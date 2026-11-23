-- Nature des offres du catalogue (23/11/2026).
--
-- Chaque offre dit si elle est une livraison de biens (goods) ou une
-- prestation de services (services), meme vocabulaire que
-- invoices.operation_category. La nature suit ensuite chaque ligne de devis
-- et de facture (items[].nature), et la nature de la facture se deduit des
-- lignes (lib/nature-operation.ts).
--
-- Additive : NULL autorise pour les offres existantes (non precisee),
-- l'interface demande la nature au lieu de la supposer. Le code deja en
-- production ignore la colonne.
alter table public.service_catalog add column if not exists nature text null;
alter table public.service_catalog drop constraint if exists service_catalog_nature_check;
alter table public.service_catalog add constraint service_catalog_nature_check
  check (nature is null or nature in ('goods', 'services'));
comment on column public.service_catalog.nature is
  'Nature de l''offre : goods (livraison de biens) ou services (prestation). NULL = non precisee (offres anterieures au 23/11/2026). Meme vocabulaire que invoices.operation_category.';
