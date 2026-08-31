import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function Quote() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    projectType: '',
    budget: '',
    description: '',
    urgency: 'normal',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Le backend attend exactement { clientName, email, serviceType, description }.
    // On agrège les champs détaillés du formulaire dans `description`.
    const details = [
      formData.description.trim(),
      '',
      `— Type de projet : ${formData.projectType || 'non précisé'}`,
      `— Budget estimé : ${formData.budget || 'non précisé'}`,
      `— Urgence : ${formData.urgency}`,
      formData.company ? `— Entreprise : ${formData.company}` : '',
      formData.phone ? `— Téléphone : ${formData.phone}` : '',
    ].filter(Boolean).join('\n');

    const payload = {
      clientName: formData.clientName.trim(),
      email: formData.email.trim(),
      serviceType: formData.service,
      description: details,
    };

    if (payload.description.length < 20) {
      setError('Merci de détailler votre projet (au moins 20 caractères).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/quotes/request', payload);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-md">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="mb-4">Demande envoyée !</h2>
          <p className="text-gray-600">
            Nous avons bien reçu votre demande de devis. Nous vous recontacterons sous 48h.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6">Demander un Devis</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Décrivez-nous votre projet et recevez une proposition détaillée sous 48h
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="clientName" className="block mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>

              <div>
                <label htmlFor="company" className="block mb-2">
                  Entreprise
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>

              <div>
                <label htmlFor="service" className="block mb-2">
                  Service souhaité *
                </label>
                <select
                  id="service"
                  name="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                >
                  <option value="">Sélectionnez un service</option>
                  <option value="BIM & Modélisation 3D">BIM & Modélisation 3D</option>
                  <option value="Diagnostic Structurel">Diagnostic Structurel</option>
                  <option value="Calculs Eurocodes">Calculs Eurocodes</option>
                </select>
              </div>

              <div>
                <label htmlFor="projectType" className="block mb-2">
                  Type de projet *
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  required
                  value={formData.projectType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="Résidentiel">Résidentiel</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Industriel">Industriel</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block mb-2">
                  Budget estimé
                </label>
                <select
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                >
                  <option value="">Sélectionnez un budget</option>
                  <option value="<10000">&lt; 10 000 €</option>
                  <option value="10000-20000">10 000 - 20 000 €</option>
                  <option value="20000-50000">20 000 - 50 000 €</option>
                  <option value="50000-100000">50 000 - 100 000 €</option>
                  <option value=">100000">&gt; 100 000 €</option>
                </select>
              </div>

              <div>
                <label htmlFor="urgency" className="block mb-2">
                  Urgence
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="très urgent">Très urgent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block mb-2">
                  Description du projet *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre projet en détail..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center">
                {error}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Envoi en cours…' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="mb-2">Réponse Rapide</h3>
              <p className="text-gray-600">Devis détaillé sous 48h</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="mb-2">Sur Mesure</h3>
              <p className="text-gray-600">Solution adaptée à vos besoins</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="mb-2">Sans Engagement</h3>
              <p className="text-gray-600">Devis gratuit et sans obligation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
