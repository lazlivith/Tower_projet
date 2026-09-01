import { useState } from 'react';
import { Plus, Trash2, GripVertical, Check } from 'lucide-react';

/**
 * Composant prédéfini de composition de quiz — sort le format normalisé
 * `{ question, options: {A..F}, correctAnswer }[]` attendu par l'API
 * (identique à la sortie du parseur de fichier).
 */

export interface BuilderQuestion {
  question: string;
  options: Record<string, string>;
  correctAnswer: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const blank = (): { q: string; opts: string[]; correct: number } => ({ q: '', opts: ['', ''], correct: 0 });

export function toApiQuestions(rows: { q: string; opts: string[]; correct: number }[]): BuilderQuestion[] {
  return rows.map((r) => {
    const filled = r.opts.map((o) => o.trim());
    const options: Record<string, string> = {};
    filled.forEach((o, i) => { if (o) options[LETTERS[i]] = o; });
    return { question: r.q.trim(), options, correctAnswer: LETTERS[r.correct] };
  });
}

export function isBuilderValid(rows: { q: string; opts: string[]; correct: number }[]): boolean {
  return (
    rows.length > 0 &&
    rows.every((r) => r.q.trim() && r.opts.filter((o) => o.trim()).length >= 2 && r.opts[r.correct]?.trim())
  );
}

export default function QuizBuilder({
  value,
  onChange,
}: {
  value: { q: string; opts: string[]; correct: number }[];
  onChange: (rows: { q: string; opts: string[]; correct: number }[]) => void;
}) {
  const [rows, setRows] = useState(value.length ? value : [blank()]);

  const push = (next: typeof rows) => { setRows(next); onChange(next); };

  const update = (i: number, patch: Partial<(typeof rows)[number]>) =>
    push(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={i} className="a-card p-3.5">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-2 h-4 w-4 flex-shrink-0 text-[color:var(--a-ink-dim)]" />
            <div className="min-w-0 flex-1">
              <input
                className="a-input mb-2"
                placeholder={`Question ${i + 1}`}
                value={r.q}
                onChange={(e) => update(i, { q: e.target.value })}
              />
              <div className="flex flex-col gap-1.5">
                {r.opts.map((o, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Marquer comme bonne réponse"
                      onClick={() => update(i, { correct: j })}
                      className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors ${
                        r.correct === j
                          ? 'border-[color:var(--a-ok)] bg-[color:color-mix(in_srgb,var(--a-ok)_20%,transparent)] text-[color:var(--a-ok)]'
                          : 'border-[color:var(--a-line)] text-[color:var(--a-ink-dim)]'
                      }`}
                    >
                      {r.correct === j ? <Check className="h-3.5 w-3.5" /> : LETTERS[j]}
                    </button>
                    <input
                      className="a-input !py-1.5"
                      placeholder={`Option ${LETTERS[j]}`}
                      value={o}
                      onChange={(e) => update(i, { opts: r.opts.map((x, k) => (k === j ? e.target.value : x)) })}
                    />
                    {r.opts.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const opts = r.opts.filter((_, k) => k !== j);
                          update(i, { opts, correct: Math.min(r.correct, opts.length - 1) });
                        }}
                        className="text-[color:var(--a-ink-dim)] hover:text-[color:var(--a-danger)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {r.opts.length < 6 && (
                <button
                  type="button"
                  onClick={() => update(i, { opts: [...r.opts, ''] })}
                  className="mt-1.5 text-[11px] font-semibold text-[color:var(--a-accent)]"
                >
                  + Ajouter une option
                </button>
              )}
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => push(rows.filter((_, k) => k !== i))}
                className="mt-1 text-[color:var(--a-ink-dim)] hover:text-[color:var(--a-danger)]"
                title="Supprimer la question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => push([...rows, blank()])}
        className="a-btn a-btn-ghost self-start"
      >
        <Plus className="h-4 w-4" /> Ajouter une question
      </button>
    </div>
  );
}
