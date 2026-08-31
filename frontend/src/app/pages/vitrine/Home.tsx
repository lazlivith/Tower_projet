import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useReveal } from '../../hooks/useReveal';

const HERO_IMG =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80';
const PLACEHOLDER = 'https://placehold.co/1200x900/17160f/faf9f6?text=Tower+Structure';

const SERVICES = [
  { n: '01', t: 'BIM & Modélisation', d: 'Maquette numérique structure, coordination inter-lots, dossiers d\'exécution exploitables.' },
  { n: '02', t: 'Calculs Eurocodes', d: 'Dimensionnement béton, métal et mixte selon EN 1992/1993/1998. Notes de calcul traçables.' },
  { n: '03', t: 'Diagnostic & Confortement', d: 'Inspection, pathologie du bâti, renforcement de structures existantes en site occupé.' },
];

const STATS = [
  { v: '15+', l: "années d'expertise" },
  { v: '200+', l: 'projets étudiés' },
  { v: '500+', l: 'ingénieurs formés' },
  { v: 'BIM', l: 'méthodologie systématique' },
];

const TESTIMONIALS = [
  { q: "Une méthodologie BIM rigoureuse et un accompagnement du concept jusqu'au chantier.", n: 'M. Bennani', o: 'Maître d\'ouvrage — Casablanca' },
  { q: 'Formation très complète, encadrée par des ingénieurs praticiens. Directement applicable.', n: 'S. El Amrani', o: 'Ingénieure structure — Rabat' },
];

