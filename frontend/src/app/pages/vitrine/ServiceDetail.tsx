import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { services } from '../../data/mockData';
import { useReveal } from '../../hooks/useReveal';

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const service = services.find((s) => s.id === serviceId);
  useReveal([serviceId]);

  if (!service) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-40 text-center sm:px-8 lg:px-12">
        <p className="text-[color:var(--color-ink-soft)]">Service introuvable.</p>
        <Link to="/services" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">← Retour aux services</Link>
      </div>
    );
  }

  return (
    <div>
      <Helmet><title>{service.title} — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <Link to="/services" className="inline-flex items-center gap-2 text-[13px] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
          <ArrowLeft className="w-4 h-4" /> Services
        </Link>
        <h1 className="mt-8 max-w-4xl text-4xl leading-[1.05] sm:text-6xl">{service.title}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">{service.description}</p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="reveal-img aspect-[21/9] w-full bg-[color:var(--color-line)]">
          <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Le service</p>
          </div>
          <div className="fade-up md:col-span-8">
            <p className="font-[family-name:var(--font-display)] text-2xl leading-[1.4]">{service.details.overview}</p>

            <div className="mt-12 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {service.details.features.map((f) => (
                <div key={f} className="border-t border-[color:var(--color-line)] py-4 text-[15px]">{f}</div>
              ))}
            </div>

            <div className="mt-14">
              <p className="eyebrow">Questions fréquentes</p>
              <div className="mt-4">
                {service.details.faqs.map((q) => (
                  <div key={q.question} className="border-t border-[color:var(--color-line)] py-6">
                    <div className="font-[family-name:var(--font-display)] text-lg">{q.question}</div>
                    <p className="mt-2 text-[15px] text-[color:var(--color-ink-soft)]">{q.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-4xl">Parlons de votre projet.</h2>
          <Link to="/quote" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">
            Demander un devis <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
