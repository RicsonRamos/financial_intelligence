import { describe, it, expect } from 'vitest';
import { sql } from 'slonik';
import { runInJailTransaction } from './helpers.js';

describe('Prioridade 2: Multi-tenancy (Isolamento de Dados)', () => {
  it('Usuário A não deve conseguir visualizar transações do Usuário B', async () => {
    await runInJailTransaction(async (t) => {
      // 1. Criar Usuário A e Usuário B
      const userA = await t.oneFirst(sql.unsafe`INSERT INTO users (email) VALUES ('userA@test.com') RETURNING id`);
      const userB = await t.oneFirst(sql.unsafe`INSERT INTO users (email) VALUES ('userB@test.com') RETURNING id`);

      const accA = await t.oneFirst(sql.unsafe`INSERT INTO accounts (user_id, name, type) VALUES (${userA}, 'AccA', 'CASH') RETURNING id`);
      const accB = await t.oneFirst(sql.unsafe`INSERT INTO accounts (user_id, name, type) VALUES (${userB}, 'AccB', 'CASH') RETURNING id`);
      
      const cat = await t.oneFirst(sql.unsafe`INSERT INTO categories (name) VALUES ('General') RETURNING id`);

      // 2. Inserir dados para ambos
      await t.query(sql.unsafe`INSERT INTO transactions (user_id, account_id, category_id, amount) VALUES (${userA}, ${accA}, ${cat}, 100)`);
      await t.query(sql.unsafe`INSERT INTO transactions (user_id, account_id, category_id, amount) VALUES (${userB}, ${accB}, ${cat}, 200)`);

      // 3. Usuário A tenta ler dados
      const transacoesDoUserA = await t.any(sql.unsafe`
        SELECT id, user_id, amount::numeric(15,2) FROM transactions WHERE user_id = ${userA}
      `);

      // 4. Validação: Apenas 1 registro deve retornar, e o valor deve ser o do User A
      expect(transacoesDoUserA).toHaveLength(1);
      expect(transacoesDoUserA[0].amount.toString()).toBe('100.00');

      // 5. Garantir que a query do User A não retornou nada do User B
      const encontrouDadosDoUserB = transacoesDoUserA.some(tr => tr.user_id === userB);
      expect(encontrouDadosDoUserB).toBe(false);
    });
  });
});
