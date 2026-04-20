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

/**
 * GET /analytics/burn-rate
 */
router.get('/burn-rate', authMiddleware, async (req, res, next) => {
  try {
    const result = await analyticsService.getBurnRate(req.userId);
    res.json({ 
      value: result, 
      logic: "AVG(ABS(amount)) OVER (30 days) WHERE amount < 0" 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/drift
 */
router.get('/drift', authMiddleware, async (req, res, next) => {
  try {
    const result = await analyticsService.getBudgetDrift(req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/anomalies
 */
router.get('/anomalies', authMiddleware, async (req, res, next) => {
  try {
    const result = await analyticsService.getAnomalies(req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
