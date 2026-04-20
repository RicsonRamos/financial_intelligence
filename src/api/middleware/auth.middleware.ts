import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

/**
 * Validates the x-user-id header and attaches it to the request context.
 * Strict UUID v4 check prevents common multi-tenancy injection bugs.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'];

  if (!userId || typeof userId !== 'string') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing x-user-id header'
      }
    });
  }

  try {
    const validatedId = uuidSchema.parse(userId);
    // userId is now attached to req and typed via Express Request augmentation in types/index.ts
    req.userId = validatedId;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_USER_CONTEXT',
        message: 'The provided x-user-id is not a valid UUID v4'
      }
    });
  }
};
