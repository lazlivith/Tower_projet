import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import { sendMail } from '../services/mail.service.js';
import { enrollmentAccessEmail, enrollmentPendingEmail } from '../services/mail.templates.js';
import { generateInvoicePDF } from '../services/pdf.service.js';
import Stripe from 'stripe';

// En mode dev, si STRIPE_SECRET_KEY n'est pas configurée, on crée un objet mock
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const requireStripe = (res) => {
  if (!stripe) {
    res.status(503).json({ message: 'Service de paiement non configuré (mode dev). Veuillez configurer STRIPE_SECRET_KEY.' });
    return false;
  }
  return true;
};

/**
 * MANAGER : Valide manuellement un paiement et active l'accès étudiant
 */
export const validateStudentPayment = async (req, res) => {
  const { paymentId } = req.params;
  const managerId = req.user?.id;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        enrollment: {
          include: { student: true, course: true }
        }
      }
    });

    if (!payment) return res.status(404).json({ message: "Ordre de paiement introuvable." });
    if (payment.paymentStatus === 'COMPLETED') return res.status(400).json({ message: "Ce paiement a déjà été validé." });

    // Transaction atomique : MAJ paiement + activation accès
    const updatedEnrollment = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { paymentStatus: 'COMPLETED', validatedBy: managerId }
      });

      return await tx.enrollment.update({
        where: { id: payment.enrollmentId },
        data: {
          accessStatus: 'ACTIVE',
          nextPaymentDue: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        }
      });
    });

    // Générer la facture PDF sur disque
    try {
      const invoiceUrl = await generateInvoicePDF(payment, payment.enrollment.student, payment.enrollment.course);
      console.log(`[PDF] Facture générée : ${invoiceUrl}`);
    } catch (err) {
      console.error("[PDF] Erreur facture manuelle:", err.message);
    }

    // Notification Prisma automatique
    await prisma.notification.create({
      data: {
        userId: payment.enrollment.studentId,
        type: 'SYSTEM',
        message: `Votre paiement a été validé. Votre accès à la formation "${payment.enrollment.course.title}" est maintenant actif.`
      }
    });

    // Email de confirmation avec lien JWT temporaire
    const token = jwt.sign(
      { userId: payment.enrollment.studentId, role: payment.enrollment.student.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn/student?token=${token}`;

    await sendMail({
      to: payment.enrollment.student.email,
      subject: 'Votre accès formation TowerStructure est confirmé',
      html: enrollmentAccessEmail({
        courseTitle: payment.enrollment.course.title,
        dashboardUrl,
      })
    });

    return res.status(200).json({
      message: "Paiement validé. L'email d'accès a été envoyé à l'étudiant.",
      enrollmentStatus: updatedEnrollment.accessStatus
    });

  } catch (error) {
    console.error("[PAYMENT] Erreur validation:", error);
    return res.status(500).json({ message: "Erreur interne lors de la validation." });
  }
};

/**
 * STUDENT : Initier l'achat d'une formation (Stripe Checkout ou paiement différé)
 */
export const processEnrollmentAndPayment = async (req, res) => {
  const { courseId, paymentMethod, paymentPlan } = req.body;
  const studentId = req.user.id;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { classrooms: true }
    });

    if (!course) return res.status(404).json({ message: "Formation introuvable." });
    if (course.classrooms.length === 0) {
      return res.status(400).json({ message: "Cette formation n'a pas encore de classe ouverte." });
    }

    const defaultClassroom = course.classrooms[0];

    // Vérifier si déjà inscrit
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: { payments: true }
    });

    const amount = paymentPlan === 'FULL' ? Number(course.price) : Number(course.price) / 3;

    if (existingEnrollment) {
      if (existingEnrollment.accessStatus === 'ACTIVE') {
        return res.status(400).json({ message: "Vous êtes déjà inscrit et votre accès est actif." });
      }

      // Si suspendu et Stripe en attente, on peut relancer la session
      const pendingStripePayment = existingEnrollment.payments.find(
        p => p.paymentMethod === 'STRIPE' && p.paymentStatus === 'PENDING'
      );

      if (pendingStripePayment && paymentMethod === 'STRIPE') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'mad',
                product_data: {
                  name: course.title,
                  description: course.description || `Inscription à la formation ${course.title}`,
                },
                unit_amount: Math.round(Number(pendingStripePayment.amount) * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
          metadata: {
            enrollmentId: existingEnrollment.id,
            paymentId: pendingStripePayment.id,
            studentId,
            courseId,
            classroomId: existingEnrollment.classroomId,
          },
        });

        return res.status(200).json({
          message: "Session Stripe recréée.",
          checkoutUrl: session.url,
          enrollment: existingEnrollment
        });
      }

      return res.status(400).json({
        message: "Vous possédez déjà une demande d'inscription en attente de traitement."
      });
    }

    // ─── Paiement en ligne (STRIPE) → Initialisation de Session Checkout ───
    if (paymentMethod === 'STRIPE') {
      const isInstallments = paymentPlan === 'THREE_INSTALLMENTS';
      const DAYS = 30 * 24 * 60 * 60 * 1000;

      const result = await prisma.$transaction(async (tx) => {
        const newEnroll = await tx.enrollment.create({
          data: {
            studentId, courseId,
            classroomId: defaultClassroom.id,
            paymentPlan,
            accessStatus: 'SUSPENDED', // Devient actif via webhook
            nextPaymentDue: isInstallments ? new Date(Date.now() + DAYS) : null
          }
        });

        // 1re échéance (payée maintenant via Stripe)
        const newPay = await tx.payment.create({
          data: { enrollmentId: newEnroll.id, amount, paymentMethod: 'STRIPE', paymentStatus: 'PENDING' }
        });

        // Échéancier 3× : on enregistre les 2 échéances restantes (à collecter ultérieurement)
        if (isInstallments) {
          await tx.payment.createMany({
            data: [
              { enrollmentId: newEnroll.id, amount, paymentMethod: 'STRIPE', paymentStatus: 'PENDING' },
              { enrollmentId: newEnroll.id, amount, paymentMethod: 'STRIPE', paymentStatus: 'PENDING' },
            ]
          });
        }

        return { enrollment: newEnroll, payment: newPay };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mad',
              product_data: {
                name: isInstallments ? `${course.title} — 1re échéance (1/3)` : course.title,
                description: course.description || `Inscription à la formation ${course.title}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
        metadata: {
          enrollmentId: result.enrollment.id,
          paymentId: result.payment.id,
          studentId,
          courseId,
          classroomId: defaultClassroom.id,
          paymentPlan,
        },
      });

      return res.status(201).json({
        message: "Session Stripe initiée avec succès.",
        checkoutUrl: session.url,
        enrollment: result.enrollment
      });
    }

    // ─── Paiement physique (VIREMENT, CHEQUE…) → En attente de validation ───
    const enrollment = await prisma.$transaction(async (tx) => {
      const newEnroll = await tx.enrollment.create({
        data: {
          studentId, courseId,
          classroomId: defaultClassroom.id,
          paymentPlan,
          accessStatus: 'SUSPENDED'
        }
      });

      await tx.payment.create({
        data: { enrollmentId: newEnroll.id, amount, paymentMethod, paymentStatus: 'PENDING' }
      });

      return newEnroll;
    });

    const user = await prisma.user.findUnique({ where: { id: studentId } });
    await sendMail({
      to: user.email,
      subject: 'Votre commande est en attente de validation — TowerStructure',
      html: enrollmentPendingEmail({ courseTitle: course.title, amount, paymentMethod })
    });

    return res.status(201).json({ message: "Demande enregistrée. En attente de validation.", enrollment });

  } catch (error) {
    console.error("[PAYMENT] Erreur checkout:", error);
    return res.status(500).json({ message: "Erreur lors du traitement de l'achat." });
  }
};

