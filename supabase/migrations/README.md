# Migrations — Fundação multi-tenant (Fase 1)

Implementação da spec `docs/spec-fase1-multitenant.md`. Banco compartilhado com a v1
(`drgrwpmhmrrhxuwxabow`) — leia os avisos antes de aplicar.

## Status

🟡 **Escritas, ainda NÃO aplicadas.** São artefatos para revisão no PR. Aplicar só após
revisão e, de preferência, teste em um Supabase branch.

## Ordem de aplicação

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `0001_tenants.sql` | Cria `tenants` + `tenant_members` + RLS |
| 2 | `0002_seed_emagreser.sql` | Seed do tenant único `emagreser` (idempotente) |
| 3 | `0003_core_tenant_id.sql` | `tenant_id` nas 11 tabelas core: add nullable → backfill → not null |
| 4 | `0004_auth_tenant_id_and_core_policies.sql` | Função `auth_tenant_id()` + policies de isolamento nas core |
| 5 | `0005_inherited_tenant_policies.sql` | Policies de `email_queue`/`whatsapp_queue` (herdam tenant via lead) |
| 6 | `0006_pages_blocks.sql` | Editor de blocos: `pages` + `page_blocks` + RLS |

## Por que é seguro para a v1

Os workers PHP da v1 acessam o Postgres via `service_role`, que **ignora RLS**. As
migrations só **adicionam** colunas/policies; nenhuma altera ou remove o que a v1 usa.
A coluna `tenant_id` é preenchida pelo backfill (passo 3), então `INSERT`s da v1 que não
informam `tenant_id` continuariam falhando o `NOT NULL` — **por isso**, antes de aplicar
o passo 3 em produção, confirmar que nenhum caminho de escrita da v1 insere nessas tabelas
sem passar pelo backfill, ou manter `tenant_id` com `DEFAULT` do tenant seed nessa fase.

## Antes de aplicar (checklist)

1. Rodar em um **Supabase branch** (`create_branch`) e validar.
2. Auditar policies pré-existentes nas tabelas core para o papel `authenticated`
   (policies permissive são OR'd — ver aviso no topo de `0004`).
3. Rodar `get_advisors` (security) após aplicar.
4. Popular `app_metadata.tenant_id` do(s) usuário(s) admin e inseri-los em `tenant_members`.

## Como aplicar (via MCP)

Cada arquivo vira uma chamada `apply_migration` (name = nome do arquivo sem extensão,
query = conteúdo), na ordem acima.
