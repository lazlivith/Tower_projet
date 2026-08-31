import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cms/publications')
      .then((res) => setPosts(res.data?.data ?? res.data ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Blog & Actualités | Tower Structure</title>
        <meta name="description" content="Articles et actualités de Tower Structure : BIM, Eurocodes, diagnostic structurel, ingénierie." />
      </Helmet>

      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-4 text-4xl font-extrabold">Blog & Actualités</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Analyses, retours d'expérience et actualités de l'ingénierie structurelle
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-center text-gray-400 py-12">Chargement…</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-40" />
              Aucun article publié pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={toAbsoluteUrl(p.imageUrl) || 'https://placehold.co/600x400/1A1A2E/FFC107?text=Tower+Structure'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1A1A2E/FFC107?text=Tower+Structure'; }}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {p.category && (
                      <span className="text-xs px-2.5 py-1 bg-[#FFC107]/20 text-[#8a6d0b] rounded-full font-semibold w-fit mb-3">
                        {p.category}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{p.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3 flex-1">{p.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1 text-[#1A1A2E] font-semibold group-hover:gap-2 transition-all">
                        Lire <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