/**
 * STRIPE WEBHOOK : Valide automatiquement le paiement lors de la complétion du Checkout
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // express.raw() place le Buffer brut dans req.body ; fallback sur req.rawBody
    const rawPayload = Buffer.isBuffer(req.body) ? req.body : req.rawBody;
    event = stripe.webhooks.constructEvent(rawPayload, sig, endpointSecret);
  } catch (err) {
    console.error(`[STRIPE WEBHOOK ERROR] : ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ─── invoice.payment_succeeded : encaissement d'une échéance (3×) ───
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const enrollmentId =
      invoice.metadata?.enrollmentId ||
      invoice.subscription_details?.metadata?.enrollmentId ||
      invoice.lines?.data?.[0]?.metadata?.enrollmentId;

    if (!enrollmentId) {
      console.warn('[STRIPE WEBHOOK] invoice.payment_succeeded sans enrollmentId — ignoré.');
      return res.status(200).json({ received: true });
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Marque la plus ancienne échéance encore en attente comme réglée
        const pending = await tx.payment.findFirst({
          where: { enrollmentId, paymentStatus: 'PENDING' },
          orderBy: { createdAt: 'asc' },
        });
        if (pending) {
          await tx.payment.update({ where: { id: pending.id }, data: { paymentStatus: 'COMPLETED' } });
        }

        const remaining = await tx.payment.count({ where: { enrollmentId, paymentStatus: 'PENDING' } });
        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            accessStatus: 'ACTIVE',
            nextPaymentDue: remaining > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          },
        });
      });
      console.log(`[STRIPE WEBHOOK] Échéance encaissée pour enrollment ${enrollmentId}.`);
    } catch (error) {
      console.error('[STRIPE WEBHOOK] Erreur invoice.payment_succeeded :', error);
      return res.status(500).json({ message: 'Erreur interne serveur.' });
    }
    return res.status(200).json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { enrollmentId, paymentId } = session.metadata;

    try {
      const updatedEnrollment = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: paymentId },
          data: { paymentStatus: 'COMPLETED' },
          include: { enrollment: { include: { student: true, course: true } } }
        });

        const enroll = await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            accessStatus: 'ACTIVE',
            nextPaymentDue: payment.enrollment.paymentPlan === 'THREE_INSTALLMENTS'
              ? new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
              : null
          }
        });

        const lessons = await tx.moduleLesson.findMany({
          where: { courseId: payment.enrollment.courseId }
        });

        if (lessons.length > 0) {
          await tx.progress.createMany({
            data: lessons.map(l => ({
              studentId: payment.enrollment.studentId,
              lessonId: l.id,
              isCompleted: false
            })),
            skipDuplicates: true
          });
        }

        return { payment, enroll };
      });

      const { payment, enroll } = updatedEnrollment;
      const student = payment.enrollment.student;
      const course = payment.enrollment.course;

      // Générer facture PDF
      try {
        const invoiceUrl = await generateInvoicePDF(payment, student, course);
        console.log(`[PDF Webhook] Facture générée : ${invoiceUrl}`);
      } catch (err) {
        console.error("[PDF Webhook] Erreur facture automatique:", err.message);
      }

      // Notification
      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'SYSTEM',
          message: `Votre paiement via Stripe a été validé. Votre accès à la formation "${course.title}" est maintenant actif.`
        }
      });

      // Email
      const token = jwt.sign(
        { userId: student.id, role: student.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/learn/student?token=${token}`;

      await sendMail({
        to: student.email,
        subject: 'Votre accès formation TowerStructure est activé !',
        html: enrollmentAccessEmail({ courseTitle: course.title, dashboardUrl })
      });

      console.log(`[STRIPE WEBHOOK] Inscription validée pour l'élève ${student.email}`);

    } catch (error) {
      console.error("[STRIPE WEBHOOK] Erreur lors de la validation en base de données :", error);
      return res.status(500).json({ message: "Erreur interne serveur lors de la validation." });
    }
  }

  return res.status(200).json({ received: true });
};

// ─────────────────────────────────────────────────────────────────
// PAIEMENT SIMULÉ (Mode Test — Sans Stripe)
// ─────────────────────────────────────────────────────────────────

/**
 * ÉTUDIANT — S'inscrire à une formation et valider l'accès immédiatement (mode test)
 * Corps de la requête : { courseId }
 */
