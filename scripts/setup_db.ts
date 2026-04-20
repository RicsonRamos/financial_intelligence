import { pool } from '../src/db/index.js';
import { sql } from 'slonik';
import fs from 'fs';
import path from 'path';

async function setup() {
  console.log('--- Initializing Database ---');

  try {
    const migrationPath = path.resolve(
      process.cwd(),
      'src',
      'db',
      'migrations',
      '001_initial_schema.sql'
    );

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements since Slonik forbids multi-statement queries
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await pool.transaction(async (t) => {
      console.log('--- Resetting Database Schema ---');
      const resetStatements = [
        'DROP SCHEMA public CASCADE',
        'CREATE SCHEMA public'
      ];

      for (const statement of resetStatements) {
        const parts = [statement] as any;
        parts.raw = [statement];
        Object.freeze(parts);
        Object.freeze(parts.raw);
        await t.query(sql.unsafe(parts as unknown as TemplateStringsArray));
      }

      console.log('--- Applying Migrations ---');
      for (const statement of statements) {
        // Satisfying Slonik's strict check for template literals
        const parts = [statement] as any;
        parts.raw = [statement];
        Object.freeze(parts);
        Object.freeze(parts.raw);
        await t.query(sql.unsafe(parts as unknown as TemplateStringsArray));
      }

      console.log('--- Seeding Default Categories ---');
      const defaultCategories = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Other'];
      for (const categoryName of defaultCategories) {
        console.log(`[SEED] Seeding category: ${categoryName}`);
        const seedSql = `INSERT INTO categories (name, user_id) VALUES ('${categoryName}', NULL) ON CONFLICT (name, user_id) DO NOTHING`;
        const p = [seedSql] as any;
        p.raw = [seedSql];
        Object.freeze(p);
        Object.freeze(p.raw);
        await t.query(sql.unsafe(p as unknown as TemplateStringsArray));
      }
    });

    console.log('[SUCCESS] Database initialized and seeded.');
  } catch (error) {
    console.error('[ERROR] Failed to setup database:');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setup().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});