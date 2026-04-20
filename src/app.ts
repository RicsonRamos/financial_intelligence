import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import transactionRoutes from './api/routes/transaction.routes.js';
import analyticsRoutes from './api/routes/analytics.routes.js';

const app = express();

// 1. Core Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// 2. Route Definitions
app.use('/transactions', transactionRoutes);
app.use('/analytics', analyticsRoutes);

// Index & Health
app.get('/', (req, res) => {
  res.json({ 
    project: 'Financial Intelligence Core', 
    version: '1.0.0', 
    status: 'OPERATIONAL' 
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 3. Standardized Global Error Handler
// Ensures all failures return a consistent JSON structure { error: { code, message, details } }
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] Middleware caught exception:', err.message);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      details: err.details || {}
    }
  });
});

export default app;
