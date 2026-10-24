-- Vue de pilotage administrateur : un compte par ligne, totaux calcules par la
-- base (une lecture PostgREST plafonne a 1 000 lignes, compter cote page aurait
-- donne des chiffres faux des que l'activite grossit). Aucun contenu de devis
-- ni de facture : ce sont les donnees des clients de nos utilisateurs (RGPD).
-- Fermee a anon et authenticated, executable par le seul service_role (la page
-- admin, cote serveur, apres verification ADMIN_EMAILS).
create or replace function public.admin_pilotage()
returns table (
  user_id uuid, email text, entreprise text, plan text, abonnement text,
  inscrit_le timestamptz, derniere_connexion timestamptz,
  nb_devis bigint, nb_factures bigint, nb_erreurs_pa bigint,
  raccordement text, nb_achats_bloques bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.email, coalesce(nullif(p.company_name, ''), p.full_name), p.plan, p.subscription_status,
         p.created_at, u.last_sign_in_at,
         (select count(*) from proposals x where x.user_id = p.id),
         (select count(*) from invoices x where x.user_id = p.id),
         (select count(*) from invoices x where x.user_id = p.id and x.superpdp_error is not null),
         c.session_status,
         (select count(*) from superpdp_achats_int x where x.user_id = p.id and x.transmission_status in ('action_requise', 'echec'))
  from profiles p
  left join auth.users u on u.id = p.id
  left join superpdp_connections c on c.user_id = p.id
  where not coalesce(p.is_demo, false)
  order by p.created_at desc;
$$;

revoke all on function public.admin_pilotage() from public, anon, authenticated;
grant execute on function public.admin_pilotage() to service_role;
