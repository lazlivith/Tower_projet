import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useReveal } from '../../hooks/useReveal';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level?: string;
  durationHours?: number;
  imageUrl?: string | null;
  priceLabel?: string | null;
}
const PLACEHOLDER = 'https://placehold.co/900x700/0d1117/38bdf8?text=Formation';

const levelChip = (lvl?: string) => {
  const l = (lvl || '').toLowerCase();
  if (l.includes('avanc')) return 'chip-amber';
  if (l.includes('interm')) return 'chip-green';
  return 'chip-blue';
};

export default function Formations() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data?.data ?? res.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  useReveal([courses]);

  return (
    <div>
      <Helmet>
        <title>Formations BIM & structure — Tower Structure</title>
        <meta name="description" content="Formations en ligne certifiantes : BIM, calcul de structure, Eurocodes, conception parasismique." />
      </Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <p className="eyebrow">Académie Tower Structure</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.04] sm:text-6xl lg:text-[4.2rem]">
          Se former à la structure,<br />pour de bon.
        </h1>
        <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Parcours encadrés par des ingénieurs praticiens. Séquençage progressif, quiz, devoirs, certificat.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        {loading ? (
          <p className="py-16 text-center text-[color:var(--color-ink-soft)]">Chargement…</p>
        ) : courses.length === 0 ? (
          <p className="py-16 text-center text-[color:var(--color-ink-soft)]">Aucune formation publiée pour le moment.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link to={`/formations/${c.id}`} key={c.id} className="card fade-up block">
                <div className="card-media aspect-[4/3]">
                  <img src={toAbsoluteUrl(c.imageUrl) || PLACEHOLDER} alt={c.title}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                  <span className={`chip ${levelChip(c.level)} absolute left-3 top-3`}>{c.level || 'Tous niveaux'}</span>
                  {c.durationHours ? <span className="chip chip-glass absolute right-3 top-3">{c.durationHours} h</span> : null}
                </div>
                <div className="card-body">
                  <h2 className="text-[15px] font-medium leading-snug sm:text-base">{c.title}</h2>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{c.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[13px] font-[family-name:var(--font-display)] text-[color:var(--accent-2)]">
                    {c.priceLabel || `${Number(c.price)?.toLocaleString('fr-FR')} MAD`}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden bg-[color:var(--band)] text-[color:var(--band-fg)]">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-3xl sm:text-5xl">Former une équipe entière&nbsp;?</h2>
          <p className="mt-4 max-w-xl text-[14.5px] text-white/55">Parcours sur mesure pour les bureaux d'études et entreprises.</p>
          <Link to="/quote" className="btn btn-light mt-8">Nous contacter <ArrowUpRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}
