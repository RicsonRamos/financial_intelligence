import { pool } from '../src/db/index.js';
import { sql } from 'slonik';
import { z } from 'zod';

async function seed() {
  console.log('--- Seeding Mock Budgets for Day 6 ---');
  
  const userId = '00000000-0000-0000-0000-000000000001';
  
  try {
    // 1. Get Categories
    const categories = await pool.any(sql.type(z.object({ id: z.string(), name: z.string() }))`
      SELECT id, name FROM categories WHERE name IN ('Food', 'Transport', 'Utilities')
    `);

    await pool.transaction(async (t) => {
      for (const cat of categories) {
        let amount = 1000.00;
        if (cat.name === 'Transport') amount = 300.00;
        if (cat.name === 'Utilities') amount = 500.00;

        await t.query(sql.type(z.any())`
          INSERT INTO budgets (user_id, category_id, target_amount, period_start, period_end)
          VALUES (
            ${userId}, 
            ${cat.id}, 
            ${amount}, 
            CURRENT_DATE - INTERVAL '15 days', 
            CURRENT_DATE + INTERVAL '15 days'
          )
          ON CONFLICT DO NOTHING
        `);
        console.log(`[SEED] Budget created for ${cat.name}: R$ ${amount}`);
      }
    });

    console.log('[SUCCESS] Mock budgets seeded.');
  } catch (err) {
    console.error('[ERROR]', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
