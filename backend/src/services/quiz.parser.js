import * as XLSX from 'xlsx';

/**
 * Import de quiz depuis un fichier (.xlsx, .xls ou .csv).
 *
 * Colonnes (ordre libre, casse/espaces/accents tolérés) :
 *   - Question           (synonymes : Intitulé, Enoncé)
 *   - OptionA … OptionF  (2 à 6 options ; A et B obligatoires)   synonymes : A, B, …
 *   - CorrectAnswer      (lettre A–F)                            synonymes : Réponse, BonneRéponse, Correct
 *   - PassScore          (optionnel, en %) — 1re ligne non vide fait foi
 *
 * @returns {{ questions: Array<{question, options:Record<string,string>, correctAnswer:string}>, passScore?: number }}
 * @throws {Error} `.status = 400` + `.details` (lignes fautives)
 */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const norm = (k) =>
  String(k).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

const QUESTION_KEYS = ['question', 'intitule', 'enonce', 'libelle'];
const ANSWER_KEYS = ['correctanswer', 'reponse', 'bonnereponse', 'correct', 'solution'];
const SCORE_KEYS = ['passscore', 'seuil', 'seuilreussite', 'score'];
const optionKeys = (l) => [`option${l.toLowerCase()}`, l.toLowerCase(), `choix${l.toLowerCase()}`, `rep${l.toLowerCase()}`];

const fail = (message, details) => {
  const e = new Error(message);
  e.status = 400;
  if (details) e.details = details;
  throw e;
};

export const parseQuizWorkbook = (buffer) => {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    fail('Fichier illisible ou corrompu (formats acceptés : .xlsx, .xls, .csv).');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) fail('Le fichier ne contient aucune feuille de calcul.');

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (rows.length === 0) fail('Le fichier est vide (aucune question).');

  // colonne normalisée -> clé réelle
  const keyMap = {};
  for (const realKey of Object.keys(rows[0])) keyMap[norm(realKey)] = realKey;
  const pick = (candidates) => {
    const hit = candidates.find((c) => c in keyMap);
    return hit ? keyMap[hit] : null;
  };

  const questionCol = pick(QUESTION_KEYS);
  const answerCol = pick(ANSWER_KEYS);
  const scoreCol = pick(SCORE_KEYS);
  if (!questionCol) fail(`Colonne "Question" introuvable. En-têtes détectés : ${Object.keys(rows[0]).join(', ')}`);
  if (!answerCol) fail('Colonne "CorrectAnswer" (ou "Réponse") introuvable.');

  const optionCols = LETTERS.map((l) => pick(optionKeys(l)));
  const availableCount = optionCols.filter(Boolean).length;
  if (availableCount < 2) fail('Au moins 2 colonnes d\'options (OptionA, OptionB) sont requises.');

  const get = (row, col) => (col ? String(row[col] ?? '').trim() : '');

  const questions = [];
  const errors = [];
  let passScore;

  rows.forEach((row, i) => {
    const lineNo = i + 2;
    const question = get(row, questionCol);
    const opts = optionCols.map((c) => get(row, c));
    const answer = get(row, answerCol).toUpperCase();

    if (!question && opts.every((o) => !o)) return; // ligne vide

    if (scoreCol && passScore === undefined) {
      const s = parseInt(get(row, scoreCol), 10);
      if (!Number.isNaN(s) && s >= 1 && s <= 100) passScore = s;
    }

    const filled = opts.filter(Boolean);
    const rowErrors = [];
    if (!question) rowErrors.push('question vide');
    if (filled.length < 2) rowErrors.push('au moins 2 options non vides sont requises');
    const answerIdx = LETTERS.indexOf(answer);
    if (answerIdx < 0 || answerIdx >= filled.length || !opts[answerIdx]) {
      rowErrors.push(`la bonne réponse doit être une lettre valide parmi les options remplies (reçu : "${answer || 'vide'}")`);
    }

    if (rowErrors.length) {
      errors.push(`Ligne ${lineNo} : ${rowErrors.join(' ; ')}`);
      return;
    }

    // options compactées A.. selon le nombre réellement rempli
    const options = {};
    filled.forEach((o, k) => { options[LETTERS[k]] = o; });
    const correctAnswer = LETTERS[filled.indexOf(opts[answerIdx])];

    questions.push({ question, options, correctAnswer });
  });

  if (errors.length) fail(`Fichier invalide (${errors.length} erreur(s)).`, errors);
  if (questions.length === 0) fail('Aucune question valide trouvée dans le fichier.');

  return { questions, ...(passScore !== undefined ? { passScore } : {}) };
};

/** Génère un classeur .xlsx modèle prêt à remplir. */
export const buildQuizTemplate = () => {
  const aoa = [
    ['Question', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer', 'PassScore'],
    ['Quelle norme couvre le calcul du béton armé ?', 'Eurocode 2', 'Eurocode 3', 'Eurocode 8', 'RPS 2000', 'A', 70],
    ['Le module d\'Young de l\'acier vaut environ…', '210 GPa', '21 GPa', '2100 MPa', '70 GPa', 'A', ''],
    ['LOD 400 correspond à…', 'un niveau de détail conceptuel', 'un niveau de détail pour exécution', 'une charge', 'un logiciel', 'B', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 55 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Quiz');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
