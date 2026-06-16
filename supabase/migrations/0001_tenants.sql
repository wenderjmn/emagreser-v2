-- 0001 — Fundação multi-tenant: tabelas tenants e tenant_members
-- Ver docs/spec-fase1-multitenant.md §3.1 e §5.
-- NÃO aplicado ainda. Revisar e testar em um Supabase branch antes de aplicar em produção.

create table if not exists public.tenants (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'admin',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_members_user_id_idx on public.tenant_members(user_id);

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;

-- Um usuário enxerga apenas os tenants em que é membro.
drop policy if exists tenant_member_can_read on public.tenants;
create policy tenant_member_can_read on public.tenants
  for select to authenticated
  using (exists (
    select 1 from public.tenant_members m
    where m.tenant_id = tenants.id and m.user_id = auth.uid()
  ));

-- Um usuário enxerga apenas as próprias linhas de membership.
drop policy if exists member_can_read_own on public.tenant_members;
create policy member_can_read_own on public.tenant_members
  for select to authenticated
  using (user_id = auth.uid());

-- Escrita em tenants/tenant_members fica a cargo do service_role (provisionamento server-only),
-- que ignora RLS. Convites self-service entram numa fase posterior.
