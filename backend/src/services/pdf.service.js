import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PDF_DIR = path.resolve('uploads/pdfs');

// Créer le dossier si inexistant
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

/**
 * Sauvegarde le buffer PDF sur disque et retourne l'URL publique
 */
const savePdf = (pdfBytes, prefix) => {
  const filename = `${prefix}-${uuidv4()}.pdf`;
  const filePath = path.join(PDF_DIR, filename);
  fs.writeFileSync(filePath, pdfBytes);
  return `/uploads/pdfs/${filename}`;
};

/**
 * Génère un reçu de paiement en PDF — retourne une URL relative
 */
export const generateInvoicePDF = async (paymentData, studentInfo, courseInfo) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    page.drawText('FACTURE / REÇU DE PAIEMENT', { x: 50, y: 350, size: 24, font: timesRomanBold, color: rgb(0.1, 0.1, 0.4) });
    page.drawText(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { x: 50, y: 310, size: 12, font: timesRomanFont });
    page.drawText(`Élève: ${studentInfo.nom}`, { x: 50, y: 290, size: 14, font: timesRomanFont });
    page.drawText(`Email: ${studentInfo.email}`, { x: 50, y: 270, size: 12, font: timesRomanFont });
    page.drawText(`Détail de la commande:`, { x: 50, y: 230, size: 14, font: timesRomanBold });
    page.drawText(`Formation: ${courseInfo.title}`, { x: 50, y: 210, size: 14, font: timesRomanFont });
    page.drawText(`Montant payé: ${paymentData.amount} MAD`, { x: 50, y: 170, size: 16, font: timesRomanBold, color: rgb(0.1, 0.6, 0.1) });
    page.drawText(`Méthode: ${paymentData.paymentMethod}`, { x: 50, y: 150, size: 12, font: timesRomanFont });
    page.drawText('Merci pour votre confiance - TowerStructure', { x: 50, y: 50, size: 10, font: timesRomanFont, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();
    return savePdf(pdfBytes, 'facture');
  } catch (error) {
    console.error("Erreur génération facture:", error);
    throw error;
  }
};

/**
 * Génère un certificat de réussite en PDF — retourne une URL relative.
 * @param {number|null} hoursSpent - Heures de présence effectuées (affichées si fournies)
 */
export const generateCertificatePDF = async (studentInfo, courseInfo, score, hoursSpent = null) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const center = (text, y, size, font, color) => {
      const width = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (842 - width) / 2, y, size, font, color });
    };

    page.drawRectangle({
      x: 20, y: 20, width: 802, height: 555,
      borderColor: rgb(0.9, 0.75, 0.1), borderWidth: 5,
    });

    center('CERTIFICAT DE RÉUSSITE', 480, 36, helveticaBold, rgb(0.1, 0.1, 0.3));
    center('Décerné à', 420, 18, helveticaFont, rgb(0.4, 0.4, 0.4));
    center(studentInfo.nom, 370, 32, helveticaBold, rgb(0, 0, 0));
    center('Pour avoir complété avec succès la formation :', 310, 16, helveticaFont, rgb(0.4, 0.4, 0.4));
    center(courseInfo.title, 260, 24, helveticaBold, rgb(0.1, 0.1, 0.3));

    const line = hoursSpent != null
      ? `Note finale : ${score} %     -     Heures effectuées : ${Math.round(hoursSpent)} h`
      : `Note finale : ${score} %`;
    center(line, 205, 15, helveticaBold, rgb(0.1, 0.5, 0.2));
    center(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, 130, 14, helveticaFont, rgb(0.3, 0.3, 0.3));
    center('Tower Structure — E-Learning', 70, 11, helveticaFont, rgb(0.5, 0.5, 0.5));

    const pdfBytes = await pdfDoc.save();
    return savePdf(pdfBytes, 'certificat');
  } catch (error) {
    console.error("Erreur génération certificat:", error);
    throw error;
  }
};