export const simulatePayment = async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user?.id;

  if (!courseId) {
    return res.status(400).json({ message: "L'ID de la formation est requis." });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Formation introuvable." });

    // Vérifier si l'étudiant est déjà inscrit
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } }
    });

    let enrollment;
    if (existingEnrollment) {
      // Réactiver l'accès si déjà inscrit
      enrollment = await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { accessStatus: 'ACTIVE' }
      });
    } else {
      const classroom = await prisma.classroom.findFirst({ where: { courseId } });
      if (!classroom) {
        return res.status(400).json({ message: "Cette formation n'a pas encore de classe ouverte." });
      }

      enrollment = await prisma.$transaction(async (tx) => {
        const enroll = await tx.enrollment.create({
          data: {
            studentId,
            courseId,
            classroomId: classroom.id,
            accessStatus: 'ACTIVE',
            paymentPlan: 'FULL'
          }
        });

        const lessons = await tx.moduleLesson.findMany({ where: { courseId }, select: { id: true } });
        if (lessons.length > 0) {
          await tx.progress.createMany({
            data: lessons.map(l => ({ studentId, lessonId: l.id, isCompleted: false })),
            skipDuplicates: true
          });
        }
        return enroll;
      });
    }

    return res.status(200).json({
      message: `Inscription à "${course.title}" validée avec succès ! Accès activé immédiatement.`,
      enrollment,
      course: { id: course.id, title: course.title, price: course.price }
    });
  } catch (error) {
    console.error("[SIMULATE] Erreur :", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Vous êtes déjà inscrit à cette formation." });
    }
    return res.status(500).json({ message: "Erreur lors de la simulation du paiement." });
  }
};

