import { describe, it, expect } from 'vitest';
import { sql } from 'slonik';
import { z } from 'zod';
import { classifierService } from '../services/classifier.service.js';
import { transactionService } from '../services/transaction.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { runInJailTransaction } from './helpers.js';

describe('Day 4: Domain & Service Layer Integration', () => {
  
  describe('TransactionClassifier', () => {
    it('Deve identificar "Uber extra ride" como Categoria Transport', async () => {
      await runInJailTransaction(async (t) => {
        const userId = '00000000-0000-0000-0000-000000000001';
        const categoryId = await classifierService.classify('Uber extra ride', userId, t);
        
        const categoryName = await t.oneFirst(sql.type(z.string())`
          SELECT name FROM categories WHERE id = ${categoryId}
        `);
        
        expect(categoryName).toBe('Transport');
      });
    });

    it('Deve identificar "iFood Burger" como Categoria Food', async () => {
      await runInJailTransaction(async (t) => {
        const userId = '00000000-0000-0000-0000-000000000001';
        const categoryId = await classifierService.classify('iFood Burger Dinner', userId, t);
        
        const categoryName = await t.oneFirst(sql.type(z.string())`
          SELECT name FROM categories WHERE id = ${categoryId}
        `);
        
        expect(categoryName).toBe('Food');
      });
    });

    it('Deve priorizar categoria personalizada do usuário sobre o sistema', async () => {
      await runInJailTransaction(async (t) => {
        const userId = '00000000-0000-0000-0000-000000000001';
        
        // Criar usuário antes para satisfazer a constraint de user_id
        await t.query(sql.type(z.any())`INSERT INTO users (id, email) VALUES (${userId}, 'priority@test.com')`);

        // Criar categoria 'Transport' customizada do usuário
        await t.query(sql.type(z.any())`
          INSERT INTO categories (name, user_id) VALUES ('Transport', ${userId})
        `);
        
        const categoryId = await classifierService.classify('Uber', userId, t);
        
        const result = await t.one(sql.type(z.any())`
          SELECT user_id FROM categories WHERE id = ${categoryId}
        `);
        
        // NULLS LAST no ORDER BY deve ter trazido a do usuário (não a NULL)
        expect(result.user_id).toBe(userId);
      });
    });
  });

  describe('TransactionService', () => {
    it('Deve criar transação com classificação automática quando category_id é nulo', async () => {
      await runInJailTransaction(async (t) => {
        const userId = '00000000-0000-0000-0000-000000000002';
        // Setup Account
        await t.query(sql.type(z.any())`INSERT INTO users (id, email) VALUES (${userId}, 'serv@test.com')`);
        const accId = await t.oneFirst(sql.type(z.string())`
          INSERT INTO accounts (user_id, name, type) VALUES (${userId}, 'Main', 'CASH') RETURNING id
        `);

        const tx = await transactionService.create({
          account_id: accId,
          amount: 150.00,
          description: 'Uber to work'
        }, userId, t);

        const catName = await t.oneFirst(sql.type(z.string())`
          SELECT name FROM categories WHERE id = ${tx.category_id}
        `);

        expect(catName).toBe('Transport');
      });
    });
  });

  describe('AnalyticsService - Forecast (Anti-Outlier)', () => {
    it('Deve calcular forecast mesmo com lacunas de dias (generate_series)', async () => {
      await runInJailTransaction(async (t) => {
        const userId = '00000000-0000-0000-0000-000000000003';
        await t.query(sql.type(z.any())`INSERT INTO users (id, email) VALUES (${userId}, 'forecast@test.com')`);
        const accId = await t.oneFirst(sql.type(z.string())`
          INSERT INTO accounts (user_id, name, type) VALUES (${userId}, 'Main', 'CASH') RETURNING id
        `);
        const catId = await t.oneFirst(sql.type(z.string())`SELECT id FROM categories LIMIT 1`);

        // Apenas 2 transações em 30 dias
        await t.query(sql.type(z.any())`
          INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_date)
          VALUES 
            (${userId}, ${accId}, ${catId}, 1000.00, CURRENT_DATE - INTERVAL '10 days'),
            (${userId}, ${accId}, ${catId}, 2000.00, CURRENT_DATE - INTERVAL '20 days')
        `);

        const forecast = await analyticsService.getForecast(userId, t);
        
        expect(forecast).toHaveLength(30);
        // O burn rate médio deve ser (1000 + 2000) / 30 dias = 100/dia.
        // Em 30 dias projetados, deve crescer 3000.
        const lastDay = forecast[29];
        const initialBalance = 3000;
        const projectedGrowth = 100 * 30;
        expect(parseFloat(lastDay.projected_balance)).toBeCloseTo(initialBalance + projectedGrowth, 0);
      });
    });
  });
});
