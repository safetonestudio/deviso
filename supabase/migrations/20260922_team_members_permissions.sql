-- 22/09/2026 — Autorisations personnalisables par membre.
--
-- Chaque membre invité porte cinq droits binaires, réglés par le gérant sur la
-- page Équipe. Défaut à l'invitation : tout à false (le plus restrictif). Le
-- titulaire n'est pas concerné : il a tout, implicitement (user.id == owner_id).
--
-- Remplace profiles.require_approval + le circuit de validation des devis
-- (submit-for-approval / approve / reject). Un seul modèle : la permission par
-- acte. Migration des membres existants : un espace qui exigeait la validation
-- (require_approval = true) devient « tout interdit » (le gérant validait tout à
-- la main) ; sinon « tout autorisé ». Le gérant ajuste ensuite sur la page Équipe.
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT jsonb_build_object(
    'envoyer_devis', false,
    'envoyer_facture', false,
    'transmettre_pa', false,
    'deposer_chorus', false,
    'refuser_facture_recue', false
  );

UPDATE public.team_members tm
SET permissions = CASE
  WHEN COALESCE(p.require_approval, false) THEN jsonb_build_object(
    'envoyer_devis', false, 'envoyer_facture', false, 'transmettre_pa', false,
    'deposer_chorus', false, 'refuser_facture_recue', false)
  ELSE jsonb_build_object(
    'envoyer_devis', true, 'envoyer_facture', true, 'transmettre_pa', true,
    'deposer_chorus', true, 'refuser_facture_recue', true)
END
FROM public.profiles p
WHERE p.id = tm.owner_id;

-- Une personne est active dans AU PLUS un espace de travail (le modèle de droits
-- le suppose ; getWorkspaceUserId lit une seule ligne active par member_id).
CREATE UNIQUE INDEX IF NOT EXISTS team_members_membre_actif_unique
  ON public.team_members (member_id)
  WHERE member_id IS NOT NULL AND status = 'active';
