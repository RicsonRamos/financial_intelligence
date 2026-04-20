import { Router } from 'express';
import { transactionService } from '../../services/transaction.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /transactions
 * Creates a new financial record. Automatically classifies the category 
 * if not provided by the client.
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await transactionService.create(req.body, req.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /transactions/:id
 * Updates an existing transaction. Serves as the primary 'Correction' 
 * path for automated classification audits.
 */
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await transactionService.update(req.params.id, req.body, req.userId);
    if (!result) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found or unauthorized'
        }
      });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
