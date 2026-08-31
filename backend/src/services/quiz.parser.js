import * as XLSX from 'xlsx';

/**
 * Colonnes attendues dans le fichier Excel de quiz.
 * L'ordre n'importe pas ; la casse et les espaces sont tolérés.
 */
const REQUIRED_COLUMNS = ['Question', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer'];
const VALID_ANSWERS = ['A', 'B', 'C', 'D'];

const normalizeKey = (k) => String(k).trim().toLowerCase().replace(/\s+/g, '');

/**
 * Parse un classeur Excel (buffer) en une liste de questions normalisées.
 *
 * @param {Buffer} buffer
 * @returns {{ questions: Array<{ question: string, options: {A,B,C,D}, correctAnswer: 'A'|'B'|'C'|'D' }> }}
 * @throws {Error} avec `.status = 400` et `.details` (numéro de ligne) si le fichier est invalide
 */
export const parseQuizWorkbook = (buffer) => {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    const err = new Error("Fichier Excel illisible ou corrompu.");
    err.status = 400;
    throw err;
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    const err = new Error("Le fichier ne contient aucune feuille de calcul.");
    err.status = 400;
    throw err;
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (rows.length === 0) {
    const err = new Error("La feuille de calcul est vide (aucune question).");
    err.status = 400;
    throw err;
  }

  // Table de correspondance colonne normalisée -> clé réelle du fichier
  const firstRowKeys = Object.keys(rows[0]);
  const keyMap = {};
  for (const realKey of firstRowKeys) keyMap[normalizeKey(realKey)] = realKey;

  const missing = REQUIRED_COLUMNS.filter((c) => !(normalizeKey(c) in keyMap));
  if (missing.length > 0) {
    const err = new Error(`Colonnes manquantes : ${missing.join(', ')}. Colonnes attendues : ${REQUIRED_COLUMNS.join(', ')}.`);
    err.status = 400;
    throw err;
  }

  const get = (row, col) => String(row[keyMap[normalizeKey(col)]] ?? '').trim();

  const questions = [];
  const errors = [];

  rows.forEach((row, i) => {
    const lineNo = i + 2; // +1 pour l'en-tête, +1 pour l'index 0 → numéro de ligne Excel
    const question = get(row, 'Question');
    const A = get(row, 'OptionA');
    const B = get(row, 'OptionB');
    const C = get(row, 'OptionC');
    const D = get(row, 'OptionD');
    const correctAnswer = get(row, 'CorrectAnswer').toUpperCase();

    if (!question && !A && !B && !C && !D) return; // ligne totalement vide → ignorée

    const rowErrors = [];
    if (!question) rowErrors.push('question vide');
    if (!A || !B || !C || !D) rowErrors.push('les 4 options A-D sont requises');
    if (!VALID_ANSWERS.includes(correctAnswer)) rowErrors.push(`CorrectAnswer doit être A, B, C ou D (reçu : "${correctAnswer || 'vide'}")`);

    if (rowErrors.length > 0) {
      errors.push(`Ligne ${lineNo} : ${rowErrors.join(' ; ')}`);
      return;
    }

    questions.push({ question, options: { A, B, C, D }, correctAnswer });
  });

  if (errors.length > 0) {
    const err = new Error(`Fichier invalide (${errors.length} erreur(s)).`);
    err.status = 400;
    err.details = errors;
    throw err;
  }

  if (questions.length === 0) {
    const err = new Error("Aucune question valide trouvée dans le fichier.");
    err.status = 400;
    throw err;
  }

  return { questions };
};
