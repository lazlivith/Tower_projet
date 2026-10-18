import { ReactNode } from 'react';
import { Link } from 'react-router';
import { ShieldCheck, FileCheck2, GraduationCap } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FEATURES = [
  { icon: ShieldCheck, label: 'Suivi de chantier et conformité des études' },
  { icon: FileCheck2, label: 'Devis, factures et certificats vérifiables en ligne' },
  { icon: GraduationCap, label: 'Formations BIM & Eurocodes, 100 % en ligne' },
];

/**
 * Page d'authentification plein écran, dédiée — pas de header/footer vitrine
 * (ni défilement : le panneau de gauche reste fixe, seul le panneau de droite
 * défile si son contenu dépasse la hauteur de l'écran).
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white">
      {/* Panneau de marque — masqué sous lg */}
      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#081622] via-[#0d3a52] to-[#1a7fa3] p-10 text-white lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-[#F59E0B]/10 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F59E0B] font-bold text-[#0a2132]">TS</div>
            <div>
              <div className="font-[family-name:var(--font-display,'Space_Grotesk')] text-[13px] font-semibold uppercase tracking-[0.16em]">
                Tower&nbsp;Structure
              </div>
              <div className="text-[11px] text-white/60">Bureau d'études & centre de formation BIM</div>
            </div>
          </div>

          <h2 className="mt-16 max-w-xs text-[28px] font-semibold leading-[1.25] xl:text-[32px]">
            Ingénierie structurelle, pilotée depuis un seul espace.
          </h2>
        </div>

        <ul className="relative flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-[14px] text-white/90">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
                <Icon className="h-4 w-4 text-[#F59E0B]" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="relative border-t border-white/15 pt-5 text-[12px] leading-relaxed text-white/55">
          Vos documents (devis, factures, attestations, certificats) sont conservés dans votre
          espace personnel, accessible à vous seul et vérifiables publiquement par référence.
        </div>
      </div>

      {/* Panneau du formulaire */}
      <div className="flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F59E0B] text-[13px] font-bold text-[#0a2132]">TS</div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0a2132]">Tower&nbsp;Structure</span>
          </Link>

          <h1 className="text-[28px] font-bold text-[#0f1b2a] sm:text-[32px]">{title}</h1>
          <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer}

          <Link
            to="/"
            className="mt-8 block text-center text-[13px] text-slate-400 transition-colors hover:text-slate-600"
          >
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
