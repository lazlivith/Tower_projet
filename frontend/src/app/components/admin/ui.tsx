import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Primitives back-office — thème « ingénierie sombre » (.admin-ui)   */
/* ------------------------------------------------------------------ */

type Div = React.HTMLAttributes<HTMLDivElement>;

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="a-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[1.7rem] leading-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] text-[color:var(--a-ink-soft)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Panel({ className = '', children, ...rest }: Div & { children: ReactNode }) {
  return (
    <div className={`a-panel p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function PanelTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[15px]">{children}</h3>
      {right}
    </div>
  );
}

export function StatCard({
  value,
  label,
  hint,
  tone = 'accent',
  icon,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  tone?: 'accent' | 'amber' | 'ok' | 'danger';
  icon?: ReactNode;
}) {
  const toneCls = tone === 'amber' ? 'is-amber' : tone === 'ok' ? 'is-ok' : tone === 'danger' ? 'is-danger' : '';
  return (
    <div className={`a-stat ${toneCls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="a-stat-value">{value}</div>
          <div className="a-stat-label">{label}</div>
        </div>
        {icon && <div className="text-[color:var(--a-ink-dim)]">{icon}</div>}
      </div>
      {hint && <div className="mt-2 text-[11px] text-[color:var(--a-ink-dim)]">{hint}</div>}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};
export function Btn({ variant = 'ghost', size = 'md', className = '', ...rest }: BtnProps) {
  return (
    <button
      className={`a-btn a-btn-${variant} ${size === 'sm' ? 'a-btn-sm' : ''} ${className}`}
      {...rest}
    />
  );
}

export function Chip({
  children,
  tone = 'gray',
  className = '',
}: {
  children: ReactNode;
  tone?: 'blue' | 'amber' | 'green' | 'red' | 'gray';
  className?: string;
}) {
  return <span className={`a-chip a-chip-${tone} ${className}`}>{children}</span>;
}

export function Field({
  label,
  children,
  hint,
  className = '',
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="a-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[color:var(--a-ink-dim)]">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`a-input ${props.className ?? ''}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`a-select ${props.className ?? ''}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`a-textarea ${props.className ?? ''}`} />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="a-empty">{children}</div>;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="a-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`a-tab ${active === t.id ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="admin-ui-modal-backdrop a-scroll" onMouseDown={onClose}>
      <div
        className="admin-ui-modal"
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--a-line)] px-5 py-4">
          <h3 className="text-[15px]">{title}</h3>
          <button onClick={onClose} className="text-[color:var(--a-ink-dim)] transition-colors hover:text-[color:var(--a-ink)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="a-scroll max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 border-t border-[color:var(--a-line)] px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Petit toast local (sans dépendance) — usage : const [toast, setToast] = useState<Toast|null>() */
export type Toast = { kind: 'ok' | 'err'; msg: string };
export function ToastHost({ toast, onDone }: { toast: Toast | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[70] a-page-in">
      <div
        className={`a-panel flex items-center gap-2 px-4 py-3 text-[13px] ${
          toast.kind === 'ok' ? 'text-[color:var(--a-ok)]' : 'text-[color:var(--a-danger)]'
        }`}
      >
        {toast.msg}
      </div>
    </div>
  );
}

export function DataTable({
  columns,
  children,
  empty,
}: {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="a-panel a-scroll overflow-x-auto">
      <table className="a-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div className="p-6 text-center text-[13px] text-[color:var(--a-ink-dim)]">Aucune donnée.</div>}
    </div>
  );
}