interface Project { id: string; title: string; category: string; imageUrl: string | null; status: string }
interface Course { id: string; title: string; description: string; level?: string; durationHours?: number; imageUrl?: string | null }

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.get('/cms/projects?status=COMPLETED').then((r) => setProjects((r.data?.data ?? r.data ?? []).slice(0, 4))).catch(() => {});
    api.get('/courses').then((r) => setCourses((r.data?.data ?? r.data ?? []).slice(0, 3))).catch(() => {});
  }, []);

  useReveal([projects, courses]);

  return (
    <div>
      <Helmet>
        <title>Tower Structure — Ingénierie structurelle & formation BIM</title>
        <meta name="description" content="Bureau d'ingénierie structurelle et organisme de formation BIM. Études de structure, calculs Eurocodes, diagnostic et confortement." />
      </Helmet>

      {/* ---------- HERO ---------- */}
      <section className="relative -mt-[72px] h-[100svh] min-h-[640px] w-full">
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-20 sm:px-8 lg:px-12">
          <p className="eyebrow text-white/70">Bureau d'ingénierie · Formation BIM</p>
          <h1 className="mt-5 max-w-4xl font-[family-name:var(--font-display)] text-[2.6rem] font-medium leading-[1.05] text-white sm:text-6xl lg:text-[5rem]">
            La structure, pensée avec précision.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/75">
            De l'étude de structure au dossier d'exécution — et la montée en compétences de vos équipes,
            avec une méthodologie BIM appliquée à chaque projet.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              to="/quote"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13.5px] font-medium text-[color:var(--color-ink)] transition-colors hover:bg-white/90"
            >
              Démarrer un projet
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link to="/projets" className="arrow-link text-white/90">Voir les réalisations</Link>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 hidden text-white/60 sm:block">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </section>

      {/* ---------- MANIFESTE ---------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Le studio</p>
          </div>
          <div className="fade-up md:col-span-8">
            <p className="font-[family-name:var(--font-display)] text-2xl font-normal leading-[1.4] sm:text-[2rem]">
              Tower Structure conçoit et vérifie des structures — bâtiment, industrie, ouvrages d'art —
              et forme les ingénieurs qui les construiront. Une même exigence&nbsp;: des choix
              justifiés, des notes de calcul traçables, une maquette numérique tenue à jour.
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-8 border-t border-[color:var(--color-line)] pt-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="fade-up">
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{s.v}</div>
              <div className="mt-2 text-[13px] text-[color:var(--color-ink-soft)]">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- PROJETS ---------- */}
      <section className="bg-[color:var(--color-paper-2)] py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Réalisations</p>
              <h2 className="mt-3 text-3xl sm:text-5xl">Projets récents</h2>
            </div>
            <Link to="/projets" className="arrow-link hidden text-[color:var(--color-ink)] sm:inline-flex">
              Tous les projets <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2">
            {(projects.length ? projects : Array.from({ length: 2 })).map((p: any, i) => (
              <Link
                key={p?.id ?? i}
                to="/projets"
                className={`fade-up group block ${i % 3 === 0 ? 'md:col-span-2' : ''}`}
              >
                <div className="reveal-img aspect-[16/10] w-full bg-[color:var(--color-line)]">
                  <img
                    src={toAbsoluteUrl(p?.imageUrl) || PLACEHOLDER}
                    alt={p?.title || ''}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="text-xl">{p?.title || 'Projet Tower Structure'}</h3>
                  <span className="text-[12px] uppercase tracking-[0.15em] text-[color:var(--color-ink-soft)]">
                    {p?.category || '—'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Link to="/projets" className="arrow-link mt-12 inline-flex text-[color:var(--color-ink)] sm:hidden">
            Tous les projets <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Expertises</p>
            <h2 className="mt-3 text-3xl sm:text-5xl">Ce que nous faisons</h2>
            <Link to="/services" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">
              Détail des services <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="md:col-span-8">
            {SERVICES.map((s) => (
              <div key={s.n} className="fade-up grid grid-cols-[auto_1fr] gap-6 border-t border-[color:var(--color-line)] py-8 first:border-t-0 md:gap-10">
                <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-ink-soft)]">{s.n}</span>
                <div>
                  <h3 className="text-xl sm:text-2xl">{s.t}</h3>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FORMATIONS ---------- */}
      <section className="bg-[color:var(--color-paper-2)] py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Académie</p>
              <h2 className="mt-3 text-3xl sm:text-5xl">Formations BIM & structure</h2>
            </div>
            <Link to="/formations" className="arrow-link hidden text-[color:var(--color-ink)] sm:inline-flex">
              Catalogue <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {(courses.length ? courses : Array.from({ length: 3 })).map((c: any, i) => (
              <Link key={c?.id ?? i} to="/formations" className="fade-up group block">
                <div className="reveal-img aspect-[4/3] w-full bg-[color:var(--color-line)]">
                  <img
                    src={toAbsoluteUrl(c?.imageUrl) || PLACEHOLDER}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </div>
                <h3 className="mt-4 text-lg">{c?.title || 'Formation Tower Structure'}</h3>
                <p className="mt-2 line-clamp-2 text-[14px] text-[color:var(--color-ink-soft)]">{c?.description || ''}</p>
                <div className="mt-3 text-[12px] uppercase tracking-[0.15em] text-[color:var(--color-ink-soft)]">
                  {c?.level || 'Tous niveaux'}{c?.durationHours ? ` · ${c.durationHours} h` : ''}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TÉMOIGNAGES ---------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <p className="eyebrow">Retours</p>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.n} className="fade-up border-t border-[color:var(--color-line)] pt-8">
              <p className="font-[family-name:var(--font-display)] text-xl font-normal leading-[1.5] sm:text-2xl">“{t.q}”</p>
              <footer className="mt-6 text-[13px] text-[color:var(--color-ink-soft)]">
                <span className="text-[color:var(--color-ink)]">{t.n}</span> — {t.o}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <h2 className="max-w-3xl text-3xl sm:text-5xl lg:text-6xl">Un projet de structure&nbsp;? Parlons-en.</h2>
          <p className="mt-5 max-w-xl text-[15px] text-white/60">
            Décrivez votre projet, nous revenons vers vous sous 48 h avec une première approche.
          </p>
          <Link
            to="/quote"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13.5px] font-medium text-[color:var(--color-ink)] transition-colors hover:bg-white/90"
          >
            Demander un devis
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
