import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

const COLS = [
  {
    title: 'Studio',
    links: [
      { to: '/about', label: 'À propos' },
      { to: '/services', label: 'Services' },
      { to: '/projets', label: 'Projets' },
      { to: '/blog', label: 'Journal' },
    ],
  },
  {
    title: 'Formation',
    links: [
      { to: '/formations', label: 'Catalogue' },
      { to: '/learn/login', label: 'Espace apprenant' },
      { to: '/quote', label: 'Demander un devis' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[color:var(--band)] text-[color:var(--band-fg)]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        {/* Bandeau haut */}
        <div className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <div className="font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] uppercase">
              Tower Structure
            </div>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/55">
              Bureau d'ingénierie structurelle & organisme de formation BIM.
              De l'étude de structure au dossier d'exécution, et la montée en compétences des équipes.
            </p>
            <Link
              to="/quote"
              className="arrow-link mt-8 text-[color:var(--band-fg)]"
            >
              Démarrer un projet <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {COLS.map((c) => (
            <div key={c.title} className="md:col-span-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">{c.title}</div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[14.5px] text-white/70 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Contact</div>
            <ul className="mt-4 space-y-2.5 text-[14.5px] text-white/70">
              <li><a href="mailto:contact@tower-structure.ma" className="hover:text-white">contact@tower-structure.ma</a></li>
              <li><a href="tel:+212522000000" className="hover:text-white">+212 5 22 00 00 00</a></li>
              <li className="text-white/50">Casablanca — Maroc</li>
            </ul>
            <div className="mt-5 flex gap-4 text-[13px] text-white/50">
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">Instagram</a>
              <a href="#" className="hover:text-white">Behance</a>
            </div>
          </div>
        </div>

        {/* Bas */}
        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-[12.5px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Tower Structure. Tous droits réservés.</span>
          <span>Ingénierie structurelle · BIM · Formation</span>
        </div>
      </div>
    </footer>
  );
}
