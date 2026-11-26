-- 24/11/2026 : programme bêta (lib/beta.ts).
--
-- Ajouts SEULS : aucune colonne existante n'est modifiée ni supprimée. Si la
-- bêta est fermée (BETA_OUVERTE = false), ces objets restent en place, inertes ;
-- l'application d'avant la bêta ne les lit pas.
--
-- beta_candidatures : une ligne par candidature (formulaire public) ou par
-- invitation directe de Selim (clients du cabinet pilote, cabinet lui-même).
--   statut        en_attente | acceptee | refusee
--   type_acces    testeur : le compte naît en bêta (2 mois, formule complète)
--                 cabinet : le compte naît sans formule (le cockpit est gratuit)
--   jeton_hash    empreinte SHA-256 du lien d'accès envoyé au candidat accepté ;
--                 le jeton en clair n'est jamais stocké. Usage unique
--                 (jeton_utilise_le), durée limitée (jeton_expire_le), lié à
--                 l'adresse e-mail de la candidature.
--   ip_empreinte  empreinte de l'adresse IP, pour limiter les envois répétés.
-- Aucune politique RLS : lue et écrite par la seule clé de service.
CREATE TABLE IF NOT EXISTS public.beta_candidatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cree_le timestamptz NOT NULL DEFAULT now(),
  origine text NOT NULL DEFAULT 'formulaire' CHECK (origine IN ('formulaire', 'direct')),
  type_acces text NOT NULL DEFAULT 'testeur' CHECK (type_acces IN ('testeur', 'cabinet')),
  nom text NOT NULL,
  email text NOT NULL,
  activite text,
  statut_juridique text,
  outil text,
  message text,
  echange_accepte boolean NOT NULL DEFAULT false,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee')),
  decide_le timestamptz,
  jeton_hash text UNIQUE,
  jeton_expire_le timestamptz,
  jeton_utilise_le timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_empreinte text
);

ALTER TABLE public.beta_candidatures ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS beta_candidatures_email_idx ON public.beta_candidatures (lower(email));
CREATE INDEX IF NOT EXISTS beta_candidatures_ip_idx ON public.beta_candidatures (ip_empreinte, cree_le);
-- Une seule candidature en attente par adresse.
CREATE UNIQUE INDEX IF NOT EXISTS beta_candidatures_une_en_attente
  ON public.beta_candidatures (lower(email)) WHERE statut = 'en_attente';

-- Profil : période de bêta du compte. NULL partout = compte hors bêta (cas de
-- tous les comptes existants, et de tous les comptes après la bêta).
--   beta_debut / beta_fin       période de gratuité (2 mois depuis la création
--                               du compte) ; subscription_status = 'beta' pendant,
--                               'beta_terminee' après.
--   beta_rappel_le              rappel J-7 envoyé (écrit AVANT l'envoi).
--   beta_fin_notifiee_le        courriel de fin envoyé (écrit AVANT l'envoi).
--   beta_reception_avis_le      dernier avis avant fermeture de la réception.
--   beta_reception_fermee_le    ligne de réception fermée (30 jours après la fin).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_debut timestamptz,
  ADD COLUMN IF NOT EXISTS beta_fin timestamptz,
  ADD COLUMN IF NOT EXISTS beta_rappel_le timestamptz,
  ADD COLUMN IF NOT EXISTS beta_fin_notifiee_le timestamptz,
  ADD COLUMN IF NOT EXISTS beta_reception_avis_le timestamptz,
  ADD COLUMN IF NOT EXISTS beta_reception_fermee_le timestamptz;
