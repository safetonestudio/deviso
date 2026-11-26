-- 24/11/2026 : enregistrer une candidature bêta d'un seul geste.
--
-- Relevé en relecture indépendante : la route comptait les envois de l'heure
-- PUIS insérait. N requêtes simultanées voyaient toutes « moins de 3 » et
-- passaient, chacune envoyant deux courriels (dont un accusé de réception à
-- une adresse choisie par l'expéditeur) : le formulaire pouvait servir à
-- écrire à des tiers.
--
-- Ici, un verrou par empreinte d'IP sérialise les envois d'une même origine,
-- et le comptage, le contrôle de doublon et l'insertion se font dans la même
-- transaction. Ajout seul : aucune table modifiée.
--
-- Retour : 'nouvelle' (insérée, courriels à envoyer), 'doublon' (une
-- candidature en attente existe pour cette adresse), 'limite' (3 envois dans
-- l'heure depuis cette origine).
CREATE OR REPLACE FUNCTION public.beta_enregistrer_candidature(
  p_nom text,
  p_email text,
  p_activite text,
  p_statut_juridique text,
  p_outil text,
  p_message text,
  p_echange boolean,
  p_ip_empreinte text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cle text := COALESCE(p_ip_empreinte, 'sans-ip');
  v_recents integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('beta_candidature:' || v_cle, 0));

  SELECT count(*) INTO v_recents
  FROM beta_candidatures
  WHERE COALESCE(ip_empreinte, 'sans-ip') = v_cle
    AND cree_le > now() - interval '1 hour';
  IF v_recents >= 3 THEN
    RETURN 'limite';
  END IF;

  IF EXISTS (SELECT 1 FROM beta_candidatures WHERE email = p_email AND statut = 'en_attente') THEN
    RETURN 'doublon';
  END IF;

  INSERT INTO beta_candidatures (origine, type_acces, nom, email, activite, statut_juridique, outil, message, echange_accepte, ip_empreinte)
  VALUES ('formulaire', 'testeur', p_nom, p_email, p_activite, p_statut_juridique, p_outil, p_message, p_echange, v_cle);
  RETURN 'nouvelle';
EXCEPTION WHEN unique_violation THEN
  RETURN 'doublon';
END;
$$;

-- Réservée au serveur (clé de service) : ni le public ni un compte connecté
-- ne l'appellent.
REVOKE ALL ON FUNCTION public.beta_enregistrer_candidature(text, text, text, text, text, text, boolean, text) FROM PUBLIC, anon, authenticated;
