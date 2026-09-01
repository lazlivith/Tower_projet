import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useReveal } from '../../hooks/useReveal';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  status: 'ONGOING' | 'COMPLETED';
}
type Tab = 'COMPLETED' | 'ONGOING';
const PLACEHOLDER = 'https://placehold.co/1200x900/17160f/faf9f6?text=Tower+Structure';

export default function Projects() {
  const [tab, setTab] = useState<Tab>('COMPLETED');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/cms/projects?status=${tab}`)
      .then((r) => setProjects(r.data?.data ?? r.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useReveal([projects]);

  return (
    <div>
      <Helmet><title>Projets — Tower Structure</title></Helmet>

      {/* En-tête éditorial */}
      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Réalisations & chantiers</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.5rem]">
          Des structures étudiées,<br />vérifiées, construites.
        </h1>

        <div className="mt-12 flex gap-8 border-b border-[color:var(--color-line)]">
          {([['COMPLETED', 'Projets réalisés'], ['ONGOING', 'En cours']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`-mb-px border-b pb-4 text-[13px] uppercase tracking-[0.16em] transition-colors ${
                tab === v
                  ? 'border-[color:var(--color-ink)] text-[color:var(--color-ink)]'
                  : 'border-transparent text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Grille */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        {loading ? (
          <p className="py-20 text-center text-[color:var(--color-ink-soft)]">Chargement…</p>
        ) : projects.length === 0 ? (
          <p className="py-20 text-center text-[color:var(--color-ink-soft)]">
            {tab === 'COMPLETED' ? 'Aucun projet réalisé publié.' : 'Aucun projet en cours publié.'}
          </p>
        ) : (
          <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
            {projects.map((p, i) => (
              <Link to={`/projets/${p.id}`} key={p.id} className={`fade-up group block ${i % 3 === 0 ? 'md:col-span-2' : ''}`}>
                <div className={`reveal-img w-full bg-[color:var(--color-line)] ${i % 3 === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                  <img
                    src={toAbsoluteUrl(p.imageUrl) || PLACEHOLDER}
                    alt={p.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-2xl sm:text-3xl">
                    {p.title}
                    <ArrowUpRight className="w-5 h-5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </h2>
                  <span className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                    {p.category} · {p.status === 'ONGOING' ? 'En cours' : 'Réalisé'}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">
                  {p.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-4xl">Votre ouvrage mérite la même rigueur.</h2>
          <a href="/quote" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">Demander un devis</a>
        </div>
      </section>
    </div>
  );
}
