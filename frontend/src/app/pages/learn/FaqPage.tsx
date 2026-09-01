import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const COMMON = [
  {
    q: "Comment accéder à mes cours ?",
    a: "Après votre inscription et la validation de votre paiement par l'administration, vos formations apparaissent dans « Mes cours ». La lecture des vidéos se fait directement dans la plateforme.",
  },
  {
    q: "Où trouver mon attestation, mes factures et mon certificat ?",
    a: "Dans le menu en haut à droite → « Fichiers personnels ». L'attestation d'inscription est générée dès l'activation de votre accès, les factures après chaque paiement, et le certificat une fois la formation validée (heures de présence + quiz réussis).",
  },
  {
    q: "Comment fonctionnent les quiz ?",
    a: "Les quiz sont proposés par votre formateur, soit à toute la classe soit personnellement. Retrouvez-les dans « Mes quiz ». Un quiz réussi rattaché à un chapitre le débloque automatiquement.",
  },
  {
    q: "Comment rejoindre une session en direct ?",
    a: "Les sessions planifiées par votre formateur apparaissent dans « Sessions ». Le bouton « Rejoindre » ouvre la salle (Jitsi) ou le lien de réunion (Teams / Zoom / Meet) à l'heure prévue.",
  },
  {
    q: "Comment échanger avec ma classe ?",
    a: "« Espace de classe » est un mur d'échange commun : votre formateur y publie des annonces et vous pouvez y répondre.",
  },
  {
    q: "J'ai un problème d'accès ou de paiement",
    a: "Contactez l'administration à contact@tower-structure.ma. Un administrateur peut débloquer votre accès manuellement depuis son espace.",
  },
];

const INSTRUCTOR = [
  {
    q: "Comment ajouter une vidéo à un cours ?",
    a: "Dans « Contenu des cours », ajoutez une leçon avec un lien YouTube, une vidéo téléversée ou un PDF. Les élèves lisent la vidéo dans la plateforme.",
  },
  {
    q: "Comment donner un quiz à un seul élève ?",
    a: "Dans « Quiz », choisissez « Un élève : … » comme destinataire. Vous pouvez aussi importer un fichier (.xlsx/.csv) ou composer le quiz à la main.",
  },
  {
    q: "Comment planifier une session Teams ?",
    a: "Dans « Calendrier », créez une session et collez le lien de réunion Teams / Zoom / Meet. Sans lien, une salle vidéo est générée automatiquement.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span className="font-semibold text-gray-900">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600">{a}</p>}
    </div>
  );
}

export default function FaqPage() {
  const { user } = useAuth();
  const list = user?.role === 'INSTRUCTOR' ? [...INSTRUCTOR, ...COMMON] : COMMON;

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2.5">
        <HelpCircle className="h-6 w-6 text-[#FFC107]" />
        <h1 className="text-2xl font-bold text-[#1A1A2E]">FAQ</h1>
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((it) => <Item key={it.q} {...it} />)}
      </div>
    </div>
  );
}
