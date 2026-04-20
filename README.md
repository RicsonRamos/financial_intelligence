# Financial Intelligence - Core Analytical Engine

Este é o motor de inteligência financeira focado em integridade transacional e análise preditiva. O projeto segue uma arquitetura purista (**Anti-Vibe Coding**) com foco em SQL puro e isolamento total de dados.

## 🛡️ Filosofia de Segurança: AI Jail
O ambiente de desenvolvimento opera sob a filosofia **AI Jail** (Akita). O agente de IA (Antigravity/Roo-Code) é confinado em um container Docker endurecido via `bubblewrap` e `ai-jail`, garantindo que ele tenha acesso apenas ao `/workspace` e não aos seus segredos do host (chaves SSH, .env, etc).

## 🚀 Quick Start

### 1. Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/) + Extensão **Dev Containers**

### 2. Inicialização do Ambiente
1. Clone o repositório.
2. Abra no VS Code.
3. No prompt do VS Code, selecione **"Reopen in Container"** (ou use o comando `Ctrl+Shift+P`).
4. O Docker Compose irá subir os serviços de **Node.js** e **PostgreSQL 16**.

### 3. Configuração do Banco de Dados
Dentro do terminal do container, execute o bootstrap para criar o esquema inicial:
```bash
npm run setup:db
```

### 4. Execução de Testes (Dia 3)
O projeto utiliza **Vitest** para testes de integração reais contra o banco `finance_test`.
```bash
npm test
```

## 🛠️ Stack Tecnológica
- **Backend:** Node.js 20 + TypeScript.
- **Banco de Dados:** PostgreSQL 16.
- **Acesso a Dados:** Slonik (SQL puro, sem ORM).
- **Testes:** Vitest (Zero Mocks).
- **Validação:** Zod.

## 📂 Estrutura do Projeto
- `.devcontainer/`: Configuração do container isolado e Docker Compose.
- `src/db/migrations/`: Scripts SQL puros (Esquema 3FN).
- `src/db/queries/`: Queries complexas (CTEs e Window Functions).
- `src/services/`: Lógica de domínio e heurísticas.
- `src/api/`: Endpoints da aplicação.
- `scripts/`: Utilitários de manutenção e diagnóstico.
- `CLAUDE.md`: O "Contrato Arquitetural" que guia o desenvolvimento via IA.

## 📜 Regras de Ouro (Anti-Vibe)
1. **Precisão Financeira:** Use exclusivamente `DECIMAL(15,2)` para valores monetários.
2. **Multi-tenant:** Toda query deve filtrar obrigatoriamente por `user_id`.
3. **Imutabilidade:** Transações de meses encerrados são bloqueadas.
4. **Performance:** Queries analíticas devem rodar em menos de 200ms.

## 🤖 Operação com IA
Este projeto é otimizado para assistência por IA. Sempre utilize o arquivo `CLAUDE.md` como referência de contexto. Para rodar comandos via agentes de IA com segurança, o wrapper `ai-jail` está disponível:
```bash
ai-jail -- [comando]
```

---
*Status: Infraestrutura e Camada de Dados Inicial concluídas.*
