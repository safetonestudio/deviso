-- superpdp_achats_int n'avait AUCUNE FK sur user_id : les achats survivaient a
-- la suppression du compte. Deux consequences : comptes de demonstration
-- orphelins apres purge (2 h), et surtout donnees d'un vrai compte NON effacees
-- lors d'une suppression RGPD. On aligne sur superpdp_connections /
-- superpdp_invoices : cascade avec profiles.
alter table public.superpdp_achats_int
  add constraint superpdp_achats_int_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
