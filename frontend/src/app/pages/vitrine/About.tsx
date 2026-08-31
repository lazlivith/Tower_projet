import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';

const APPROACH = [
  { n: '01', t: 'Comprendre', d: 'Contexte, contraintes de site, exigences d\'usage et de délai. Rien ne se calcule avant d\'avoir cadré le problème.' },
  { n: '02', t: 'Modéliser', d: 'Maquette numérique structure tenue à jour, coordonnée avec l\'architecture et les fluides.' },
  { n: '03', t: 'Vérifier', d: 'Dimensionnement Eurocodes, analyses dynamiques, dispositions constructives. Notes de calcul traçables.' },
  { n: '04', t: 'Transmettre', d: 'Dossier d\'exécution exploitable, assistance chantier, et formation des équipes qui reprennent la méthode.' },
];

const VALUES = ['Rigueur', 'Traçabilité', 'BIM systématique', 'Pédagogie'];

export default function About() {
  useReveal();
  return (
    <div>
      <Helmet><title>Le studio — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Le studio</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.5rem]">
          Ingénieurs praticiens,<br />formateurs par nécessité.
        </h1>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4"><p className="eyebrow">Notre histoire</p></div>
          <div className="fade-up md:col-span-8 space-y-6 text-[16.5px] leading-[1.75] text-[color:var(--color-ink-soft)]">
            <p>
              Tower Structure réunit des ingénieurs structure qui ont d'abord été sur les chantiers.
              De cette pratique est née une conviction&nbsp;: une étude n'a de valeur que si elle est
              comprise et suivie jusqu'à la mise en œuvre.
            </p>
            <p>
              Nous concevons et vérifions des structures — bâtiment, industrie, ouvrages d'art — et
              nous formons les équipes qui les construiront. Les deux activités se nourrissent&nbsp;:
              les retours de chantier alimentent nos formations, les formations élèvent le niveau
              d'exigence sur les projets.
            </p>
          </div>
        </div>
      </section>

      {/* Approche */}
      <section className="bg-[color:var(--color-paper-2)] py-20 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p className="eyebrow">Méthode</p>
          <h2 className="mt-3 text-3xl sm:text-5xl">Quatre temps</h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {APPROACH.map((a) => (
              <div key={a.n} className="fade-up border-t border-[color:var(--color-line)] pt-6">
                <div className="flex items-baseline gap-4">
                  <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-ink-soft)]">{a.n}</span>
                  <h3 className="text-2xl">{a.t}</h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{a.d}</p>
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
              Demander un devis <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link to="/formations" className="arrow-link text-[color:var(--color-paper)]">Voir les formations</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
