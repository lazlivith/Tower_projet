import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const checkoutSchema = z.object({
  courseId: z.string().regex(UUID_REGEX, 'courseId doit être un UUID valide.'),
  paymentMethod: z.enum(['STRIPE', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE'], {
    errorMap: () => ({ message: 'Méthode de paiement invalide (STRIPE, MOBILE_MONEY, VIREMENT, CHEQUE).' })
  }),
  paymentPlan: z.enum(['FULL', 'THREE_INSTALLMENTS'], {
    errorMap: () => ({ message: 'Plan de paiement invalide (FULL, THREE_INSTALLMENTS).' })
  }),
}).strict();
