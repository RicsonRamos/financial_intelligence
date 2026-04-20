import { createPool, sql, createTypeParserPreset } from 'slonik';
import { z } from 'zod';
import { types } from 'pg';

// Defense-in-depth: Set global pg parser to return raw strings for NUMERIC (OID 1700)
types.setTypeParser(1700, (val) => val);

// Database connection string
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres_password@db:5432/financial_intelligence';

// Slonik v48+ uses its own type parsers list. We MUST override the 'numeric' parser
// here to prevent it from using parseFloat() by default.
export const pool = await createPool(DATABASE_URL, {
  typeParsers: [
    ...createTypeParserPreset().filter((p) => p.name !== 'numeric'),
    {
      name: 'numeric',
      parse: (val) => val,
    },
  ],
});

// Ubiquitous Language Helper: Enforce string with exactly 2 decimal places
export const MoneySchema = z
  .string()
  .regex(/^-?\d+(\.\d{2})$/);

/**
 * Ensures strict multi-tenant isolation by user_id
 */
export const withUserIsolation = (userId: string) => {
  return sql.fragment`user_id = ${userId}`;
};