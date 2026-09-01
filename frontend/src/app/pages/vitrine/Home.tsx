import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, ArrowDown, ArrowRight } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useReveal } from '../../hooks/useReveal';

const HERO_IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80';
const PLACEHOLDER = 'https://placehold.co/900x700/16150f/f7f5f0?text=Tower+Structure';

const WHY = [
  { k: '01', t: 'Rigueur & conformité', d: "Calculs Eurocodes et RPS, modélisation avancée : la durabilité et la sécurité de vos ouvrages, démontrées." },
  { k: '02', t: 'Expertise terrain & digitale', d: 'Expérience de chantier, ingénierie de pointe et méthodologie BIM appliquée à chaque projet.' },
  { k: '03', t: 'Formation continue', d: 'Transfert de savoir-faire aux équipes techniques pour maîtriser les outils et normes actuels.' },
];

const SERVICES = [
  { n: '01', t: "Études d'exécution & calculs", d: 'Béton armé (EC2), charpente métallique (EC3), mixte. Étude parasismique EC8 / RPS. Plans de coffrage et de ferraillage.', to: '/services/exe' },
  { n: '02', t: 'Coordination BIM & synthèse', d: 'Maquettes LOD 100 à 400, détection de clashs structure / architecture / MEP, livrables RVT et IFC.', to: '/services/bim' },
  { n: '03', t: 'Diagnostic & réhabilitation', d: "Audit d'ouvrages existants, capacité portante résiduelle, ingénierie de confortement.", to: '/services/diagnostic' },
];

const STATS = [
  { v: 'EC0 → EC8', l: 'Eurocodes maîtrisés' },
  { v: 'LOD 400', l: 'niveau de détail BIM' },
  { v: 'RPS 2000', l: 'règlement parasismique' },
  { v: 'EXE', l: "dossiers d'exécution" },
];

const TESTIMONIALS = [
  { q: "Une méthodologie BIM rigoureuse, du concept jusqu'au chantier.", n: 'M. Bennani', o: "Maître d'ouvrage — Casablanca" },
  { q: 'Formation complète, encadrée par des ingénieurs praticiens. Directement applicable.', n: 'S. El Amrani', o: 'Ingénieure structure — Rabat' },
];

