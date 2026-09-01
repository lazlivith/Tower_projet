import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import paymentRoutes from './routes/payment.routes.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import sessionRoutes from './routes/session.routes.js';
import adminRoutes from './routes/admin.routes.js';
import messagingRoutes from './routes/messaging.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import statsRoutes from './routes/stats.routes.js';
import instructorRoutes from './routes/instructor.routes.js';
import classroomRoutes from './routes/classroom.routes.js';
import studentRoutes from './routes/student.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import uploadRoutes from './routes/upload.routes.js';
import { httpLogger } from './config/logger.js';
import { setupSwagger } from './config/swagger.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { startCronJobs } from './services/cron.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Derrière un proxy (Render/Railway/Nginx) : nécessaire pour req.ip / rate-limit / cookies secure
app.set('trust proxy', 1);

// Middlewares globaux
app.use(httpLogger);

// En-têtes de sécurité — CSP désactivée (Swagger UI charge depuis un CDN ; le front est servi ailleurs)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cookieParser()); // Nécessaire pour lire req.cookies (refresh token httpOnly)

// CORS — liste d'origines autorisées (séparées par des virgules) via FRONTEND_URL.
// En dev, toute origine localhost/127.0.0.1 est acceptée (peu importe le port de Vite).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin: (origin, cb) => {
    // Requêtes same-origin / outils (curl, Postman) : pas d'en-tête Origin
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (isDev && isLocalhost(origin)) return cb(null, true);
    // Origine refusée : on ne lève PAS d'erreur (évite un 500) — on n'ajoute juste pas les en-têtes CORS
    return cb(null, false);
  },
  credentials: true,
}));

// Rate limiting global sur l'API (le webhook Stripe et les routes d'auth ont leurs propres règles)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/payments/webhook',
  message: { message: 'Trop de requêtes. Réessayez dans quelques minutes.' },
});
app.use('/api', apiLimiter);

// Le webhook Stripe DOIT recevoir le corps brut (non parsé) pour la vérification de signature.
// Monté avant express.json() et limité à cette route.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Swagger Documentation (DOIT être monté avant les routes API)
setupSwagger(app);

// Démarrer les tâches planifiées (Cron Jobs)
startCronJobs();

// Montage des routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/upload', uploadRoutes);

// Fichiers statiques (uploads) — fallback disque local quand Cloudinary n'est pas configuré.
// Aligné sur storage.service.js qui écrit dans `<cwd>/uploads/<type>`.
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Endpoint de test / santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'L\'API TowerStructure fonctionne correctement.' });
});

app.get('/api/health/deep', async (req, res) => {
  const report = {
    status: 'UNKNOWN',
    postgres_connectivity: false,
    enums_present: false,
    unique_constraints: false,
    details: {}
  };

  try {
    const prisma = (await import('./config/prisma.js')).default;

    // 1. Check PostgreSQL Connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      report.postgres_connectivity = true;
      report.details.connectivity = 'OK';
    } catch (e) {
      report.details.connectivity = e.message;
    }

    // 2. Check Enums (Role, AccessStatus, PaymentPlan)
    try {
      const enums = await prisma.$queryRaw`
        SELECT t.typname, array_agg(e.enumlabel::text) as values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname IN ('Role', 'AccessStatus', 'PaymentPlan')
        GROUP BY t.typname;
      `;
      const foundEnums = enums.map(e => e.typname);
      if (foundEnums.includes('Role') && foundEnums.includes('AccessStatus') && foundEnums.includes('PaymentPlan')) {
        report.enums_present = true;
      }
      report.details.enums_found = foundEnums;
    } catch (e) {
      report.details.enums = e.message;
    }

    // 3. Check Unique Constraints (Double Registration)
    try {
      const testEmail = 'diagnostic.test@tower.ma';
      // Cleanup first if exists
      await prisma.user.deleteMany({ where: { email: testEmail } });
      
      // First insert
      await prisma.user.create({
        data: {
          nom: 'Test User',
          email: testEmail,
          passwordHash: 'dummyhash',
          role: 'STUDENT'
        }
      });
      
      // Second insert (should fail with P2002)
      let p2002Triggered = false;
      try {
        await prisma.user.create({
          data: {
            nom: 'Test User 2',
            email: testEmail,
            passwordHash: 'dummyhash',
            role: 'STUDENT'
          }
        });
      } catch (insertErr) {
        if (insertErr.code === 'P2002') {
          p2002Triggered = true;
        }
      }
      
      report.unique_constraints = p2002Triggered;
      report.details.unique_constraint_code = p2002Triggered ? 'P2002 triggered successfully' : 'Constraint failed to trigger';
      
      // Cleanup
      await prisma.user.deleteMany({ where: { email: testEmail } });
    } catch (e) {
      report.details.unique_constraint_error = e.message;
    }

    if (report.postgres_connectivity && report.enums_present && report.unique_constraints) {
      report.status = 'HEALTHY';
    } else {
      report.status = 'UNHEALTHY';
    }

    res.json(report);
  } catch (err) {
    report.details.global_error = err.message;
    res.status(500).json(report);
  }
});

// Middleware global d'erreurs — DOIT être en dernier
app.use(errorHandler);

export default app;
