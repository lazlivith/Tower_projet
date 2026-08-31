import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, Star, FileText, MessageCircle, Calendar, Upload, CheckCircle, Video, File } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'messages' | 'sessions'>('courses');
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeStudents: 0, assignedCourses: 0, pendingAssignments: 0, unreadMessages: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Modales
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [contentForm, setContentForm] = useState({ title: '', content: '', videoUrl: '', pdfUrl: '' });

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ courseId: '', title: '', scheduledAt: '', duration: 120 });

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes, assignRes, sessRes] = await Promise.all([
        api.get('/stats/instructor'),
        api.get('/instructor/my-courses'),
        api.get('/assignments/pending'),
        api.get('/sessions/instructor')
      ]);
      setStats(statsRes.data);
      setCourses(coursesRes.data);
      setAssignments(assignRes.data);
      setSessions(sessRes.data);
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return alert("Sélectionnez un cours");
    try {
      await api.post('/instructor/lessons', { ...contentForm, courseId: selectedCourseId });
      alert("Contenu ajouté avec succès !");
      setShowContentModal(false);
      setContentForm({ title: '', content: '', videoUrl: '', pdfUrl: '' });
    } catch (err) {
      alert("Erreur lors de l'ajout du contenu.");
    }
  };

  const handleGrade = async (submissionId: string) => {
    const grade = prompt("Entrez la note (sur 100) :");
    if (!grade || isNaN(Number(grade))) return;
    
    try {
      await api.patch(`/assignments/${submissionId}/grade`, { grade: Number(grade) });
      alert("Devoir corrigé avec succès !");
      fetchData();
    } catch (err) {
      alert("Erreur lors de la notation.");
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.courseId) return alert("Veuillez sélectionner un cours.");
    try {
      await api.post(`/instructor/courses/${sessionForm.courseId}/sessions`, sessionForm);
      alert("Session planifiée avec succès !");
      setShowSessionModal(false);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la planification.");
    }
  };

  const handleViewStudents = async (courseId: string) => {
    try {
      const res = await api.get(`/instructor/courses/${courseId}/students`);
      setCourseStudents(res.data);
      setShowStudentsModal(true);
    } catch (err) {
      alert("Erreur lors de la récupération des étudiants.");
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement de votre espace...</div>;

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Espace Instructeur - {user?.nom}</h1>
          <p className="text-gray-600">Gérez vos formations, ajoutez du contenu et suivez vos étudiants</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#FFC107] to-[#FFD54F] text-[#1A1A2E] p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-10 h-10" />
              <div className="text-right">
                <div className="text-3xl font-bold">{courses.length}</div>
                <div className="text-sm opacity-80">Cours assignés</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.activeStudents}</div>
                <div className="text-sm opacity-80">Étudiants actifs</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md relative">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-10 h-10 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{assignments.length}</div>
                <div className="text-sm opacity-80">Devoirs à corriger</div>
              </div>
            </div>
            {assignments.length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md relative">
            <div className="flex items-center justify-between mb-4">
              <MessageCircle className="w-10 h-10 opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm opacity-80">Messages non lus</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'courses' ? 'border-[#FFC107] text-[#FFC107]' : 'border-transparent text-gray-500'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Mes Cours
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'assignments' ? 'border-[#FFC107] text-[#FFC107]' : 'border-transparent text-gray-500'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Devoirs ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'sessions' ? 'border-[#FFC107] text-[#FFC107]' : 'border-transparent text-gray-500'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Sessions Live
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* TAB: COURSES */}
            {activeTab === 'courses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3>Gestion des Cours</h3>
                  <button 
                    onClick={() => setShowContentModal(true)}
                    className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center gap-2 font-semibold"
                  >
                    <Upload className="w-4 h-4" />
                    Nouveau contenu (Vidéo/PDF)
                  </button>
                </div>
                <div className="space-y-6">
                  {courses.length === 0 ? <p>Aucun cours assigné.</p> : courses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h4 className="mb-2 text-xl font-bold">{course.title}</h4>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <button onClick={() => handleViewStudents(course.id)} className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium cursor-pointer">
                              <Users className="w-4 h-4" />
                              {course.students} étudiants (Voir la liste)
                            </button>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              Score moyen: {course.avgScore}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Taux de complétion</span>
                            <span className="font-semibold">{course.completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{ width: `${course.completionRate}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Performance globale</span>
                            <span className="font-semibold">{course.avgScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-[#FFC107] to-[#FFD54F] h-3 rounded-full" style={{ width: `${course.avgScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ASSIGNMENTS */}
            {activeTab === 'assignments' && (
              <div>
                <h3 className="mb-6">Devoirs à Corriger</h3>
                <div className="space-y-4">
                  {assignments.length === 0 ? <p>Aucun devoir en attente.</p> : assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold">{assignment.student?.nom}</h4>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">À corriger</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{assignment.assignment?.course?.title}</p>
                          <p className="text-sm font-medium">{assignment.assignment?.title}</p>
                          {assignment.fileUrl && (
                            <a href={assignment.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-2">
                              <File className="w-4 h-4" /> Voir le document soumis
                            </a>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <button 
                            onClick={() => handleGrade(assignment.id)}
                            className="px-6 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors text-sm font-bold shadow-sm"
                          >
                            Corriger & Noter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SESSIONS */}
            {activeTab === 'sessions' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3>Sessions Programmées</h3>
                  <button 
                    onClick={() => setShowSessionModal(true)}
                    className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors text-sm font-bold"
                  >
                    + Planifier une session
                  </button>
                </div>
                <div className="space-y-6">
                  {sessions.length === 0 ? <p className="text-gray-500 italic">Aucune session programmée.</p> : sessions.map((session) => {
                    const now = new Date();
                    const sessionStart = new Date(session.scheduledAt);
                    const sessionEnd = new Date(sessionStart.getTime() + (session.duration || 120) * 60000);
                    
                    const isActive = now >= sessionStart && now <= sessionEnd;
                    const isPast = now > sessionEnd;
                    const isFuture = now < sessionStart;

                    return (
                      <div key={session.id} className="relative bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center shadow-sm hover:shadow-md transition-all overflow-hidden">
                        {/* Indicateur de statut (Bordure latérale) */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${isActive ? 'bg-green-500 animate-pulse' : isPast ? 'bg-gray-300' : 'bg-blue-400'}`}></div>
                        
                        <div className="flex gap-6 items-center w-full md:w-auto mb-4 md:mb-0 ml-2">
                          <div className={`rounded-2xl p-4 text-center w-24 flex flex-col justify-center shadow-inner ${isActive ? 'bg-green-100 text-green-900' : isPast ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-900'}`}>
                            <div className="text-3xl font-extrabold">{sessionStart.getDate()}</div>
                            <div className="text-xs uppercase tracking-wider font-bold">{sessionStart.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-extrabold text-xl text-gray-900">{session.title}</h4>
                              {isActive && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> En cours</span>}
                              {isFuture && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">À venir</span>}
                              {isPast && <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wide">Terminée</span>}
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 opacity-70" /> {session.course?.title}
                            </p>
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-4">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4 opacity-70"/> {sessionStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}</span>
                              <span className="flex items-center gap-1"><Video className="w-4 h-4 opacity-70"/> {session.duration || 120} min</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex justify-end">
                          {isActive ? (
                            <Link to={`/learn/session/${session.id}`} className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg font-bold transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                              <Video className="w-5 h-5" /> Rejoindre la classe en direct
                            </Link>
                          ) : isFuture ? (
                            <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed border border-gray-200">
                              Lien disponible à l'heure
                            </button>
                          ) : (
                            <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-50 text-gray-400 rounded-xl font-bold cursor-not-allowed border border-gray-200">
                              Session clôturée
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale d'ajout de contenu */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Ajouter du contenu</h3>
              <button onClick={() => setShowContentModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddContent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sélectionnez le cours cible</label>
                <select required className="w-full border rounded-lg p-2" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                  <option value="">-- Choisir un cours --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titre de la leçon</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={contentForm.title} onChange={e => setContentForm({...contentForm, title: e.target.value})} placeholder="Ex: Introduction au BIM" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><Video className="w-4 h-4"/> Lien Vidéo YouTube (optionnel)</label>
                <input type="url" className="w-full border rounded-lg p-2" value={contentForm.videoUrl} onChange={e => setContentForm({...contentForm, videoUrl: e.target.value})} placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><File className="w-4 h-4"/> Lien Document PDF (optionnel)</label>
                <input type="url" className="w-full border rounded-lg p-2" value={contentForm.pdfUrl} onChange={e => setContentForm({...contentForm, pdfUrl: e.target.value})} placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-[#FFC107] text-[#1A1A2E] font-bold py-3 rounded-lg mt-4">Publier le contenu</button>
            </form>
          </div>
        </div>
      )}

      {/* Modale Planifier Session */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Planifier une session Live</h3>
              <button onClick={() => setShowSessionModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleScheduleSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cours concerné</label>
                <select required className="w-full border rounded-lg p-2" value={sessionForm.courseId} onChange={e => setSessionForm({...sessionForm, courseId: e.target.value})}>
                  <option value="">-- Choisir un cours --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titre de la session</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={sessionForm.title} onChange={e => setSessionForm({...sessionForm, title: e.target.value})} placeholder="Ex: Q&A et Révisions" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date et heure</label>
                <input required type="datetime-local" className="w-full border rounded-lg p-2" value={sessionForm.scheduledAt} onChange={e => setSessionForm({...sessionForm, scheduledAt: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Durée (minutes)</label>
                <input required type="number" className="w-full border rounded-lg p-2" value={sessionForm.duration} onChange={e => setSessionForm({...sessionForm, duration: Number(e.target.value)})} min="15" max="300" />
              </div>
              <button type="submit" className="w-full bg-[#FFC107] text-[#1A1A2E] font-bold py-3 rounded-lg mt-4">Générer le lien Jitsi</button>
            </form>
          </div>
        </div>
      )}

      {/* Modale Liste des Élèves */}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" /> Étudiants de la salle</h3>
              <button onClick={() => setShowStudentsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {courseStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun étudiant inscrit pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {courseStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold">{student.nom}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className="w-48">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progression</span>
                          <span className="font-bold">{student.progressRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${student.progressRate === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${student.progressRate}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
