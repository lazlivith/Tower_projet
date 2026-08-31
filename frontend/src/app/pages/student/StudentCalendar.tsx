import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Video, Plus, X } from 'lucide-react';
import { upcomingSessions } from '../../data/mockData';
import Modal from '../../components/shared/Modal';

export default function StudentCalendar() {
  const [sessions, setSessions] = useState(upcomingSessions);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const joinSession = (sessionId: string) => {
    alert('Redirection vers la salle de classe virtuelle...');
    // Logique pour rejoindre la session
  };

  const viewDetails = (session: any) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="mb-2">Calendrier des Sessions</h2>
        <p className="text-gray-600">Vos sessions live et événements à venir</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-sm text-gray-600">Sessions à venir</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-600">Sessions complétées</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">24h</div>
              <div className="text-sm text-gray-600">Temps total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="mb-6">Sessions Programmées</h3>
        <div className="space-y-4">
          {sessions.map((session) => {
            const sessionDate = new Date(session.date);
            const isPast = sessionDate < new Date();
            const isToday = sessionDate.toDateString() === new Date().toDateString();

            return (
              <div
                key={session.id}
                className={`border rounded-lg p-6 transition-all ${
                  isPast
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : isToday
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-4 text-center min-w-[80px] ${
                    isPast
                      ? 'bg-gray-300 text-gray-700'
                      : isToday
                      ? 'bg-green-500 text-white'
                      : 'bg-[#FFC107] text-[#1A1A2E]'
                  }`}>
                    <div className="text-2xl font-bold">
                      {sessionDate.getDate()}
                    </div>
                    <div className="text-xs">
                      {sessionDate.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                    {isToday && (
                      <div className="mt-1 text-xs font-semibold">Aujourd'hui</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="mb-2">{session.title}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {session.instructor}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {session.time} - Durée: {session.duration}
                          </p>
                          <p className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            {sessionDate.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {!isPast && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => joinSession(session.id)}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                              isToday
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-[#FFC107] text-[#1A1A2E] hover:bg-[#FFD54F]'
                            }`}
                          >
                            <Video className="w-4 h-4 inline mr-2" />
                            Rejoindre
                          </button>
                          <button
                            onClick={() => viewDetails(session)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Détails
                          </button>
                        </div>
                      )}

                      {isPast && (
                        <span className="text-sm text-gray-500 font-medium">Terminée</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Détails de la Session"
        size="md"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2">{selectedSession.title}</h3>
              <p className="text-gray-600">
                Animé par {selectedSession.instructor}
              </p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <div className="text-sm font-semibold mb-1">Date et heure</div>
                <p className="text-gray-600">
                  {new Date(selectedSession.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} à {selectedSession.time}
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">Durée</div>
                <p className="text-gray-600">{selectedSession.duration}</p>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">Description</div>
                <p className="text-gray-600">
                  Session interactive pour approfondir les concepts et répondre à vos questions.
                  Préparez vos questions à l'avance pour une session productive.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  joinSession(selectedSession.id);
                  setIsModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors"
              >
                <Video className="w-4 h-4 inline mr-2" />
                Rejoindre la session
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 inline mr-2" />
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
