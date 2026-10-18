-- Langue d'edition du PDF de facture (habillage seulement ; les mentions
-- legales restent toujours en francais). Defaut 'fr' pour tout l'existant.
alter table public.invoices
  add column if not exists language text not null default 'fr';

alter table public.invoices
  drop constraint if exists invoices_language_check;

alter table public.invoices
  add constraint invoices_language_check check (language in ('fr','en'));
