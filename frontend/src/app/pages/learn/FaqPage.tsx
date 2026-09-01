import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/admin/ui';

const COMMON = [
  {
    q: 'Comment accéder à mes cours ?',
    a: "Après votre inscription et la validation du paiement par l'administration, vos formations apparaissent dans « Mes cours ». La lecture des vidéos se fait directement dans la plateforme.",
  },
  {
    q: 'Où trouver mon attestation, mes factures et mon certificat ?',
    a: "Menu en haut à droite → « Fichiers personnels ». L'attestation est générée à l'activation de l'accès, les factures après chaque paiement, le certificat une fois la formation validée (heures de présence + quiz réussis).",
  },
  {
    q: 'Comment fonctionnent les quiz ?',
    a: "Les quiz sont proposés par votre formateur, à toute la classe ou personnellement. Retrouvez-les dans « Mes quiz ». Un quiz réussi rattaché à un chapitre le débloque automatiquement.",
  },
  {
    q: 'Comment rejoindre une session en direct ?',
    a: "Les sessions apparaissent dans « Sessions ». « Rejoindre » ouvre la salle (Jitsi) ou le lien de réunion (Teams / Zoom / Meet) à l'heure prévue.",
  },
  {
    q: 'Comment échanger avec ma classe ?',
    a: "« Espace de classe » est un mur commun : votre formateur y publie des annonces et vous pouvez y répondre.",
  },
  {
    q: "J'ai un problème d'accès ou de paiement",
    a: 'Contactez l\'administration à contact@tower-structure.ma.',
  },
];

const INSTRUCTOR = [
  {
    q: 'Comment ajouter une vidéo à un cours ?',
    a: "Dans « Contenu des cours », ajoutez une leçon avec un lien YouTube, une vidéo téléversée ou un PDF.",
  },
  {
    q: 'Comment donner un quiz à un seul élève ?',
    a: "Dans « Quiz », choisissez « Un élève : … » comme destinataire. Import de fichier (.xlsx/.csv) ou composeur.",
  },
  {
    q: 'Comment planifier une session Teams ?',
    a: "Dans « Calendrier », créez une session et collez le lien Teams / Zoom / Meet. Sans lien, une salle est générée.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="a-card">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span className="font-semibold text-[color:var(--a-ink)]">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-[color:var(--a-ink-dim)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="border-t border-[color:var(--a-line-soft)] px-4 pb-4 pt-3 text-[13px] leading-relaxed text-[color:var(--a-ink-soft)]">{a}</p>}
    </div>
  );
}

export default function FaqPage() {
  const { user } = useAuth();
  const list = user?.role === 'INSTRUCTOR' ? [...INSTRUCTOR, ...COMMON] : COMMON;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Aide" title="FAQ" description="Réponses aux questions les plus fréquentes." />
      <div className="flex flex-col gap-2.5">
        {list.map((it) => <Item key={it.q} {...it} />)}
      </div>
    </div>
  );
}
