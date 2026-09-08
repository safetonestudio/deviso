/**
 * Pourquoi une facture ne porte pas de TVA — la regle, sans reseau.
 *
 * Pourquoi cette traversee existe. Le PDF, le XML transmis a l'administration
 * et l'ecran tiraient tous les trois la meme conclusion d'une seule donnee :
 * `tva_rate === 0` valait « franchise en base, art. 293 B du CGI ». C'est la
 * mention du micro-entrepreneur non assujetti, et elle s'imprimait sur toute
 * facture a 0 % — y compris la livraison intracommunautaire d'un assujetti,
 * qui se voyait donc declarer par ecrit un regime fiscal qui n'est pas le sien.
 *
 * Rien ne levait d'erreur : le document est valide, il est simplement faux.
 * C'est exactement le profil de defaut qu'aucun test d'integration n'attrape,
 * et qu'une regle pure et tabulee attrape en une ligne.
 */

import { verifier, bilan } from "./lib.mjs";
import { motifExoneration } from "../../lib/exoneration.ts";
import { cronAutorise } from "../../lib/cron-auth.ts";

console.log("");
console.log("── Exoneration de TVA : quatre causes, pas une ────────────────");
console.log("");

const assujetti = { seller_tva_number: "FR12345678901" };
const franchise = { seller_tva_number: null };

// ── Le cas nominal : il ne doit pas changer ─────────────────────────────────

const avecTva = motifExoneration({ ...assujetti, tva_rate: 20, client_country: "FR" });
verifier(
  "une facture avec TVA reste categorie S, sans mention",
  avecTva.categorie === "S" && avecTva.mention === "" && avecTva.certaine,
  JSON.stringify(avecTva),
);

// ── Franchise en base : le seul cas ou 293 B est vrai ───────────────────────

const micro = motifExoneration({ ...franchise, tva_rate: 0, client_country: "FR" });
verifier(
  "un vendeur sans numero de TVA est en franchise : categorie E",
  micro.categorie === "E" && micro.certaine,
  JSON.stringify(micro),
);
verifier(
  "et lui seul cite l'article 293 B",
  /293 B/.test(micro.mention),
  micro.mention,
);

// Un micro-entrepreneur qui facture a l'etranger reste en franchise.
const microExport = motifExoneration({
  ...franchise,
  tva_rate: 0,
  client_country: "BE",
  client_company: "Studio Bruxelles SPRL",
});
verifier(
  "la franchise suit le vendeur, y compris a l'export",
  microExport.categorie === "E" && /293 B/.test(microExport.mention),
  microExport.mention,
);

// ── Livraison intracommunautaire ────────────────────────────────────────────

const intracom = motifExoneration({
  ...assujetti,
  tva_rate: 0,
  client_country: "BE",
  client_company: "Studio Bruxelles SPRL",
  client_vat_number: "BE0123456789",
});
verifier(
  "une livraison intracommunautaire est categorie K",
  intracom.categorie === "K" && intracom.certaine,
  JSON.stringify(intracom),
);
verifier(
  "et sa mention est l'autoliquidation, pas la franchise",
  /262 ter/.test(intracom.mention) && !/293 B/.test(intracom.mention),
  intracom.mention,
);

// Sans numero de TVA du client, l'exoneration intracom n'est pas justifiable.
const intracomSansNumero = motifExoneration({
  ...assujetti,
  tva_rate: 0,
  client_country: "DE",
  client_company: "Muster GmbH",
});
verifier(
  "sans numero de TVA client, on n'affirme aucune exoneration",
  intracomSansNumero.certaine === false && !/262 ter|293 B/.test(intracomSansNumero.mention),
  JSON.stringify(intracomSansNumero),
);
verifier(
  "et l'on dit ce qui manque, nommement",
  /numero de TVA|numéro de TVA/i.test(intracomSansNumero.manque ?? ""),
  intracomSansNumero.manque,
);

