# Spec — Fundação Multi-tenant (Fase 1)

> Especificação técnica do schema multi-tenant e RLS da v2. Núcleo restante da Fase 1
> do roadmap (`docs/v1-blueprint-historico.md`, seções 6.2 e 7). Documento de design —
> a implementação acontece via migrations Supabase (`apply_migration`), não por
> alteração direta de schema.

## 1. Objetivo

Transformar o banco compartilhado com a v1 (`drgrwpmhmrrhxuwxabow`) de single-tenant
(tudo implicitamente "EmagreSer") para multi-tenant, onde cada conta profissional
(psicólogo/nutricionista/coach) é um `tenant` isolado por RLS. Durante a transição,
**EmagreSer é o único tenant** — os dados existentes recebem um `tenant_id` fixo (seed).

Não-objetivos desta fase: billing, self-service onboarding, migração de dados da v1
(continua em produção no mesmo banco, intocada).

## 2. Estado atual (introspecção do banco — 2026-06-16)

| Fato | Situação |
|---|---|
| Tabela `tenants`/`accounts`/`organizations` | **Não existe** — será criada |
| `tenant_id` em qualquer tabela core | **Ausente em todas** (greenfield) |
| RLS habilitado | ✅ em todas as 31 tabelas do `public` |
| Tabelas da Área do Aluno com `user_id` | ✅ `user_missions`, `user_badges`, `xp_transactions`, `diary_entries`, `sabotador_journals`, `theater_exercises`, `community_posts`, `community_comments` |
| `users_profile` | PK `id uuid` = `auth.users.id` (sem `user_id` próprio); tem `turma_id`, `role`, gamificação |
| Tabelas com RLS mas 0 policies | `email_templates`, `whatsapp_queue` (deny-all exceto `service_role`) |

Conclusão: a v1 (workers PHP) acessa o banco via `service_role`, que **ignora RLS**.
Portanto adicionar policies por `tenant_id` para o papel autenticado **não quebra a v1**.
Essa é a invariante de segurança que torna a transição não-destrutiva.

## 3. Modelo de dados

### 3.1 Novas tabelas

```
tenants (
  id           uuid pk default gen_random_uuid(),
  slug         text unique not null,        -- 'emagreser'
  name         text not null,               -- 'Programa EmagreSer'
  active       boolean not null default true,
  created_at   timestamptz not null default now()
)

tenant_members (
  tenant_id    uuid not null references tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'admin',  -- 'owner' | 'admin' | 'staff'
  created_at   timestamptz not null default now(),
  primary key (tenant_id, user_id)
)
```

`tenant_members` modela a relação admin↔tenant (suporta equipe no futuro). A app
descobre o tenant do admin logado por essa tabela **ou** pelo claim no JWT (§4).

### 3.2 `tenant_id` nas tabelas core (admin)

Recebem `tenant_id uuid references tenants(id)`:

`leads`, `sequences`, `email_templates`, `wpp_templates`, `site_config`,
`turmas`, `weeks`, `missions`, `badges`, `mentors`, `page_content`.

- Adicionado **nullable**, com backfill para o tenant seed, e **só então** marcado
  `not null` (evita travar a v1 durante a migration).
- Índice `(tenant_id)` em cada uma (toda query da app filtra por tenant).
- `email_queue`/`whatsapp_queue`/`page_events` **não** ganham `tenant_id` diretamente:
  herdam o tenant via `lead_id → leads.tenant_id` (evita desnormalização que a v1
  teria de preencher). Reavaliar se a performance de RLS exigir desnormalizar.

### 3.3 Área do Aluno

As tabelas do aluno já têm `user_id` e são isoladas por `auth.uid()`. O vínculo com o
tenant é **transitivo**: `users_profile.turma_id → turmas.tenant_id`. Não adicionamos
`tenant_id` redundante nelas na Fase 1 — o isolamento por usuário já cobre o caso de uso
(aluno só vê o próprio dado). `tenant_id` entra aqui só se/quando um tenant precisar de
visão agregada dos seus alunos (Fase 3+).

### 3.4 Editor de blocos (substitui `CONFIG_KEYS_PAGES`)

```
pages (
  id          uuid pk default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  slug        text not null,                 -- 'lp' | 'ig' | 'programa' | ...
  title       text,
  template    text,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (tenant_id, slug)
)

page_blocks (
  id          uuid pk default gen_random_uuid(),
  page_id     uuid not null references pages(id) on delete cascade,
  type        text not null,                 -- hero|text|image|video|bonus|faq|price|testimonials|cta
  order_index int not null default 0,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now()
)
```

