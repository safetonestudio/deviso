import { ecrituresComptables, type AchatExport, type FactureExport, type LigneEcriture } from "./exports-comptables";
import { PLAN_PAR_DEFAUT, type PlanComptesFec } from "./plan-comptes-fec";

/**
 * Export Quadra ASCII (Cegid Quadra Comptabilité), 20/11/2026.
 *
 * Spécification : fiche Cegid « Fichier d'entrée ASCII », KB0014530, version
 * 2023.194.10 (table recopiée dans docs/reference/formats-import-logiciels.md).
 * Enregistrements à positions fixes, fin de ligne « Return » (CRLF).
 * - C (compte) : crée le compte auxiliaire de chaque client, rattaché au
 *   collectif clients ; placé avant les écritures. Pas de mise à jour d'un
 *   compte existant (position 217 à blanc).
 * - M (écriture) : 251 caractères, montant en centimes signé, date JJMMAA.
 * Les écritures sont exactement celles du FEC (ecrituresComptables) : même
 * équilibre, même TVA sur encaissements, même lettrage.
 *
 * Encodage : la fiche ne le précise pas ; on n'écrit que de l'ASCII imprimable
 * (accents retirés), lisible à l'identique en CP1252 comme en UTF-8.
 */

/** Texte ASCII imprimable, accents retirés, cadré à gauche sur `n` caractères. */
function alpha(v: string | null | undefined, n: number): string {
  const s = (v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, " ");
  return s.slice(0, n).padEnd(n, " ");
}

/** Compte Quadra sur 8 : chiffres complétés de zéros à droite (411000 -> 41100000). */
export function compteQuadra(compte: string): string {
  return compte.replace(/\s/g, "").slice(0, 8).padEnd(8, "0");
}

/**
 * Compte auxiliaire client sur 8 caractères, stable si le client change de nom :
 * « C » + SIREN écrit en base 36 (9 chiffres tiennent en 6 caractères, donc
 * aucune collision). Sans SIREN : le code du FEC (C + empreinte du nom).
 */
export function auxiliaireQuadra(siren: string | null | undefined, repli: string): string {
  const chiffres = (siren ?? "").replace(/\D/g, "");
  if (chiffres.length >= 9) return `C${Number(chiffres.slice(0, 9)).toString(36).toUpperCase().padStart(7, "0")}`;
  return repli.slice(0, 8).toUpperCase();
}

/**
 * Compte auxiliaire fournisseur sur 8 caractères : « F » + SIREN en base 36,
 * ou « F » + empreinte en base 36 du code du FEC (n° de TVA d'un fournisseur
 * étranger, trop long pour 8 caractères : tronquer ferait collisionner deux
 * fournisseurs d'un même pays).
 */
export function auxiliaireFournisseurQuadra(siren: string | null | undefined, repli: string): string {
  const chiffres = (siren ?? "").replace(/\D/g, "");
  if (chiffres.length >= 9) return `F${Number(chiffres.slice(0, 9)).toString(36).toUpperCase().padStart(7, "0")}`;
  let h = 0;
  for (let i = 0; i < repli.length; i++) h = (h * 31 + repli.charCodeAt(i)) >>> 0;
  return `F${h.toString(36).toUpperCase().padStart(7, "0").slice(-7)}`;
}

const auxiliaire = (l: LigneEcriture) =>
  l.tiers === "fournisseur" ? auxiliaireFournisseurQuadra(l.siren, l.auxNum) : auxiliaireQuadra(l.siren, l.auxNum);

/** Lettrage Quadra sur 2 lettres : 676 codes ; au-delà, pas de lettrage plutôt qu'un code réutilisé. */
function lettrageQuadra(rang: number | undefined): string {
  if (rang === undefined || rang >= 676) return "  ";
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return a[Math.floor(rang / 26)] + a[rang % 26];
}

const jjmmaa = (aaaammjj: string) => `${aaaammjj.slice(6, 8)}${aaaammjj.slice(4, 6)}${aaaammjj.slice(2, 4)}`;

/** Écrit `valeur` à la position `pos` (comptée à partir de 1) d'un enregistrement. */
function poser(ligne: string[], pos: number, valeur: string) {
  for (let i = 0; i < valeur.length; i++) ligne[pos - 1 + i] = valeur[i];
}

export type OptionsQuadra = {
  plan?: PlanComptesFec;
  /** Nom du PDF joint (8 + 3 caractères) par numéro de facture, placé à côté du fichier. */
  pieces?: Map<string, string>;
};

export function genererQuadra(invoices: FactureExport[], options: OptionsQuadra = {}, achats: AchatExport[] = []): string {
  const plan = options.plan ?? PLAN_PAR_DEFAUT;
  const ecritures = ecrituresComptables(invoices, plan, achats);
  const sortie: string[] = [];

  // Enregistrements C : un par client (type C, collectif 411) et par
  // fournisseur (type F, collectif 401), avant les écritures.
  const comptes = new Map<string, { libelle: string; fournisseur: boolean }>();
  for (const e of ecritures) {
    for (const l of e.lignes) {
      if (l.auxNum) comptes.set(auxiliaire(l), { libelle: l.auxLib, fournisseur: l.tiers === "fournisseur" });
    }
  }
  for (const [code, { libelle, fournisseur }] of comptes) {
    const c = Array<string>(219).fill(" ");
    poser(c, 1, "C");
    poser(c, 2, alpha(code, 8));
    poser(c, 10, alpha(libelle, 30));
    poser(c, 99, compteQuadra(fournisseur ? plan.fournisseurs : plan.clients));
    poser(c, 218, fournisseur ? "F" : "C");
    sortie.push(c.join("").trimEnd());
  }

  // Enregistrements M.
  for (const e of ecritures) {
    const pj = e.nature === "vente" ? options.pieces?.get(e.ref) : undefined;
    for (const l of e.lignes) {
      // Quadra veut un montant positif et un sens. Une ligne négative (TVA d'un
      // solde inférieure à celle de son acompte, par exemple) s'écrit dans le
      // sens inverse : un débit de -100 est un crédit de 100. L'ignorer
      // déséquilibrait l'écriture importée.
      const net = Math.round((l.debit - l.credit) * 100);
      if (net === 0) continue;
      const debit = net > 0;
      const montant = Math.abs(net);
      const m = Array<string>(251).fill(" ");
      poser(m, 1, "M");
      poser(m, 2, l.auxNum ? alpha(auxiliaire(l), 8) : compteQuadra(l.compte));
      poser(m, 10, alpha(e.journal, 2));
      poser(m, 12, "000");
      poser(m, 15, jjmmaa(e.date));
      poser(m, 42, debit ? "D" : "C");
      poser(m, 43, "+" + String(montant).padStart(12, "0"));
      poser(m, 70, l.auxNum ? lettrageQuadra(l.rangLettrage) : "  ");
      poser(m, 108, "EUR");
      poser(m, 111, alpha(e.journal, 3));
      poser(m, 117, alpha(l.auxLib ? `${e.lib} ${l.auxLib}` : e.lib, 30));
      if (pj) poser(m, 182, alpha(pj, 12));
      poser(m, 232, alpha(e.ref, 20));
      sortie.push(m.join(""));
    }
  }
  return sortie.join("\r\n") + "\r\n";
}

/** Nom 8.3 du PDF joint, imposé par la position 182 (8 caractères + extension sur 3). */
export const nomPieceQuadra = (rang: number) => `P${String(rang + 1).padStart(7, "0")}.pdf`;
