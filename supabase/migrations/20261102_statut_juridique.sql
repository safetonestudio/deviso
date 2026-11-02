-- Statut de l'entreprise : micro-entrepreneur, entreprise individuelle au reel,
-- ou societe. Il decide de la vue du tableau de bord (echeance URSSAF et
-- cotisations pour les micros seulement, echeance de TVA pour les assujettis).
-- Avant lui, l'app deduisait "micro" de la franchise de TVA : un micro ayant
-- depasse le seuil perdait son echeance URSSAF, une petite societe en franchise
-- recevait a tort les dates du micro.
alter table public.profiles
  add column if not exists statut_juridique text
  check (statut_juridique in ('micro', 'ei_reel', 'societe'));

comment on column public.profiles.statut_juridique is
  'micro | ei_reel | societe. NULL = non precise : le tableau de bord le demande.';

-- Seule deduction certaine : la declaration URSSAF en tierce (TDAE) est
-- reservee aux micro-entrepreneurs. Les autres comptes restent a NULL.
update public.profiles p
   set statut_juridique = 'micro'
 where p.statut_juridique is null
   and exists (select 1 from public.urssaf_tdae_comptes u where u.user_id = p.id);
