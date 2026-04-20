import { pool } from '../db/index.js';
import { sql, DatabasePool, DatabasePoolConnection, DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

type Connection = DatabasePool | DatabasePoolConnection | DatabaseTransactionConnection;
import { classifierService } from './classifier.service.js';
import { CreateTransactionDTO, UpdateTransactionDTO, Transaction } from '../types/index.js';

/**
 * Service handling transactional lifecycle.
 * Focus: Multi-tenant security and automated data enrichment.
 */
export class TransactionService {
  /**
   * Creates a new transaction.
   * Logical Chain: Provided Category -> Classifier Heuristic -> 'Other' Default.
   */
  async create(data: CreateTransactionDTO, userId: string, connection: Connection = pool): Promise<Transaction> {
    // 1. Category Resolution Fallback
    let categoryId = data.category_id;

    if (!categoryId && data.description) {
      categoryId = (await classifierService.classify(data.description, userId, connection)) || undefined;
    }
    
    if (!categoryId) {
      categoryId = await classifierService.getDefaultCategoryId(userId, connection);
    }

    // 2. Atomic Insertion with Real-time Anomaly Detection
    // We calculate the Z-Score based on the user's historical average for THIS category.
    // Category 'Salary' is excluded from anomaly detection to avoid polluting stats with expected high value income.
    const transaction = await connection.one(sql.type(z.any())`
      WITH category_info AS (
        SELECT name FROM categories WHERE id = ${categoryId}
      ),
      stats AS (
        SELECT 
          COALESCE(AVG(amount), ${data.amount}) as avg_amt,
          COALESCE(STDDEV(amount), 0) as std_amt
        FROM transactions 
        WHERE user_id = ${userId} AND category_id = ${categoryId}
      )
      INSERT INTO transactions (
        user_id, account_id, category_id, amount, description, transaction_date, z_score, is_anomaly
      ) 
      SELECT 
        ${userId}, ${data.account_id}, ${categoryId}, ${data.amount}, ${data.description || null}, 
        ${data.transaction_date || sql.fragment`CURRENT_DATE`},
        CASE 
          WHEN ci.name = 'Salary' OR stats.std_amt = 0 THEN 0 
          ELSE (ABS(${data.amount} - stats.avg_amt) / stats.std_amt)
        END as calculated_z,
        CASE 
          WHEN ci.name != 'Salary' AND stats.std_amt > 0 AND (ABS(${data.amount} - stats.avg_amt) / stats.std_amt) > 3 THEN TRUE 
          ELSE FALSE 
        END as flagged_anomaly
      FROM stats, category_info ci
      RETURNING *, amount::numeric(15,2) as amount
    `);

    return transaction as Transaction;
  }

  /**
   * Updates an existing transaction (Audit Correction).
   * This generates the 'labeled data' needed for Day 5 ML improvements.
   */
  async update(id: string, data: UpdateTransactionDTO, userId: string, connection: Connection = pool): Promise<Transaction | null> {
    // 1. Get current state to detect changes
    const current = await connection.maybeOne(sql.type(z.object({ category_id: z.string() }))`
      SELECT category_id FROM transactions WHERE id = ${id} AND user_id = ${userId}
    `);

    if (!current) return null;

    // 2. Atomic Update
    const transaction = await connection.one(sql.type(z.any())`
      UPDATE transactions
      SET 
        category_id = COALESCE(${data.category_id || null}, category_id),
        amount = COALESCE(${data.amount || null}, amount),
        description = COALESCE(${data.description || null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *, amount::numeric(15,2) as amount
    `);

    // 3. Log correction if category changed (Feedback Loop)
    if (data.category_id && data.category_id !== current.category_id) {
      await connection.query(sql.type(z.any())`
        INSERT INTO category_audit_logs (transaction_id, user_id, old_category_id, new_category_id, correction_source)
        VALUES (${id}, ${userId}, ${current.category_id}, ${data.category_id}, 'user')
      `);
    }

    return transaction as Transaction;
  }
}

export const transactionService = new TransactionService();
