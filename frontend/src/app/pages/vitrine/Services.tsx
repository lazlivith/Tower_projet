import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import { services } from '../../data/mockData';
import { useReveal } from '../../hooks/useReveal';

export default function Services() {
  useReveal();
  return (
    <div>
      <Helmet><title>Services — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Ingénierie structurelle</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.5rem]">
          Trois expertises,<br />une seule exigence.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Du concept au dossier d'exécution. Chaque mission est menée en BIM, avec des livrables
          traçables et vérifiables.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        {services.map((s, i) => (
          <Link
            key={s.id}
            to={`/services/${s.id}`}
            className="fade-up group grid gap-8 border-t border-[color:var(--color-line)] py-14 md:grid-cols-12 md:items-center"
          >
            <div className="md:col-span-1">
              <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-ink-soft)]">
                0{i + 1}
              </span>
            </div>
            <div className="md:col-span-5">
              <h2 className="text-3xl sm:text-4xl">{s.title}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{s.description}</p>
              <span className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">
                En savoir plus <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="reveal-img md:col-span-6 aspect-[16/10] bg-[color:var(--color-line)]">
              <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
            </div>
          </Link>
        ))}
      </section>

      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-3xl sm:text-5xl">Un besoin spécifique ? Décrivez-le-nous.</h2>
          <Link to="/quote" className="arrow-link mt-8 inline-flex text-[color:var(--color-paper)]">
            Demander un devis <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
