-- 01/11/2026 — Cockpit cabinet : signalement cible au client.
--
-- Le cabinet, en lecture seule sur les dossiers, ne modifie jamais les donnees
-- du client. Un signalement n'est pas une modification du dossier : c'est un
-- message cible (« il manque le SIREN sur la facture 2026-012 ») que le client
-- voit dans son tableau de bord et peut marquer comme traite.
--
-- Acces par la cle de service uniquement, avec controle applicatif : le cabinet
-- doit etre rattache au dossier (estComptableDe) pour ecrire ; le client ne lit
-- et ne clot que les signalements de SON espace. Aucune politique RLS : la
-- table reste fermee a l'acces direct.
CREATE TABLE IF NOT EXISTS public.cabinet_signalements (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references auth.users on delete cascade,
  client_id   uuid not null references auth.users on delete cascade,
  message     text not null,
  statut      text not null default 'ouvert' check (statut in ('ouvert','traite')),
  created_at  timestamptz not null default now(),
  traite_at   timestamptz
);
CREATE INDEX IF NOT EXISTS cabinet_signalements_client ON public.cabinet_signalements (client_id, statut);
CREATE INDEX IF NOT EXISTS cabinet_signalements_cabinet ON public.cabinet_signalements (cabinet_id);

ALTER TABLE public.cabinet_signalements ENABLE ROW LEVEL SECURITY;
