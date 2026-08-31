import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Save, X } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';

export default function PublicationsManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    category: 'BIM',
    status: 'DRAFT',
  });

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const res = await api.get('/cms/publications');
      setPosts(res.data);
    } catch (error) {
      console.error("Erreur récupération publications", error);
    }
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image: '',
      category: 'BIM',
      status: 'DRAFT',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content,
      image: post.imageUrl || '',
      category: post.category || 'BIM',
      status: post.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      // Pour l'instant, retrait local
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPost) {
      // Édition locale pour l'instant
      setPosts(posts.map(p => p.id === editingPost.id ? {
        ...p,
        ...formData,
        imageUrl: formData.image
      } : p));
    } else {
      try {
        await api.post('/cms/publications', {
          title: formData.title,
          content: formData.content,
          imageUrl: formData.image,
          status: formData.status
        });
        fetchPublications();
      } catch (error) {
        console.error("Erreur création publication", error);
        alert("Erreur lors de la création.");
      }
    }

    setIsModalOpen(false);
  };

  const toggleStatus = (postId: string) => {
    // Retrait local (TODO: route backend)
    setPosts(posts.map(p => p.id === postId ? {
      ...p,
      status: p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
      createdAt: p.status === 'DRAFT' ? new Date().toISOString() : p.createdAt,
    } : p));
  };

  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT').length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="mb-2">Gestion des Publications</h2>
            <p className="text-gray-600">
              {publishedCount} publiées • {draftCount} brouillons
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle publication
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="font-bold text-2xl">{publishedCount}</div>
            <div className="text-sm text-gray-600">Publications publiées</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-500">
            <div className="font-bold text-2xl">{draftCount}</div>
            <div className="text-sm text-gray-600">Brouillons</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="font-bold text-2xl">
              {posts.reduce((acc, p) => acc + p.views, 0)}
            </div>
            <div className="text-sm text-gray-600">Vues totales</div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex gap-4">
              <img
                src={post.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'}
                alt={post.title}
                className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3>{post.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Par {post.author}</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {post.category || 'BIM'}
                      </span>
                      <span>•</span>
                      <span>{new Date(post.createdAt || new Date()).toLocaleDateString('fr-FR')}</span>
                      {post.status === 'PUBLISHED' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views || 0} vues
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(post)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleStatus(post.id)}
                    className={`px-3 py-1 rounded transition-colors text-sm ${
                      post.status === 'PUBLISHED'
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {post.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'Modifier la publication' : 'Nouvelle publication'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          <div>
            <label className="block mb-2">URL (slug)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          <div>
            <label className="block mb-2">Extrait</label>
            <textarea
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          <div>
            <label className="block mb-2">Contenu *</label>
            <textarea
              rows={8}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          <div>
            <label className="block mb-2">URL de l'image</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              >
                <option value="BIM">BIM</option>
                <option value="Eurocodes">Eurocodes</option>
                <option value="Diagnostic">Diagnostic</option>
                <option value="Formation">Formation</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingPost ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
