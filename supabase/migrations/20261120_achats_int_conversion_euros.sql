-- Achats à l'étranger en devise : conversion en euros pour la comptabilité
-- (FEC, Quadra), au cours de référence BCE du jour de la facture. Fixée une
-- fois et conservée : un export refait plus tard donne les mêmes montants.
alter table public.superpdp_achats_int
  add column if not exists taux_change numeric,
  add column if not exists date_taux_change date,
  add column if not exists montant_ht_eur numeric,
  add column if not exists montant_tva_eur numeric;
