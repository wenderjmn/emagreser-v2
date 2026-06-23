-- 0005 — Policies para tabelas que herdam o tenant via FK ao lead.
-- email_queue e whatsapp_queue carregam lead_id -> leads.tenant_id (não desnormalizamos).
-- Ver docs/spec-fase1-multitenant.md §3.2 e §5 (categoria "Herdam tenant").
--
-- Nota: page_events NÃO entra aqui — na v1 não tem vínculo a lead/tenant (é por session_id).
-- Mantém o comportamento atual (insert anon, leitura via service_role) até ganhar tenant_id
-- numa fase futura, se necessário.

do $$
declare t text;
begin
  foreach t in array array['email_queue','whatsapp_queue'] loop
    execute format('drop policy if exists tenant_isolation on public.%I', t);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated '
      || 'using (exists (select 1 from public.leads l '
      || '  where l.id = %I.lead_id and l.tenant_id = public.auth_tenant_id())) '
      || 'with check (exists (select 1 from public.leads l '
      || '  where l.id = %I.lead_id and l.tenant_id = public.auth_tenant_id()))',
      t, t, t);
  end loop;
end $$;
