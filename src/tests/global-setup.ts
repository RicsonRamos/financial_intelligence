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
    
    // Read the primary migration file
    const migrationPath = path.join(process.cwd(), 'src', 'db', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Apply migration
    await client.query(sql);
    console.log('[SUCCESS] Schema applied to finance_test.');
    
  } catch (error) {
    console.error('[ERROR] Failed to setup test database schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}
