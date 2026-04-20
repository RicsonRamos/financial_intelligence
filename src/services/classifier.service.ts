import { pool } from '../db/index.js';
import { sql } from 'slonik';
import { z } from 'zod';

export interface Heuristic {
  pattern: RegExp;
  category: string;
}

/**
 * Solid initial heuristics for financial classification.
 * These cover primary spending groups for most retail users.
 */
const DEFAULT_HEURISTICS: Heuristic[] = [
  { pattern: /uber|99|taxi/i, category: 'Transport' },
  { pattern: /ifood|restaurant|pizza|mcdonalds|burger|kfc/i, category: 'Food' },
  { pattern: /netflix|spotify|prime|steam|playstation|xbox/i, category: 'Entertainment' },
  { pattern: /energia|luz|agua|light|enel|sabesp/i, category: 'Utilities' },
  { pattern: /aluguel|condominio|rent/i, category: 'Housing' },
  { pattern: /farmacia|hospital|unimed|droga|medico/i, category: 'Health' }
];

export class TransactionClassifier {
  /**
   * Attempts to classify a transaction description into a Category ID.
   * Priority logic: Matches Regex -> Finds Category ID (User-specific PREFERRED over System-default).
   */
  async classify(description: string, userId: string): Promise<string | null> {
    if (!description) return null;

    // 1. Heuristic Matching
    const match = DEFAULT_HEURISTICS.find(h => h.pattern.test(description));
    if (!match) return null;

    // 2. Hierarchical Database Lookup
    // We order by user_id NULLS LAST so that if the user created their own 'Food' category, 
    // it will be returned before the system default.
    try {
      const categoryId = await pool.maybeOneFirst(sql.type(z.string())`
        SELECT id 
        FROM categories 
        WHERE name = ${match.category} 
        AND (user_id IS NULL OR user_id = ${userId})
        ORDER BY user_id NULLS LAST
        LIMIT 1
      `);

      return categoryId || null;
    } catch (error) {
      console.error('[CLASSIFIER] Database lookup failed:', error);
      return null;
    }
  }

  /**
   * Returns a safe default category ID ('Other') for a user.
   */
  async getDefaultCategoryId(userId: string): Promise<string> {
    const id = await pool.oneFirst(sql.type(z.string())`
      SELECT id FROM categories 
      WHERE name = 'Other' 
      AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY user_id NULLS LAST
      LIMIT 1
    `);
    return id;
  }
}

export const classifierService = new TransactionClassifier();
