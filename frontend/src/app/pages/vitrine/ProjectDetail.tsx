import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
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
  surface?: string | null;
  missions?: string | null;
  challenge?: string | null;
  solution?: string | null;
}
const PLACEHOLDER = 'https://placehold.co/1600x900/17160f/faf9f6?text=Projet';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/cms/projects/${id}`)
      .then((r) => { setProject(r.data); setState('ok'); })
      .catch(() => setState('notfound'));
  }, [id]);

  useReveal([project]);

  if (state === 'loading') return <div className="py-40 text-center text-[color:var(--color-ink-soft)]">Chargement…</div>;
  if (state === 'notfound' || !project) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-40 text-center sm:px-8 lg:px-12">
        <p className="text-[color:var(--color-ink-soft)]">Projet introuvable.</p>
        <Link to="/projets" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">← Retour aux projets</Link>
      </div>
    );
  }

  const meta = [
    { k: 'Catégorie', v: project.category },
    project.location && { k: 'Lieu', v: project.location },
    project.surface && { k: 'Surface', v: project.surface },
    { k: 'État', v: project.status === 'ONGOING' ? 'En cours' : 'Réalisé' },
  ].filter(Boolean) as { k: string; v: string }[];

  const blocks = [
    project.missions && { t: 'Missions confiées à Tower Structure', v: project.missions },
    project.challenge && { t: 'Défi technique', v: project.challenge },
    project.solution && { t: 'Solution apportée', v: project.solution },
  ].filter(Boolean) as { t: string; v: string }[];

  return (
    <div>
      <Helmet><title>{project.title} — Projets Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <Link to="/projets" className="inline-flex items-center gap-2 text-[13px] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
          <ArrowLeft className="w-4 h-4" /> Projets
        </Link>
        <p className="eyebrow mt-8">Étude de cas</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl">{project.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">{project.description}</p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="reveal-img aspect-[21/9] w-full bg-[color:var(--color-line)]">
          <img src={toAbsoluteUrl(project.imageUrl) || PLACEHOLDER} alt={project.title} className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <dl className="grid gap-x-8 gap-y-6 border-y border-[color:var(--color-line)] py-8 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div key={m.k}>
              <dt className="eyebrow">{m.k}</dt>
              <dd className="mt-2 text-[15px]">{m.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {blocks.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          {blocks.map((b) => (
            <div key={b.t} className="fade-up grid gap-8 border-t border-[color:var(--color-line)] py-12 first:border-t-0 md:grid-cols-12">
              <div className="md:col-span-4"><p className="eyebrow">{b.t}</p></div>
              <p className="md:col-span-8 whitespace-pre-wrap text-[16px] leading-[1.7] text-[color:var(--color-ink)]">{b.v}</p>
            </div>
          ))}
        </section>
      )}

      <section className="bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="text-2xl sm:text-4xl">Votre ouvrage mérite la même rigueur.</h2>
          <Link to="/quote" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">
            Demander une étude <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
