import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

vi.mock('../src/config/prisma.js', () => ({
  default: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Course API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner la liste des cours (200)', async () => {
    const mockCourses = [
      { id: '1', title: 'Cours 1', price: 100, isPublished: true },
      { id: '2', title: 'Cours 2', price: 200, isPublished: true }
    ];
    prisma.course.count.mockResolvedValue(2);
    prisma.course.findMany.mockResolvedValue(mockCourses);

    const res = await request(app).get('/api/courses');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);
  });

  it('devrait retourner un cours par son ID (200)', async () => {
    const mockCourse = { id: '1', title: 'Cours 1', price: 100, isPublished: true };
    prisma.course.findUnique.mockResolvedValue(mockCourse);

    const res = await request(app).get('/api/courses/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Cours 1');
  });

  it('devrait retourner une erreur 404 si le cours n\'existe pas', async () => {
    prisma.course.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/courses/999');

    expect(res.statusCode).toBe(404);
  });
});
