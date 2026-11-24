-- 24/11/2026 : la table d'équipe ne s'écrit plus que côté serveur.
--
-- Le défaut (relevé en relecture indépendante le 24/11, présent en production
-- depuis la création de la table). La politique « owner_all » (FOR ALL, sans
-- WITH CHECK) autorisait tout compte connecté à INSÉRER dans team_members
-- n'importe quelle ligne portant owner_id = lui-même, par un simple appel à
-- l'API de la base (clé publique + session). Deux conséquences :
--   - prise de contrôle : une ligne { owner_id: attaquant, member_id: victime,
--     status: 'active' } rattache la victime à l'espace de l'attaquant
--     (getWorkspaceUserId, accessible_workspace_ids) : ce qu'elle crée ensuite
--     atterrit chez lui, qui peut le lire ;
--   - équipe sans limite ni facturation : des membres ajoutés ainsi échappent
--     à la limite de sièges et à synchroniserSieges.
--
-- Aucune écriture légitime n'utilise la session de l'utilisateur : invitation,
-- expert-comptable, code cabinet, acceptation, retrait, démo, veille passent
-- toutes par la clé de service (vérifié le 24/11). Le titulaire garde la
-- LECTURE de ses lignes, le membre la lecture de la sienne (member_select).
-- Sans effet sur le code en place : applicable immédiatement.
DROP POLICY IF EXISTS owner_all ON public.team_members;
CREATE POLICY owner_select ON public.team_members
  FOR SELECT
  USING ((SELECT auth.uid()) = owner_id);
