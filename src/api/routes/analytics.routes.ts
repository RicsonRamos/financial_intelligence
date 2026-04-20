import { Router } from 'express';
import { analyticsService } from '../../services/analytics.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /analytics/balance
 * Returns the accumulation history (Running Total).
 */
router.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const result = await analyticsService.getRunningBalance(req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/forecast
 * Returns a 30-day balance projection using robust calendar-aware SQL.
 */
router.get('/forecast', authMiddleware, async (req, res, next) => {
  try {
    const result = await analyticsService.getForecast(req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
