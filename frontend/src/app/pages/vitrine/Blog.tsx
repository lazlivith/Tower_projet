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
const PLACEHOLDER = 'https://placehold.co/1000x700/16150f/f7f5f0?text=Blog';

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
      <Helmet><title>Blog — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <p className="eyebrow">Notes de terrain</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.04] sm:text-6xl lg:text-[4.2rem]">Blog</h1>
        <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Méthodes, retours de chantier et repères techniques — BIM, Eurocodes, diagnostic.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        {loading ? (
          <p className="py-16 text-center text-[color:var(--color-ink-soft)]">Chargement…</p>
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-[color:var(--color-ink-soft)]">Aucun article publié pour le moment.</p>
        ) : (
          <>
            <Link to={`/blog/${lead.id}`} className="card fade-up grid gap-8 md:grid-cols-2 md:items-center">
              <div className="card-media aspect-[16/10]">
                <img src={toAbsoluteUrl(lead.imageUrl) || PLACEHOLDER} alt={lead.title}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
              </div>
              <div>
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
                  <span className="chip">{lead.category || 'Article'}</span>
                  {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl">{lead.title}</h2>
                <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">{lead.excerpt}</p>
                <span className="arrow-link mt-5 inline-flex text-[color:var(--color-ink)]">Lire l'article <ArrowUpRight className="w-4 h-4" /></span>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className="mt-16 grid gap-x-6 gap-y-12 border-t border-[color:var(--color-line)] pt-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <Link key={p.id} to={`/blog/${p.id}`} className="card fade-up block">
                    <div className="card-media aspect-[4/3]">
                      <img src={toAbsoluteUrl(p.imageUrl) || PLACEHOLDER} alt={p.title}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                    </div>
                    <div className="mt-3.5 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--color-ink-soft)]">
                      <span className="chip">{p.category || 'Article'}</span>
                      {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <h3 className="mt-2 text-[16px] font-medium leading-snug">{p.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[13.5px] text-[color:var(--color-ink-soft)]">{p.excerpt}</p>
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
