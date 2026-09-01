import { Link } from 'react-router';
import { ArrowUpRight, ArrowUp, ShieldCheck } from 'lucide-react';

const ING = [
  { to: '/services/exe', label: "Études d'exécution" },
  { to: '/services/bim', label: 'Coordination BIM' },
  { to: '/services/diagnostic', label: 'Diagnostic & audit' },
  { to: '/projets', label: 'Projets réalisés' },
];
const ACAD = [
  { to: '/formations', label: 'Catalogue formations' },
  { to: '/blog', label: 'Blog technique' },
  { to: '/learn/login', label: 'Espace apprenant' },
  { to: '/quote', label: 'Demander un devis' },
];

export default function Footer() {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div id="site-footer">
      <div id="footer-sentinel" aria-hidden="true" />

      {/* Carte d'appel à l'action */}
      <section className="mx-auto max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-12 sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(56,189,248,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.7) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
              maskImage: 'radial-gradient(ellipse 80% 120% at 100% 0%, #000, transparent 70%)',
            }}
          />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="eyebrow">Bureau d'études · Casablanca</p>
              <h2 className="mt-3 max-w-xl text-2xl sm:text-4xl">
                Prêt à lancer votre <span className="grad-text">projet de structure</span>&nbsp;?
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/quote" className="btn btn-solid">Démarrer une étude <ArrowUpRight className="w-4 h-4" /></Link>
              <Link to="/formations" className="btn btn-outline">Voir les formations</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer principal */}
      <footer className="relative bg-[#090c10] text-[color:var(--ink-soft)]">
        <div className="gradient-rule" />
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 py-16 md:grid-cols-12 md:py-20">
            {/* Marque */}
            <div className="md:col-span-4">
              <div className="font-[family-name:var(--font-display)] text-xl tracking-[0.14em] uppercase text-white">
                Tower&nbsp;Structure
              </div>
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed">
                Bureau d'ingénierie structurelle et centre de formation. De l'étude d'exécution au dossier
                de chantier, et la montée en compétences des équipes.
              </p>
              <span className="chip chip-blue mt-5">BIM & Calcul Eurocodes</span>
            </div>

            {/* Ingénierie */}
            <div className="md:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Ingénierie</div>
              <ul className="mt-4 space-y-2.5">
                {ING.map((l) => (
                  <li key={l.label}><Link to={l.to} className="foot-link text-[14px]">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Académie */}
            <div className="md:col-span-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Académie & formations</div>
              <ul className="mt-4 space-y-2.5">
                {ACAD.map((l) => (
                  <li key={l.label}><Link to={l.to} className="foot-link text-[14px]">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Contact — Hub Casablanca */}
            <div className="md:col-span-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Hub Casablanca</div>
              <ul className="mt-4 space-y-2 text-[14px]">
                <li>Boulevard Zerktouni, Casablanca — Maroc</li>
                <li><a href="tel:+212522000000" className="foot-link">+212 5 22 00 00 00</a></li>
                <li><a href="mailto:contact@tower-structure.ma" className="foot-link">contact@tower-structure.ma</a></li>
              </ul>
              <div className="mt-4 flex gap-4 text-[13px]">
                <a href="#" className="foot-link">LinkedIn</a>
                <a href="#" className="foot-link">Instagram</a>
                <a href="#" className="foot-link">Behance</a>
              </div>
            </div>
          </div>

          {/* Bas */}
          <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[12.5px] text-white/40">© {new Date().getFullYear()} Tower Structure. Tous droits réservés.</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50">
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--accent)]" /> Eurocodes EC0–EC8
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50">
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--accent-2)]" /> RPS 2000
              </span>
              <button
                onClick={toTop}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[12px] text-white/70 transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                Haut de page <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
