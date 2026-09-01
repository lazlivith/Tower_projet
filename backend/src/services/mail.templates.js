/**
 * Templates d'emails transactionnels — layout HTML responsive centralisé.
 *
 * Toutes les couleurs/styles sont inline (compatibilité clients mail).
 * `renderEmail()` fournit l'ossature ; chaque fonction exportée produit un email métier.
 */

const BRAND = {
  dark: '#1A1A2E',
  accent: '#FFC107',
  text: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f1f5f9',
};

/**
 * Ossature responsive commune.
 * @param {Object} o
 * @param {string} o.title       - Titre principal (h1)
 * @param {string} o.bodyHtml    - Contenu HTML déjà échappé
 * @param {{ label: string, url: string }} [o.cta] - Bouton d'action optionnel
 * @param {string} [o.preheader] - Texte d'aperçu (masqué)
 */
export const renderEmail = ({ title, bodyHtml, cta, preheader }) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92vw;background:#ffffff;border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="background:${BRAND.dark};padding:20px 32px;">
            <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:${BRAND.accent};color:${BRAND.dark};font-weight:bold;border-radius:6px;">TS</span>
            <span style="color:#ffffff;font-weight:bold;font-size:16px;vertical-align:middle;margin-left:12px;">Tower Structure</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.dark};">${title}</h1>
            <div style="font-size:15px;line-height:1.6;color:${BRAND.text};">${bodyHtml}</div>
            ${cta ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr><td style="border-radius:6px;background:${BRAND.accent};">
                <a href="${cta.url}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:${BRAND.dark};text-decoration:none;">${cta.label}</a>
              </td></tr>
            </table>
            <p style="font-size:13px;color:${BRAND.muted};margin:0;">Lien : <a href="${cta.url}" style="color:${BRAND.muted};">${cta.url}</a></p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.border};font-size:12px;color:${BRAND.muted};">
            TowerStructure — cet email est envoyé automatiquement, merci de ne pas y répondre.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

/** Onboarding instructeur : identifiants + lien de connexion. */
export const instructorOnboardingEmail = ({ nom, email, tempPassword, courseTitle, classroomName, loginUrl }) =>
  renderEmail({
    title: `Bienvenue sur TowerStructure, ${nom} !`,
    preheader: 'Vos identifiants Instructeur et votre lien de connexion.',
    bodyHtml: `
      <p>Votre compte <strong>Instructeur</strong> a été créé par un administrateur.</p>
      <div style="background:${BRAND.bg};border-radius:6px;padding:16px;margin:16px 0;">
        <p style="margin:0;"><strong>Email :</strong> ${email}</p>
        <p style="margin:10px 0 0;"><strong>Mot de passe temporaire :</strong>
          <span style="font-family:monospace;font-size:18px;color:#2563eb;">${tempPassword}</span></p>
      </div>
      <p>Vous êtes assigné à la classe <strong>${classroomName}</strong> pour la formation <strong>${courseTitle}</strong>.</p>
      <p style="font-size:13px;color:${BRAND.muted};">Pour votre sécurité, vous devrez définir un nouveau mot de passe dès votre première connexion.</p>`,
    cta: { label: 'Se connecter à la plateforme', url: loginUrl },
  });

/** Réinitialisation de mot de passe. */
export const passwordResetEmail = ({ resetUrl }) =>
  renderEmail({
    title: 'Réinitialisation de votre mot de passe',
    preheader: 'Lien valable 1 heure.',
    bodyHtml: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe TowerStructure.</p>
      <p>Ce lien est valable <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    cta: { label: 'Réinitialiser mon mot de passe', url: resetUrl },
  });

/** Accès formation confirmé (paiement validé). */
export const enrollmentAccessEmail = ({ courseTitle, dashboardUrl }) =>
  renderEmail({
    title: 'Votre inscription est validée !',
    preheader: `Votre accès à « ${courseTitle} » est actif.`,
    bodyHtml: `
      <p>Votre paiement pour la formation <strong>${courseTitle}</strong> a été confirmé.</p>
      <p>Votre accès à l'espace e-learning est désormais actif.</p>`,
    cta: { label: 'Accéder à mon espace LMS', url: dashboardUrl },
  });

/** Commande enregistrée, en attente de règlement (virement / chèque…). */
export const enrollmentPendingEmail = ({ courseTitle, amount, paymentMethod }) =>
  renderEmail({
    title: 'Commande reçue',
    preheader: 'En attente de votre règlement.',
    bodyHtml: `
      <p>Votre demande d'inscription à <strong>${courseTitle}</strong> a bien été enregistrée.</p>
      <p>Merci de procéder au règlement de <strong>${amount} MAD</strong> par <strong>${paymentMethod}</strong>.</p>
      <p>Notre équipe activera votre accès dès réception du paiement.</p>`,
  });

/** Accusé de réception d'une demande de devis (vitrine). */
export const quoteReceivedEmail = ({ clientName, serviceType }) =>
  renderEmail({
    title: `Bonjour ${clientName},`,
    preheader: 'Nous avons bien reçu votre demande de devis.',
    bodyHtml: `
      <p>Nous avons bien reçu votre demande de devis pour <strong>${serviceType}</strong>.</p>
      <p>Notre équipe vous recontactera sous 48h.</p>`,
  });

/** Notification interne : nouvelle demande de devis + lien du PDF généré. */
export const quoteForAdminEmail = ({ clientName, email, serviceType, description, reference, documentUrl }) =>
  renderEmail({
    title: `Nouveau devis — ${reference}`,
    preheader: `Demande de ${clientName} (${serviceType}).`,
    bodyHtml: `
      <p><strong>${clientName}</strong> — ${email}</p>
      <p><strong>Prestation :</strong> ${serviceType}</p>
      <p><strong>Description :</strong><br/>${(description || '').replace(/</g, '&lt;')}</p>
      <p>Le devis PDF a été généré automatiquement.</p>`,
    cta: documentUrl ? { label: 'Ouvrir le devis (PDF)', url: documentUrl } : undefined,
  });
