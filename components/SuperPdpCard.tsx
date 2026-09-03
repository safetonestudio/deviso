"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Raccordement à la Plateforme Agréée (Super PDP).
 *
 * Ce composant existe parce que les routes `/api/superpdp/connect`, `/callback`
 * et `/status` étaient écrites depuis un mois sans qu'aucune interface ne les
 * appelle : personne ne pouvait donc se raccorder, et l'échange de jetons
 * n'avait jamais été parcouru. Les deux côtés existaient, ils n'étaient pas
 * reliés — le défaut le plus fréquent de ce projet.
 *
 * Ce que l'écran doit rendre lisible, dans l'ordre :
 * 1. l'obligation de **réception** des factures électroniques au 1ᵉʳ septembre 2026 ;
 * 2. l'état réel du raccordement, y compris l'état intermédiaire `pending` —
 *    Super PDP vérifie le rattachement entreprise en différé, et pendant ce
 *    temps l'API renvoie 403. Masquer cet état ferait passer une attente
 *    normale pour une panne.
 */

type Etat = {
  available: boolean;
  sandbox?: boolean;
  connected: boolean;
  status?: "pending" | "verified" | "error" | null;
  companyId?: string | null;
  directoryAddress?: string | null;
  regimeTva?: string | null;
  /** Renseigné si l'environnement de la plateforme ne correspond pas au nôtre. */
  discordanceEnv?: string | null;
  /** Ce qu'il faut dire, et si une action est attendue de la personne. */
  messageStatut?: { texte: string; agir: boolean } | null;
  /** État réel de la ligne de réception. Voir lib/superpdp-ligne-annuaire.ts. */
  ligne?:
    | { etat: "joignable"; adresse: string }
    | { etat: "programmee"; adresse: string; aPartirDu: string }
    | { etat: "en_cours"; adresse: string }
    | { etat: "en_erreur"; adresse: string; message: string | null }
    | { etat: "absente" }
    | null;
  lastError?: string | null;
};

/** Messages de retour du tunnel d'autorisation, posés par `/api/superpdp/callback`. */
const RETOURS: Record<string, { ton: "ok" | "attente" | "erreur"; texte: string }> = {
  connecte: { ton: "ok", texte: "Raccordement établi." },
  en_attente: {
    ton: "attente",
    texte:
      "Autorisation enregistrée. Super PDP vérifie le rattachement de votre entreprise, " +
      "cela peut prendre un moment.",
  },
  expire: {
    ton: "erreur",
    texte:
      "La demande a expiré : le raccordement doit être mené en une fois, en moins " +
      "de 30 minutes. Relancez-le.",
  },
  interrompu: {
    ton: "erreur",
    texte:
      "Le raccordement a été interrompu avant la dernière étape. Relancez-le et " +
      "allez jusqu'à l'écran d'autorisation.",
  },
  double: {
    ton: "erreur",
    texte:
      "Le raccordement a été ouvert plusieurs fois : c'est une demande précédente " +
      "qui est revenue. Fermez les autres onglets et relancez-le une seule fois.",
  },
  session_perdue: {
    ton: "erreur",
    texte: "Votre session Deviso a été perdue pendant le raccordement. Reconnectez-vous puis réessayez.",
  },
  indisponible: { ton: "erreur", texte: "Le raccordement n'est pas encore activé côté Deviso." },
  erreur: { ton: "erreur", texte: "Le raccordement a échoué." },
};

/**
 * Les messages d'erreur de Super PDP arrivent en anglais et en vocabulaire
 * d'API. On traduit ceux qu'on a réellement rencontrés plutôt que d'afficher
 * « No company found with these superpdp_company_number_scheme… » à un
 * indépendant venu cocher une case de conformité.
 */
function traduire(detail: string): string {
  if (/no company found/i.test(detail)) {
    return (
      "Super PDP ne reconnaît pas l'entreprise transmise. Reprenez le raccordement " +
      "et saisissez vos informations directement dans leur formulaire."
    );
  }
  return detail;
}