// ── Exportation hors Union ──────────────────────────────────────────────────

const exportUs = motifExoneration({
  ...assujetti,
  tva_rate: 0,
  client_country: "US",
  client_company: "Acme Inc",
});
verifier(
  "une exportation hors UE est categorie G",
  exportUs.categorie === "G" && exportUs.certaine,
  JSON.stringify(exportUs),
);
verifier(
  "et cite l'article 262 I, pas 293 B",
  /262 I/.test(exportUs.mention) && !/293 B/.test(exportUs.mention),
  exportUs.mention,
);

const exportSuisse = motifExoneration({
  ...assujetti,
  tva_rate: 0,
  client_country: "CH",
  client_company: "Muster AG",
});
verifier(
  "la Suisse est hors Union : exportation, pas intracommunautaire",
  exportSuisse.categorie === "G",
  JSON.stringify(exportSuisse),
);

// ── Assujetti, operation francaise, taux a zero : on n'invente pas ──────────

const francaisZero = motifExoneration({
  ...assujetti,
  tva_rate: 0,
  client_country: "FR",
  client_company: "Client SARL",
});
verifier(
  "un assujetti facturant 0 % en France : aucune reference d'article inventee",
  francaisZero.certaine === false && !/293 B|262/.test(francaisZero.mention),
  JSON.stringify(francaisZero),
);
verifier(
  "ecrire un mauvais article est pire que n'en ecrire aucun",
  francaisZero.mention === "TVA non applicable",
  francaisZero.mention,
);

// ── Monaco et les DOM suivent la France ─────────────────────────────────────

for (const pays of ["MC", "RE", "GP"]) {
  const d = motifExoneration({ ...assujetti, tva_rate: 0, client_country: pays, client_company: "X" });
  verifier(
    `${pays} n'est pas traite comme une exportation`,
    d.categorie !== "G" && d.categorie !== "K",
    JSON.stringify(d),
  );
}

// ── Le secret des taches planifiees ─────────────────────────────────────────

console.log("");
console.log("── Taches planifiees : un secret absent ferme la porte ────────");
console.log("");

const entete = (v) => ({ headers: { get: (n) => (n.toLowerCase() === "authorization" ? v : null) } });
const secretInitial = process.env.CRON_SECRET;

delete process.env.CRON_SECRET;
verifier(
  "sans CRON_SECRET, « Bearer undefined » ne passe pas",
  cronAutorise(entete("Bearer undefined")) === false,
  "c'etait la chaine que produisait le gabarit, et elle etait devinable",
);
verifier(
  "sans CRON_SECRET, rien ne passe du tout",
  [null, "", "Bearer ", "Bearer x"].every((v) => cronAutorise(entete(v)) === false),
  "une variable oubliee au deploiement ouvrait l'envoi de toutes les relances",
);

process.env.CRON_SECRET = "court";
verifier(
  "un secret trop court est refuse plutot qu'accepte",
  cronAutorise(entete("Bearer court")) === false,
  "16 caracteres minimum : un secret de cinq lettres n'en est pas un",
);

process.env.CRON_SECRET = "un-secret-suffisamment-long-2026";
verifier(
  "le bon secret passe",
  cronAutorise(entete("Bearer un-secret-suffisamment-long-2026")) === true,
  "sans quoi les taches planifiees ne tourneraient plus",
);
verifier(
  "un secret voisin ne passe pas",
  cronAutorise(entete("Bearer un-secret-suffisamment-long-2027")) === false,
  "comparaison en temps constant, mais comparaison quand meme",
);
verifier(
  "un prefixe du bon secret ne passe pas",
  cronAutorise(entete("Bearer un-secret")) === false,
  "les longueurs different : refus avant toute comparaison",
);

if (secretInitial === undefined) delete process.env.CRON_SECRET;
else process.env.CRON_SECRET = secretInitial;

bilan();
