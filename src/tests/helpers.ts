import { pool } from '../db/index.js';
import { DatabaseTransactionConnection } from 'slonik';

/**
 * Runs a block of code inside a Slonik transaction that ALWAYS rolls back.
 * Use this in tests to ensure database state remains clean.
 */
export const runInJailTransaction = async (
  testFn: (t: DatabaseTransactionConnection) => Promise<void>
) => {
  try {
    await pool.transaction(async (t) => {
      await testFn(t);
      // Force a rollback by throwing a specific internal error
      throw new Error('ROLLBACK');
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ROLLBACK') {
      // Expected rollback, do nothing
      return;
    }
    throw error;
  }
};
