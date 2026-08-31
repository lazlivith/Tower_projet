import { useNavigate, Link } from 'react-router-dom';
import { Play, BookOpen, Calendar, Clock, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard, DashboardData } from '../../hooks/useDashboard';
import { motion } from 'framer-motion';

const SkeletonCard = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    className="bg-gray-200 animate-pulse rounded-3xl p-8 min-h-[300px] w-full"
  >
    <div className="h-6 bg-gray-300 rounded-full w-1/3 mb-6"></div>
    <div className="h-8 bg-gray-300 rounded-full w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-300 rounded-full w-full mb-2"></div>
    <div className="h-4 bg-gray-300 rounded-full w-5/6"></div>
  </motion.div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: myCourses, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-12">
        <div className="mx-auto max-w-7xl">
          <div className="bg-gray-100 animate-pulse rounded-3xl p-8 lg:p-12 mb-8 h-96 w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !myCourses) return <div className="min-h-screen flex items-center justify-center font-sans text-xl text-red-500">Erreur lors du chargement de YBoost.</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-12 font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* Hero Section */}
        <div className="bg-[#F8EFE6] rounded-3xl p-8 lg:p-12 mb-8 flex flex-col lg:flex-row items-center justify-between shadow-sm relative overflow-hidden">
          <div className="lg:w-1/2 z-10">
            <div className="inline-block px-4 py-1 bg-white rounded-full text-xs font-bold mb-6 tracking-wide shadow-sm">
              EDUNAI x YNOV
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-[#1a1a1a]">
              Bienvenue sur <br/>
              <span className="text-[#FF4D6D]">YBoost</span> By <span className="text-[#2B7A78]">Ynov Campus</span>
            </h1>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed max-w-lg font-medium">
              YBoost réunit l'excellence pédagogique d'Ynov Campus et l'innovation d'Edunai dans une approche pratique orientée projet. Les parcours sont portés par M. Oussama ETTALALI pour AI & Development et M. Abdelaziz Haidar pour CyberSecurity, afin de développer des compétences techniques solides et directement applicables.
            </p>
            <button className="bg-[#1A1A1A] text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-colors flex items-center gap-2">
              Commencer l'aventure {'>'}
            </button>
          </div>

          <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-end z-10">
            <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md shadow-2xl text-green-400 font-mono text-sm leading-relaxed border border-gray-800">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p className="text-white"><span className="text-pink-500">def</span> <span className="text-blue-400">future</span>(you):</p>
              <p className="pl-4"><span className="text-pink-500">while</span> creating:</p>
              <p className="pl-8"><span className="text-pink-500">try</span>:</p>
              <p className="pl-12">level += 1</p>
              <p className="pl-12">xp = <span className="text-yellow-300">"Max"</span></p>
              <p className="pl-8"><span className="text-pink-500">except</span> Bug:</p>
              <p className="pl-12 text-blue-400">debug<span className="text-white">(you)</span></p>
              <br/>
              <p className="pl-4"><span className="text-pink-500">return</span> <span className="text-yellow-300">"Success"</span></p>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myCourses.map((enrollment, index) => {
            const course = enrollment.course;
            const classroom = enrollment.classroom;
            const progressRate = enrollment.progressRate;
            const nextSession = course.upcomingLiveSessions?.[0];
            
            const isFirst = index % 2 === 0;
            const bgColor = isFirst ? 'bg-[#A8E6CF]' : 'bg-[#EAEAEA]';
            const btnColor = isFirst ? 'bg-white text-black' : 'bg-[#1A1A1A] text-white';
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={enrollment.enrollmentId} 
                className={`${bgColor} rounded-3xl p-8 relative flex flex-col justify-between transition-transform hover:scale-[1.02] cursor-pointer shadow-sm`} 
                onClick={() => navigate(`/learn/student/course/${course.id}`)}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs font-bold">
                      <BookOpen className="w-3 h-3" />
                      {classroom?.name || 'Classe non assignée'}
                    </div>
                    <div className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-[#1a1a1a]">
                      {progressRate}% complété
                    </div>
                  </div>

                  <h2 className="text-3xl font-extrabold mb-4 text-[#1A1A1A]">{course.title}</h2>
                  <p className="text-gray-800 text-sm max-w-sm font-medium opacity-90 line-clamp-2 mb-6">
                    {course.description || "Formation YBoost en cours."}
                  </p>
                  
                  {classroom?.instructor && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                        {classroom.instructor.nom.charAt(0)}
                      </div>
                      <span>Prof. {classroom.instructor.nom}</span>
                    </div>
                  )}

                  {nextSession && (
                    <div className="bg-white/50 rounded-xl p-4 mt-4 mb-16 backdrop-blur-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Video className="w-3 h-3 text-red-500" /> Prochaine Session Live
                      </div>
                      <div className="font-bold text-[#1a1a1a] mb-1">{nextSession.title}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(nextSession.scheduledAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(nextSession.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                      <Link
                        to={`/learn/session/${nextSession.id}`}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                      >
                        <Video className="w-3.5 h-3.5" /> Rejoindre la visio
                      </Link>
                    </div>
                  )}
                  {!nextSession && <div className="mb-16"></div>}
                </div>
                
                <div className="absolute bottom-8 right-8">
                  <button className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${btnColor}`}>
                    <Play className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}
