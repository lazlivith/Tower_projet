import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useReveal } from '../../hooks/useReveal';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  imageUrl: string | null;
  createdAt: string;
}
const PLACEHOLDER = 'https://placehold.co/1200x800/17160f/faf9f6?text=Journal';

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cms/publications')
      .then((r) => setPosts(r.data?.data ?? r.data ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  useReveal([posts]);

  const [lead, ...rest] = posts;

  return (
    <div>
      <Helmet><title>Journal — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Notes de terrain</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.5rem]">Journal</h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Méthodes, retours de chantier et repères techniques — BIM, Eurocodes, diagnostic.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        {loading ? (
          <p className="py-20 text-center text-[color:var(--color-ink-soft)]">Chargement…</p>
        ) : posts.length === 0 ? (
          <p className="py-20 text-center text-[color:var(--color-ink-soft)]">Aucun article publié pour le moment.</p>
        ) : (
          <>
            {/* Article à la une */}
            <Link to={`/blog/${lead.id}`} className="fade-up group grid gap-8 md:grid-cols-2 md:items-center">
              <div className="reveal-img aspect-[4/3] w-full bg-[color:var(--color-line)]">
                <img
                  src={toAbsoluteUrl(lead.imageUrl) || PLACEHOLDER}
                  alt={lead.title}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                />
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                  {lead.category || 'Article'} · {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl">{lead.title}</h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">{lead.excerpt}</p>
                <span className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">Lire l'article <ArrowUpRight className="w-4 h-4" /></span>
              </div>
            </Link>

            {/* Reste */}
            {rest.length > 0 && (
              <div className="mt-20 grid gap-x-8 gap-y-14 border-t border-[color:var(--color-line)] pt-14 md:grid-cols-3">
                {rest.map((p) => (
                  <Link key={p.id} to={`/blog/${p.id}`} className="fade-up group block">
                    <div className="reveal-img aspect-[4/3] w-full bg-[color:var(--color-line)]">
                      <img
                        src={toAbsoluteUrl(p.imageUrl) || PLACEHOLDER}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                      />
                    </div>
                    <div className="mt-4 text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
                      {p.category || 'Article'} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <h3 className="mt-2 text-xl">{p.title}</h3>
                    <p className="mt-2 line-clamp-2 text-[14px] text-[color:var(--color-ink-soft)]">{p.excerpt}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
