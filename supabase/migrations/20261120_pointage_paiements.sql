-- Relance de pointage : demander au titulaire si une facture échue a été payée.
--
-- La déclaration d'encaissement (fr:212) et le livre des recettes dépendent du
-- clic « Marquer comme payée ». Un oubli ne se voyait qu'après coup, côté
-- cabinet. Ces trois colonnes portent la question posée et la réponse « pas
-- encore », pour ne jamais la reposer trop tôt ni deux fois le même jour.
alter table public.invoices
  add column if not exists pointage_demande_at timestamptz,
  add column if not exists pointage_demande_nb integer not null default 0,
  add column if not exists pointage_pas_encore_at timestamptz;

comment on column public.invoices.pointage_demande_at is
  'Dernière fois que Deviso a demandé au titulaire si cette facture échue était payée (écrit AVANT l''envoi).';
comment on column public.invoices.pointage_demande_nb is
  'Nombre de demandes de pointage envoyées pour cette facture.';
comment on column public.invoices.pointage_pas_encore_at is
  'Le titulaire a répondu « pas encore payée » à cette date.';
