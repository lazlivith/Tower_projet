import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../src/config/prisma.js', () => ({
  default: {
    enrollment: { findUnique: vi.fn() },
    quiz: { findMany: vi.fn() },
    quizAttempt: { findMany: vi.fn() },
  },
}));

const prisma = (await import('../src/config/prisma.js')).default;
const { evaluateCertificateEligibility, CERT_MIN_HOURS } = await import('../src/services/certificate.service.js');

describe('evaluateCertificateEligibility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('éligible : heures suffisantes + tous les quiz validés', async () => {
    prisma.enrollment.findUnique.mockResolvedValue({
      classroomId: 'c1', hoursSpent: 90, course: { title: 'BIM' },
    });
    prisma.quiz.findMany.mockResolvedValue([{ id: 'q1' }, { id: 'q2' }]);
    prisma.quizAttempt.findMany.mockResolvedValue([{ quizId: 'q1' }, { quizId: 'q2' }]);

    const r = await evaluateCertificateEligibility('s1', 'course1');
    expect(r.eligible).toBe(true);
    expect(r.hoursRequired).toBe(CERT_MIN_HOURS);
  });

  it('non éligible : pas assez d\'heures', async () => {
    prisma.enrollment.findUnique.mockResolvedValue({
      classroomId: 'c1', hoursSpent: 40, course: { title: 'BIM' },
    });
    prisma.quiz.findMany.mockResolvedValue([]);
    prisma.quizAttempt.findMany.mockResolvedValue([]);

    const r = await evaluateCertificateEligibility('s1', 'course1');
    expect(r.eligible).toBe(false);
    expect(r.hoursOk).toBe(false);
  });

  it('non éligible : un quiz non validé', async () => {
    prisma.enrollment.findUnique.mockResolvedValue({
      classroomId: 'c1', hoursSpent: 120, course: { title: 'BIM' },
    });
    prisma.quiz.findMany.mockResolvedValue([{ id: 'q1' }, { id: 'q2' }]);
    prisma.quizAttempt.findMany.mockResolvedValue([{ quizId: 'q1' }]);

    const r = await evaluateCertificateEligibility('s1', 'course1');
    expect(r.eligible).toBe(false);
    expect(r.quizzesOk).toBe(false);
  });
});

describe('jitsi.service', () => {
  it('createJitsiToken renvoie null sans secret configuré', async () => {
    delete process.env.JITSI_APP_SECRET;
    vi.resetModules();
    const { createJitsiToken } = await import('../src/services/jitsi.service.js');
    expect(createJitsiToken({ room: 'r', user: { id: 'u', nom: 'X' } })).toBeNull();
  });

  it('createJitsiToken signe un JWT quand le secret est présent', async () => {
    process.env.JITSI_APP_SECRET = 'test-secret';
    process.env.JITSI_APP_ID = 'towertest';
    vi.resetModules();
    const { createJitsiToken } = await import('../src/services/jitsi.service.js');
    const token = createJitsiToken({ room: 'salle-1', user: { id: 'u1', nom: 'Prof' }, moderator: true });
    const decoded = jwt.verify(token, 'test-secret');
    expect(decoded.room).toBe('salle-1');
    expect(decoded.aud).toBe('towertest');
    expect(decoded.context.user.moderator).toBe(true);
    delete process.env.JITSI_APP_SECRET;
  });
});
