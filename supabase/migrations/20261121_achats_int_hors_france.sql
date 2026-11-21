-- Achat sans TVA réalisé hors de France (hôtel à New York, restaurant, salon,
-- transport ou travaux à l'étranger) : ni autoliquidation ni déclaration
-- (CGI art. 259 A et suivants ; art. 290, I-3°). Quatrième nature de TVA.
alter table public.superpdp_achats_int drop constraint superpdp_achats_int_tva_facturee_check;
alter table public.superpdp_achats_int add constraint superpdp_achats_int_tva_facturee_check
  check (tva_facturee in ('aucune', 'hors_france', 'francaise', 'etrangere'));
alter table public.superpdp_achats_int drop constraint superpdp_achats_int_tva_coherente;
alter table public.superpdp_achats_int add constraint superpdp_achats_int_tva_coherente
  check ((tva_facturee in ('aucune', 'hors_france')) = (montant_tva = 0));