`page_blocks` herda o tenant via `page_id → pages.tenant_id` (mesma lógica das queues).
A tabela `page_content` (2 rows) é o precursor; não é migrada agora, fica como referência.

## 4. Claims & resolução de tenant

Estratégia: gravar `tenant_id` em `app_metadata` do usuário admin (via Admin API, no
fluxo de criação de conta/convite — não editável pelo cliente). O JWT carrega o claim e
o RLS lê direto, sem JOIN a cada policy.

- Função helper SQL (security definer, estável):

```sql
create or replace function public.auth_tenant_id() returns uuid
language sql stable as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id', ''
  )::uuid
$$;
```

- Fallback (enquanto o claim não estiver populado): policy que resolve via
  `tenant_members` por `auth.uid()`. As duas formas coexistem; o claim é a rápida.

## 5. Estratégia de RLS

Três categorias de policy:

| Categoria | Tabelas | Regra (papel `authenticated`) |
|---|---|---|
| **Core admin** | leads, sequences, *_templates, site_config, turmas, weeks, missions, badges, mentors, page_content, pages | `tenant_id = public.auth_tenant_id()` (FOR ALL) |
| **Herdam tenant** | email_queue, whatsapp_queue, page_events, page_blocks | via EXISTS no pai (`leads`/`pages`) com o tenant do usuário |
| **Aluno** | users_profile, user_missions, user_badges, xp_transactions, diary_entries, sabotador_journals, theater_exercises, community_* | `user_id = auth.uid()` (já existente; community: leitura por turma, escrita por dono) |

Invariantes:
- `service_role` continua com bypass total (workers da v1 e jobs server-only da v2).
- Conteúdo de catálogo por tenant (`weeks`/`missions`/`badges`/`mentors`) é **somente
  leitura** para o aluno do tenant correspondente, e leitura/escrita para o admin do tenant.
- Nenhuma policy nova concede acesso ao papel `anon` além do que já existe (ex.: insert
  público em `page_events`), preservando o comportamento das landing pages da v1.

## 6. Plano de migrations (ordenado, idempotente)

Cada passo é uma migration registrada via `apply_migration`:

1. `tenants` + `tenant_members` (+ RLS: membro vê seu tenant; admin gerencia membros).
2. Seed do tenant `emagreser` (slug fixo) — captura o `id` para os backfills.
3. `tenant_id` nullable nas 11 tabelas core + índices.
4. Backfill `tenant_id = <seed>` em todas as rows existentes.
5. `alter ... set not null` nas 11 colunas.
6. `public.auth_tenant_id()` + policies "core admin".
7. Policies "herdam tenant" (queues, page_events, page_blocks).
8. `pages` + `page_blocks` + RLS.
9. Revisão de advisors de segurança (`get_advisors`) pós-migration.

Reversibilidade: passos 3-5 são aditivos; rollback = `drop column tenant_id`. Policies
podem ser dropadas sem afetar a v1 (que usa service_role).

## 7. Integração na app (Next.js)

- **Resolução do tenant**: helper server-side `getTenantId()` lê o claim do JWT da sessão
  (`lib/supabase/server.ts`); fallback via `tenant_members`.
- **Queries**: Server Components/Actions usam o client anon autenticado — o RLS aplica o
  filtro por tenant automaticamente; a app não precisa anexar `tenant_id` manualmente em
  SELECTs (mas **deve** anexar em INSERTs).
- **Criação de admin**: ao provisionar um admin, gravar `app_metadata.tenant_id` via
  service_role (server-only) e inserir em `tenant_members`.
- **Dashboard atual**: o count de `leads` passa a refletir apenas o tenant do usuário —
  bom smoke test do isolamento.

## 8. Decisões em aberto

1. Claim em `app_metadata.tenant_id` (1 tenant por usuário) vs. multi-tenant por usuário
   (resolver tenant ativo por header/subdomínio). Proposta: começar 1:1 via claim.
2. Catálogo (`weeks`/`missions`/`badges`) como **template clonável** por tenant
   (decisão pendente §8.5 do blueprint) — afeta se o seed é por-tenant ou global+override.
3. Desnormalizar `tenant_id` nas queues/page_events se o EXISTS de RLS pesar em volume.

## 9. Fora de escopo desta fase

Editor visual de blocos (UI), billing, convites self-service, e a engine de
XP/badges/`unlock_day` da Área do Aluno (Fase 3). Este spec entrega apenas o **schema +
RLS multi-tenant** e o **modelo de páginas/blocos**, base para as fases seguintes.
