import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useReveal } from '../../hooks/useReveal';

export default function Services() {
  const { services, amo } = useServices();
  useReveal([services, amo]);
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
            to={`/services/${s.slug}`}
            className="fade-up group grid gap-8 border-t border-[color:var(--color-line)] py-14 md:grid-cols-12 md:items-center"
          >
            <div className="md:col-span-1">
              <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-ink-soft)]">
                0{i + 1}
              </span>
            </div>
            <div className="md:col-span-5">
              <h2 className="text-3xl sm:text-4xl">{s.title}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{s.summary}</p>
              <span className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">
                En savoir plus <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="reveal-img md:col-span-6 aspect-[16/10] bg-[color:var(--color-line)]">
              {s.imageUrl && <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />}
            </div>
          </Link>
        ))}
      </section>

      {/* AMO — encart */}
      {amo && (
        <section className="bg-[color:var(--color-paper-2)] py-20 lg:py-28">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">Accompagnement</p>
              <h2 className="mt-3 text-2xl sm:text-4xl">{amo.title}</h2>
            </div>
            <ul className="fade-up lg:col-span-8">
              {amo.scope.map((p) => (
                <li key={p} className="border-t border-[color:var(--color-line)] py-6 text-[15.5px] leading-relaxed first:border-t-0">{p}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-[color:var(--band)] text-[color:var(--band-fg)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-3xl sm:text-5xl">Un besoin spécifique&nbsp;? Décrivez-le-nous.</h2>
          <Link to="/quote" className="arrow-link mt-8 inline-flex text-[color:var(--band-fg)]">
            Demander une étude de structure <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
