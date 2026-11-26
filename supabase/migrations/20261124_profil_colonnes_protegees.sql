-- 24/11/2026 : un utilisateur ne peut plus changer lui-même sa formule.
--
-- ⚠️ À APPLIQUER AU MOMENT DU DÉPLOIEMENT du code qui l'accompagne, pas avant :
-- jusqu'au 24/11, /api/stripe/checkout et /api/stripe/portal écrivaient
-- plan / stripe_customer_id / stripe_subscription_id avec la session de
-- l'utilisateur. Ils passent désormais par la clé de service ; appliquée avant
-- ce code, cette protection casserait le paiement en production.
--
-- Le défaut corrigé. La politique RLS « Users can update their own profile »
-- autorise la mise à jour de TOUTE la ligne, et le rôle `authenticated` a le
-- droit UPDATE sur chaque colonne. N'importe quel compte connecté pouvait donc,
-- par un simple appel à l'API de la base (clé publique + sa session), écrire
-- plan = 'pro' sur son propre profil et obtenir la formule complète sans payer.
-- Pendant la bêta, cela rendait aussi la fermeture des inscriptions inutile.
--
-- La règle. Les colonnes qui décident des droits et de la facturation ne
-- s'écrivent que côté serveur (clé de service, ou fonctions SECURITY DEFINER
-- comme handle_new_user). Pour les rôles `authenticated` et `anon` :
--   - UPDATE : changer l'une d'elles est refusé ;
--   - INSERT : elles doivent rester à leur valeur par défaut.
-- Toute autre colonne du profil reste modifiable par son titulaire, comme avant.
CREATE OR REPLACE FUNCTION public.profiles_colonnes_protegees()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.plan IS DISTINCT FROM 'free'
       OR NEW.subscription_status IS DISTINCT FROM 'inactive'
       OR NEW.stripe_customer_id IS NOT NULL
       OR NEW.stripe_subscription_id IS NOT NULL
       OR COALESCE(NEW.is_demo, false)
       OR NEW.beta_debut IS NOT NULL OR NEW.beta_fin IS NOT NULL
       OR NEW.beta_rappel_le IS NOT NULL OR NEW.beta_fin_notifiee_le IS NOT NULL
       OR NEW.beta_reception_avis_le IS NOT NULL OR NEW.beta_reception_fermee_le IS NOT NULL THEN
      RAISE EXCEPTION 'Colonne protégée du profil : écriture réservée au serveur' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
     OR NEW.beta_debut IS DISTINCT FROM OLD.beta_debut
     OR NEW.beta_fin IS DISTINCT FROM OLD.beta_fin
     OR NEW.beta_rappel_le IS DISTINCT FROM OLD.beta_rappel_le
     OR NEW.beta_fin_notifiee_le IS DISTINCT FROM OLD.beta_fin_notifiee_le
     OR NEW.beta_reception_avis_le IS DISTINCT FROM OLD.beta_reception_avis_le
     OR NEW.beta_reception_fermee_le IS DISTINCT FROM OLD.beta_reception_fermee_le THEN
    RAISE EXCEPTION 'Colonne protégée du profil : écriture réservée au serveur' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_colonnes_protegees ON public.profiles;
CREATE TRIGGER profiles_colonnes_protegees
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_colonnes_protegees();
