import { describe, it, expect } from 'vitest';
import { sql } from 'slonik';
import { runInJailTransaction } from './helpers.js';

describe('Prioridade 3: Matemática Financeira e Window Functions', () => {
  it('Deve calcular o saldo acumulado corretamente (Running Total) usando SQL', async () => {
    await runInJailTransaction(async (t) => {
      // 1. Setup Data
      const userId = await t.oneFirst(sql.unsafe`INSERT INTO users (email) VALUES ('math@test.com') RETURNING id`);
      const accId = await t.oneFirst(sql.unsafe`INSERT INTO accounts (user_id, name, type) VALUES (${userId}, 'Bank', 'CASH') RETURNING id`);
      const catId = await t.oneFirst(sql.unsafe`INSERT INTO categories (name) VALUES ('Finances') RETURNING id`);

      // 2. Inserir 10 transações variadas (In/Out) com datas específicas
      const entries = [
        { date: '2026-04-01', amount: 1000.00 }, // Saldo: 1000
        { date: '2026-04-02', amount: -200.50 }, // Saldo: 799.50
        { date: '2026-04-02', amount: -50.00  }, // Saldo: 749.50
        { date: '2026-04-05', amount: 1500.00 }, // Saldo: 2249.50
        { date: '2026-04-10', amount: -100.00 }, // Saldo: 2149.50
        { date: '2026-04-10', amount: -100.00 }, // Saldo: 2049.50
        { date: '2026-04-15', amount: 500.00  }, // Saldo: 2549.50
        { date: '2026-04-20', amount: -1200.00}, // Saldo: 1349.50
        { date: '2026-04-25', amount: -49.50  }, // Saldo: 1300.00
        { date: '2026-04-30', amount: 700.00  }, // Saldo: 2000.00
      ];

      for (const entry of entries) {
        await t.query(sql.unsafe`
          INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_date) 
          VALUES (${userId}, ${accId}, ${catId}, ${entry.amount}, ${entry.date})
        `);
      }

      // 3. Query de Saldo Acumulado (Motor Analítico)
      // Usamos SUM() OVER (ORDER BY date, id) para garantir determinismo em transações no mesmo dia
      const result = await t.any(sql.unsafe`
        SELECT 
          transaction_date,
          amount,
          SUM(amount) OVER (ORDER BY transaction_date, created_at)::numeric(15,2) as running_balance
        FROM transactions
        WHERE user_id = ${userId}
        ORDER BY transaction_date ASC, created_at ASC
      `);

      // 4. Assert: Validar o saldo final da última transação
      const lastEntry = result[result.length - 1];
      expect(lastEntry.running_balance.toString()).toBe('2000.00');

      // Validar um ponto intermediário (ex: 2026-04-02 após segunda transação do dia)
      // No nosso loop, 799.50 -> 749.50
      const secondDayLastTrans = result[2]; 
      expect(secondDayLastTrans.running_balance.toString()).toBe('749.50');
    });
  });
});
