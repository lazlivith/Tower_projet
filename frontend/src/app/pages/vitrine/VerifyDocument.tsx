import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, ShieldX, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

interface Result {
  valid: boolean;
  number: string;
  type?: string;
  typeLabel?: string;
  issuedAt?: string;
}

export default function VerifyDocument() {
  const { number: paramNumber } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(paramNumber ?? '');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (num: string) => {
    const ref = num.trim().toUpperCase();
    if (!ref) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.get(`/documents/verify/${encodeURIComponent(ref)}`);
      setResult(r.data);
    } catch {
      setError("La vérification n'a pas pu aboutir. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paramNumber) check(paramNumber);
  }, [paramNumber, check]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = input.trim().toUpperCase();
    if (ref) navigate(`/verify/${encodeURIComponent(ref)}`);
  };

  return (
    <div>
      <Helmet><title>Vérification de document — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[720px] px-5 pt-24 pb-28 sm:px-8 lg:pt-32">
        <p className="eyebrow">Authenticité</p>
        <h1 className="mt-4 text-3xl leading-[1.1] sm:text-5xl">Vérifier un document</h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Saisissez la référence figurant sur un certificat, une facture, un devis ou une attestation
          émis par Tower Structure (ex. <span className="font-[family-name:var(--font-display)]">TS-CERT-2026-0007</span>).
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="TS-XXX-AAAA-0000"
            className="flex-1 rounded-full border border-[color:var(--color-line)] bg-transparent px-5 py-3 text-[15px] uppercase tracking-wide text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]"
          />
          <button type="submit" className="btn btn-solid justify-center">
            Vérifier <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-10">
          {loading && (
            <div className="flex items-center gap-2 text-[color:var(--color-ink-soft)]">
              <Loader2 className="h-5 w-5 animate-spin" /> Vérification…
            </div>
          )}

          {error && <p className="text-[color:var(--color-ink-soft)]">{error}</p>}

          {result && !loading && (
            result.valid ? (
              <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)] p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:color-mix(in_srgb,#34d399_20%,transparent)] text-[#34d399]">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-ink)]">Document authentique</div>
                    <div className="text-[13px] text-[color:var(--color-ink-soft)]">Émis par Tower Structure</div>
                  </div>
                </div>
                <dl className="mt-5 grid gap-3 border-t border-[color:var(--color-line)] pt-5 text-[14px] sm:grid-cols-3">
                  <div><dt className="text-[color:var(--color-ink-soft)]">Référence</dt><dd className="mt-0.5 font-[family-name:var(--font-display)] text-[color:var(--color-ink)]">{result.number}</dd></div>
                  <div><dt className="text-[color:var(--color-ink-soft)]">Type</dt><dd className="mt-0.5 text-[color:var(--color-ink)]">{result.typeLabel}</dd></div>
                  <div><dt className="text-[color:var(--color-ink-soft)]">Émis le</dt><dd className="mt-0.5 text-[color:var(--color-ink)]">{result.issuedAt ? new Date(result.issuedAt).toLocaleDateString('fr-FR') : '—'}</dd></div>
                </dl>
                <p className="mt-4 text-[12.5px] text-[color:var(--color-ink-soft)]">
                  Comparez ces informations avec celles imprimées sur votre document. En cas de doute,
                  contactez-nous à contact@tower-structure.ma.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[color:var(--color-line)] p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:color-mix(in_srgb,#f87171_18%,transparent)] text-[#f87171]">
                    <ShieldX className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-ink)]">Référence inconnue</div>
                    <div className="text-[13px] text-[color:var(--color-ink-soft)]">Aucun document ne correspond à « {result.number} »</div>
                  </div>
                </div>
                <p className="mt-4 text-[12.5px] text-[color:var(--color-ink-soft)]">
                  Vérifiez la saisie (tirets et casse). Si le problème persiste, ce document n'a pas été
                  émis par Tower Structure ou a été retiré.
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
