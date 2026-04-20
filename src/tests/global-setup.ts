import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export async function setup() {
  const rawConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@db:5432/finance_test';
  
  // Force the database name to 'finance_test' for safety and consistency
  const connectionString = rawConnectionString.replace(/\/[^/]+$/, '/finance_test');
  const targetDb = 'finance_test';
  
  console.log(`\n--- Test Global Setup: Ensuring Consistency on ${targetDb} ---`);
  
  // 1. Ensure the finance_test database exists
  const adminConnectionString = rawConnectionString.replace(/\/[^/]+$/, '/postgres');
  const adminClient = new Client({ connectionString: adminConnectionString });
  
  try {
    await adminClient.connect();
    const dbCheck = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    
    if (dbCheck.rowCount === 0) {
      console.log(`[INIT] Creating database: ${targetDb}`);
      await adminClient.query(`CREATE DATABASE ${targetDb}`);
    }
  } catch (error) {
    console.error('[ERROR] Failed to ensure existence of test database:', error);
    throw error;
  } finally {
    await adminClient.end();
  }

  // 2. Clear schema and apply migrations
  const client = new Client({ connectionString });
  
  try {
    await client.connect();

    // Safety Check: Never run DROP SCHEMA public CASCADE on a non-test database
    if (!client.database?.includes('test')) {
      throw new Error(`CRITICAL SAFETY VIOLATION: Attempted to reset non-test database: ${client.database}`);
    }
    
    // Fresh Reset for test database
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    
    // Read all migration files in order
    const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`[INIT] Applying ${migrationFiles.length} migrations...`);
    for (const file of migrationFiles) {
      console.log(`[MIGRATION] Running ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
    }
    console.log('[SUCCESS] All migrations applied to finance_test.');
    
    // 3. Seeding Default Categories (Essential for Day 4 classifier tests)
    console.log('[INIT] Seeding default categories...');
    const defaultCategories = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Other'];
    for (const categoryName of defaultCategories) {
      await client.query('INSERT INTO categories (name, user_id) VALUES ($1, NULL) ON CONFLICT (name, user_id) DO NOTHING', [categoryName]);
    }
    console.log('[SUCCESS] Default categories seeded.');
    
  } catch (error) {
    console.error('[ERROR] Failed to setup test database schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}
