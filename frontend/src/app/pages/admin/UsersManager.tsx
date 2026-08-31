import { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, X, Loader, Shield, Mail, User } from 'lucide-react';
import api from '../../services/api';

type UserItem = { id: string; nom: string; email: string; role: string; isActive: boolean; studentStatus?: string; certificatesCount?: number };

export default function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [instForm, setInstForm] = useState({ nom: '', email: '', courseId: '' });
  const [filter, setFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR' | 'MANAGER'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/courses')
      ]);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setCourses(coursesRes.data?.data || coursesRes.data || []);
    } catch { showFeedback('error', 'Erreur chargement données.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instForm.courseId) {
      showFeedback('error', "Veuillez sélectionner une formation.");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/admin/instructors/onboard', instForm);
      showFeedback('success', `✅ ${res.data.message}`);
      setInstForm({ nom: '', email: '', courseId: '' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || "Erreur lors de la création.");
    } finally { setCreating(false); }
  };

  const handleToggle = async (userId: string, isActive: boolean) => {
    if (!window.confirm(`${isActive ? 'Bloquer' : 'Débloquer'} cet utilisateur ?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`, { action: isActive ? 'BLOCK' : 'UNBLOCK' });
      showFeedback('success', isActive ? 'Utilisateur bloqué.' : 'Utilisateur débloqué.');
      fetchData();
    } catch { showFeedback('error', 'Erreur lors de la modification.'); }
  };

  const filtered = users.filter(u => filter === 'ALL' || u.role === filter);
  const roleColors: Record<string, string> = { MANAGER: 'bg-purple-100 text-purple-800', INSTRUCTOR: 'bg-blue-100 text-blue-800', STUDENT: 'bg-green-100 text-green-800' };
  const roleLabel: Record<string, string> = { MANAGER: 'Admin', INSTRUCTOR: 'Instructeur', STUDENT: 'Étudiant' };

  return (
    <div className="p-6">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-3 max-w-sm ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <X className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Modal Créer Instructeur */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Onboarder un Instructeur</h3>
                <p className="text-sm text-gray-500">Un mot de passe temporaire sera généré et envoyé par mail.</p>
              </div>
            </div>
            <form onSubmit={handleCreateInstructor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><User className="w-4 h-4" /> Nom complet *</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" value={instForm.nom} onChange={e => setInstForm({ ...instForm, nom: e.target.value })} placeholder="Ex: Dr. Ahmed Bensali" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email *</label>
                <input required type="email" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" value={instForm.email} onChange={e => setInstForm({ ...instForm, email: e.target.value })} placeholder="ahmed.bensali@tower.ma" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Formation assignée *</label>
                <select required className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" value={instForm.courseId} onChange={e => setInstForm({ ...instForm, courseId: e.target.value })}>
                  <option value="" disabled>Sélectionner une formation</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                <Shield className="w-4 h-4 inline mr-1.5" />
                L'instructeur recevra un email contenant ses identifiants. Il sera automatiquement lié à une classe de cette formation.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">Annuler</button>
                <button type="submit" disabled={creating} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {creating ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestion des Utilisateurs ({users.length})</h2>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
            <option value="ALL">Tous les utilisateurs</option>
            <option value="STUDENT">Étudiants</option>
            <option value="INSTRUCTOR">Instructeurs</option>
            <option value="MANAGER">Admins</option>
          </select>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
            <UserPlus className="w-4 h-4" /> Créer un Instructeur
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">Chargement des utilisateurs...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-sm font-bold text-gray-600">Nom & Contact</th>
                <th className="p-4 text-sm font-bold text-gray-600">Rôle</th>
                <th className="p-4 text-sm font-bold text-gray-600">Statut</th>
                <th className="p-4 text-sm font-bold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Aucun utilisateur trouvé.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                        {u.nom?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{u.nom}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Actif' : 'Bloqué'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggle(u.id, u.isActive)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {u.isActive ? 'Bloquer' : 'Débloquer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
