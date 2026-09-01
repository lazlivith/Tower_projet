import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Loader2, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

const SERVICES = ['BIM & Modélisation', 'Calculs Eurocodes', 'Diagnostic & Confortement', 'Formation sur mesure', 'Autre'];
const TYPES = ['Résidentiel', 'Commercial / Tertiaire', 'Industriel', 'Infrastructure / Ouvrage d\'art', 'Santé', 'Autre'];

const empty = {
  clientName: '', email: '', phone: '', company: '',
  service: '', projectType: '', budget: '', description: '', urgency: 'normal',
};

export default function Quote() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const description = [
      form.description.trim(), '',
      `— Type de projet : ${form.projectType || 'non précisé'}`,
      `— Budget estimé : ${form.budget || 'non précisé'}`,
      `— Urgence : ${form.urgency}`,
      form.company ? `— Entreprise : ${form.company}` : '',
      form.phone ? `— Téléphone : ${form.phone}` : '',
    ].filter(Boolean).join('\n');

    if (description.length < 20) {
      setError('Merci de détailler votre projet (au moins 20 caractères).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/quotes/request', {
        clientName: form.clientName.trim(),
        email: form.email.trim(),
        serviceType: form.service,
        description,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/'), 3500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full border-0 border-b border-[color:var(--color-line)] bg-transparent py-3 text-[15px] outline-none focus:border-[color:var(--color-ink)] transition-colors';

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-[1400px] flex-col items-center justify-center px-5 text-center">
        <CheckCircle2 className="mb-6 h-14 w-14 text-[color:var(--color-accent)]" />
        <h1 className="text-3xl sm:text-4xl">Demande envoyée</h1>
        <p className="mt-4 max-w-md text-[color:var(--color-ink-soft)]">
          Merci. Notre équipe revient vers vous sous 48 h avec une première approche.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Helmet><title>Demander un devis — Tower Structure</title></Helmet>

      <section className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-[4.5rem]">
          Décrivez votre projet.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink-soft)]">
          Quelques lignes suffisent pour démarrer. Réponse sous 48 h, sans engagement.
        </p>
      </section>

      <section className="mx-auto max-w-[900px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <form onSubmit={handleSubmit} className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          <div>
            <label className="eyebrow">Nom complet *</label>
            <input name="clientName" required value={form.clientName} onChange={set} className={field} />
          </div>
          <div>
            <label className="eyebrow">Email *</label>
            <input type="email" name="email" required value={form.email} onChange={set} className={field} />
          </div>
          <div>
            <label className="eyebrow">Téléphone</label>
            <input name="phone" value={form.phone} onChange={set} className={field} />
          </div>
          <div>
            <label className="eyebrow">Entreprise</label>
            <input name="company" value={form.company} onChange={set} className={field} />
          </div>
          <div>
            <label className="eyebrow">Service *</label>
            <select name="service" required value={form.service} onChange={set} className={field}>
              <option value="">—</option>
              {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow">Type de projet</label>
            <select name="projectType" value={form.projectType} onChange={set} className={field}>
              <option value="">—</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow">Budget estimé</label>
            <select name="budget" value={form.budget} onChange={set} className={field}>
              <option value="">—</option>
              <option>&lt; 50 000 DH</option>
              <option>50 000 – 150 000 DH</option>
              <option>150 000 – 500 000 DH</option>
              <option>&gt; 500 000 DH</option>
            </select>
          </div>
          <div>
            <label className="eyebrow">Échéance</label>
            <select name="urgency" value={form.urgency} onChange={set} className={field}>
              <option value="normal">Standard</option>
              <option value="urgent">Urgent</option>
              <option value="tres-urgent">Très urgent</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="eyebrow">Description du projet *</label>
            <textarea name="description" required rows={5} value={form.description} onChange={set}
              className={field + ' resize-none'} placeholder="Nature de l'ouvrage, surface, contraintes, attentes…" />
          </div>

          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-solid disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
              {loading ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
