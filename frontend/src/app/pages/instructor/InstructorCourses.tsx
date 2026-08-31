import { useState } from 'react';
import { BookOpen, Users, TrendingUp, Upload, Edit, Eye, Plus } from 'lucide-react';
import { instructorCourses } from '../../data/mockData';
import Modal from '../../components/shared/Modal';

export default function InstructorCourses() {
  const [courses, setCourses] = useState(instructorCourses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const uploadContent = (courseId: string) => {
    alert('Ouverture de l\'interface d\'upload de contenu...');
  };

  const viewStudents = (courseId: string) => {
    alert('Affichage de la liste des étudiants...');
  };

  const editCourse = (course: any) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">Mes Cours</h2>
            <p className="text-gray-600">Gérez vos formations et contenus pédagogiques</p>
          </div>
          <button
            onClick={() => {
              setEditingCourse(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau cours
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#FFC107]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#FFC107]" />
            <div>
              <div className="text-2xl font-bold">{courses.length}</div>
              <div className="text-sm text-gray-600">Cours actifs</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">
                {courses.reduce((acc, c) => acc + c.students, 0)}
              </div>
              <div className="text-sm text-gray-600">Étudiants totaux</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">
                {Math.round(courses.reduce((acc, c) => acc + c.avgScore, 0) / courses.length)}%
              </div>
              <div className="text-sm text-gray-600">Score moyen global</div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="mb-2">{course.title}</h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.students} étudiants
                  </span>
                  <span>•</span>
                  <span>Taux de complétion: {course.completionRate}%</span>
                  <span>•</span>
                  <span>Score moyen: {course.avgScore}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => uploadContent(course.id)}
                  className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload contenu
                </button>
                <button
                  onClick={() => editCourse(course)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Taux de complétion</span>
                  <span className="font-semibold">{course.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${course.completionRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Performance globale</span>
                  <span className="font-semibold">{course.avgScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#FFC107] to-[#FFD54F] h-3 rounded-full transition-all"
                    style={{ width: `${course.avgScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => viewStudents(course.id)}
                className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs text-gray-600">Étudiants</div>
              </button>
              <button className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                <BookOpen className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <div className="text-xs text-gray-600">Modules</div>
              </button>
              <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <div className="text-xs text-gray-600">Analytics</div>
              </button>
              <button className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-center">
                <Eye className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                <div className="text-xs text-gray-600">Aperçu</div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Modifier le cours' : 'Nouveau cours'}
        size="lg"
      >
        <form className="space-y-4">
          <div>
            <label className="block mb-2">Titre du cours *</label>
            <input
              type="text"
              defaultValue={editingCourse?.title}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="Ex: BIM - Niveau Avancé"
            />
          </div>
          <div>
            <label className="block mb-2">Description</label>
            <textarea
              rows={4}
              defaultValue={editingCourse?.description}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              placeholder="Décrivez le contenu du cours..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Niveau</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]">
                <option>Débutant</option>
                <option>Intermédiaire</option>
                <option>Avancé</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Durée (heures)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                placeholder="40"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors"
            >
              {editingCourse ? 'Mettre à jour' : 'Créer le cours'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
