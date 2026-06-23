-- 0002 — Seed do tenant único da fase de transição: EmagreSer.
-- Idempotente: re-rodar não duplica (slug é unique).
-- Ver docs/spec-fase1-multitenant.md §1 e §6 (passo 2).

insert into public.tenants (slug, name, active)
values ('emagreser', 'Programa EmagreSer', true)
on conflict (slug) do nothing;
