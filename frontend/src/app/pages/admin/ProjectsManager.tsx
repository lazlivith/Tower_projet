import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Save, X, Image as ImageIcon } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';

export default function ProjectsManager() {
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Résidentiel',
    description: '',
    image: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/cms/projects');
      setProjectsList(res.data);
    } catch (error) {
      console.error("Erreur récupération projets", error);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      category: 'Résidentiel',
      description: '',
      image: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      category: project.category,
      description: project.description,
      image: project.imageUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      // Pour l'instant, on retire juste de l'interface car on n'a pas vu de route DELETE
      setProjectsList(projectsList.filter(p => p.id !== projectId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProject) {
      // Édition non supportée côté back pour le moment, on met à jour localement
      setProjectsList(projectsList.map(p => p.id === editingProject.id ? {
        ...p,
        ...formData,
        imageUrl: formData.image
      } : p));
    } else {
      try {
        await api.post('/cms/projects', {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          imageUrl: formData.image
        });
        fetchProjects();
      } catch (error) {
        console.error("Erreur création projet", error);
        alert("Erreur lors de la création du projet.");
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">Gestion des Projets</h2>
            <p className="text-gray-600">{projectsList.length} projets dans la galerie</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau projet
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsList.map((project) => (
          <div key={project.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
            <div className="relative group">
              <img
                src={project.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                <button
                  onClick={() => handleEdit(project)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {project.category}
              </span>
              <h4 className="mt-2 mb-1">{project.title}</h4>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Titre du projet *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="Ex: Tour Résidentielle - Paris 15e"
            />
          </div>

          <div>
            <label className="block mb-2">Catégorie *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            >
              <option value="Résidentiel">Résidentiel</option>
              <option value="Commercial">Commercial</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Industriel">Industriel</option>
              <option value="Santé">Santé</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="Décrivez brièvement le projet..."
            />
          </div>

          <div>
            <label className="block mb-2">URL de l'image *</label>
            <input
              type="text"
              required
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="https://images.unsplash.com/..."
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingProject ? 'Mettre à jour' : 'Créer'}
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
