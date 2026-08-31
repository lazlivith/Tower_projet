import express from 'express';
import { createQuote, getQuotes, updateQuoteStatus } from '../controllers/quote.controller.js';
import { requireAuth, checkGlobalActivation } from '../middlewares/auth.middleware.js';
import { restrictToRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createQuoteSchema, updateQuoteStatusSchema } from '../validators/quote.validator.js';

const router = express.Router();

// Public — avec validation
router.post('/request', validate({ body: createQuoteSchema }), createQuote);

// Restreint (MANAGER)
router.use(requireAuth, checkGlobalActivation, restrictToRole('MANAGER'));
router.get('/', getQuotes);
router.patch('/:id/status', validate({ body: updateQuoteStatusSchema }), updateQuoteStatus);

export default router;
