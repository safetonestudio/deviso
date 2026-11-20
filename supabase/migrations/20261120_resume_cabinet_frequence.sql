-- Résumé par e-mail du cabinet : rythme et jour réglables (20/11/2026).
-- Appliquée en production le même jour via le MCP Supabase. Colonnes avec
-- valeurs par défaut = comportement précédent (chaque lundi).
alter table public.profiles add column if not exists resume_cabinet_frequence text not null default 'hebdo';
alter table public.profiles add column if not exists resume_cabinet_jour smallint not null default 1;
alter table public.profiles add column if not exists resume_cabinet_dernier_passage date;
alter table public.profiles drop constraint if exists profiles_resume_cabinet_frequence_check;
alter table public.profiles add constraint profiles_resume_cabinet_frequence_check check (resume_cabinet_frequence in ('hebdo','quinzaine','mensuel'));
alter table public.profiles drop constraint if exists profiles_resume_cabinet_jour_check;
alter table public.profiles add constraint profiles_resume_cabinet_jour_check check (resume_cabinet_jour between 1 and 5);
comment on column public.profiles.resume_cabinet_frequence is 'Expert-comptable : rythme du résumé par e-mail (hebdo, quinzaine, mensuel).';
comment on column public.profiles.resume_cabinet_jour is 'Expert-comptable : jour d''envoi du résumé, 1 = lundi à 5 = vendredi.';
comment on column public.profiles.resume_cabinet_dernier_passage is 'Expert-comptable : dernier jour où le résumé était dû (envoyé ou rien à signaler).';
