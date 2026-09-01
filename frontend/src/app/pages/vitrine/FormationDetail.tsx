import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useReveal } from '../../hooks/useReveal';

interface SyllabusDay { label?: string; title: string; points?: string[] }
interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level?: string | null;
  durationHours?: number | null;
  imageUrl?: string | null;
  audience?: string | null;
  prerequisites?: string | null;
  format?: string | null;
  priceLabel?: string | null;
  objectives?: string[] | null;
  syllabus?: SyllabusDay[] | null;
}
const PLACEHOLDER = 'https://placehold.co/1600x900/17160f/faf9f6?text=Formation';

export default function FormationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/courses/${id}`)
      .then((r) => { setCourse(r.data); setState('ok'); })
      .catch(() => setState('notfound'));
  }, [id]);

  useReveal([course]);

  const enroll = () => {
    if (!user) navigate('/learn/login', { state: { returnUrl: `/payment/${id}` } });
    else navigate(`/payment/${id}`);
  };

  if (state === 'loading') return <div className="py-40 text-center text-[color:var(--color-ink-soft)]">Chargement…</div>;
  if (state === 'notfound' || !course) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-40 text-center sm:px-8 lg:px-12">
        <p className="text-[color:var(--color-ink-soft)]">Formation introuvable.</p>
        <Link to="/formations" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">← Retour au catalogue</Link>
      </div>
    );
  }

  const meta = [
    course.level && { k: 'Niveau', v: course.level },
    course.durationHours ? { k: 'Durée', v: `${course.durationHours} heures` } : null,
    course.format && { k: 'Modalités', v: course.format },
    { k: 'Tarif', v: course.priceLabel || `${Number(course.price).toLocaleString('fr-FR')} MAD` },
  ].filter(Boolean) as { k: string; v: string }[];

  const objectives = Array.isArray(course.objectives) ? course.objectives : [];
  const syllabus = Array.isArray(course.syllabus) ? course.syllabus : [];

  return (
    <div>
      <Helmet><title>{course.title} — Formations Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <Link to="/formations" className="inline-flex items-center gap-2 text-[13px] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
          <ArrowLeft className="w-4 h-4" /> Catalogue
        </Link>
        <p className="eyebrow mt-8">Fiche formation</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl">{course.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--color-ink-soft)]">{course.description}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button onClick={enroll} className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--color-ink)] px-7 py-3.5 text-[13.5px] font-medium text-[color:var(--color-paper)] transition-colors hover:bg-[color:var(--color-accent)]">
            S'inscrire à cette session
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
          <Link to="/quote" className="arrow-link text-[color:var(--color-ink)]">Session intra-entreprise sur mesure</Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="reveal-img aspect-[21/9] w-full bg-[color:var(--color-line)]">
          <img src={toAbsoluteUrl(course.imageUrl) || PLACEHOLDER} alt={course.title} className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
        </div>
      </section>

      {/* Méta */}
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

      {/* Public & prérequis */}
      {(course.audience || course.prerequisites) && (
        <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-2">
            {course.audience && (
              <div className="fade-up">
                <p className="eyebrow">Public visé</p>
                <p className="mt-4 text-[15.5px] leading-relaxed text-[color:var(--color-ink-soft)]">{course.audience}</p>
              </div>
            )}
            {course.prerequisites && (
              <div className="fade-up">
                <p className="eyebrow">Prérequis</p>
                <p className="mt-4 text-[15.5px] leading-relaxed text-[color:var(--color-ink-soft)]">{course.prerequisites}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Objectifs */}
      {objectives.length > 0 && (
        <section className="bg-[color:var(--color-paper-2)] py-20 lg:py-28">
          <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
            <div className="lg:col-span-4"><p className="eyebrow">Objectifs pédagogiques</p></div>
            <ul className="fade-up lg:col-span-8">
              {objectives.map((o, i) => (
                <li key={i} className="grid grid-cols-[auto_1fr] gap-5 border-t border-[color:var(--color-line)] py-5 first:border-t-0">
                  <span className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-ink-soft)]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15.5px] leading-relaxed">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Programme */}
      {syllabus.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <p className="eyebrow">Programme détaillé</p>
          <div className="mt-10">
            {syllabus.map((d, i) => (
              <div key={i} className="fade-up grid gap-6 border-t border-[color:var(--color-line)] py-8 md:grid-cols-12">
                <div className="md:col-span-3">
                  <div className="font-[family-name:var(--font-display)] text-sm text-[color:var(--color-ink-soft)]">{d.label || `Séquence ${i + 1}`}</div>
                  <div className="mt-1 text-lg">{d.title}</div>
                </div>
                <ul className="md:col-span-9">
                  {(d.points || []).map((p, j) => (
                    <li key={j} className="border-t border-[color:var(--color-line)] py-3 text-[15px] text-[color:var(--color-ink-soft)] first:border-t-0">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-2xl sm:text-4xl">Prêt à monter en compétences&nbsp;?</h2>
          <button onClick={enroll} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13.5px] font-medium text-[color:var(--color-ink)] hover:bg-white/90">
            S'inscrire <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
