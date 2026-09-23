-- 23/09/2026 — Audit round 2 : deux trous de sécurité au niveau base.
--
-- (1) ESCALADE DE PRIVILÈGE — team_members.member_update
-- La policy « member_update » (UPDATE where auth.uid() = member_id, SANS
-- with_check) laissait un membre écrire SA PROPRE ligne team_members sans
-- aucune contrainte sur les valeurs. Muni de la clé anon (publique, dans le
-- bundle) et de son JWT, un membre appelait PostgREST directement et se
-- posait `permissions` = les cinq actes — puis passait tous les exigerActe de
-- l'API et déclenchait les effets externes (envoi, PA, Chorus). Toute la
-- feature de permissions par membre était contournable en une requête.
--
-- Aucun code légitime n'en dépend : toutes les écritures sur team_members
-- (invitation, acceptation, semis démo) passent par le client service_role
-- (createAdminClient), qui ignore la RLS. On supprime donc la policy. Le
-- membre garde member_select (lecture de sa propre ligne) ; le gérant garde
-- owner_all. Plus aucune écriture de team_members par un membre.
DROP POLICY IF EXISTS member_update ON public.team_members;

-- (2) DOUBLE DÉPÔT CHORUS PRO — verrou d'idempotence
-- La route chorus-pro lisait `chorus_pro_ref` puis déposait puis écrivait la
-- référence : deux appels concurrents (double-clic, deux onglets, réessai)
-- lisaient tous deux NULL et déposaient DEUX fois la même facture B2G chez la
-- collectivité, sous le compte AIFE de l'espace. Le remède est la prise
-- atomique déjà employée par l'émission Super PDP (superpdp_emission_debutee_at)
-- et l'encaissement : un UPDATE conditionnel que la base arbitre. Il lui faut
-- une colonne de verrou dédiée, périmable, distincte du timestamp métier
-- `chorus_pro_submitted_at`.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS chorus_pro_depot_debute_at timestamptz;
