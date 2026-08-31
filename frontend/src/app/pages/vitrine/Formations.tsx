import { Link, useNavigate } from 'react-router';
import { Clock, BookOpen, Users, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Formations() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.data || res.data);
      } catch (err) {
        console.error('Erreur de chargement des formations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleEnrollment = (courseId: string) => {
    if (!user) {
      navigate('/learn/login'); // We could also use state to remember the returnUrl
    } else {
      navigate(`/payment/${courseId}`);
    }
  };
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Formations E-Learning en Ingénierie Structurelle | TowerStructure</title>
        <meta name="description" content="Développez vos compétences en ingénierie structurelle avec nos formations en ligne certifiantes sur le calcul de structure, BIM et parasismique." />
        <meta property="og:title" content="Formations E-Learning en Ingénierie Structurelle | TowerStructure" />
        <meta property="og:description" content="Catalogue complet de nos formations pour ingénieurs. Apprenez le calcul de structure et les normes Eurocodes." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6">Formations E-Learning</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Développez vos compétences en ingénierie structurelle avec nos formations en ligne certifiantes
          </p>
        </div>
      </section>

      {/* Filters & Stats */}
      <section className="py-8 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#FFC107]" />
              <div className="font-bold">{courses.length}</div>
              <div className="text-sm text-gray-600">Formations</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-[#FFC107]" />
              <div className="font-bold">500+</div>
              <div className="text-sm text-gray-600">Étudiants</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-[#FFC107]" />
              <div className="font-bold">195h</div>
              <div className="text-sm text-gray-600">De contenu</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-[#FFC107]" />
              <div className="font-bold">4.6/5</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Formations Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {loading ? (
              <div className="col-span-1 md:col-span-2 text-center py-12">Chargement des formations...</div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all flex flex-col"
                >
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-56 object-cover" />
                  ) : (
                    <div className="w-full h-56 bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 font-medium">Image par défaut</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-[#FFC107] text-[#1A1A2E] rounded-full text-xs font-bold">
                        {course.level || 'Débutant'}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">{course.durationHours || 40} heures</span>
                    </div>
                    
                    <h3 className="mb-2 font-bold text-xl text-gray-900">{course.title}</h3>
                    <p className="text-gray-600 mb-6 h-12 overflow-hidden text-sm line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                    
                    <div className="space-y-2 mt-auto mb-6 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Instructeur:</span>
                        <span className="font-bold text-gray-900">Dr. Rousseau</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Modules:</span>
                        <span className="font-bold text-gray-900">12 modules</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Étudiants:</span>
                        <span className="font-bold text-gray-900">156 inscrits</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleEnrollment(course.id)}
                      className="w-full px-4 py-3 bg-[#FFC107] text-[#1A1A2E] font-bold tracking-wide rounded-lg hover:bg-yellow-500 transition-colors text-center"
                    >
                      S'inscrire
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Pourquoi Choisir Nos Formations ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📚',
                title: 'Contenu Expert',
                description: 'Formations conçues par des ingénieurs expérimentés',
              },
              {
                icon: '⏰',
                title: 'Flexibilité',
                description: 'Apprenez à votre rythme, 24/7',
              },
              {
                icon: '🎓',
                title: 'Certification',
                description: 'Certificat reconnu à l\'issue de la formation',
              },
              {
                icon: '💬',
                title: 'Support',
                description: 'Assistance pédagogique disponible',
              },
              {
                icon: '🔄',
                title: 'Mises à jour',
                description: 'Contenu régulièrement actualisé',
              },
              {
                icon: '🤝',
                title: 'Communauté',
                description: 'Échangez avec d\'autres apprenants',
              },
            ].map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white rounded-2xl p-12 text-center">
            <h2 className="mb-4">Prêt à Commencer ?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Inscrivez-vous dès aujourd'hui et accédez à toutes nos formations
            </p>
            <Link
              to="/learn/login"
              className="px-8 py-4 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors inline-block"
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
