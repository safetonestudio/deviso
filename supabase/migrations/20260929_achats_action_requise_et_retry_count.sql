-- Achats internationaux : un état terminal distinct de en_attente pour les cas
-- qu'aucun reessai automatique ne resoudra (date hors delai, pays non pris en
-- charge), et un compteur de tentatives servant de garde d'abandon au cron.
--
-- Ne du 29/09/2026 : une facture polonaise datee du 05/06 restait en_attente a
-- vie (refusee par la Plateforme Agreee pour date hors fenetre), reessayee
-- chaque heure sans jamais aboutir. en_attente melait "transitoire, un reessai
-- corrige" et "bloque sur ce qu'aucun reessai ne changera".
alter table public.superpdp_achats_int
  drop constraint superpdp_achats_int_transmission_status_check;

alter table public.superpdp_achats_int
  add constraint superpdp_achats_int_transmission_status_check
  check (transmission_status in ('en_attente','transmis','echec','action_requise'));

alter table public.superpdp_achats_int
  add column if not exists retry_count integer not null default 0;
