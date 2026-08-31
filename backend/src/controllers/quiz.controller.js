import prisma from '../config/prisma.js';
import { parseQuizWorkbook } from '../services/quiz.parser.js';
import { issueCertificateIfEligible } from '../services/certificate.service.js';

/** L'instructeur possède la classe (ou est MANAGER). */
const assertClassroomAccess = async (user, classroomId) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) {
    const e = new Error('Classe introuvable.'); e.status = 404; throw e;
  }
  if (user.role !== 'MANAGER' && classroom.instructorId !== user.id) {
    const e = new Error("Vous n'êtes pas assigné à cette classe."); e.status = 403; throw e;
  }
  return classroom;
};

/**
 * INSTRUCTEUR — Importer un Quiz depuis un fichier Excel.
 * multipart/form-data : `file` (.xlsx) + `classroomId` + `lessonId?` + `title?`
 */
export const uploadQuiz = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu (champ "file").' });

    const { classroomId, lessonId, title } = req.body;
    if (!classroomId) return res.status(400).json({ message: 'classroomId est requis.' });

    await assertClassroomAccess(req.user, classroomId);

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

    const quiz = await prisma.quiz.create({
      data: {
        classroomId,
        lessonId: lessonId || null,
        title: title?.trim() || 'Quiz',
        questions: parsed.questions,
      },
    });

    return res.status(201).json({
      message: `Quiz importé : ${parsed.questions.length} question(s).`,
      quiz,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[QUIZ] uploadQuiz:', error);
    return res.status(500).json({ message: "Erreur lors de l'import du quiz." });
  }
};

/** INSTRUCTEUR — Lister les quiz d'une classe (avec réponses, pour prévisualisation). */
export const listClassroomQuizzes = async (req, res) => {
  try {
    await assertClassroomAccess(req.user, req.params.classroomId);
    const quizzes = await prisma.quiz.findMany({
      where: { classroomId: req.params.classroomId },
      orderBy: { createdAt: 'desc' },
      include: { lesson: { select: { id: true, title: true } }, _count: { select: { attempts: true } } },
    });
    return res.status(200).json(quizzes);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Erreur lors de la récupération des quiz.' });
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

/** ÉTUDIANT — Récupérer le quiz d'une leçon (sans les bonnes réponses). */
export const getLessonQuiz = async (req, res) => {
  try {
    await assertStudentAccessToLesson(req.user.id, req.params.lessonId);
    const quiz = await prisma.quiz.findFirst({ where: { lessonId: req.params.lessonId } });
    if (!quiz) return res.status(200).json(null);

    const safeQuestions = quiz.questions.map((q, index) => ({
      index,
      question: q.question,
      options: q.options,
    }));
    return res.status(200).json({ id: quiz.id, title: quiz.title, passScore: quiz.passScore, questions: safeQuestions });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Erreur lors de la récupération du quiz.' });
  }
};

/**
 * ÉTUDIANT — Soumettre les réponses d'un quiz.
 * body : { answers: { "0": "A", "1": "C", ... } }
 * Si le score >= passScore et que le quiz est rattaché à une leçon, la leçon est marquée achevée.
 */
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

    const total = quiz.questions.length;
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (String(answers[index] ?? answers[String(index)] ?? '').toUpperCase() === q.correctAnswer) correct++;
    });
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= quiz.passScore;

    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({
        data: { quizId, studentId: req.user.id, score, passed, answers },
      });

      if (passed && quiz.lessonId) {
        await tx.progress.upsert({
          where: { studentId_lessonId: { studentId: req.user.id, lessonId: quiz.lessonId } },
          update: { isCompleted: true },
          create: { studentId: req.user.id, lessonId: quiz.lessonId, isCompleted: true },
        });
      }
      return created;
    });

    // Quiz validé → vérifier l'éligibilité au certificat (non bloquant)
    if (passed && quiz.lessonId) {
      const lesson = await prisma.moduleLesson.findUnique({ where: { id: quiz.lessonId }, select: { courseId: true } });
      if (lesson) issueCertificateIfEligible(req.user.id, lesson.courseId).catch(() => {});
    }

    return res.status(200).json({
      score,
      passed,
      correct,
      total,
      lessonCompleted: passed && !!quiz.lessonId,
      attemptId: attempt.id,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('[QUIZ] submitQuiz:', error);
    return res.status(500).json({ message: 'Erreur lors de la soumission du quiz.' });
  }
};
