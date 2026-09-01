import prisma from '../config/prisma.js';
import { parseQuizWorkbook, buildQuizTemplate } from '../services/quiz.parser.js';
import { issueCertificateIfEligible } from '../services/certificate.service.js';

// ─────────────────────────── helpers ───────────────────────────

/** L'instructeur possède la classe (ou est MANAGER). */
const assertClassroomAccess = async (user, classroomId) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) { const e = new Error('Classe introuvable.'); e.status = 404; throw e; }
  if (user.role !== 'MANAGER' && classroom.instructorId !== user.id) {
    const e = new Error("Vous n'êtes pas assigné à cette classe."); e.status = 403; throw e;
  }
  return classroom;
};

/** assignedToId doit être un élève avec une inscription ACTIVE dans cette classe. */
const assertAssigneeInClassroom = async (classroomId, assignedToId) => {
  if (!assignedToId) return;
  const enr = await prisma.enrollment.findFirst({
    where: { classroomId, studentId: assignedToId, accessStatus: 'ACTIVE' },
    select: { id: true },
  });
  if (!enr) { const e = new Error("L'élève ciblé n'appartient pas (ou n'est pas actif) à cette classe."); e.status = 400; throw e; }
};

/** Normalise/valide un tableau de questions issu du builder manuel. */
const validateQuestions = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) {
    const e = new Error('Le quiz doit contenir au moins une question.'); e.status = 400; throw e;
  }
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  return raw.map((q, i) => {
    const question = String(q.question ?? '').trim();
    const entries = LETTERS.map((l) => [l, String(q.options?.[l] ?? '').trim()]).filter(([, v]) => v);
    const correct = String(q.correctAnswer ?? '').toUpperCase();
    if (!question) { const e = new Error(`Question ${i + 1} : intitulé vide.`); e.status = 400; throw e; }
    if (entries.length < 2) { const e = new Error(`Question ${i + 1} : au moins 2 options.`); e.status = 400; throw e; }
    if (!entries.some(([l]) => l === correct)) { const e = new Error(`Question ${i + 1} : bonne réponse invalide.`); e.status = 400; throw e; }
    return { question, options: Object.fromEntries(entries), correctAnswer: correct };
  });
};

/** Un élève peut passer ce quiz : inscription ACTIVE dans la classe + (assigné à tous OU à lui). */
const assertStudentCanTakeQuiz = async (studentId, quiz) => {
  if (quiz.assignedToId && quiz.assignedToId !== studentId) {
    const e = new Error("Ce quiz n'est pas disponible pour vous."); e.status = 403; throw e;
  }
  const enr = await prisma.enrollment.findFirst({
    where: { classroomId: quiz.classroomId, studentId, accessStatus: 'ACTIVE' },
    select: { id: true },
  });
  if (!enr) { const e = new Error('Accès refusé à ce quiz.'); e.status = 403; throw e; }
};

const cleanQuizForList = (q) => ({
  id: q.id,
  title: q.title,
  description: q.description,
  passScore: q.passScore,
  dueAt: q.dueAt,
  lesson: q.lesson,
  assignedTo: q.assignedTo,
  questionsCount: Array.isArray(q.questions) ? q.questions.length : 0,
  attempts: q._count?.attempts ?? 0,
  createdAt: q.createdAt,
});

// ─────────────────────────── INSTRUCTEUR ───────────────────────────

/** POST /api/instructor/quizzes/upload  (multipart : file + classroomId + …) */
export const uploadQuiz = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu (champ "file").' });
    const { classroomId, lessonId, title, description, assignedToId } = req.body;
    if (!classroomId) return res.status(400).json({ message: 'classroomId est requis.' });

    await assertClassroomAccess(req.user, classroomId);
    await assertAssigneeInClassroom(classroomId, assignedToId || null);
    if (lessonId) {
      const lesson = await prisma.moduleLesson.findUnique({ where: { id: lessonId }, select: { id: true } });
      if (!lesson) return res.status(404).json({ message: 'Leçon introuvable.' });
    }

    let parsed;
    try {
      parsed = parseQuizWorkbook(req.file.buffer);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message, details: err.details });
    }

    const passScore = Number(req.body.passScore) || parsed.passScore || 70;
    const quiz = await prisma.quiz.create({
      data: {
        classroomId,
        lessonId: lessonId || null,
        assignedToId: assignedToId || null,
        title: title?.trim() || 'Quiz',
        description: description?.trim() || null,
        passScore: Math.min(100, Math.max(1, passScore)),
        dueAt: req.body.dueAt ? new Date(req.body.dueAt) : null,
        questions: parsed.questions,
      },
    });

    return res.status(201).json({ message: `Quiz importé : ${parsed.questions.length} question(s).`, quiz });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[QUIZ] uploadQuiz:', error);
    return res.status(500).json({ message: "Erreur lors de l'import du quiz." });
  }
};

