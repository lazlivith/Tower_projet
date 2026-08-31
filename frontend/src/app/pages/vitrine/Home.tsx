import { Link } from 'react-router';
import { Building2, GraduationCap, Award, ArrowRight } from 'lucide-react';
import { projects, formations } from '../../data/mockData';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-[#0A0A0A] text-white py-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&h=1080&fit=crop"
            alt="BIM Structure"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-transparent to-[#0A0A0A]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/50 via-transparent to-[#0A0A0A]/50" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center z-10 mt-10">
          <div className="inline-block mb-8 px-5 py-2 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-orange-500/10">
            L'EXCELLENCE EN INGÉNIERIE
          </div>
          
          <h1 className="mb-8 text-5xl md:text-7xl lg:text-[80px] font-bold font-serif leading-[1.1] tracking-tight">
            Votre partenaire en <span className="text-[#FF6B00]">ingénierie</span> <br className="hidden md:block" /> structurelle
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Expertise BIM, calculs Eurocodes et formation continue pour les professionnels de la construction. Nous transformons vos idées complexes en réalités performantes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/quote"
              className="px-8 py-4 bg-[#FF6B00] text-white text-xs uppercase tracking-[0.15em] font-bold rounded-full hover:bg-[#e66000] hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 inline-flex items-center gap-2"
            >
              DEMANDER UN DEVIS
            </Link>
            <Link
              to="/formations"
              className="px-8 py-4 border border-white/20 text-white text-xs uppercase tracking-[0.15em] font-bold rounded-full hover:bg-white/5 hover:border-white/40 transition-all duration-300 inline-flex items-center gap-2 group"
            >
              NOS FORMATIONS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Projets réalisés', value: '200+', icon: Building2 },
              { label: 'Étudiants formés', value: '500+', icon: GraduationCap },
              { label: 'Années d\'expérience', value: '15+', icon: Award },
              { label: 'Taux de satisfaction', value: '98%', icon: Award },
            ].map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-[#FFC107]" />
                <div className="font-bold mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Nos Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des solutions complètes pour tous vos besoins en ingénierie structurelle
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'BIM & Modélisation 3D',
                description: 'Conception et modélisation de structures en 3D',
                icon: '🏗️',
                link: '/services/bim',
              },
              {
                title: 'Diagnostic Structurel',
                description: 'Analyse approfondie de vos structures existantes',
                icon: '🔍',
                link: '/services/diagnostic',
              },
              {
                title: 'Calculs Eurocodes',
                description: 'Dimensionnement selon les normes européennes',
                icon: '📐',
                link: '/services/eurocodes',
              },
            ].map((service, index) => (
              <Link
                key={index}
                to={service.link}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <span className="text-[#FFC107] hover:underline inline-flex items-center gap-2">
                  En savoir plus
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Showcase */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Projets Réalisés</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez quelques-unes de nos réalisations récentes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="text-sm text-[#FFC107] mb-1">{project.category}</div>
                  <h4 className="mb-2">{project.title}</h4>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formations Preview */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Formations E-Learning</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Développez vos compétences avec nos formations en ligne
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {formations.slice(0, 4).map((formation) => (
              <div key={formation.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <img
                  src={formation.image}
                  alt={formation.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="mb-2">{formation.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{formation.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formation.duration}</span>
                    <span className="text-[#FFC107]">{formation.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/formations"
              className="px-6 py-3 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors inline-flex items-center gap-2"
            >
              Voir toutes les formations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4">Prêt à démarrer votre projet ?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Contactez-nous dès aujourd'hui pour discuter de vos besoins en ingénierie structurelle
          </p>
          <Link
            to="/quote"
            className="px-8 py-4 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors inline-flex items-center gap-2"
          >
            Demander un devis gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
