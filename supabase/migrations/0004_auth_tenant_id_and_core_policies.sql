-- 0004 — Helper auth_tenant_id() + policies de isolamento por tenant nas tabelas core.
-- Ver docs/spec-fase1-multitenant.md §4 e §5 (categoria "Core admin").
--
-- ATENÇÃO ao revisar: policies PERMISSIVE são OR'd com as já existentes na tabela.
-- Auditar policies pré-existentes para o papel `authenticated` antes de aplicar, para
-- garantir que nenhuma delas conceda acesso cross-tenant mais amplo.

create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id', ''
  )::uuid
$$;

do $$
declare
  t text;
  core text[] := array[
    'leads','sequences','email_templates','wpp_templates','site_config',
    'turmas','weeks','missions','badges','mentors','page_content'
  ];
begin
  foreach t in array core loop
    execute format('drop policy if exists tenant_isolation on public.%I', t);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated '
      || 'using (tenant_id = public.auth_tenant_id()) '
      || 'with check (tenant_id = public.auth_tenant_id())', t);
  end loop;
end $$;
