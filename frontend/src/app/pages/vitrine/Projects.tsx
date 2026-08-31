import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Building2 } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  status: 'ONGOING' | 'COMPLETED';
}

type Tab = 'COMPLETED' | 'ONGOING';

export default function Projects() {
  const [tab, setTab] = useState<Tab>('COMPLETED');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/cms/projects?status=${tab}`)
      .then((res) => setProjects(res.data?.data ?? res.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Projets réalisés & en cours | Tower Structure</title>
        <meta name="description" content="Découvrez les projets d'ingénierie structurelle réalisés et en cours par Tower Structure." />
      </Helmet>

      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-4 text-4xl font-extrabold">Nos Projets</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Réalisations et chantiers en cours en ingénierie structurelle
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
              {([['COMPLETED', 'Projets réalisés'], ['ONGOING', 'Projets en cours']] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  className={`px-6 py-2.5 text-sm font-semibold transition-colors ${tab === v ? 'bg-[#1A1A2E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-12">Chargement…</p>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
              {tab === 'COMPLETED' ? 'Aucun projet réalisé publié pour le moment.' : 'Aucun projet en cours publié pour le moment.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                  <div className="h-52 bg-gray-100 relative">
                    <img
                      src={toAbsoluteUrl(p.imageUrl) || 'https://placehold.co/600x400/1A1A2E/FFC107?text=Projet'}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/1A1A2E/FFC107?text=Projet'; }}
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'ONGOING' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
                      {p.status === 'ONGOING' ? 'En cours' : 'Réalisé'}
                    </span>
                  </div>
                  <div className="p-6">
                    <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">{p.category}</span>
                    <h3 className="mt-3 font-bold text-lg text-gray-900">{p.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
