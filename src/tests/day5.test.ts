import { describe, it, expect } from 'vitest';
import { sql } from 'slonik';
import { z } from 'zod';
import { transactionService } from '../services/transaction.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { runInJailTransaction } from './helpers.js';

describe('Day 5: Intelligence & Audit Integration', () => {
    
    describe('Anomaly Detection (Real-time Z-Score)', () => {
        it('Deve marcar transação como anomalia quando exceder 3 desvios padrão', async () => {
            await runInJailTransaction(async (t) => {
                const userId = '00000000-0000-0000-0000-000000000005';
                await t.query(sql.type(z.any())`INSERT INTO users (id, email) VALUES (${userId}, 'anomaly@test.com')`);
                const accId = await t.oneFirst(sql.type(z.string())`
                    INSERT INTO accounts (user_id, name, type) VALUES (${userId}, 'Main', 'CASH') RETURNING id
                `);
                const catId = await t.oneFirst(sql.type(z.string())`SELECT id FROM categories WHERE name = 'Food'`);

                // 1. Inserir massa de dados com leve variância (Média ~10)
                const amounts = [10.00, 11.00, 9.00, 10.50, 9.50];
                for (const amt of amounts) {
                    await transactionService.create({
                        account_id: accId,
                        amount: amt,
                        description: 'Normal lunch',
                        category_id: catId
                    }, userId, t);
                }

                // 2. Inserir anomalia (100.00)
                // Com 5 registros de 10, a média é 10 e o desvio é 0. 
                // Slonik/SQL handles stddev carefully.
                const anomalyTx = await transactionService.create({
                    account_id: accId,
                    amount: 200.00,
                    description: 'Extravagant Dinner',
                    category_id: catId
                }, userId, t);

                expect(anomalyTx.is_anomaly).toBe(true);
                expect(Number(anomalyTx.z_score)).toBeGreaterThan(3);
            });
        });

        it('Não deve marcar Salary como anomalia mesmo se for alta', async () => {
            await runInJailTransaction(async (t) => {
                const userId = '00000000-0000-0000-0000-000000000006';
                await t.query(sql.type(z.any())`INSERT INTO users (id, email) VALUES (${userId}, 'salary@test.com')`);
                const accId = await t.oneFirst(sql.type(z.string())`
                    INSERT INTO accounts (user_id, name, type) VALUES (${userId}, 'Main', 'CASH') RETURNING id
                `);
                
                // Forçar criação da categoria Salary se não existir (seeding handles it)
                const catId = await t.oneFirst(sql.type(z.string())`
                    INSERT INTO categories (name, user_id) VALUES ('Salary', NULL) 
                    ON CONFLICT (name, user_id) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                `);

                // Dados estáveis
                for (let i = 0; i < 3; i++) {
                    await transactionService.create({ account_id: accId, amount: 5000.00, category_id: catId }, userId, t);
                }

                const bigSalary = await transactionService.create({
                    account_id: accId,
                    amount: 50000.00,
                    category_id: catId
                }, userId, t);

                expect(bigSalary.is_anomaly).toBe(false);
                expect(Number(bigSalary.z_score)).toBe(0);
            });
        });
    });

    describe('Audit Logs (Recovery for ML)', () => {
        it('Deve registrar log de auditoria quando o usuário corrige a categoria', async () => {
            await runInJailTransaction(async (t) => {
                const userId = '00000000-0000-0000-0000-000000000007';
                await t.query(sql.type(z.any())`INSERT INTO users (id, email) VALUES (${userId}, 'audit@test.com')`);
                const accId = await t.oneFirst(sql.type(z.string())`
                    INSERT INTO accounts (user_id, name, type) VALUES (${userId}, 'Main', 'CASH') RETURNING id
                `);
                const catOther = await t.oneFirst(sql.type(z.string())`SELECT id FROM categories WHERE name = 'Other'`);
                const catFood = await t.oneFirst(sql.type(z.string())`SELECT id FROM categories WHERE name = 'Food'`);

                // 1. Criar transação classificada como 'Other'
                const tx = await transactionService.create({
                    account_id: accId,
                    amount: 50.00,
                    description: 'Unknown Pizza',
                    category_id: catOther
                }, userId, t);

                // 2. Corrigir para 'Food'
                await transactionService.update(tx.id, { category_id: catFood }, userId, t);

                // 3. Verificar se existe o log
                const log = await t.one(sql.type(z.any())`
                    SELECT * FROM category_audit_logs WHERE transaction_id = ${tx.id}
                `);

                expect(log.old_category_id).toBe(catOther);
                expect(log.new_category_id).toBe(catFood);
                expect(log.correction_source).toBe('user');
            });
        });
    });
});
