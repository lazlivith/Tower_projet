import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, BookOpen, DollarSign, TrendingUp, Shield, CheckCircle, Ban, FileText, Image as ImageIcon, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const activeTab = location.pathname.includes('users') ? 'users' : location.pathname.includes('services') ? 'services' : location.pathname.includes('analytics') ? 'analytics' : 'overview';
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    activeStudents: 0, 
    totalCourses: 0, 
    monthlyRevenue: 0,
    totalPublications: 0,
    totalProjects: 0,
    pendingQuotes: 0,
    recentQuotes: [] as any[]
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '', className: '', imageUrl: '', level: 'Débutant', durationHours: '' });

  // Filters for Users
  const [userFilter, setUserFilter] = useState<'ALL' | 'STUDENT_OK' | 'STUDENT_LATE' | 'ALUMNI' | 'INSTRUCTORS'>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        api.get('/stats/admin'),
        api.get('/admin/users'),
        api.get('/courses')
      ]);
      
      setStats({
        totalUsers: statsRes.data.totalUsers || 0,
        activeStudents: statsRes.data.activeStudents || 0,
        totalCourses: statsRes.data.totalCourses || 0,
        monthlyRevenue: statsRes.data.monthlyRevenue || 0,
        totalPublications: statsRes.data.totalPublications || 0,
        totalProjects: statsRes.data.totalProjects || 0,
        pendingQuotes: statsRes.data.pendingQuotes || 0,
        recentQuotes: statsRes.data.recentQuotes || []
      });

      setUsersList(usersRes.data.data || usersRes.data || []);
      setCourses(coursesRes.data.data || coursesRes.data || []);
    } catch (error) {
      console.error("Erreur récupération admin", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Voulez-vous ${currentStatus ? 'bloquer' : 'débloquer'} cet utilisateur ?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`, { action: currentStatus ? 'BLOCK' : 'UNBLOCK' });
      fetchData();
    } catch (err) {
      alert("Erreur lors de la modification.");
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses/setup', { 
        ...courseForm, 
        price: Number(courseForm.price),
        durationHours: Number(courseForm.durationHours)
      });
      alert("Formation créée avec succès !");
      setCourseForm({ title: '', description: '', price: '', className: '', imageUrl: '', level: 'Débutant', durationHours: '' });
      fetchData();
    } catch (err) {
      alert("Erreur création formation.");
    }
  };

  const filteredUsers = usersList.filter(u => {
    if (userFilter === 'ALL') return true;
    if (userFilter === 'INSTRUCTORS') return u.role === 'INSTRUCTOR';
    if (userFilter === 'ALUMNI') return u.isAlumni;
    if (userFilter === 'STUDENT_OK') return u.role === 'STUDENT' && u.studentStatus === 'EN RÈGLE';
    if (userFilter === 'STUDENT_LATE') return u.role === 'STUDENT' && u.studentStatus === 'EN RETARD';
    return true;
  });

  if (loading) return <div className="p-8 text-center">Chargement de l'espace administration...</div>;

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      
      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Colored Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Blue: Users */}
            <div className="bg-[#2563EB] text-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-lg"><Users className="w-6 h-6" /></div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-sm font-medium opacity-90">Utilisateurs</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Actifs: {stats.activeStudents}</span>
              </div>
            </div>

            {/* Green: Courses */}
            <div className="bg-[#10B981] text-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-lg"><BookOpen className="w-6 h-6" /></div>
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-sm font-medium opacity-90">Formations</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Total actifs</span>
              </div>
            </div>

            {/* Yellow/Orange: Revenue */}
            <div className="bg-[#F59E0B] text-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-lg"><DollarSign className="w-6 h-6" /></div>
                <div className="text-3xl font-bold">{stats.monthlyRevenue}€</div>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-sm font-medium opacity-90">Revenu mensuel</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Paiements validés</span>
              </div>
            </div>

            {/* Purple: Completion */}
            <div className="bg-[#8B5CF6] text-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
                <div className="text-3xl font-bold">78%</div>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-sm font-medium opacity-90">Taux de complétion</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Moyenne</span>
              </div>
            </div>
          </div>

          {/* Row 2: Secondary White Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group cursor-pointer hover:border-blue-200 transition-colors">
              <div>
                <div className="text-blue-500 mb-2"><FileText className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalPublications}</div>
                <div className="text-sm text-gray-500">Publications</div>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group cursor-pointer hover:border-green-200 transition-colors">
              <div>
                <div className="text-green-500 mb-2"><Eye className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalProjects}</div>
                <div className="text-sm text-gray-500">Projets</div>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group cursor-pointer hover:border-purple-200 transition-colors">
              <div>
                <div className="text-purple-500 mb-2"><Users className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
                <div className="text-sm text-gray-500">Utilisateurs</div>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group cursor-pointer hover:border-yellow-200 transition-colors">
              <div>
                <div className="text-[#FFC107] mb-2"><FileText className="w-6 h-6" /></div>
                <div className="text-2xl font-bold text-gray-800">{stats.pendingQuotes}</div>
                <div className="text-sm text-gray-500">Devis en attente</div>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-[#FFC107]" />
            </div>
          </div>

          {/* Row 3: Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Devis Récents (2/3 width) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold flex items-center gap-2 text-gray-800"><FileText className="w-5 h-5 text-[#FFC107]" /> Devis Récents ({stats.recentQuotes.length})</h3>
                <button className="text-sm text-[#FFC107] font-medium hover:underline">Voir tous →</button>
              </div>

              <div className="space-y-4">
                {stats.recentQuotes.length > 0 ? stats.recentQuotes.map((quote: any) => (
                  <div key={quote.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{quote.clientName}</h4>
                        <p className="text-sm text-gray-500">{quote.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${quote.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {quote.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-4">
                      <p><strong>Service:</strong> {quote.serviceType}</p>
                      <p className="mt-1 italic text-gray-500">{quote.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {quote.status === 'PENDING' && (
                        <button className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600">Accepter</button>
                      )}
                      <button className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600">Contacter</button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-4 text-gray-500 border rounded-xl">Aucun devis récent.</div>
                )}
              </div>
            </div>

            {/* Right: Activités Récentes (1/3 width) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold flex items-center gap-2 text-gray-800 mb-6"><TrendingUp className="w-5 h-5 text-[#FFC107]" /> Activités Récentes</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-yellow-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white border border-gray-100 p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-800 font-medium">Nouveau devis reçu - Entreprise Martin</p>
                    <p className="text-xs text-gray-500">Il y a 5 min</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white border border-gray-100 p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-800 font-medium">Nouvel utilisateur inscrit - Marie Laurent</p>
                    <p className="text-xs text-gray-500">Il y a 2 h</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-green-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white border border-gray-100 p-3 rounded shadow-sm">
                    <p className="text-sm text-gray-800 font-medium">Formation "BIM Avancé" complétée - Jean Dupont</p>
                    <p className="text-xs text-gray-500">Il y a 5 h</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Gestion des Utilisateurs</h2>
            <select 
              className="border rounded-lg p-2 font-semibold text-sm"
              value={userFilter}
              onChange={(e: any) => setUserFilter(e.target.value)}
            >
              <option value="ALL">Tous les utilisateurs</option>
              <option value="INSTRUCTORS">Instructeurs uniquement</option>
              <option value="STUDENT_OK">Étudiants (En règle)</option>
              <option value="STUDENT_LATE">Étudiants (En retard)</option>
              <option value="ALUMNI">Lauréats (Certifiés)</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-bold text-gray-600">Nom & Contact</th>
                  <th className="p-4 font-bold text-gray-600">Rôle</th>
                  <th className="p-4 font-bold text-gray-600">Statut Financier</th>
                  <th className="p-4 font-bold text-gray-600">Certificats</th>
                  <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold">{u.nom}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role === 'STUDENT' ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.studentStatus === 'EN RÈGLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.studentStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      {u.isAlumni ? (
                        <span className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
                          <CheckCircle className="w-4 h-4"/> Lauréat ({u.certificatesCount})
                        </span>
                      ) : '0'}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleUser(u.id, u.isActive)}
                        className={`p-2 text-sm rounded font-bold flex items-center gap-1 ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {u.isActive ? <><Ban className="w-4 h-4"/> Bloquer</> : <><CheckCircle className="w-4 h-4"/> Débloquer</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center p-4 text-gray-500">Aucun utilisateur trouvé.</p>}
          </div>
        </div>
      )}

      {/* TAB: SERVICES (Fallback Formations for now) */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-6">Créer une Formation</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre de la formation</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea required className="w-full border rounded-lg p-2" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix (MAD)</label>
                  <input required type="number" className="w-full border rounded-lg p-2" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Classe (ex: Promo 2026)</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={courseForm.className} onChange={e => setCourseForm({...courseForm, className: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau</label>
                  <select className="w-full border rounded-lg p-2" value={courseForm.level} onChange={e => setCourseForm({...courseForm, level: e.target.value})}>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Durée (heures)</label>
                  <input required type="number" className="w-full border rounded-lg p-2" value={courseForm.durationHours} onChange={e => setCourseForm({...courseForm, durationHours: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Image de couverture (URL)</label>
                <input type="url" className="w-full border rounded-lg p-2" value={courseForm.imageUrl} onChange={e => setCourseForm({...courseForm, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-[#FFC107] text-[#1A1A2E] font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors">Créer la formation</button>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-6">Formations Existantes</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {courses.map(course => (
                <div key={course.id} className="border p-4 rounded-lg flex gap-4 items-center">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-24 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-600 flex gap-3 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{course.level}</span>
                      <span>{course.durationHours}h</span>
                      <span className="font-semibold text-green-600">{course.price} DH</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
