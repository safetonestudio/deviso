-- Plan de comptes réglable par le cabinet pour ses exports FEC (20/11/2026).
-- Appliquée en production le même jour via le MCP Supabase. Null = plan par
-- défaut de lib/exports-comptables.ts.
alter table public.profiles add column if not exists plan_comptes_fec jsonb;
comment on column public.profiles.plan_comptes_fec is 'Expert-comptable : comptes et codes journaux appliqués aux FEC exportés depuis l''espace cabinet (null = plan par défaut). Colonne optionnelle.';
