/**
 * La regle de detection des factures bloquees.
 *
 * Pourquoi une traversee dediee. Cette regle est la seule protection contre la
 * classe de panne qui a produit tous les defauts du 30/08/2026 : l'echec
 * silencieux. Si elle se trompe, elle se trompe dans les deux sens, et les deux
 * sont graves :
 *
 *   - trop bavarde, elle signale des factures qui vont bien. L'utilisateur
 *     apprend a ignorer l'alerte, et le jour ou elle est vraie il ne la lit
 *     plus. Une alerte qu'on ignore est pire qu'une absence d'alerte, parce
 *     qu'elle donne l'illusion d'une surveillance ;
 *   - trop discrete, elle laisse passer une facture jamais remise, et on est
 *     revenu au point de depart.
 *
 * Elle est pure et prend l'heure en parametre : on peut donc l'eprouver sur des
 * scenarios datés sans rien attendre, et sans toucher a la Plateforme Agreee.
 */

import { verifier, bilan } from "./lib.mjs";
import { factureBloquee, depuis, SEUIL_TRANSPORT_HEURES, SEUIL_SANS_STATUT_HEURES } from "../../lib/superpdp-blocage.ts";

const T0 = Date.parse("2026-08-30T12:00:00Z");
const ilYA = (heures) => new Date(T0 - heures * 3_600_000).toISOString();

console.log("Detection des factures bloquees\n");

// ── Ce qui NE doit PAS alerter ─────────────────────────────────────────────

verifier(
  "Une facture jamais transmise n'est pas un blocage",
  factureBloquee({ superpdp_invoice_id: null, superpdp_status: null, updated_at: ilYA(500) }, T0) === null,
  "manquesPourEmission couvre deja ce cas ; le dire deux fois serait du bruit",
);

verifier(
  "Une facture tout juste deposee n'alerte pas",
  factureBloquee(
    { superpdp_invoice_id: "1", superpdp_status: "api:uploaded", superpdp_status_date: ilYA(2) },
    T0,
  ) === null,
  "l'acheminement a le droit de prendre quelques minutes",
);

verifier(
  "Une facture remise et en attente du destinataire n'alerte jamais, meme apres des mois",
  factureBloquee(
    { superpdp_invoice_id: "1", superpdp_status: "fr:202", superpdp_status_date: ilYA(24 * 90) },
    T0,
  ) === null,
  "fr:202 = correctement remise ; y rester est le delai de paiement, pas une panne",
);

for (const attente of ["fr:203", "fr:204", "fr:205", "fr:211"]) {
  verifier(
    `${attente} ne declenche pas d'alerte apres 30 jours`,
    factureBloquee(
      { superpdp_invoice_id: "1", superpdp_status: attente, superpdp_status_date: ilYA(24 * 30) },
      T0,
    ) === null,
  );
}

for (const fin of ["fr:212", "fr:210", "fr:213", "fr:501", "api:invalid", "api:rejected"]) {
  verifier(
    `${fin} est un statut cloturant : jamais signale comme bloque`,
    factureBloquee(
      { superpdp_invoice_id: "1", superpdp_status: fin, superpdp_status_date: ilYA(24 * 365) },
      T0,
    ) === null,
    "la facture a fini sa vie, meme mal",
  );
}

// ── Ce qui DOIT alerter ─────────────────────────────────────────────────────

const coincee = factureBloquee(
  {
    superpdp_invoice_id: "1",
    superpdp_status: "api:uploaded",
    superpdp_status_date: ilYA(72),
    superpdp_adresse_source: "saisie",
  },
  T0,
);
verifier("Trois jours en api:uploaded declenche une alerte", coincee !== null);
verifier("L'alerte compte les heures", coincee?.heures === 72, `heures = ${coincee?.heures}`);
verifier("L'alerte propose un remede", Boolean(coincee?.remede?.length));
verifier(
  "Sans adresse deduite, le remede n'invite pas a retransmettre",
  /ne la retransmettez pas/.test(coincee?.remede ?? ""),
  "reemettre une facture dont on ignore le sort risque le doublon",
);