interface Project { id: string; title: string; category: string; imageUrl: string | null; status: string }
interface Course { id: string; title: string; description: string; level?: string; durationHours?: number; imageUrl?: string | null; priceLabel?: string | null; price?: number }

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
        <meta name="description" content="Bureau d'études structure et centre de formation BIM. Études d'exécution, calculs Eurocodes, coordination BIM, diagnostic et confortement." />
      </Helmet>

      {/* ---------- HERO ---------- */}
      <section className="relative -mt-[66px] flex h-[100svh] min-h-[620px] w-full items-end overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-[color:var(--color-ink)]/85" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-16 sm:px-8 lg:px-12">
          <p className="eyebrow text-white/80">Bureau d'études structure · Centre de formation BIM</p>
          <h1 className="mt-5 max-w-5xl text-[2.15rem] font-medium leading-[1.05] text-white sm:text-5xl lg:text-[4.2rem]">
            L'ingénierie structurelle d'excellence et la montée en compétences BIM.
          </h1>
          <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-white/70">
            De l'étude de structure complexe à l'optimisation des dossiers d'exécution — nous accompagnons
            les maîtres d'ouvrage et formons les ingénieurs de demain.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/quote" className="btn btn-light">Demander une étude <ArrowUpRight className="w-4 h-4" /></Link>
            <Link to="/formations" className="arrow-link text-white/90">Découvrir nos formations</Link>
          </div>
        </div>
        <ArrowDown className="absolute bottom-6 right-6 hidden w-5 h-5 animate-bounce text-white/50 sm:block" />
      </section>

      {/* ---------- POURQUOI NOUS (sombre) ---------- */}
      <section className="relative overflow-hidden bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="eyebrow">Pourquoi Tower Structure</p>
              <h2 className="mt-4 text-3xl sm:text-4xl">Une exigence,<br />deux métiers.</h2>
            </div>
            <div className="md:col-span-8 md:pt-2">
              {WHY.map((w) => (
                <div key={w.k} className="fade-up grid grid-cols-[auto_1fr] gap-5 border-t border-white/12 py-7 first:border-t-0 md:gap-8">
                  <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-accent)]">{w.k}</span>
                  <div>
                    <h3 className="text-lg sm:text-xl">{w.t}</h3>
                    <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/55">{w.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/12 pt-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="fade-up">
                <div className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[color:var(--color-accent)]">{s.v}</div>
                <div className="mt-1.5 text-[12px] text-white/45">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PROJETS ---------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Réalisations</p>
            <h2 className="mt-3 text-3xl sm:text-[2.75rem]">Projets récents</h2>
          </div>
          <Link to="/projets" className="arrow-link text-[color:var(--color-ink)]">
            Projets réalisés & en cours <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {(projects.length ? projects : Array.from({ length: 3 })).map((p: any, i) => (
            <Link
              key={p?.id ?? i}
              to={p?.id ? `/projets/${p.id}` : '/projets'}
              className={`card fade-up block ${i === 0 ? 'sm:col-span-2 lg:row-span-1' : ''}`}
            >
              <div className={`card-media ${i === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                <img src={toAbsoluteUrl(p?.imageUrl) || PLACEHOLDER} alt={p?.title || ''}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
              </div>
              <div className="mt-3.5 flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-medium leading-snug">{p?.title || 'Projet Tower Structure'}</h3>
                <span className="chip shrink-0">{p?.category?.split(' ')[0] || '—'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="bg-[color:var(--color-paper-2)] py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Expertises</p>
            <h2 className="mt-3 text-3xl sm:text-[2.75rem]">Ce que<br />nous faisons</h2>
            <Link to="/services" className="btn btn-outline mt-7">Détail des services <ArrowUpRight className="w-4 h-4" /></Link>
          </div>
          <div className="lg:col-span-8">
            {SERVICES.map((s) => (
              <Link key={s.n} to={s.to} className="group fade-up grid grid-cols-[auto_1fr_auto] items-center gap-5 border-t border-[color:var(--color-line)] py-7 first:border-t-0 md:gap-8">
                <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-accent)]">{s.n}</span>
                <div>
                  <h3 className="text-lg sm:text-xl transition-colors group-hover:text-[color:var(--color-accent)]">{s.t}</h3>
                  <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[color:var(--color-ink-soft)]">{s.d}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[color:var(--color-ink-soft)] transition-all group-hover:text-[color:var(--color-accent)] group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FORMATIONS ---------- */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Académie</p>
            <h2 className="mt-3 text-3xl sm:text-[2.75rem]">Formations BIM & structure</h2>
          </div>
          <Link to="/formations" className="arrow-link text-[color:var(--color-ink)]">Catalogue complet <ArrowRight className="w-4 h-4" /></Link>
        </div>

        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {(courses.length ? courses : Array.from({ length: 3 })).map((c: any, i) => (
            <Link key={c?.id ?? i} to={c?.id ? `/formations/${c.id}` : '/formations'} className="card fade-up block">
              <div className="card-media aspect-[4/3]">
                <img src={toAbsoluteUrl(c?.imageUrl) || PLACEHOLDER} alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
              </div>
              <div className="mt-3.5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
                  {c?.level || 'Tous niveaux'}{c?.durationHours ? ` · ${c.durationHours} h` : ''}
                </div>
                <h3 className="mt-1.5 text-[15px] font-medium leading-snug">{c?.title || 'Formation Tower Structure'}</h3>
                <div className="mt-2 text-[13px] font-[family-name:var(--font-display)] text-[color:var(--color-accent)]">
                  {c?.priceLabel || (c?.price ? `${Number(c.price).toLocaleString('fr-FR')} MAD` : '')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- TÉMOIGNAGES ---------- */}
      <section className="bg-[color:var(--color-paper-2)] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p className="eyebrow">Ils nous font confiance</p>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.n} className="fade-up rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-8">
                <p className="font-[family-name:var(--font-display)] text-lg leading-[1.5] sm:text-xl">“{t.q}”</p>
                <footer className="mt-6 text-[13px] text-[color:var(--color-ink-soft)]">
                  <span className="text-[color:var(--color-ink)]">{t.n}</span> — {t.o}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <h2 className="max-w-3xl text-3xl sm:text-5xl lg:text-6xl">Un projet de structure&nbsp;? Parlons-en.</h2>
          <p className="mt-5 max-w-xl text-[14.5px] text-white/55">
            Décrivez votre projet, nous revenons vers vous sous 48 h avec une première approche.
          </p>
          <Link to="/quote" className="btn btn-light mt-9">Demander un devis <ArrowUpRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}
