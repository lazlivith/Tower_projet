import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';

const ENGAGEMENTS = [
  {
    t: "L'ingénierie n'est pas une boîte noire",
    d: "Chaque note de calcul issue de notre bureau est transparente, vérifiable et optimisée. Nos hypothèses sont explicites, nos résultats reproductibles.",
  },
  {
    t: "L'alliance bureau d'études & formation",
    d: "Nos formateurs sont des ingénieurs en activité sur les chantiers. Cette double casquette garantit des formations ancrées dans les contraintes réelles du marché.",
  },
];

const VALUES = ['Rigueur', 'Traçabilité', 'BIM systématique', 'Pédagogie'];

export default function About() {
  useReveal();
  return (
    <div>
      <Helmet><title>Le studio — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Le studio</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.4rem]">
          Concrétiser des projets ambitieux,<br />élever le niveau du BTP.
        </h1>
      </section>

      {/* Vision & ADN */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4"><p className="eyebrow">Vision & ADN</p></div>
          <div className="fade-up md:col-span-8 space-y-6 text-[16.5px] leading-[1.75] text-[color:var(--color-ink-soft)]">
            <p>
              <span className="text-[color:var(--color-ink)]">Tower Structure</span> est un bureau d'études en
              ingénierie structurelle et un centre de formation spécialisé. Notre mission est double&nbsp;:
              concrétiser des projets architecturaux ambitieux grâce à une ingénierie fiable, et élever les
              compétences des acteurs du BTP.
            </p>
            <p>
              Fondé par des ingénieurs en génie civil et des product engineers chevronnés, le studio allie
              rigueur théorique, expertise sur le terrain et maîtrise des technologies digitales du bâtiment.
            </p>
          </div>
        </div>
      </section>

      {/* Engagements */}
      <section className="bg-[color:var(--color-paper-2)] py-20 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p className="eyebrow">Notre engagement</p>
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {ENGAGEMENTS.map((e) => (
              <div key={e.t} className="fade-up border-t border-[color:var(--color-line)] pt-6">
                <h3 className="text-2xl">{e.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{e.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {VALUES.map((v, i) => (
            <span key={v} className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl">
              {v}{i < VALUES.length - 1 && <span className="mx-3 text-[color:var(--color-line)]">/</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-3xl sm:text-5xl">Travailler avec le studio</h2>
          <div className="mt-8 flex flex-wrap gap-6">
            <Link to="/quote" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13.5px] font-medium text-[color:var(--color-ink)] hover:bg-white/90">
              Demander une étude <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link to="/formations" className="arrow-link text-[color:var(--color-paper)]">Voir les formations</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