const adresseDeduite = factureBloquee(
  {
    superpdp_invoice_id: "1",
    superpdp_status: "api:uploaded",
    superpdp_status_date: ilYA(72),
    superpdp_adresse_source: "siren",
  },
  T0,
);
verifier(
  "Adresse deduite du SIREN : la raison nomme la cause reelle",
  /SIREN/.test(adresseDeduite?.raison ?? ""),
  adresseDeduite?.raison,
);
verifier(
  "Adresse deduite : le remede est actionnable par l'utilisateur",
  /adresse de facturation electronique|adresse de facturation électronique/i.test(adresseDeduite?.remede ?? ""),
  "c'est le seul cas qu'il peut corriger lui-meme",
);

// Le cas que le test initial avait manque, et que les donnees reelles ont
// rattrape : 16 factures B2C sur 16 dormaient a api:uploaded sans avoir jamais
// progresse. Un particulier n'a pas d'adresse electronique — la plateforme n'a
// rien a acheminer et retient la facture pour l'e-reporting. Les signaler
// aurait noye toutes les vraies alertes.
verifier(
  "Une facture B2C reste a api:uploaded sans jamais etre signalee",
  factureBloquee(
    {
      superpdp_invoice_id: "1",
      superpdp_status: "api:uploaded",
      superpdp_status_date: ilYA(24 * 60),
      superpdp_adresse_source: "aucune",
    },
    T0,
  ) === null,
  "c'est son etat normal et definitif, pas une panne",
);

const muette = factureBloquee(
  { superpdp_invoice_id: "1", superpdp_status: null, updated_at: ilYA(10) },
  T0,
);
verifier("Transmise sans aucun statut apres 10 h : alerte", muette !== null);
verifier(
  "Le silence total est attrape plus tot que la stagnation",
  SEUIL_SANS_STATUT_HEURES < SEUIL_TRANSPORT_HEURES,
  `${SEUIL_SANS_STATUT_HEURES} h contre ${SEUIL_TRANSPORT_HEURES} h`,
);

// ── Les bords du seuil ──────────────────────────────────────────────────────

verifier(
  `Juste sous le seuil (${SEUIL_TRANSPORT_HEURES - 1} h) : pas d'alerte`,
  factureBloquee(
    { superpdp_invoice_id: "1", superpdp_status: "api:uploaded", superpdp_status_date: ilYA(SEUIL_TRANSPORT_HEURES - 1) },
    T0,
  ) === null,
);
verifier(
  `Pile au seuil (${SEUIL_TRANSPORT_HEURES} h) : alerte`,
  factureBloquee(
    { superpdp_invoice_id: "1", superpdp_status: "api:uploaded", superpdp_status_date: ilYA(SEUIL_TRANSPORT_HEURES) },
    T0,
  ) !== null,
);

// ── Robustesse : une date illisible ne doit pas inventer un blocage ─────────

verifier(
  "Une date de statut absente n'invente pas de blocage",
  factureBloquee({ superpdp_invoice_id: "1", superpdp_status: "api:uploaded" }, T0) === null,
);
verifier(
  "Une date de statut illisible n'invente pas de blocage",
  factureBloquee(
    { superpdp_invoice_id: "1", superpdp_status: "api:uploaded", superpdp_status_date: "pas-une-date" },
    T0,
  ) === null,
  "mieux vaut ne rien dire que crier au loup sur une donnee corrompue",
);
verifier(
  "Un statut inconnu de la table n'est pas signale comme bloque",
  factureBloquee(
    { superpdp_invoice_id: "1", superpdp_status: "fr:999", superpdp_status_date: ilYA(1000) },
    T0,
  ) === null,
  "leur nomenclature evolue : on ne prete pas une panne a un code qu'on ne connait pas",
);

// ── La formulation, qui est la moitie du travail ────────────────────────────

verifier("depuis(3) se lit « depuis 3 heures »", depuis(3) === "depuis 3 heures");
verifier("depuis(1) est au singulier", depuis(1) === "depuis 1 heure");
verifier("depuis(72) bascule en jours", depuis(72) === "depuis 3 jours");

process.exit(bilan());
