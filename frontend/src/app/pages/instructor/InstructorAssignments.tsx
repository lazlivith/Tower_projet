import { useState } from 'react';
import { FileText, Check, X, Eye, Clock } from 'lucide-react';
import { pendingAssignments } from '../../data/mockData';
import Modal from '../../components/shared/Modal';

export default function InstructorAssignments() {
  const [assignments, setAssignments] = useState(pendingAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const pendingCount = assignments.filter(a => a.status === 'pending').length;

  const viewAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setGrade('');
    setFeedback('');
    setIsModalOpen(true);
  };

  const gradeAssignment = () => {
    if (!grade) {
      alert('Veuillez entrer une note');
      return;
    }

    setAssignments(assignments.map(a =>
      a.id === selectedAssignment.id
        ? { ...a, status: 'graded', grade: parseInt(grade), feedback }
        : a
    ));

    alert('Devoir corrigé avec succès!');
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="mb-2">Devoirs à Corriger</h2>
        <p className="text-gray-600">Gérez et corrigez les travaux de vos étudiants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-10 h-10" />
            <div>
              <div className="text-3xl font-bold">{pendingCount}</div>
              <div className="text-sm opacity-80">En attente</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <Check className="w-10 h-10" />
            <div>
              <div className="text-3xl font-bold">
                {assignments.filter(a => a.status === 'graded').length}
              </div>
              <div className="text-sm opacity-80">Corrigés</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-10 h-10" />
            <div>
              <div className="text-3xl font-bold">{assignments.length}</div>
              <div className="text-sm opacity-80">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button className="px-6 py-4 text-sm font-medium border-b-2 border-[#FFC107] text-[#FFC107]">
            En attente ({pendingCount})
          </button>
          <button className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Corrigés
          </button>
          <button className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Tous
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.filter(a => a.status === 'pending').map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-[#FFC107]" />
                  <h4>{assignment.student}</h4>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    À corriger
                  </span>
                </div>
                <div className="ml-8">
                  <p className="text-sm text-gray-600 mb-1">{assignment.course}</p>
                  <p className="text-sm font-medium mb-2">{assignment.assignment}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Soumis le {new Date(assignment.submittedDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => viewAssignment(assignment)}
                className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors text-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Corriger
              </button>
            </div>
          </div>
        ))}

        {pendingCount === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="mb-2 text-gray-600">Tous les devoirs sont corrigés !</h3>
            <p className="text-sm text-gray-500">Excellent travail 👏</p>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Correction du devoir"
        size="lg"
      >
        {selectedAssignment && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Étudiant:</span> {selectedAssignment.student}
                </div>
                <div>
                  <span className="font-semibold">Cours:</span> {selectedAssignment.course}
                </div>
                <div>
                  <span className="font-semibold">Devoir:</span> {selectedAssignment.assignment}
                </div>
                <div>
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(selectedAssignment.submittedDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>

            {/* Assignment Content (Simulated) */}
            <div>
              <h4 className="mb-2">Contenu du devoir</h4>
              <div className="border border-gray-200 rounded-lg p-6 bg-white max-h-64 overflow-y-auto">
                <p className="text-gray-700 mb-4">
                  [Contenu du devoir soumis par l'étudiant...]
                </p>
                <p className="text-gray-700">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            </div>

            {/* Grading Form */}
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Note (sur 100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  placeholder="Ex: 85"
                />
              </div>

              <div>
                <label className="block mb-2">Commentaires et feedback</label>
                <textarea
                  rows={6}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  placeholder="Donnez votre retour à l'étudiant..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={gradeAssignment}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Valider la correction
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
