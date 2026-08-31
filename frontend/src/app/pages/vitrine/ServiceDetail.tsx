import { useParams, Link } from 'react-router';
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { services, projects } from '../../data/mockData';

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const service = services.find((s) => s.id === serviceId);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Service non trouvé</h2>
          <Link to="/services" className="text-[#FFC107] hover:underline">
            Retour aux services
          </Link>
        </div>
      </div>
    );
  }

  const relatedProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{service.title} - Services Ingénierie | TowerStructure</title>
        <meta name="description" content={service.description} />
        <meta property="og:title" content={`${service.title} | TowerStructure`} />
        <meta property="og:description" content={service.description} />
        <meta property="og:image" content={service.image} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/services" className="inline-flex items-center gap-2 text-[#FFC107] hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour aux services
          </Link>
          <h1 className="mb-6">{service.title}</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            {service.description}
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="mb-6">Vue d'ensemble</h2>
              <p className="text-gray-700 mb-6">{service.details.overview}</p>
              <h3 className="mb-4">Nos prestations</h3>
              <ul className="space-y-3">
                {service.details.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FFC107] mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img
                src={service.image}
                alt={service.title}
                className="rounded-lg shadow-2xl w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center">Questions Fréquentes</h2>
          <div className="space-y-4">
            {service.details.faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="mb-2">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Projects */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center">Projets Similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProjects.map((project) => (
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

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4">Intéressé par ce service ?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Demandez un devis personnalisé et recevez une réponse sous 48h
          </p>
          <Link
            to="/quote"
            className="px-8 py-4 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors inline-flex items-center gap-2"
          >
            Demander un devis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
