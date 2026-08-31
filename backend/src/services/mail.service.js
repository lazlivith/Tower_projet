import nodemailer from 'nodemailer';

/**
 * Service d'envoi d'emails via Nodemailer (SMTP).
 * Retombe sur une simulation si les variables SMTP ne sont pas configurées.
 */

let transporter = null;

const isSmtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[MAIL] Service Nodemailer initialisé avec succès.');
} else {
  console.warn('[MAIL] Variables SMTP non configurées — les emails seront simulés (mode dev).');
}

/**
 * Envoie un email transactionnel.
 * @param {Object} options
 * @param {string} options.to       - Adresse de destination
 * @param {string} options.subject  - Sujet de l'email
 * @param {string} options.html     - Corps HTML de l'email
 * @param {string} [options.text]         - Corps texte alternatif (optionnel)
 * @param {boolean} [options.throwOnError] - Si true, relance l'erreur au lieu de renvoyer false
 *                                           (utilisé quand l'envoi fait partie d'une transaction).
 * @returns {Promise<boolean>}
 */
export const sendMail = async ({ to, subject, html, text, throwOnError = false }) => {
  if (!transporter) {
    // Mode simulation (pas de SMTP configuré)
    console.log(`\n📧 [MAIL SIMULÉ] ─────────────────────────`);
    console.log(`   À      : ${to}`);
    console.log(`   Sujet  : ${subject}`);
    console.log(`──────────────────────────────────────────\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"TowerStructure" <noreply@towerstructure.ma>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback texte brut
    });

    console.log(`[MAIL] Email envoyé avec succès à ${to} — Message ID : ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Erreur lors de l'envoi à ${to} :`, error.message);
    if (throwOnError) {
      throw new Error(`Échec de l'envoi de l'email à ${to} : ${error.message}`);
    }
    // Par défaut, on ne bloque pas le flux métier si l'email échoue
    return false;
  }
};
