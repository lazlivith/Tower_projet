import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import jwt from 'jsonwebtoken';

// Mock Stripe — DOIT être avant l'import de app pour éviter le crash au chargement
// `new Stripe(key)` appelle un constructeur de classe → le mock doit être une classe
vi.mock('stripe', () => {
  const mockStripeInstance = {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/fake-url' }),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
  class MockStripe {
    constructor() {
      return mockStripeInstance;
    }
  }
  return { default: MockStripe };
});

vi.mock('../src/config/prisma.js', () => ({
  default: {
    course: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    payment: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), createMany: vi.fn() },
    moduleLesson: { findMany: vi.fn() },
    progress: { createMany: vi.fn() },
    user: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(async (callback) => callback(prisma)),
  },
}));

vi.mock('../src/services/mail.service.js', () => ({
  sendMail: vi.fn().mockResolvedValue(true),
}));

vi.mock('../src/services/pdf.service.js', () => ({
  generateInvoicePDF: vi.fn().mockResolvedValue('/uploads/pdfs/facture-test.pdf'),
}));

describe('Payment API', () => {
  const mockCourseId = '00000000-0000-0000-0000-000000000001';
  let token;

  beforeEach(() => {
    vi.clearAllMocks();
    token = jwt.sign(
      { id: 'uuid-student', role: 'STUDENT' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  it('devrait refuser un checkout sans authentification (401)', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .send({ courseId: mockCourseId, paymentMethod: 'STRIPE', paymentPlan: 'FULL' });

    expect(res.statusCode).toBe(401);
  });

  it('devrait retourner 400 si les données sont invalides (Zod)', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: 'pas-un-uuid', paymentMethod: 'INVALID', paymentPlan: 'FULL' });

    expect(res.statusCode).toBe(400);
  });

  it('devrait retourner 404 si la formation est introuvable', async () => {
    prisma.course.findUnique.mockResolvedValue(null);
    prisma.enrollment.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: mockCourseId, paymentMethod: 'VIREMENT', paymentPlan: 'FULL' });

    expect(res.statusCode).toBe(404);
  });

  it('devrait initier une session Stripe et retourner un checkoutUrl', async () => {
    prisma.course.findUnique.mockResolvedValue({
      id: mockCourseId,
      title: 'Béton Armé',
      description: 'Formation',
      price: 3000,
      classrooms: [{ id: 'class-uuid', name: 'Classe A' }],
    });
    prisma.enrollment.findUnique.mockResolvedValue(null);
    prisma.enrollment.create.mockResolvedValue({ id: 'enroll-uuid' });
    prisma.payment.create.mockResolvedValue({ id: 'pay-uuid' });

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: mockCourseId, paymentMethod: 'STRIPE', paymentPlan: 'FULL' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('checkoutUrl');
    expect(res.body.checkoutUrl).toContain('stripe.com');
  });

  it('plan 3× : enregistre les 2 échéances restantes en plus de la 1re', async () => {
    prisma.course.findUnique.mockResolvedValue({
      id: mockCourseId,
      title: 'Béton Armé',
      description: 'Formation',
      price: 3000,
      classrooms: [{ id: 'class-uuid', name: 'Classe A' }],
    });
    prisma.enrollment.findUnique.mockResolvedValue(null);
    prisma.enrollment.create.mockResolvedValue({ id: 'enroll-uuid' });
    prisma.payment.create.mockResolvedValue({ id: 'pay-uuid' });

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: mockCourseId, paymentMethod: 'STRIPE', paymentPlan: 'THREE_INSTALLMENTS' });

    expect(res.statusCode).toBe(201);
    expect(prisma.payment.createMany).toHaveBeenCalledOnce();
    const arg = prisma.payment.createMany.mock.calls[0][0];
    expect(arg.data).toHaveLength(2);
  });
});