/** POST /api/instructor/classrooms/:classroomId/quizzes  (JSON, depuis le QuizBuilder) */
export const createQuiz = async (req, res) => {
  try {
    const { classroomId } = req.params;
    await assertClassroomAccess(req.user, classroomId);

    const { title, description, lessonId, assignedToId, dueAt } = req.body;
    const questions = validateQuestions(req.body.questions);
    await assertAssigneeInClassroom(classroomId, assignedToId || null);
    if (lessonId) {
      const lesson = await prisma.moduleLesson.findUnique({ where: { id: lessonId }, select: { id: true } });
      if (!lesson) return res.status(404).json({ message: 'Leçon introuvable.' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        classroomId,
        lessonId: lessonId || null,
        assignedToId: assignedToId || null,
        title: (title || 'Quiz').trim(),
        description: description?.trim() || null,
        passScore: Math.min(100, Math.max(1, Number(req.body.passScore) || 70)),
        dueAt: dueAt ? new Date(dueAt) : null,
        questions,
      },
    });
    return res.status(201).json({ message: `Quiz créé : ${questions.length} question(s).`, quiz });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[QUIZ] createQuiz:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du quiz.' });
  }
};

/** INSTRUCTEUR — Lister les quiz d'une classe. */
export const listClassroomQuizzes = async (req, res) => {
  try {
    await assertClassroomAccess(req.user, req.params.classroomId);
    const quizzes = await prisma.quiz.findMany({
      where: { classroomId: req.params.classroomId },
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, nom: true } },
        _count: { select: { attempts: true } },
      },
    });
    return res.status(200).json(quizzes.map(cleanQuizForList));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Erreur lors de la récupération des quiz.' });
  }
};

/** INSTRUCTEUR — Résultats détaillés d'un quiz (par élève : meilleure tentative). */
export const getQuizResults = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { assignedTo: { select: { id: true, nom: true } } },
    });
    if (!quiz) return res.status(404).json({ message: 'Quiz introuvable.' });
    await assertClassroomAccess(req.user, quiz.classroomId);

    // Public visé : l'élève assigné, ou tous les élèves actifs de la classe.
    const cohort = quiz.assignedToId
      ? [{ id: quiz.assignedTo.id, nom: quiz.assignedTo.nom }]
      : (await prisma.enrollment.findMany({
          where: { classroomId: quiz.classroomId, accessStatus: 'ACTIVE' },
          include: { student: { select: { id: true, nom: true } } },
        })).map((e) => e.student);

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: quiz.id },
      orderBy: { createdAt: 'asc' },
      select: { studentId: true, score: true, passed: true, createdAt: true },
    });

    const byStudent = {};
    for (const a of attempts) {
      const cur = byStudent[a.studentId];
      if (!cur || a.score > cur.bestScore) {
        byStudent[a.studentId] = { bestScore: a.score, passed: a.passed || cur?.passed || false };
      } else if (a.passed) cur.passed = true;
      byStudent[a.studentId].attempts = (byStudent[a.studentId].attempts || 0) + 1;
      byStudent[a.studentId].lastAt = a.createdAt;
    }

    const rows = cohort.map((s) => ({
      studentId: s.id,
      nom: s.nom,
      status: byStudent[s.id] ? (byStudent[s.id].passed ? 'PASSED' : 'FAILED') : 'NOT_STARTED',
      bestScore: byStudent[s.id]?.bestScore ?? null,
      attempts: byStudent[s.id]?.attempts ?? 0,
      lastAt: byStudent[s.id]?.lastAt ?? null,
    }));

    const done = rows.filter((r) => r.status !== 'NOT_STARTED');
    return res.status(200).json({
      quiz: { id: quiz.id, title: quiz.title, passScore: quiz.passScore, questionsCount: quiz.questions.length, dueAt: quiz.dueAt },
      summary: {
        cohort: rows.length,
        started: done.length,
        passed: rows.filter((r) => r.status === 'PASSED').length,
        avgScore: done.length ? Math.round(done.reduce((a, r) => a + (r.bestScore || 0), 0) / done.length) : null,
      },
      rows,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[QUIZ] getQuizResults:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des résultats.' });
  }
};

/** INSTRUCTEUR — Supprimer un quiz. */
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ message: 'Quiz introuvable.' });
    await assertClassroomAccess(req.user, quiz.classroomId);
    await prisma.quiz.delete({ where: { id: quiz.id } });
    return res.status(200).json({ message: 'Quiz supprimé.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};

/** INSTRUCTEUR — Télécharger le modèle .xlsx. */
export const downloadQuizTemplate = (req, res) => {
  const buffer = buildQuizTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="modele-quiz-tower.xlsx"');
  return res.status(200).send(buffer);
};

// ─────────────────────────── ÉTUDIANT ───────────────────────────

/** Vérifie que l'étudiant a un accès ACTIVE au cours de la leçon. */
const assertStudentAccessToLesson = async (studentId, lessonId) => {
  const lesson = await prisma.moduleLesson.findUnique({ where: { id: lessonId }, select: { courseId: true } });
  if (!lesson) { const e = new Error('Leçon introuvable.'); e.status = 404; throw e; }
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: lesson.courseId } },
    select: { accessStatus: true },
  });
  if (!enrollment || enrollment.accessStatus !== 'ACTIVE') {
    const e = new Error('Accès refusé à ce contenu.'); e.status = 403; throw e;
  }
};

