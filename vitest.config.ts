import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Ensure the database is ready before running tests
    globalSetup: ['./src/tests/global-setup.ts'],
    env: {
      // Point to the dedicated test database
      DATABASE_URL: 'postgresql://postgres:postgres_password@db:5432/finance_test'
    },
    include: ['src/tests/**/*.test.ts'],
  },
});
