-- Résumé hebdomadaire envoyé au cabinet (20/11/2026). Appliquée en production
-- le même jour via le MCP Supabase. Colonne optionnelle, défaut vrai : un
-- cabinet le reçoit tant qu'il ne l'a pas coupé depuis son espace.
alter table public.profiles add column if not exists resume_cabinet_hebdo boolean not null default true;
comment on column public.profiles.resume_cabinet_hebdo is 'Expert-comptable : reçoit le résumé du lundi (dossiers à traiter, TVA à déclarer). Colonne optionnelle, défaut vrai.';
