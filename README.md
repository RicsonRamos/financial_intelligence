# Financial Intelligence Core Analytical Engine

High-integrity financial intelligence and transaction analysis engine built with TypeScript, PostgreSQL 16, Slonik (pure SQL), and isolated development sandboxing (AI Jail).

---

## 1. Problema de Negócio e Contexto

Sistemas de contabilidade e análise transacional corporativa enfrentam dois riscos críticos comuns no desenvolvimento moderno de software:

1. **Inconsistência Transacional e Falhas de Ponto Flutuante:** O uso de tipos numéricos imprecisos (`FLOAT`/`REAL`) e a dependência cega de Object-Relational Mappers (ORMs) costumam mascarar queries N+1, planos de execução ineficientes e discrepâncias em centavos contábeis acumuladas ao longo de milhares de operações.
2. **Vulnerabilidade de Segurança em Agentes Autônomos:** Em ambientes de engenharia assistidos por ferramentas de IA, conceder acesso irrestrito ao sistema host impõe risco direto de exfiltração de chaves SSH, credenciais de produção e variáveis de ambiente confidenciais.

O objetivo do projeto foi construir um núcleo financeiro analítico de alta fidelidade que:
- Rejeita abstrações de ORM em prol de SQL puro tipado, auditável e com planos de execução determinísticos.
- Garante precisão monetária estrita em nível de banco de dados e aplicação.
- Implementa isolamento multi-tenant intransponível por design em cada query.
- Opera em contêineres endurecidos (*sandboxing* com AI Jail) para proteção contra exfiltração de segredos.

---

## 2. Processo e Racional das Escolhas Técnicas

### 2.1. SQL Puro com Slonik vs. ORMs de Alto Nível (Prisma / TypeORM)
- **Controle de Execução e Performance:** ORMs convencionais geram consultas automáticas que dificultam a inspeção de índices e o uso eficiente de Common Table Expressions (CTEs) e Window Functions para análises temporais complexas. A biblioteca `slonik` foi selecionada por garantir segurança nativa contra SQL Injection por meio de interpolação estrita de templates (`sql.unsafe` / `sql.fragment`) sem sacrificar o controle artesanal da query.
- **Auditoria com EXPLAIN ANALYZE:** Todas as consultas analíticas de agregação foram desenhadas para responder em tempo inferior a 200 milissegundos, com planos de execução otimizados por índices compostos em `(user_id, transaction_date)`.

### 2.2. Rigor Numérico e Modelagem 3FN
- **Precisão Contábil `DECIMAL(15,2)`:** É estritamente vedado o uso de representações de ponto flutuante binário (padrão IEEE 754) para moedas. O banco e a camada de validação em TypeScript (`zod`) utilizam exclusivamente tipos decimais de precisão fixa, prevenindo divergências de arredondamento em fluxos de caixa.
- **Segurança Multi-Tenant:** Toda operação de leitura, mutação ou relatório aplica filtragem obrigatória por `user_id` vinculado a chaves primárias em UUID v4, impedindo vazamento de dados entre clientes distintos.

### 2.3. Testes de Integração com Banco Real (Zero Mocks) vs. Mocks Unitários
- **Vitest contra PostgreSQL 16:** O comportamento de constraints relacionais (chaves estrangeiras, regras de unicidade e locks transacionais) não pode ser simulado de forma fidedigna por objetos mockados em memória. A suíte de testes do Vitest executa diretamente contra uma instância dedicada do banco (`finance_test`), aplicando migrações automáticas a cada ciclo de teste.

### 2.4. Arquitetura de Confinamento (AI Jail / Dev Container)
- **Sandboxing Endurecido:** O agente de desenvolvimento é estritamente confinado dentro do contêiner Docker isolado via `bubblewrap` e utilitários de sandbox, com acesso limitado estritamente ao diretório `/workspace` e restrição de acesso a chaves locais do sistema hospedeiro.

---

## 3. Resultados Atingidos e Métricas de Validação

### 3.1. Governança e Integridade Relacional
- **Conformidade em 3ª Forma Normal (3FN):** Esquema relacional estruturado com migrações SQL puras, garantindo integridade referencial completa e auditoria de datas (`created_at`, `updated_at`).
- **Validação de Schemas em Runtime:** 100% das entradas de API e payloads de transações interceptados e validados via Zod antes da execução em banco.

### 3.2. Capacidades Analíticas Integradas
- **Detecção de Anomalias Financeiras:** Queries analíticas com cálculo de desvio padrão e Z-Score móvel para identificação automática de transações atípicas.
- **Motor de Previsão de Gastos:** Algoritmos determinísticos de médias móveis executados diretamente na camada analítica do banco de dados para projeção de despesas recorrentes.

---

## 4. Arquitetura da Solução e Estrutura

```text
financial_intelligence/
├── .devcontainer/              # Especificação de contêiner isolado (Dev Containers)
├── .ai-jail.toml               # Diretrizes de sandboxing e limites operacionais
├── CLAUDE.md                   # Contrato arquitetural e regras de governança
├── package.json                # Scripts npm e dependências (slonik, vitest, zod)
├── tsconfig.json               # Configurações do compilador TypeScript
├── vitest.config.ts            # Parametrização da suíte de testes de integração
├── scripts/                    # Scripts de bootstrap de banco e manutenção
└── src/
    ├── app.ts                  # Ponto de entrada do servidor
    ├── index.ts                # Inicialização de serviços
    ├── api/                    # Rotas e controladores REST
    ├── db/
    │   ├── migrations/         # DDLs SQL puros de migração estrutural
    │   └── queries/            # Repositórios com queries analíticas e CTEs
    ├── services/               # Regras de negócio e motores heurísticos
    ├── types/                  # Definições tipadas e contratos de dados
    └── tests/                  # Bateria de testes de integração (Zero Mocks)
```

---

## 5. Como Executar

### 5.1. Pré-requisitos
- Docker Desktop e Docker Compose
- Visual Studio Code com a extensão **Dev Containers** (recomendado) ou Node.js 20+ e PostgreSQL 16 locais

### 5.2. Execução via Dev Containers (Recomendado)

1. Clone o repositório:
```bash
git clone https://github.com/RicsonRamos/financial_intelligence.git
cd financial_intelligence
```

2. Abra a pasta no VS Code e acione o comando `Reopen in Container` via Command Palette (`Ctrl+Shift+P`).
3. O ambiente subirá automaticamente os contêineres de Node.js e PostgreSQL 16.

### 5.3. Bootstrap do Banco de Dados e Testes

Dentro do terminal do contêiner:

1. Execute as migrações estruturais do banco de dados:
```bash
npm run setup:db
```

2. Execute a suíte de testes de integração contra o PostgreSQL real:
```bash
npm test
```
