-- Achats à l'étranger : nature de la TVA de la facture et taux français
-- d'autoliquidation (21/11/2026).
--
-- tva_facturee : ce que porte la facture du fournisseur.
--   'aucune'    : pas de TVA, autoliquidation (ou importation pour des biens hors UE) ;
--   'francaise' : TVA française (fournisseur immatriculé en France), déductible ;
--   'etrangere' : TVA du pays du fournisseur, non déductible en France, en charge.
--   NULL (défaut, toutes les lignes existantes) : règle d'avant cette colonne,
--   déduite du montant (TVA > 0 = étrangère, 0 = aucune). Le comportement des
--   achats déjà saisis ne change donc pas.
--
-- taux_autoliquidation : taux français appliqué à une autoliquidation.
--   Défaut 20 : le taux unique utilisé jusqu'ici.
alter table public.superpdp_achats_int
  add column if not exists tva_facturee text
    check (tva_facturee in ('aucune', 'francaise', 'etrangere')),
  add column if not exists taux_autoliquidation numeric not null default 20
    check (taux_autoliquidation in (20, 10, 8.5, 5.5, 2.1, 1.05, 0.9));
