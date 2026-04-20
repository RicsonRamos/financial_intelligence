# CLAUDE.md - Ordem de Serviço Arquitetural
# Projeto: Sistema Analítico Financeiro (Motor SQL Puro)

## 1. Premissas de Isolamento (AI Jail)
- O agente opera exclusivamente dentro do container Docker (Ubuntu/Node.js).
- Proibido acesso a pastas fora do `/workspace`.
- Toda execução de comando terminal (`execute_command`) exige confirmação explícita do usuário.
- Não armazenar segredos (.env) no contexto; utilizar apenas referências a variáveis de ambiente.

## 2. Stack Tecnológica & Restrições Rígidas
- **Banco de Dados:** PostgreSQL 16+.
- **Backend:** Node.js (Runtime) / TypeScript. Sem abstrações de alto nível.
- **Frontend:** Next.js (Foco em dados, UI minimalista).
- **Acesso ao Banco:** PROIBIDO o uso de ORMs (Prisma, Sequelize, etc.).
- **Lógica de Dados:** OBRIGATÓRIO o uso de SQL puro via biblioteca `slonik`.
- **Padrão de Código:** Camada de repositório focada em queries brutas (CTE, Window Functions).
- **ML Layer:** Heurística inicial em Node.js; suporte a Python no container para prontidão.

## 3. Modelagem de Dados (Rigor 3FN & Financeiro)
- **Moeda:** PROIBIDO o uso de FLOAT/REAL. Usar `DECIMAL(15,2)` para evitar erros de arredondamento.
- **Identificadores:** Usar `UUID v4` para PKs para garantir segurança em ambiente multi-tenant.
- **Integridade:** Chaves estrangeiras obrigatórias e índices em colunas de busca (user_id, transaction_date).
- **Rastreabilidade:** Todas as tabelas devem conter `created_at` e `updated_at`.
- **Segurança:** Implementar lógica de isolamento por `user_id` em todas as queries.

## 4. Estrutura de Diretórios
- `/src/db/migrations`: Scripts SQL puros para definição de esquema.
- `/src/db/queries`: Arquivos .sql ou módulos TS contendo CTEs e Window Functions analíticas.
- `/src/services`: Lógica de integração e ML leve (categorização).
- `/src/api`: Endpoints FastAPI/Node.js.

## 5. Workflow de Desenvolvimento (Anti-Vibe Coding)
1. **Contrato:** Definir o esquema SQL antes de qualquer lógica de aplicação.
2. **Teste (TDD):** Escrever testes de integração que validem a query SQL contra um banco de teste antes de implementar a rota.
3. **Implementação:** Desenvolver a função apenas após o teste falhar por ausência de código.
4. **Revisão:** Analisar o `EXPLAIN ANALYZE` de queries complexas para garantir performance.

## 6. Lógica Analítica Obrigatória
- **Forecasting:** Implementado via SQL (Médias Móveis/Regressão) ou processamento em service layer, persistido em tabelas de `forecasts`.
- **Anomalias:** Queries baseadas em desvio padrão para detectar gastos fora da curva.
- **Agregações:** Uso de Materialized Views para o Dashboard para reduzir carga transacional.

## 7. Workflow Dia 3 - Testes de Integração (Slonik + Vitest)
- **Setup:** Conectar ao banco `finance_test` via Slonik.
- **Esquema Automático:** O script de teste deve aplicar as migrações automaticamente antes da execução.
- **Isolamento:** OBRIGATÓRIO utilizar `transaction.rollback()` (usando o erro controlado `ROLLBACK`) para manter o estado do banco limpo entre testes.
- **Prioridade 1 (Esquema):** Validar restrições de `NOT NULL`, `UNIQUE` (user_id/email) e tipos `DECIMAL`.
- **Prioridade 2 (Multi-tenancy):** Testar obrigatoriamente se uma query de um `user_id` retorna 0 registros de outro `user_id`.
- **Prioridade 3 (Matemática):** Testar Window Functions de saldo acumulado com massa de dados variada (entradas/saídas no mesmo dia).
- **Proibição:** Não avançar para o Dia 4 enquanto a cobertura de lógica SQL não estiver em 100%. Mocks de banco de dados são estritamente PROIBIDOS.

---
**Linguagem Ubíqua:**
- **Saldo Real:** Soma de transações efetivadas até o momento $t$.
- **Saldo Previsto:** Projeção baseada em transações recorrentes e média de gastos variáveis.
- **Drift de Orçamento:** Diferença percentual entre Budget e Real.
- **Burn Rate:** Velocidade média diária de consumo do saldo disponível.

## 8. Workflow Dia 5 - Inteligência e Auditoria
- **Anomalias:** OBRIGATÓRIO usar Window Functions para calcular média móvel e desvio padrão diretamente no PostgreSQL.
- **Z-Score:** Implementar por categoria (partition by category_id) filtrando outliers > 3.0. Ignorar categoria 'Salary'.
- **Integração Python:** Criar um endpoint `/analytics/train` que dispara o script Python no `venv` (`/home/node/venv/bin/python`) para processar o mapeamento de categorias.
- **Rigor de Dados:** Detecção híbrida: Gravação em tempo real no `TransactionService` + Recalibragem em batch no `AnalyticsService`.
- **Feedback Loop:** Toda correção manual de categoria deve disparar um registro em `category_audit_logs` para futura recalibração da heurística/ML.
- **Audit Logs:** Registrar `transaction_id`, `old_category_id`, `new_category_id`, `user_id` e a fonte da correção.

## 9. Workflow Dia 6 - Interface de Saída (UX de Dados)
- **Prioridade:** Visualização de dados diagnósticos sobre estética pura.
- **Next.js:** Usar App Router no diretório `/src/frontend`.
- **Componentes:** Criar 'Metric Cards' para Saldo, Burn Rate e Forecast com Tooltips de "Explicar Cálculo".
- **Gráficos:** Implementar 'Saldo Acumulado vs Previsto' usando Recharts (leves).
- **Interatividade:** Lista de Anomalias com modal de correção para alimentar o loop de feedback.
- **Sincronização:** Toda correção na UI deve disparar um update no backend e atualizar o `category_audit_logs`.


