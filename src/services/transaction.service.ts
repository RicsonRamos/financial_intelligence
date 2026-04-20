import { pool } from '../db/index.js';
import { sql } from 'slonik';
import { z } from 'zod';
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
  async create(data: CreateTransactionDTO, userId: string): Promise<Transaction> {
    // 1. Category Resolution Fallback
    let categoryId = data.category_id;

    if (!categoryId && data.description) {
      categoryId = (await classifierService.classify(data.description, userId)) || undefined;
    }

    if (!categoryId) {
      categoryId = await classifierService.getDefaultCategoryId(userId);
    }

    // 2. Atomic Insertion
    // Note: We use explicit column casting for amount to ensure consistency with our decimal precision rules.
    const transaction = await pool.one(sql.type(z.any())`
      INSERT INTO transactions (
        user_id, 
        account_id, 
        category_id, 
        amount, 
        description, 
        transaction_date
      ) VALUES (
        ${userId},
        ${data.account_id},
        ${categoryId},
        ${data.amount},
        ${data.description || null},
        ${data.transaction_date || sql`CURRENT_DATE`}
      )
      RETURNING *, amount::numeric(15,2) as amount
    `);

    return transaction as Transaction;
  }

  /**
   * Updates an existing transaction (Audit Correction).
   * This generates the 'labeled data' needed for Day 5 ML improvements.
   */
  async update(id: string, data: UpdateTransactionDTO, userId: string): Promise<Transaction | null> {
    const transaction = await pool.maybeOne(sql.type(z.any())`
      UPDATE transactions
      SET 
        category_id = COALESCE(${data.category_id || null}, category_id),
        amount = COALESCE(${data.amount || null}, amount),
        description = COALESCE(${data.description || null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *, amount::numeric(15,2) as amount
    `);

    return transaction as Transaction || null;
  }
}

export const transactionService = new TransactionService();
