import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ShieldCheck, ShieldOff, Award } from 'lucide-react';
import api from '../../services/api';
import {
  PageHeader, Btn, Chip, Select, DataTable, EmptyState, ToastHost, type Toast,
} from '../../components/ui';

type UserItem = {
  id: string; nom: string; email: string; role: string; isActive: boolean;
  studentStatus?: string; certificatesCount?: number;
};

const roleChip = (r: string) =>
  r === 'MANAGER' ? <Chip tone="amber">Admin</Chip> : r === 'INSTRUCTOR' ? <Chip tone="blue">Instructeur</Chip> : <Chip tone="green">Étudiant</Chip>;

export default function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR' | 'MANAGER'>('ALL');
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data?.data || res.data || []);
    } catch {
      setToast({ kind: 'err', msg: 'Erreur de chargement des utilisateurs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (u: UserItem) => {
    if (!window.confirm(`${u.isActive ? 'Bloquer' : 'Débloquer'} le compte de ${u.nom} ?`)) return;
    try {
      await api.patch(`/admin/users/${u.id}/toggle-status`, { action: u.isActive ? 'BLOCK' : 'UNBLOCK' });
      setToast({ kind: 'ok', msg: u.isActive ? 'Compte bloqué.' : 'Compte débloqué.' });
      fetchData();
    } catch {
      setToast({ kind: 'err', msg: 'Erreur lors de la modification.' });
    }
  };

  const filtered = users.filter((u) => filter === 'ALL' || u.role === filter);
  const count = (r: string) => users.filter((u) => u.role === r).length;

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Communauté"
        title="Utilisateurs"
        description={`${users.length} comptes · ${count('STUDENT')} élèves · ${count('INSTRUCTOR')} instructeurs · ${count('MANAGER')} admin`}
        actions={
          <>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="!w-auto !py-2">
              <option value="ALL">Tous</option>
              <option value="STUDENT">Étudiants</option>
              <option value="INSTRUCTOR">Instructeurs</option>
              <option value="MANAGER">Admins</option>
            </Select>
            <Link to="/learn/admin/instructors"><Btn variant="primary"><UserPlus className="h-4 w-4" /> Créer un instructeur</Btn></Link>
          </>
        }
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : filtered.length === 0 ? (
        <EmptyState>Aucun utilisateur pour ce filtre.</EmptyState>
      ) : (
        <DataTable columns={['Nom & contact', 'Rôle', 'Statut', 'Certificats', 'Actions']}>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-[color:var(--a-line)] text-[13px] font-bold text-[color:var(--a-accent)]">
                    {u.nom?.charAt(0)?.toUpperCase()}
                  </span>
                  <div>
                    <div className="a-td-strong">{u.nom}</div>
                    <div className="text-[11px] text-[color:var(--a-ink-dim)]">{u.email}</div>
                  </div>
                </div>
              </td>
              <td>{roleChip(u.role)}</td>
              <td>{u.isActive ? <Chip tone="green">Actif</Chip> : <Chip tone="red">Bloqué</Chip>}</td>
              <td>
                {u.certificatesCount ? (
                  <span className="inline-flex items-center gap-1 text-[color:var(--a-accent-2)]"><Award className="h-3.5 w-3.5" /> {u.certificatesCount}</span>
                ) : (
                  <span className="text-[color:var(--a-ink-dim)]">—</span>
                )}
              </td>
              <td>
                <Btn size="sm" variant={u.isActive ? 'danger' : 'accent'} onClick={() => handleToggle(u)}>
                  {u.isActive ? <><ShieldOff className="h-3.5 w-3.5" /> Bloquer</> : <><ShieldCheck className="h-3.5 w-3.5" /> Débloquer</>}
                </Btn>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
