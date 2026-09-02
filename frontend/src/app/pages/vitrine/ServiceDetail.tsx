import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useReveal } from '../../hooks/useReveal';

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const { services, amo, loading } = useServices();
  const service = [...services, ...(amo ? [amo] : [])].find((s) => s.slug === serviceId);
  useReveal([serviceId, service]);

  if (loading) {
    return <div className="mx-auto max-w-[1400px] px-5 py-40 text-center sm:px-8 lg:px-12" />;
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-40 text-center sm:px-8 lg:px-12">
        <p className="text-[color:var(--color-ink-soft)]">Service introuvable.</p>
        <Link to="/services" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">← Retour aux services</Link>
      </div>
    );
  }

  const { objective, scope, deliverables } = service;

  return (
    <div>
      <Helmet><title>{service.title} — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <Link to="/services" className="inline-flex items-center gap-2 text-[13px] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
          <ArrowLeft className="w-4 h-4" /> Services
        </Link>
        <h1 className="mt-8 max-w-4xl text-4xl leading-[1.05] sm:text-6xl">{service.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">{service.summary}</p>
      </section>

      {service.imageUrl && (
        <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
          <div className="reveal-img aspect-[21/9] w-full bg-[color:var(--color-line)]">
            <img src={service.imageUrl} alt={service.title} className="h-full w-full object-cover" />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        {objective && (
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4"><p className="eyebrow">Objectif</p></div>
            <div className="fade-up md:col-span-8">
              <p className="font-[family-name:var(--font-display)] text-2xl leading-[1.4]">{objective}</p>
            </div>
          </div>
        )}

        {scope.length > 0 && (
          <div className="mt-16 grid gap-12 border-t border-[color:var(--color-line)] pt-16 md:grid-cols-12">
            <div className="md:col-span-4"><p className="eyebrow">Périmètre d'action</p></div>
            <ul className="fade-up md:col-span-8">
              {scope.map((s) => (
                <li key={s} className="border-t border-[color:var(--color-line)] py-5 text-[15.5px] leading-relaxed first:border-t-0">{s}</li>
              ))}
            </ul>
          </div>
        )}

        {deliverables.length > 0 && (
          <div className="mt-16 grid gap-12 border-t border-[color:var(--color-line)] pt-16 md:grid-cols-12">
            <div className="md:col-span-4"><p className="eyebrow">Livrables techniques</p></div>
            <ul className="fade-up md:col-span-8">
              {deliverables.map((d) => (
                <li key={d} className="border-t border-[color:var(--color-line)] py-5 text-[15.5px] leading-relaxed first:border-t-0">{d}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-4xl">Un projet concerné par ce service&nbsp;?</h2>
          <Link to="/quote" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">
            Demander une étude <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