export function SuperPdpCard() {
  const params = useSearchParams();
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(true);
  const [debranchement, setDebranchement] = useState(false);
  const [ouverture, setOuverture] = useState(false);
  const [messageLigne, setMessageLigne] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  // Fermer aussi la ligne d'annuaire en se débranchant.
  //
  // Décoché par défaut, et ce défaut est le bon : se débrancher de Deviso n'est
  // pas cesser d'exister. Quelqu'un qui change d'outil de facturation tout en
  // restant chez Super PDP doit rester joignable ; fermer sa ligne le rendrait
  // injoignable pour toute la France, sur un geste qu'il croyait limité à Deviso.
  const [fermerLigne, setFermerLigne] = useState(false);
  const [messageFermeture, setMessageFermeture] = useState<string | null>(null);

  const retourCle = params.get("superpdp");
  const retourDetail = params.get("detail");
  const retour = retourCle ? RETOURS[retourCle] ?? RETOURS.erreur : null;

  const relire = useCallback(async () => {
    try {
      const r = await fetch("/api/superpdp/status", { cache: "no-store" });
      if (r.ok) setEtat(await r.json());
    } catch {
      // Réseau : on laisse l'écran dans son dernier état connu plutôt que
      // d'afficher « non connecté », ce qui serait un mensonge.
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    relire();
  }, [relire]);

  const ouvrirLigne = async () => {
    setOuverture(true);
    setMessageLigne(null);
    try {
      const r = await fetch("/api/superpdp/ligne-annuaire", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessageLigne(d.message || d.error || "Ouverture impossible.");
        return;
      }
      setMessageLigne(
        d.dejaOuverte ? "Votre ligne est déjà ouverte." : "Ligne de réception ouverte."
      );
      await relire();
    } catch {
      setMessageLigne("Ouverture impossible : connexion interrompue.");
    } finally {
      setOuverture(false);
    }
  };

  const debrancher = async () => {
    setDebranchement(true);
    setMessageFermeture(null);
    try {
      const r = await fetch("/api/superpdp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fermerLigne }),
      });
      const d = await r.json().catch(() => ({}));
      // La fermeture peut échouer sans que le débranchement échoue — la route
      // ne retient personne parce que l'annuaire résiste. Le taire laisserait
      // partir quelqu'un convaincu de ne plus rien recevoir, alors qu'on lui
      // adresse encore des factures.
      if (fermerLigne && d?.ligne && d.ligne.fermee !== true) {
        setMessageFermeture(
          d.ligne.message ??
            "Votre ligne d'annuaire n'a pas pu être fermée : elle reste ouverte chez Super PDP."
        );
      }
      await relire();
      setConfirmation(false);
      setFermerLigne(false);
    } finally {
      setDebranchement(false);
    }
  };

  // Fonctionnalité pas encore activée côté serveur : inutile d'afficher une
  // carte sur laquelle rien n'est cliquable.
  if (!chargement && etat && !etat.available) return null;

  const verifie = etat?.connected && etat.status === "verified";
  const enAttente = etat?.connected && etat.status === "pending";
  const ligne = etat?.ligne ?? null;
  const joignable = verifie && ligne?.etat === "joignable";
  // Une ligne EN ERREUR ne s'ouvre pas : elle existe déjà.
  //
  // On proposait « Ouvrir ma ligne de réception » dans ce cas, avec un
  // encadré ambre alarmant. C'est le geste à ne pas faire. La documentation
  // Super PDP (article « Annuaire ») décrit l'erreur comme l'état NORMAL d'une
  // portabilité : quand une entreprise arrive d'une autre Plateforme Agréée,
  // « pendant le temps de la migration, la ligne d'annuaire est en erreur côté
  // SUPER PDP, mais ça n'est pas grave, il ne faut pas la supprimer ». L'ancien
  // plateforme a cinq jours pour répondre.
  //
  // Pousser l'utilisateur à créer une seconde ligne pendant ce transfert, c'est
  // l'inviter à casser sa propre migration. On ne propose donc l'ouverture que
  // lorsqu'il n'y a réellement aucune ligne.
  const ligneAOuvrir = verifie && (!ligne || ligne.etat === "absente");

  return (
    <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-semibold text-white">Plateforme Agréée</h2>
        {etat?.sandbox && (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
            bac à sable
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        À partir du <strong className="text-gray-400">1ᵉʳ septembre 2026</strong>, toutes les entreprises
        doivent pouvoir <strong className="text-gray-400">recevoir</strong> des factures électroniques.
        Le raccordement à une Plateforme Agréée est le moyen de le faire.
      </p>

      {retour && (
        <div
          className={`rounded-lg px-4 py-3 mb-4 text-sm ${
            retour.ton === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : retour.ton === "attente"
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}
        >
          <p>{retour.texte}</p>
          {retourDetail && <p className="text-xs opacity-80 mt-1 break-words">{traduire(retourDetail)}</p>}
        </div>
      )}

      {chargement ? (
        <p className="text-sm text-gray-500">Vérification du raccordement…</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                verifie ? "bg-emerald-400" : enAttente ? "bg-amber-400" : "bg-gray-600"
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm text-white font-medium">
                {verifie
                  ? joignable
                    ? "Raccordé"
                    : "Raccordé, mais pas encore joignable"
                  : enAttente
                    ? "Vérification en cours"
                    : "Non raccordé"}
              </p>
              {/* « Raccordé » et « joignable » sont deux choses différentes, et
                  les confondre était le mensonge le plus coûteux de cet écran :
                  c'est la ligne d'annuaire, pas la session, qui permet à un
                  fournisseur d'adresser une facture. */}
              <p className="text-xs text-gray-500 truncate">
                {verifie
                  ? ligne?.etat === "joignable"
                    ? "Vous pouvez recevoir des factures électroniques."
                    : ligne?.etat === "programmee"
                      ? `Votre ligne de réception s'ouvre le ${new Date(ligne.aPartirDu).toLocaleDateString("fr-FR")}.`
                      : ligne?.etat === "en_cours"
                        ? "Votre ligne de réception est en cours d'ouverture."
                        : ligne?.etat === "en_erreur"
                          ? "Votre ligne de réception est signalée en erreur. Si vous arrivez d'une autre Plateforme Agréée, c'est normal le temps du transfert."
                          : "Aucune ligne de réception : vos fournisseurs ne peuvent pas vous joindre."
                  : enAttente
                    ? (etat?.messageStatut?.texte ??
                      "Super PDP vérifie le rattachement de votre entreprise.")
                    : "Vous ne pouvez pas encore recevoir de factures électroniques."}
              </p>
            </div>
          </div>

          <a
            href="/api/superpdp/connect"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
              verifie
                ? "border border-ds-border text-gray-400 hover:text-white hover:bg-ds-elevated"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {verifie ? "Reconnecter" : enAttente ? "Relancer" : "Raccorder mon entreprise"}
          </a>
        </div>
      )}

      {/* Bac à sable contre production : la plateforme dit lequel, on le
          compare au nôtre. Se tromper, c'est émettre de vraies factures depuis
          un compte de test, ou croire tester alors qu'on engage le réseau
          national de facturation. */}
      {etat?.discordanceEnv && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-red-300 font-medium">Environnement incohérent</p>
          <p className="text-xs text-red-400/80 mt-1">{etat.discordanceEnv}</p>
        </div>
      )}

      {/* Le régime de TVA connu de la Plateforme Agréée.
          `/api/superpdp/status` le lit chez EUX, et non dans notre copie,
          précisément pour rendre visible une divergence. Le champ était calculé
          à chaque appel puis jeté : la carte ne le déclarait même pas. Vide,
          c'est la garantie que toute facture à un particulier sera refusée. */}
      {verifie && !etat?.regimeTva && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-300 font-medium">
            Vos factures aux particuliers seront refusées
          </p>
          <p className="text-xs text-amber-400/80 mt-1">
            La Plateforme Agréée ne connaît pas votre périodicité de déclaration de TVA. C&apos;est
            elle qui commande le calendrier d&apos;e-reporting.{" "}
            <a href="/profil#tva" className="underline hover:text-amber-300">
              Renseignez-la dans votre profil
            </a>
            .
          </p>
        </div>
      )}

      {/* Sans ligne d'annuaire, l'utilisateur n'était pas seulement mal
          informé : il n'avait aucun recours dans Deviso, et devait aller sur
          l'interface de Super PDP sans que rien ne le lui dise. */}
      {ligneAOuvrir && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-300 font-medium">
            Vos fournisseurs ne peuvent pas encore vous adresser de factures
          </p>
          <p className="text-xs text-amber-400/80 mt-1 mb-3">
            Votre entreprise est raccordée, mais aucune ligne n&apos;est ouverte à
            l&apos;annuaire. C&apos;est elle qui vous rend joignable.
          </p>
          <button
            onClick={ouvrirLigne}
            disabled={ouverture}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {ouverture ? "Ouverture…" : "Ouvrir ma ligne de réception"}
          </button>
          {messageLigne && <p className="text-xs text-amber-300 mt-2">{messageLigne}</p>}
        </div>
      )}

      {/* Une ligne en erreur : on informe, on ne pousse à rien.
          Voir le commentaire de `ligneAOuvrir` — c'est le plus souvent une
          portabilité en cours, et le seul geste utile est d'attendre. */}
      {verifie && ligne?.etat === "en_erreur" && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-300 font-medium">
            Votre ligne de réception est signalée en erreur
          </p>
          <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
            {ligne.message ? `${ligne.message} ` : ""}
            Si vous venez de quitter une autre Plateforme Agréée, c&apos;est
            attendu : votre ligne est en cours de transfert, et l&apos;ancienne
            plateforme a cinq jours pour répondre. N&apos;ouvrez pas de seconde
            ligne et ne supprimez pas celle-ci — vous interrompriez le transfert.
            Si la situation dure au-delà d&apos;une semaine, contactez la
            Plateforme Agréée.
          </p>
        </div>
      )}

      {/* L'adresse de réception : la seule information du raccordement que
          l'utilisateur ait besoin de connaître, puisque c'est ce qu'il
          communique à ses clients. Sélectionnable d'un coup, pour éviter les
          erreurs de recopie sur une chaîne de ce genre. */}
      {verifie && etat?.directoryAddress && (
        <div className="mt-4 bg-ds-elevated/50 border border-ds-border rounded-lg px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Votre adresse de facturation électronique</p>
          <p className="text-sm text-white font-mono break-all select-all">{etat.directoryAddress}</p>
          <p className="text-xs text-gray-600 mt-1.5">
            Communiquez-la à vos clients pour qu&apos;ils puissent vous adresser leurs factures.
          </p>
        </div>
      )}

      {/* Débranchement. Derrière une confirmation, parce que reprendre le
          tunnel d'autorisation n'est pas anodin — et parce qu'à partir du
          1er septembre 2026, se débrancher c'est cesser de pouvoir recevoir. */}
      {(verifie || enAttente) && (
        <div className="mt-4 pt-4 border-t border-ds-border">
          {confirmation ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 max-w-md">
                Vous ne recevrez plus de factures dans Deviso.
              </p>

              {/* Le choix qui manquait.
                  Deviso savait ouvrir une ligne d'annuaire, pas la fermer : on
                  prévenait que la ligne restait ouverte, et on envoyait la
                  personne finir la manœuvre sur l'interface de Super PDP.
                  Une moitié de cycle de vie.

                  Il fallait un choix, et pas un automatisme, parce que les deux
                  situations sont opposées et qu'elles se ressemblent : changer
                  d'outil, c'est rester joignable ; cesser son activité, c'est ne
                  plus l'être. Le défaut protège le cas réversible. */}
              {ligne && ligne.etat !== "absente" && (
                <label className="flex items-start gap-2.5 cursor-pointer max-w-md">
                  <input
                    type="checkbox"
                    checked={fermerLigne}
                    onChange={(e) => setFermerLigne(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-red-500"
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    Fermer aussi ma ligne de réception à l&apos;annuaire
                    <span className="block text-gray-600 mt-0.5">
                      À cocher seulement si vous cessez votre activité. Si vous
                      changez simplement d&apos;outil, laissez décoché&nbsp;: sinon
                      plus personne en France ne pourra vous adresser de facture.
                    </span>
                  </span>
                </label>
              )}

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    // Annuler efface AUSSI le choix de fermer la ligne. Sans
                    // ça, une case cochée puis abandonnée reste cochée au clic
                    // suivant : l'option la plus destructrice de cet écran
                    // survivrait à un renoncement explicite.
                    setConfirmation(false);
                    setFermerLigne(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-ds-border text-gray-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={debrancher}
                  disabled={debranchement}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {debranchement ? "Débranchement…" : "Confirmer"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmation(true)}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              Débrancher mon entreprise
            </button>
          )}
        </div>
      )}

      {/* La ligne n'a pas pu être fermée. On le dit, parce que quelqu'un qui
          repart en croyant sa ligne fermée continuera de recevoir des factures
          sans jamais les lire. */}
      {messageFermeture && (
        <p className="text-xs text-amber-400 mt-3 leading-relaxed">{messageFermeture}</p>
      )}

      {etat?.lastError && (
        <p className="text-xs text-red-400 mt-3 break-words">Dernière erreur : {etat.lastError}</p>
      )}
    </section>
  );
}
