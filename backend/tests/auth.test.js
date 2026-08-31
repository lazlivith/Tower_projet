import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

vi.mock('../src/config/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-uuid', tokenHash: 'hashed', expiresAt: new Date(Date.now() + 86400000) }),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── REGISTER ──────────────────────────────────────────
  it('devrait inscrire un utilisateur (201)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'uuid-123', nom: 'Test User', email: 'test@example.com', role: 'STUDENT', isActive: true
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'Test User', email: 'test@example.com', password: 'Password123!' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('devrait refuser si l\'email existe déjà (409)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'Test User', email: 'exists@example.com', password: 'Password123!' });

    expect(res.statusCode).toBe(409);
  });

  // ── LOGIN ──────────────────────────────────────────
  it('devrait connecter un utilisateur et retourner un accessToken (200)', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'uuid-123', nom: 'Test User', email: 'test@example.com',
      passwordHash: hashedPassword, role: 'STUDENT', isActive: true, enrollments: [],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    // Nouveau champ: accessToken (non plus 'token')
    expect(res.body).toHaveProperty('accessToken');
    // Cookie httpOnly doit être posé
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('refreshToken');
  });

  it('devrait refuser une connexion avec mauvais mot de passe (401)', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'uuid-123', email: 'test@example.com',
      passwordHash: hashedPassword, isActive: true, enrollments: [],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Identifiants incorrects.');
  });

  // ── REFRESH ──────────────────────────────────────────
  it('devrait refuser /refresh si aucun cookie (401)', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('manquant');
  });

  it('devrait refuser /refresh si token inconnu en BDD (401)', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=fake-token-value');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('invalide');
  });

  // ── LOGOUT ──────────────────────────────────────────
  it('devrait répondre 200 au logout même sans cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Déconnexion');
  });

  it('devrait révoquer le token en BDD lors du logout avec cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=some-raw-token');

    expect(res.statusCode).toBe(200);
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledOnce();
  });
});

