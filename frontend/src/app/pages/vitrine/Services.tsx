import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { services } from '../../data/mockData';

export default function Services() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6">Nos Services</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Des solutions complètes et personnalisées pour tous vos projets d'ingénierie structurelle
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <span className="text-[#FFC107] hover:underline inline-flex items-center gap-2">
                    En savoir plus
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Notre Processus</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une méthodologie éprouvée pour garantir la réussite de votre projet
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Analyse des besoins',
                description: 'Écoute et compréhension de vos objectifs',
              },
              {
                step: '02',
                title: 'Proposition technique',
                description: 'Élaboration d\'une solution sur-mesure',
              },
              {
                step: '03',
                title: 'Réalisation',
                description: 'Exécution du projet avec suivi régulier',
              },
              {
                step: '04',
                title: 'Livraison',
                description: 'Remise des livrables et support',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-4xl font-bold text-[#FFC107] mb-4">{item.step}</div>
                  <h3 className="mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-[#FFC107]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white rounded-2xl p-12 text-center">
            <h2 className="mb-4">Besoin d'un devis personnalisé ?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Décrivez-nous votre projet et recevez une proposition détaillée sous 48h
            </p>
            <Link
              to="/quote"
              className="px-8 py-4 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors inline-flex items-center gap-2"
            >
              Demander un devis gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
