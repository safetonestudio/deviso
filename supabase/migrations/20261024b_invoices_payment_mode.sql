-- Mode de reglement saisi a l'encaissement : mention obligatoire du livre des
-- recettes du micro-entrepreneur (avec la date d'encaissement, la reference de
-- la facture, le client, la nature et le montant). Nul pour l'existant.
alter table public.invoices add column if not exists payment_mode text;
alter table public.invoices drop constraint if exists invoices_payment_mode_check;
alter table public.invoices add constraint invoices_payment_mode_check
  check (payment_mode is null or payment_mode in ('virement','carte','cheque','especes','prelevement','autre'));
