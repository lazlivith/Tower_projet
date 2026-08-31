import { useNavigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useReveal } from '../../hooks/useReveal';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level?: string;
  durationHours?: number;
  imageUrl?: string | null;
}
const PLACEHOLDER = 'https://placehold.co/1200x900/17160f/faf9f6?text=Formation';

export default function Formations() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data?.data ?? res.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  useReveal([courses]);

  const enroll = (courseId: string) => {
    if (!user) navigate('/learn/login', { state: { returnUrl: `/payment/${courseId}` } });
    else navigate(`/payment/${courseId}`);
  };

  return (
    <div>
      <Helmet>
        <title>Formations BIM & structure — Tower Structure</title>
        <meta name="description" content="Formations en ligne certifiantes : BIM, calcul de structure, Eurocodes, conception parasismique." />
      </Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Académie Tower Structure</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.5rem]">
          Se former à la structure,<br />pour de bon.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Parcours en ligne, encadrés par des ingénieurs praticiens. Séquençage progressif,
          quiz, devoirs, certificat à la clé.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        {loading ? (
          <p className="py-20 text-center text-[color:var(--color-ink-soft)]">Chargement…</p>
        ) : courses.length === 0 ? (
          <p className="py-20 text-center text-[color:var(--color-ink-soft)]">Aucune formation publiée pour le moment.</p>
        ) : (
          <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
            {courses.map((c, i) => (
              <article key={c.id} className={`fade-up ${i % 3 === 0 ? 'md:col-span-2 md:grid md:grid-cols-2 md:gap-8 md:items-center' : ''}`}>
                <div className={`reveal-img w-full bg-[color:var(--color-line)] ${i % 3 === 0 ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}>
                  <img
                    src={toAbsoluteUrl(c.imageUrl) || PLACEHOLDER}
                    alt={c.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </div>
                <div className={i % 3 === 0 ? '' : 'mt-5'}>
                  <div className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                    {c.level || 'Tous niveaux'}{c.durationHours ? ` · ${c.durationHours} h` : ''}
                  </div>
                  <h2 className="mt-3 text-2xl sm:text-3xl">{c.title}</h2>
                  <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{c.description}</p>
                  <div className="mt-6 flex items-center gap-6">
                    <span className="font-[family-name:var(--font-display)] text-lg">
                      {Number(c.price)?.toLocaleString('fr-FR')} DH
                    </span>
                    <button onClick={() => enroll(c.id)} className="arrow-link text-[color:var(--color-ink)]">
                      S'inscrire <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
          <h2 className="max-w-2xl text-3xl sm:text-5xl">Former une équipe entière ?</h2>
          <p className="mt-5 max-w-xl text-[15px] text-white/60">Nous construisons des parcours sur mesure pour les bureaux d'études et entreprises.</p>
          <Link to="/quote" className="arrow-link mt-8 inline-flex text-[color:var(--color-paper)]">
            Nous contacter <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
