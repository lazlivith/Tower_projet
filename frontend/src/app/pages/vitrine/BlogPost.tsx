import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/cms/publications/${id}`)
      .then((r) => { setPost(r.data); setState('ok'); })
      .catch(() => setState('notfound'));
  }, [id]);

  if (state === 'loading') return <div className="py-40 text-center text-[color:var(--color-ink-soft)]">Chargement…</div>;
  if (state === 'notfound' || !post) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-40 text-center sm:px-8 lg:px-12">
        <p className="text-[color:var(--color-ink-soft)]">Article introuvable.</p>
        <Link to="/blog" className="arrow-link mt-6 inline-flex text-[color:var(--color-ink)]">← Retour au journal</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[820px] px-5 pt-20 pb-28 sm:px-8 lg:pt-28">
      <Helmet><title>{post.title} — Tower Structure</title></Helmet>

      <Link to="/blog" className="inline-flex items-center gap-2 text-[13px] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
        <ArrowLeft className="w-4 h-4" /> Journal
      </Link>

      <div className="mt-8 text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink-soft)]">
        {post.category || 'Article'} · {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl">{post.title}</h1>
      {post.excerpt && (
        <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-ink-soft)]">{post.excerpt}</p>
      )}

      {post.imageUrl && (
        <img src={toAbsoluteUrl(post.imageUrl)} alt={post.title} className="mt-10 w-full object-cover" />
      )}

      <div className="mt-10 whitespace-pre-wrap text-[16.5px] leading-[1.75] text-[color:var(--color-ink)]">
        {post.content}
      </div>

      <div className="mt-16 border-t border-[color:var(--color-line)] pt-8">
        <Link to="/blog" className="arrow-link inline-flex text-[color:var(--color-ink)]">← Tous les articles</Link>
      </div>
    </article>
  );
}
