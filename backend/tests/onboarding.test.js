import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { sendMail } from '../src/services/mail.service.js';
import jwt from 'jsonwebtoken';

vi.mock('../src/config/prisma.js', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    course: { findUnique: vi.fn() },
    classroom: { findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(async (arg) =>
      typeof arg === 'function' ? arg(prisma) : Promise.all(arg)
    ),
  },
}));

vi.mock('../src/services/mail.service.js', () => ({
  sendMail: vi.fn(),
}));

const MANAGER_ID = '00000000-0000-0000-0000-0000000000aa';
const COURSE_ID = '00000000-0000-0000-0000-0000000000c1';

describe('POST /api/admin/instructors/onboard', () => {
  let managerToken;

  beforeEach(() => {
    vi.clearAllMocks();
    managerToken = jwt.sign({ id: MANAGER_ID, role: 'MANAGER' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // checkGlobalActivation lit user.isActive
    prisma.user.findUnique.mockResolvedValue({ id: MANAGER_ID, isActive: true });
  });

  it('rejette un body invalide (400, Zod)', async () => {
    const res = await request(app)
      .post('/api/admin/instructors/onboard')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ email: 'pas-un-email', courseId: 'x' });
    expect(res.statusCode).toBe(400);
  });

  it('crée l\'instructeur et renvoie 201 quand l\'email part', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: MANAGER_ID, isActive: true }) // checkGlobalActivation
      .mockResolvedValueOnce(null); // pas d'utilisateur existant avec cet email
    prisma.user.create.mockResolvedValue({ id: 'new-instr', nom: 'Jean Prof', email: 'jean@tower.ma' });
    prisma.course.findUnique.mockResolvedValue({ id: COURSE_ID, title: 'Béton Armé' });
    prisma.classroom.findMany.mockResolvedValue([]);
    prisma.classroom.create.mockResolvedValue({ id: 'cls-1', name: 'Classe principale - Béton Armé' });
    sendMail.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/admin/instructors/onboard')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ nom: 'Jean Prof', email: 'jean@tower.ma', courseId: COURSE_ID });

    expect(res.statusCode).toBe(201);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ throwOnError: true }));
  });

  it('rollback : si l\'email échoue, la transaction remonte une erreur (500)', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: MANAGER_ID, isActive: true })
      .mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValue({ id: 'new-instr', nom: 'Jean Prof', email: 'jean@tower.ma' });
    prisma.course.findUnique.mockResolvedValue({ id: COURSE_ID, title: 'Béton Armé' });
    prisma.classroom.findMany.mockResolvedValue([]);
    prisma.classroom.create.mockResolvedValue({ id: 'cls-1', name: 'Classe principale - Béton Armé' });
    sendMail.mockRejectedValue(new Error("Échec de l'envoi de l'email à jean@tower.ma : SMTP down"));

    const res = await request(app)
      .post('/api/admin/instructors/onboard')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ nom: 'Jean Prof', email: 'jean@tower.ma', courseId: COURSE_ID });

    expect(res.statusCode).toBe(500);
  });
});
