import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/config/prisma.js', () => ({
  default: {
    user: { findUnique: vi.fn() },
    moduleLesson: { findUnique: vi.fn(), findFirst: vi.fn() },
    enrollment: { findUnique: vi.fn(), update: vi.fn() },
    progress: { findUnique: vi.fn(), upsert: vi.fn() },
    quiz: { findUnique: vi.fn(), findFirst: vi.fn() },
    quizAttempt: { create: vi.fn() },
    certificate: { findFirst: vi.fn() },
    $transaction: vi.fn(async (arg) => (typeof arg === 'function' ? arg((await import('../src/config/prisma.js')).default) : Promise.all(arg))),
  },
}));

const prisma = (await import('../src/config/prisma.js')).default;
const app = (await import('../src/app.js')).default;

const STUDENT = '00000000-0000-0000-0000-0000000000e1';
const LESSON2 = '00000000-0000-0000-0000-00000000l002';
const token = jwt.sign({ id: STUDENT, role: 'STUDENT' }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => {
  vi.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue({ id: STUDENT, isActive: true }); // checkGlobalActivation
});

describe('Déblocage séquentiel — POST /api/student/lessons/:id/toggle', () => {
  it('403 si le chapitre précédent n\'est pas achevé', async () => {
    // checkActiveEnrollmentForLesson : lesson + enrollment actifs
    prisma.moduleLesson.findUnique
      .mockResolvedValueOnce({ courseId: 'course1' })                       // middleware
      .mockResolvedValueOnce({ id: LESSON2, courseId: 'course1', sequenceOrder: 2 }); // isLessonUnlocked
    prisma.enrollment.findUnique.mockResolvedValue({ accessStatus: 'ACTIVE' });
    prisma.moduleLesson.findFirst.mockResolvedValue({ id: 'lesson1', title: 'Chapitre 1' }); // leçon précédente
    prisma.progress.findUnique.mockResolvedValue({ isCompleted: false });   // précédente non complétée

    const res = await request(app)
      .patch(`/api/student/lessons/${LESSON2}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isCompleted: true });

    expect(res.statusCode).toBe(403);
    expect(res.body.locked).toBe(true);
  });

  it('200 si le chapitre précédent est achevé', async () => {
    prisma.moduleLesson.findUnique
      .mockResolvedValueOnce({ courseId: 'course1' })
      .mockResolvedValueOnce({ id: LESSON2, courseId: 'course1', sequenceOrder: 2 });
    prisma.enrollment.findUnique.mockResolvedValue({ accessStatus: 'ACTIVE' });
    prisma.moduleLesson.findFirst.mockResolvedValue({ id: 'lesson1', title: 'Chapitre 1' });
    prisma.progress.findUnique.mockResolvedValue({ isCompleted: true });
    prisma.progress.upsert.mockResolvedValue({ id: 'p1', isCompleted: true });

    const res = await request(app)
      .patch(`/api/student/lessons/${LESSON2}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isCompleted: true });

    expect(res.statusCode).toBe(200);
  });
});

describe('GET /api/lessons/:id/video', () => {
  it('renvoie l\'URL d\'embed YouTube pour un chapitre déverrouillé', async () => {
    prisma.moduleLesson.findUnique
      .mockResolvedValueOnce({ id: 'l1', courseId: 'course1', sequenceOrder: 1, videoUrl: 'https://youtu.be/dQw4w9WgXcQ', title: 'Ch1' }) // loadLessonForStudent
      .mockResolvedValueOnce({ id: 'l1', courseId: 'course1', sequenceOrder: 1 }); // isLessonUnlocked
    prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1', accessStatus: 'ACTIVE' });

    const res = await request(app).get('/api/lessons/l1/video').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.provider).toBe('youtube');
    expect(res.body.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
});
