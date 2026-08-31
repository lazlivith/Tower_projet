import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseQuizWorkbook } from '../src/services/quiz.parser.js';
import { extractYouTubeId, resolveVideoEmbed, decorateLessonsWithLockState } from '../src/services/lesson.service.js';

const toBuffer = (rows) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Quiz');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

describe('parseQuizWorkbook', () => {
  it('parse un fichier valide', () => {
    const buf = toBuffer([
      { Question: '2+2 ?', OptionA: '3', OptionB: '4', OptionC: '5', OptionD: '6', CorrectAnswer: 'B' },
      { Question: 'Capitale du Maroc ?', OptionA: 'Rabat', OptionB: 'Casa', OptionC: 'Fès', OptionD: 'Marrakech', CorrectAnswer: 'a' },
    ]);
    const { questions } = parseQuizWorkbook(buf);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toEqual({
      question: '2+2 ?',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correctAnswer: 'B',
    });
    expect(questions[1].correctAnswer).toBe('A'); // casse normalisée
  });

  it('rejette une colonne manquante', () => {
    const buf = toBuffer([{ Question: 'x', OptionA: '1', OptionB: '2', OptionC: '3', CorrectAnswer: 'A' }]);
    expect(() => parseQuizWorkbook(buf)).toThrow(/OptionD/);
  });

  it('rejette une ligne invalide avec le numéro de ligne', () => {
    const buf = toBuffer([
      { Question: 'ok', OptionA: '1', OptionB: '2', OptionC: '3', OptionD: '4', CorrectAnswer: 'A' },
      { Question: 'mauvaise', OptionA: '1', OptionB: '2', OptionC: '3', OptionD: '4', CorrectAnswer: 'Z' },
    ]);
    try {
      parseQuizWorkbook(buf);
      throw new Error('aurait dû lever');
    } catch (e) {
      expect(e.status).toBe(400);
      expect(e.details.join(' ')).toMatch(/Ligne 3/);
    }
  });
});

describe('extractYouTubeId / resolveVideoEmbed', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extrait %s', (url, id) => {
    expect(extractYouTubeId(url)).toBe(id);
  });

  it('produit une URL embed YouTube', () => {
    expect(resolveVideoEmbed('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      originalUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
  });

  it('gère l\'absence de vidéo', () => {
    expect(resolveVideoEmbed(null).provider).toBe('none');
  });
});

describe('decorateLessonsWithLockState', () => {
  it('déverrouille séquentiellement', () => {
    const lessons = [
      { id: 'l1', sequenceOrder: 1, title: 'A', progressions: [{ isCompleted: true }] },
      { id: 'l2', sequenceOrder: 2, title: 'B', progressions: [{ isCompleted: false }] },
      { id: 'l3', sequenceOrder: 3, title: 'C', progressions: [] },
    ];
    const out = decorateLessonsWithLockState(lessons);
    expect(out[0].locked).toBe(false); // 1re toujours ouverte
    expect(out[1].locked).toBe(false); // précédente complétée
    expect(out[2].locked).toBe(true);  // précédente non complétée
    expect(out[2].lockReason).toMatch(/achevée/);
  });
});
