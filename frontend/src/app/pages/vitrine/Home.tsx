import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, ArrowDown, ArrowRight, Box, Ruler, Waves, Quote } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useReveal } from '../../hooks/useReveal';
import StructureBackground from '../../components/vitrine/StructureBackground';

const HERO_IMG = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2200&q=80';
const PLACEHOLDER = 'https://placehold.co/900x700/0d1117/38bdf8?text=Tower+Structure';

const WHY = [
  { k: '01', t: 'Rigueur & conformité', d: 'Calculs Eurocodes et RPS, modélisation avancée : la durabilité et la sécurité de vos ouvrages, démontrées.' },
  { k: '02', t: 'Expertise terrain & digitale', d: 'Expérience de chantier, ingénierie de pointe et méthodologie BIM appliquée à chaque projet.' },
  { k: '03', t: 'Formation continue', d: 'Transfert de savoir-faire aux équipes techniques pour maîtriser les outils et normes actuels.' },
];

const SERVICES = [
  { n: '01', t: "Études d'exécution & calculs", d: 'Béton armé (EC2), charpente métallique (EC3), mixte. Étude parasismique EC8 / RPS. Plans de coffrage et de ferraillage.', to: '/services/exe', tag: 'EXE', tagCls: 'chip-blue' },
  { n: '02', t: 'Coordination BIM & synthèse', d: 'Maquettes LOD 100 à 400, détection de clashs structure / architecture / MEP, livrables RVT et IFC.', to: '/services/bim', tag: 'BIM', tagCls: 'chip-blue' },
  { n: '03', t: 'Diagnostic & réhabilitation', d: "Audit d'ouvrages existants, capacité portante résiduelle, ingénierie de confortement.", to: '/services/diagnostic', tag: 'AUDIT', tagCls: 'chip-amber' },
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

// icône + couleur par typologie de projet
const TYPO: Record<string, { icon: any; cls: string }> = {
  résidentiel: { icon: Box, cls: 'text-[color:var(--accent)]' },
  tertiaire: { icon: Box, cls: 'text-[color:var(--accent)]' },
  industriel: { icon: Ruler, cls: 'text-[color:var(--accent-2)]' },
  infrastructure: { icon: Waves, cls: 'text-[#34d399]' },
  réhabilitation: { icon: Ruler, cls: 'text-[color:var(--accent-2)]' },
};
const typoOf = (cat = '') => {
  const key = Object.keys(TYPO).find((k) => cat.toLowerCase().includes(k));
  return key ? TYPO[key] : { icon: Box, cls: 'text-[color:var(--accent)]' };
};

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
      <section className="relative -mt-[66px] flex h-[82vh] min-h-[500px] max-h-[760px] w-full items-end overflow-hidden bg-[color:var(--paper)]">
        {/* photo de fond très atténuée */}
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.18]" />
        {/* maillage éléments finis animé — fond dynamique */}
        <StructureBackground fixed={false} density={2} intensity={2} accent="#38bdf8" />
        {/* dégradé de lisibilité (laisse respirer le maillage en haut) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/35 via-[#0d1117]/45 to-[#0d1117]" />
        {/* grille blueprint renforcée sur le hero */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56,189,248,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 30% 90%, #000 20%, transparent 75%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-14 sm:px-8 lg:px-12">
          <p className="eyebrow text-[color:var(--accent)]">Bureau d'études structure · Centre de formation BIM</p>
          <h1 className="mt-4 max-w-4xl text-[2rem] font-medium leading-[1.06] text-white sm:text-[2.75rem] lg:text-[3.6rem]">
            <span className="grad-text">L'ingénierie structurelle</span> d'excellence et la montée en{' '}
            <span className="grad-text">compétences BIM</span>.
          </h1>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[color:var(--ink-soft)]">
            De l'étude de structure complexe à l'optimisation des dossiers d'exécution — nous accompagnons
            les maîtres d'ouvrage et formons les ingénieurs de demain.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link to="/quote" className="btn btn-solid">Demander une étude <ArrowUpRight className="w-4 h-4" /></Link>
            <Link to="/formations" className="btn btn-outline">Découvrir nos formations <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
        <ArrowDown className="absolute bottom-6 right-6 hidden w-5 h-5 animate-bounce text-[color:var(--accent)]/60 sm:block" />
      </section>

      {/* ---------- POURQUOI NOUS ---------- */}
      <section className="relative overflow-hidden bg-[color:var(--paper-2)]">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="eyebrow">Pourquoi Tower Structure</p>
              <h2 className="mt-4 text-3xl sm:text-4xl">Une exigence,<br />deux métiers.</h2>
            </div>
            <div className="md:col-span-8 md:pt-2">
              {WHY.map((w) => (
                <div key={w.k} className="fade-up grid grid-cols-[auto_1fr] gap-5 border-t border-[color:var(--line)] py-7 first:border-t-0 md:gap-8">
                  <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--accent)]">{w.k}</span>
                  <div>
                    <h3 className="text-lg sm:text-xl">{w.t}</h3>
                    <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[color:var(--ink-soft)]">{w.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-[color:var(--line)] pt-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="fade-up">
                <div className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[color:var(--accent)]">{s.v}</div>
                <div className="mt-1.5 text-[12px] text-[color:var(--ink-soft)]">{s.l}</div>
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
          <Link to="/projets" className="arrow-link text-[color:var(--ink)]">
            Projets réalisés & en cours <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(projects.length ? projects : Array.from({ length: 3 })).map((p: any, i) => {
            const T = typoOf(p?.category);
            return (
              <Link
                key={p?.id ?? i}
                to={p?.id ? `/projets/${p.id}` : '/projets'}
                className={`card fade-up block ${i === 0 ? 'sm:col-span-2' : ''}`}
              >
                <div className={`card-media ${i === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                  <img src={toAbsoluteUrl(p?.imageUrl) || PLACEHOLDER} alt={p?.title || ''}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                  <span className="chip chip-glass absolute right-3 top-3">{p?.category?.split(' ')[0] || 'Ouvrage'}</span>
                  <div className="card-reveal flex items-center gap-2 text-white">
                    <T.icon className={`h-4 w-4 ${T.cls}`} />
                    <span className="text-[13px] font-medium">{p?.title || 'Projet Tower Structure'}</span>
                  </div>
                </div>
                <div className="card-body flex items-center justify-between">
                  <h3 className="text-[15px] font-medium leading-snug">{p?.title || 'Projet Tower Structure'}</h3>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--ink-soft)]" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="bg-[color:var(--paper-2)] py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Expertises</p>
            <h2 className="mt-3 text-3xl sm:text-[2.75rem]">Ce que<br />nous faisons</h2>
            <Link to="/services" className="btn btn-outline mt-7">Détail des services <ArrowUpRight className="w-4 h-4" /></Link>
          </div>
          <div className="lg:col-span-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((s) => (
              <Link key={s.n} to={s.to} className="card fade-up flex flex-col">
                <div className="card-body flex h-full flex-col">
                  <span className={`chip ${s.tagCls} self-start`}>{s.tag}</span>
                  <h3 className="mt-4 text-lg leading-snug">{s.t}</h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">{s.d}</p>
                  <span className="arrow-link mt-4 text-[color:var(--accent)] text-[13px]">En savoir plus <ArrowUpRight className="w-3.5 h-3.5" /></span>
                </div>
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
          <Link to="/formations" className="arrow-link text-[color:var(--ink)]">Catalogue complet <ArrowRight className="w-4 h-4" /></Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(courses.length ? courses : Array.from({ length: 3 })).map((c: any, i) => (
            <Link key={c?.id ?? i} to={c?.id ? `/formations/${c.id}` : '/formations'} className="card fade-up block">
              <div className="card-media aspect-[4/3]">
                <img src={toAbsoluteUrl(c?.imageUrl) || PLACEHOLDER} alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                <span className={`chip absolute left-3 top-3 chip-glass`}>
                  {c?.level || 'Tous niveaux'}
                </span>
              </div>
              <div className="card-body">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                  {c?.durationHours ? `${c.durationHours} h` : 'Programme complet'}
                </div>
                <h3 className="mt-1.5 text-[15px] font-medium leading-snug">{c?.title || 'Formation Tower Structure'}</h3>
                <div className="mt-2 text-[13px] font-[family-name:var(--font-display)] text-[color:var(--accent-2)]">
                  {c?.priceLabel || (c?.price ? `${Number(c.price).toLocaleString('fr-FR')} MAD` : '')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- TÉMOIGNAGES ---------- */}
      <section className="bg-[color:var(--paper-2)] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p className="eyebrow">Ils nous font confiance</p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.n} className="glass fade-up p-8">
                <Quote className="pointer-events-none absolute -right-3 -top-4 h-28 w-28 text-[color:var(--accent-2)]/10" />
                <p className="relative font-[family-name:var(--font-display)] text-lg leading-[1.5] sm:text-xl">“{t.q}”</p>
                <footer className="relative mt-6 text-[13px] text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--ink)]">{t.n}</span> — {t.o}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* La carte CTA finale est fournie globalement par le Footer */}
    </div>
  );
}
