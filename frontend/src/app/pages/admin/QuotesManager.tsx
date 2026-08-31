import { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Mail, Filter } from 'lucide-react';
import api from '../../services/api';

export default function QuotesManager() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotes');
      setQuotes(res.data.data || res.data);
    } catch (error) {
      console.error("Erreur récupération devis", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`Confirmer l'action ?`)) return;
    try {
      await api.patch(`/quotes/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const pendingCount = quotes.filter(q => q.status === 'PENDING').length;
  const acceptedCount = quotes.filter(q => q.status === 'ACCEPTED').length;
  const rejectedCount = quotes.filter(q => q.status === 'REJECTED').length;

  const filteredQuotes = quotes.filter(q => filter === 'ALL' || q.status === filter);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Gestion des Devis</h1>
        <p className="text-gray-500 text-sm">
          {pendingCount} en attente • {acceptedCount} acceptés • {rejectedCount} refusés
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#D97706] text-white p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><FileText className="w-8 h-8" /></div>
            <div>
              <div className="text-3xl font-bold">{pendingCount}</div>
              <div className="text-sm font-medium">En attente</div>
            </div>
          </div>
        </div>

        <div className="bg-[#10B981] text-white p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><CheckCircle className="w-8 h-8" /></div>
            <div>
              <div className="text-3xl font-bold">{acceptedCount}</div>
              <div className="text-sm font-medium">Acceptés</div>
            </div>
          </div>
        </div>

        <div className="bg-[#EF4444] text-white p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><XCircle className="w-8 h-8" /></div>
            <div>
              <div className="text-3xl font-bold">{rejectedCount}</div>
              <div className="text-sm font-medium">Refusés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Filter className="w-5 h-5" /> Filtrer:
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-[#FFC107] text-[#1A1A2E]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Tous ({quotes.length})</button>
          <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'PENDING' ? 'bg-[#FFC107] text-[#1A1A2E]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>En attente ({pendingCount})</button>
          <button onClick={() => setFilter('ACCEPTED')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ACCEPTED' ? 'bg-[#FFC107] text-[#1A1A2E]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Acceptés ({acceptedCount})</button>
          <button onClick={() => setFilter('REJECTED')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'REJECTED' ? 'bg-[#FFC107] text-[#1A1A2E]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Refusés ({rejectedCount})</button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-6">
        {filteredQuotes.map(quote => (
          <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900">{quote.clientName}</h3>
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  quote.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                  quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {quote.status === 'PENDING' ? 'En attente' : quote.status === 'ACCEPTED' ? 'Accepté' : 'Refusé'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" /> {quote.email}
                </p>
                <p className="text-sm">
                  <span className="font-bold text-gray-700">Type: </span>
                  <span className="text-gray-600">{quote.type}</span>
                </p>
                <p className="text-sm">
                  <span className="font-bold text-gray-700">Date: </span>
                  <span className="text-gray-600">{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</span>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-bold text-gray-700">Service: </span>
                  <span className="text-gray-600">{quote.serviceName}</span>
                </p>
                <p className="text-sm">
                  <span className="font-bold text-gray-700">Budget: </span>
                  <span className="text-gray-600">{quote.budget} MAD</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">{quote.description}</p>
            </div>

            <div className="flex gap-3">
              {quote.status === 'PENDING' && (
                <>
                  <button onClick={() => handleUpdateStatus(quote.id, 'ACCEPTED')} className="px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Accepter
                  </button>
                  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Contacter
                  </button>
                  <button onClick={() => handleUpdateStatus(quote.id, 'REJECTED')} className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                </>
              )}
              <button className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                Détails
              </button>
            </div>
          </div>
        ))}

        {filteredQuotes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">Aucun devis trouvé pour ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
