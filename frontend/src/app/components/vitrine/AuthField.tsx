import { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  label: string;
  labelRight?: ReactNode;
  endAdornment?: ReactNode;
}

/** Champ des pages d'authentification — icône + fond plein, label optionnellement
 * accompagné d'un lien à droite (ex. « Mot de passe oublié ? »). */
export default function AuthField({ icon: Icon, label, labelRight, endAdornment, id, className, ...input }: AuthFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold text-[#0f1b2a]">{label}</label>
        {labelRight}
      </div>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          {...input}
          className={
            'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 text-[15px] text-[#0f1b2a] outline-none ' +
            'transition-colors focus:border-[#2189B7] focus:bg-white focus:ring-2 focus:ring-[#2189B7]/15 ' +
            (endAdornment ? 'pr-11' : 'pr-4') + (className ? ` ${className}` : '')
          }
        />
        {endAdornment && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{endAdornment}</div>}
      </div>
    </div>
  );
}
