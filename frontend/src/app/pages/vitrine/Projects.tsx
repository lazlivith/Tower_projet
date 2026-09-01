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
  location?: string | null;
}
type Tab = 'COMPLETED' | 'ONGOING';
const PLACEHOLDER = 'https://placehold.co/900x700/16150f/f7f5f0?text=Tower+Structure';

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

      <section className="mx-auto max-w-[1400px] px-5 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <p className="eyebrow">Réalisations & chantiers</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.04] sm:text-6xl lg:text-[4.2rem]">
          Des structures étudiées,<br />vérifiées, construites.
        </h1>

        <div className="mt-10 flex gap-2">
          {([['COMPLETED', 'Projets réalisés'], ['ONGOING', 'En cours']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-full px-5 py-2 text-[12.5px] font-medium tracking-wide transition-colors ${
                tab === v
                  ? 'bg-[color:var(--color-ink)] text-[color:var(--color-paper)]'
                  : 'border border-[color:var(--color-line)] text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        {loading ? (
          <p className="py-16 text-center text-[color:var(--color-ink-soft)]">Chargement…</p>
        ) : projects.length === 0 ? (
          <p className="py-16 text-center text-[color:var(--color-ink-soft)]">
            {tab === 'COMPLETED' ? 'Aucun projet réalisé publié.' : 'Aucun projet en cours publié.'}
          </p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <Link to={`/projets/${p.id}`} key={p.id} className={`card fade-up block ${i % 5 === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
                <div className={`card-media ${i % 5 === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                  <img src={toAbsoluteUrl(p.imageUrl) || PLACEHOLDER} alt={p.title}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium leading-snug sm:text-xl">{p.title}</h2>
                    <p className="mt-1 text-[13px] text-[color:var(--color-ink-soft)]">
                      {p.category}{p.location ? ` · ${p.location}` : ''}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${p.status === 'ONGOING' ? '' : ''}`}>
                    {p.status === 'ONGOING' ? 'En cours' : 'Réalisé'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-4xl">Votre ouvrage mérite la même rigueur.</h2>
          <Link to="/quote" className="btn btn-solid mt-7">Demander une étude <ArrowUpRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}
