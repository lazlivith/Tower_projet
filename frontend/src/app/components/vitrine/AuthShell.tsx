import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Cadre partagé des pages d'authentification (connexion, première connexion…) —
 * repris du système de design de la vitrine (tokens --color-*, .eyebrow, .fade-up)
 * au lieu du gabarit générique précédent, isolé du reste de la plateforme.
 */
export default function AuthShell({ eyebrow, title, subtitle, icon: Icon, children, footer }: AuthShellProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1400px] items-center px-5 py-16 sm:px-8 lg:px-12">
      <div className="fade-up mx-auto w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {Icon && (
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <p className="eyebrow justify-center">{eyebrow}</p>
          <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{subtitle}</p>
        </div>

        <div className="mt-10 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]/70 p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-9">
          {children}
        </div>

        {footer}
      </div>
    </section>
  );
}