const safeQuestions = (questions) =>
  questions.map((q, index) => ({ index, question: q.question, options: q.options }));

/** ÉTUDIANT — Quiz d'une leçon (sans les bonnes réponses). */
export const getLessonQuiz = async (req, res) => {
  try {
    await assertStudentAccessToLesson(req.user.id, req.params.lessonId);
    const quiz = await prisma.quiz.findFirst({ where: { lessonId: req.params.lessonId, assignedToId: null } });
    if (!quiz) return res.status(200).json(null);
    return res.status(200).json({ id: quiz.id, title: quiz.title, passScore: quiz.passScore, questions: safeQuestions(quiz.questions) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Erreur lors de la récupération du quiz.' });
  }
};

/** ÉTUDIANT — Mes quiz assignés (autonomes, hors chapitre) + statut. */
export const getMyAssignedQuizzes = async (req, res) => {
  try {
    const studentId = req.user.id;
    const classIds = (await prisma.enrollment.findMany({
      where: { studentId, accessStatus: 'ACTIVE' }, select: { classroomId: true },
    })).map((e) => e.classroomId);
    if (classIds.length === 0) return res.status(200).json([]);

    const quizzes = await prisma.quiz.findMany({
      where: {
        classroomId: { in: classIds },
        lessonId: null,
        OR: [{ assignedToId: null }, { assignedToId: studentId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        classroom: { select: { name: true, course: { select: { title: true } } } },
      },
    });

    const myAttempts = await prisma.quizAttempt.findMany({
      where: { studentId, quizId: { in: quizzes.map((q) => q.id) } },
      select: { quizId: true, score: true, passed: true, createdAt: true },
    });
    const best = {};
    for (const a of myAttempts) {
      const c = best[a.quizId];
      if (!c || a.score > c.score) best[a.quizId] = { score: a.score, passed: a.passed || c?.passed || false, at: a.createdAt };
      else if (a.passed) c.passed = true;
    }

    return res.status(200).json(
      quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        passScore: q.passScore,
        dueAt: q.dueAt,
        questionsCount: q.questions.length,
        personal: q.assignedToId === studentId,
        course: q.classroom.course.title,
        classroom: q.classroom.name,
        myBestScore: best[q.id]?.score ?? null,
        passed: best[q.id]?.passed ?? false,
        attempted: !!best[q.id],
      }))
    );
  } catch (error) {
    console.error('[QUIZ] getMyAssignedQuizzes:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de vos quiz.' });
  }
};

/** ÉTUDIANT — Charger un quiz autonome par son id (sans les réponses). */
export const getQuizForStudent = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ message: 'Quiz introuvable.' });
    await assertStudentCanTakeQuiz(req.user.id, quiz);
    return res.status(200).json({
      id: quiz.id, title: quiz.title, description: quiz.description,
      passScore: quiz.passScore, dueAt: quiz.dueAt, questions: safeQuestions(quiz.questions),
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Erreur lors de la récupération du quiz.' });
  }
};

/** ÉTUDIANT — Soumettre les réponses. body : { answers: { "0": "A", ... } } */
export const submitQuiz = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Le champ "answers" est requis (objet index → lettre).' });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ message: 'Quiz introuvable.' });

    if (quiz.lessonId) await assertStudentAccessToLesson(req.user.id, quiz.lessonId);
    else await assertStudentCanTakeQuiz(req.user.id, quiz);

    if (quiz.dueAt && new Date() > new Date(quiz.dueAt)) {
      return res.status(400).json({ message: 'La date limite de ce quiz est dépassée.' });
    }

    const total = quiz.questions.length;
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (String(answers[index] ?? answers[String(index)] ?? '').toUpperCase() === q.correctAnswer) correct++;
    });
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= quiz.passScore;

    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({ data: { quizId, studentId: req.user.id, score, passed, answers } });
      if (passed && quiz.lessonId) {
        await tx.progress.upsert({
          where: { studentId_lessonId: { studentId: req.user.id, lessonId: quiz.lessonId } },
          update: { isCompleted: true },
          create: { studentId: req.user.id, lessonId: quiz.lessonId, isCompleted: true },
        });
      }
      return created;
    });

    if (passed && quiz.lessonId) {
      const lesson = await prisma.moduleLesson.findUnique({ where: { id: quiz.lessonId }, select: { courseId: true } });
      if (lesson) issueCertificateIfEligible(req.user.id, lesson.courseId).catch(() => {});
    }

    return res.status(200).json({
      score, passed, correct, total,
      lessonCompleted: passed && !!quiz.lessonId,
      attemptId: attempt.id,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[QUIZ] submitQuiz:', error);
    return res.status(500).json({ message: 'Erreur lors de la soumission du quiz.' });
  }
};
