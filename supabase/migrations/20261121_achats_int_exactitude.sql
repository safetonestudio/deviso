-- Achats : exactitude de la TVA et du périmètre déclaré (21/11/2026).
--
-- 1. La TVA de la facture devient obligatoire, et la base refuse une nature
--    contraire au montant (« aucune » <=> TVA nulle). Les lignes existantes
--    (compte de test, toutes avec TVA) prennent la nature déduite du montant.
update public.superpdp_achats_int
  set tva_facturee = case when montant_tva > 0 then 'etrangere' else 'aucune' end
  where tva_facturee is null;
alter table public.superpdp_achats_int
  alter column tva_facturee set default 'aucune',
  alter column tva_facturee set not null,
  add constraint superpdp_achats_int_tva_coherente
    check ((tva_facturee = 'aucune') = (montant_tva = 0));

-- 2. Achat hors du champ de l'e-reporting (BOI-TVA-DECLA-20-30-50-10 § 60) :
--    importation (dédouanée) ou opération située hors de France (TVA
--    étrangère). Il reste en comptabilité, il n'est pas déclaré.
alter table public.superpdp_achats_int drop constraint superpdp_achats_int_transmission_status_check;
alter table public.superpdp_achats_int add constraint superpdp_achats_int_transmission_status_check
  check (transmission_status in ('en_attente', 'transmis', 'echec', 'action_requise', 'hors_champ'));

-- 3. Avoir d'un fournisseur étranger : montants positifs, sens porté par le type.
alter table public.superpdp_achats_int
  add column if not exists est_avoir boolean not null default false;

-- 4. Facture reçue en autoliquidation (catégorie AE) : taux français réellement
--    applicable, choisi par le titulaire. NULL = taux normal présumé, signalé.
alter table public.superpdp_invoices
  add column if not exists taux_autoliquidation numeric
    check (taux_autoliquidation in (20, 10, 8.5, 5.5, 2.1, 1.05, 0.9));
