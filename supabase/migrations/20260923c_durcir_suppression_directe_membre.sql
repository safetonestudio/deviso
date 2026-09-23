-- 23/09/2026 — Audit round 4 : suppression directe par un membre.
--
-- Un membre est un utilisateur Supabase réel : il détient la clé anon
-- (publique, dans le bundle navigateur) et son propre JWT. La policy ALL
-- « workspace_access » ouvrait SELECT/INSERT/UPDATE/DELETE à tout membre de
-- l'espace. Via supabase-js en direct (hors routes Deviso), un membre pouvait
-- donc SUPPRIMER n'importe quelle facture ou devis de l'espace, contournant la
-- garde exigerTitulaire de l'API. C'est la destruction d'un document légal et
-- une rupture de la continuité de numérotation (art. 242 nonies A CGI) qu'aucun
-- des cinq actes n'est censé accorder.
--
-- On scinde la policy ALL en policies par commande. SELECT/INSERT/UPDATE
-- gardent la portée EXACTE d'origine (accessible_workspace_ids) : le membre
-- continue de créer, lire et modifier via l'API, sans aucun changement de
-- comportement. Seul DELETE est resserré au titulaire (user_id = auth.uid()).
-- Les deux routes DELETE de l'API suppriment déjà en tant que titulaire via le
-- client SSR (auth.uid() = user_id de l'espace), donc rien de légitime n'est
-- cassé ; seule la suppression directe hors API par un membre est fermée.
--
-- Note : UPDATE reste ouvert au membre au niveau base (l'API ne peut pas
-- distinguer l'acte au niveau RLS). Ce n'est pas un vecteur d'effet externe :
-- envoi, transmission PA, dépôt Chorus et encaissement passent tous par l'API
-- qui applique exigerActe. Le seul vecteur d'escalade — l'auto-octroi de
-- permissions — a été fermé le 23/09 (suppression de team_members.member_update).

-- ── invoices ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_access ON public.invoices;
CREATE POLICY workspace_select ON public.invoices FOR SELECT TO authenticated
  USING (user_id IN (SELECT accessible_workspace_ids()));
CREATE POLICY workspace_insert ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT accessible_workspace_ids()));
CREATE POLICY workspace_update ON public.invoices FOR UPDATE TO authenticated
  USING (user_id IN (SELECT accessible_workspace_ids()))
  WITH CHECK (user_id IN (SELECT accessible_workspace_ids()));
CREATE POLICY owner_delete ON public.invoices FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ── proposals ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_access ON public.proposals;
CREATE POLICY workspace_select ON public.proposals FOR SELECT TO authenticated
  USING (user_id IN (SELECT accessible_workspace_ids()));
CREATE POLICY workspace_insert ON public.proposals FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT accessible_workspace_ids()));
CREATE POLICY workspace_update ON public.proposals FOR UPDATE TO authenticated
  USING (user_id IN (SELECT accessible_workspace_ids()))
  WITH CHECK (user_id IN (SELECT accessible_workspace_ids()));
CREATE POLICY owner_delete ON public.proposals FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
