-- 0003 — Adiciona tenant_id às 11 tabelas core, com backfill no tenant seed e NOT NULL.
-- Sequência não-destrutiva (nullable -> backfill -> not null) numa única transação.
-- A v1 acessa via service_role (ignora RLS) e não escreve tenant_id; o default vem do backfill.
-- Ver docs/spec-fase1-multitenant.md §3.2 e §6 (passos 3-5).

do $$
declare
  t text;
  seed uuid;
  core text[] := array[
    'leads','sequences','email_templates','wpp_templates','site_config',
    'turmas','weeks','missions','badges','mentors','page_content'
  ];
begin
  select id into seed from public.tenants where slug = 'emagreser';
  if seed is null then
    raise exception 'Tenant seed "emagreser" não encontrado — rode 0002 antes.';
  end if;

  foreach t in array core loop
    execute format(
      'alter table public.%I add column if not exists tenant_id uuid references public.tenants(id)', t);
    execute format(
      'create index if not exists %I on public.%I(tenant_id)', t || '_tenant_id_idx', t);
    execute format(
      'update public.%I set tenant_id = $1 where tenant_id is null', t) using seed;
    execute format(
      'alter table public.%I alter column tenant_id set not null', t);
  end loop;
end $$;
