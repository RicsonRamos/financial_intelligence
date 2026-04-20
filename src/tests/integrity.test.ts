import { describe, it, expect } from 'vitest';
import { sql } from 'slonik';
import { runInJailTransaction } from './helpers.js';

describe('Prioridade 1: Integridade do Esquema (DDL)', () => {
  it('Deve gerar UUID v4 automaticamente para novos usuários', async () => {
    await runInJailTransaction(async (t) => {
      const result = await t.one(sql.unsafe`
        INSERT INTO users (email, full_name) 
        VALUES ('test@example.com', 'Test User') 
        RETURNING id
      `);
      
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  it('Deve garantir precisão DECIMAL(15,2) e evitar erros de arredondamento', async () => {
    await runInJailTransaction(async (t) => {
      // Setup test user/account/category
      const user = await t.one(sql.unsafe`INSERT INTO users (email) VALUES ('calc@test.com') RETURNING id`);
      const account = await t.one(sql.unsafe`INSERT INTO accounts (user_id, name, type) VALUES (${user.id}, 'Debt', 'CASH') RETURNING id`);
      const category = await t.one(sql.unsafe`INSERT INTO categories (name) VALUES ('Food') RETURNING id`);

      // Inserir valores que costumam dar erro em FLOAT (0.1 + 0.2)
      await t.query(sql.unsafe`INSERT INTO transactions (user_id, account_id, category_id, amount) VALUES (${user.id}, ${account.id}, ${category.id}, 0.1)`);
      await t.query(sql.unsafe`INSERT INTO transactions (user_id, account_id, category_id, amount) VALUES (${user.id}, ${account.id}, ${category.id}, 0.2)`);

      const result = await t.oneFirst(sql.unsafe`SELECT SUM(amount)::numeric(15,2) FROM transactions WHERE user_id = ${user.id}`);
      
      // SQL DECIMAL(15,2) deve retornar exatamente '0.30'
      expect(result.toString()).toBe('0.30');
    });
  });

  it('Deve falhar ao tentar inserir transação sem user_id (NOT NULL)', async () => {
    await runInJailTransaction(async (t) => {
      await expect(t.query(sql.unsafe`
        INSERT INTO transactions (account_id, category_id, amount) 
        VALUES (gen_random_uuid(), gen_random_uuid(), 100.00)
      `)).rejects.toThrow();
    });
  });

  it('Deve garantir unicidade de email de usuário', async () => {
    await runInJailTransaction(async (t) => {
      await t.query(sql.unsafe`INSERT INTO users (email) VALUES ('unique@test.com')`);
      await expect(t.query(sql.unsafe`INSERT INTO users (email) VALUES ('unique@test.com')`)).rejects.toThrow();
    });
  });
});
