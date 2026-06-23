-- 0006 — Editor de blocos: pages + page_blocks (substitui CONFIG_KEYS_PAGES da v1).
-- Ver docs/spec-fase1-multitenant.md §3.4.

create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  slug       text not null,
  title      text,
  template   text,
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.page_blocks (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.pages(id) on delete cascade,
  type        text not null
              check (type in ('hero','text','image','video','bonus','faq','price','testimonials','cta')),
  order_index int not null default 0,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists pages_tenant_id_idx on public.pages(tenant_id);
create index if not exists page_blocks_page_id_idx on public.page_blocks(page_id);

alter table public.pages enable row level security;
alter table public.page_blocks enable row level security;

-- pages: isolamento por tenant (admin). Leitura pública de páginas publicadas fica para
-- a renderização das LPs (anon) numa policy dedicada, quando o editor existir.
drop policy if exists tenant_isolation on public.pages;
create policy tenant_isolation on public.pages
  for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- page_blocks: herda o tenant via page_id -> pages.tenant_id.
drop policy if exists tenant_isolation on public.page_blocks;
create policy tenant_isolation on public.page_blocks
  for all to authenticated
  using (exists (
    select 1 from public.pages p
    where p.id = page_blocks.page_id and p.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.pages p
    where p.id = page_blocks.page_id and p.tenant_id = public.auth_tenant_id()
  ));
