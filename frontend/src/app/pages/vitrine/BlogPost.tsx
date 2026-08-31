import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar } from 'lucide-react';
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
    api.get(`/cms/publications/${id}`)
      .then((res) => { setPost(res.data); setState('ok'); })
      .catch(() => setState('notfound'));
  }, [id]);

  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  if (state === 'notfound' || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Article introuvable.</p>
        <Link to="/blog" className="text-[#1A1A2E] font-semibold hover:text-[#FFB300]">← Retour au blog</Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen">
      <Helmet><title>{post.title} | Tower Structure</title></Helmet>

      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Tous les articles
          </Link>
          {post.category && (
            <span className="text-xs px-2.5 py-1 bg-[#FFC107] text-[#1A1A2E] rounded-full font-bold">{post.category}</span>
          )}
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">{post.title}</h1>
          <p className="mt-3 text-sm text-gray-400 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {post.imageUrl && (
          <img src={toAbsoluteUrl(post.imageUrl)} alt={post.title} className="w-full rounded-2xl mb-8 object-cover max-h-96" />
        )}
        {post.excerpt && <p className="text-lg text-gray-600 font-medium mb-6">{post.excerpt}</p>}
        <div className="prose max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
          {post.content}
        </div>
      </div>
    </article>
  );
}
