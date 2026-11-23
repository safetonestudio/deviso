-- 20/11/2026 : état de la veille quotidienne (app/api/cron/veille, lib/veille/).
--
-- La veille alerte UNE fois quand un chemin critique casse, se tait tant que la
-- même panne dure, et écrit au retour à la normale. Pour cela elle doit savoir
-- ce qu'elle a déjà signalé : c'est cette ligne.
--
--  cle             « prod » pour la vraie veille, « essai » pour son test
--                  (scripts/e2e/veille.ts), qui ne doit jamais toucher l'état réel.
--  pannes          { identifiant de contrôle : { libelle, detail, depuis } }
--                  tel qu'il a été signalé lors de la dernière alerte.
--  version         compteur : l'état est réécrit sous condition de la version lue,
--                  deux passages concurrents (Vercel garantit « au moins une
--                  fois ») ne peuvent donc pas envoyer deux fois la même alerte.
--
-- Aucune politique RLS : lue et écrite par la seule clé de service.
CREATE TABLE IF NOT EXISTS public.veille_etat (
  cle text PRIMARY KEY,
  pannes jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 0,
  dernier_passage timestamptz,
  derniere_alerte timestamptz,
  dernier_bilan jsonb
);

ALTER TABLE public.veille_etat ENABLE ROW LEVEL SECURITY;
