import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { libelleEtatFlux } from "@/lib/chorus-etats";

export { libelleEtatFlux };

/**
 * Chorus Pro (factures aux administrations), via l'API PISTE de l'AIFE.
 *
 * Refait le 20/11/2026. L'ancienne route envoyait une facture « saisie »
 * (lignes, montants, TVA en JSON) à `factures/v1/deposer/flux`, qui n'accepte
 * qu'un FICHIER (champs fichierFlux / nomFichier / syntaxeFlux) : chaque dépôt
 * aurait été refusé. Aucun dépôt réel n'avait jamais eu lieu, ce qui l'a caché.
 *
 * Choix retenu : déposer tel quel le PDF Factur-X que Deviso produit déjà
 * (validé par le validateur officiel, `test:conformite`), syntaxe
 * `IN_DP_E2_CII_FACTURX`. Chorus Pro lit le destinataire, les montants et les
 * lignes dans le XML embarqué : une seule source de vérité, au lieu d'une
 * seconde description de la facture qui pouvait diverger du PDF.
 *
 * Contrat établi d'après le client open source go-choruspro (fichiers
 * factures_depots.go, transverses_flux.go, transverses.go), la documentation
 * AIFE étant en maintenance le 20/11/2026. ⚠️ À confirmer par un dépôt réel en
 * bac à sable (CHORUS_PRO_SANDBOX=true) avant d'annoncer la fonction prouvée.
 */

export const SYNTAXE_FACTURX = "IN_DP_E2_CII_FACTURX";

/** Bac à sable PISTE si CHORUS_PRO_SANDBOX=true, production sinon. */
export function configChorus() {
  const sandbox = process.env.CHORUS_PRO_SANDBOX === "true";
  return {
    sandbox,
    oauthUrl: sandbox
      ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
      : "https://oauth.piste.gouv.fr/api/oauth/token",
    apiBase: sandbox ? "https://sandbox-api.piste.gouv.fr/cpro" : "https://api.piste.gouv.fr/cpro",
  };
}

export async function jetonPiste(): Promise<string> {
  const { oauthUrl } = configChorus();
  const res = await fetch(oauthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.PISTE_CLIENT_ID ?? "",
      client_secret: process.env.PISTE_CLIENT_SECRET ?? "",
      scope: "openid",
    }),
  });
  if (!res.ok) throw new Error(`authentification PISTE refusée (${res.status})`);
  const data = await res.json();
  if (!data.access_token) throw new Error("authentification PISTE sans jeton");
  return data.access_token as string;
}

// ─── Mot de passe du compte technique Chorus Pro ─────────────────────────────
// Il était stocké en clair et renvoyé au navigateur par GET /api/profile. Il est
// désormais chiffré (AES-256-GCM) et n'est plus jamais renvoyé. La clé dérive de
// SUPABASE_SERVICE_ROLE_KEY, secret déjà présent partout où le code serveur
// tourne : pas de nouvelle variable à poser. ⚠️ Changer cette clé de service
// rend les mots de passe enregistrés illisibles : les utilisateurs devront les
// ressaisir (aucun n'était configuré au 20/11/2026).

const PREFIXE = "v1:";

function cle(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("clé de chiffrement indisponible");
  return createHash("sha256").update(`deviso/chorus-pro/${base}`).digest();
}

export function chiffrerMotDePasse(clair: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cle(), iv);
  const corps = Buffer.concat([c.update(clair, "utf8"), c.final()]);
  return PREFIXE + Buffer.concat([iv, c.getAuthTag(), corps]).toString("base64");
}

/** Accepte aussi une valeur ancienne, enregistrée en clair avant le chiffrement. */
export function dechiffrerMotDePasse(stocke: string): string {
  if (!stocke.startsWith(PREFIXE)) return stocke;
  const brut = Buffer.from(stocke.slice(PREFIXE.length), "base64");
  const d = createDecipheriv("aes-256-gcm", cle(), brut.subarray(0, 12));
  d.setAuthTag(brut.subarray(12, 28));
  return Buffer.concat([d.update(brut.subarray(28)), d.final()]).toString("utf8");
}

/** En-tête `cpro-account` : base64 de « login:mot de passe » du compte technique. */
export function enteteCompte(login: string, motDePasseStocke: string): string {
  return Buffer.from(`${login}:${dechiffrerMotDePasse(motDePasseStocke)}`).toString("base64");
}

// ─── Identifiant du destinataire ─────────────────────────────────────────────

/**
 * Une structure publique est identifiée sur Chorus Pro par son SIRET
 * (14 chiffres), pas par son SIREN : une commune a un seul SIREN mais
 * plusieurs établissements. Renvoie le SIRET nettoyé, ou null.
 */
export function siretDestinataire(saisi: string | null | undefined): string | null {
  const chiffres = (saisi ?? "").replace(/\D/g, "");
  return chiffres.length === 14 ? chiffres : null;
}

// ─── Appels ──────────────────────────────────────────────────────────────────

function entetes(jeton: string, compte: string) {
  return {
    Authorization: `Bearer ${jeton}`,
    "cpro-account": compte,
    "Content-Type": "application/json;charset=utf-8",
    Accept: "application/json;charset=utf-8",
  };
}

export type ResultatDepot = { numeroFluxDepot: string; codeRetour?: number; libelle?: string };

export async function deposerFacturX(opts: {
  jeton: string;
  compte: string;
  pdfBase64: string;
  nomFichier: string;
  idUtilisateurCourant?: number | null;
}): Promise<ResultatDepot> {
  const { apiBase } = configChorus();
  const res = await fetch(`${apiBase}/factures/v1/deposer/flux`, {
    method: "POST",
    headers: entetes(opts.jeton, opts.compte),
    body: JSON.stringify({
      ...(opts.idUtilisateurCourant ? { idUtilisateurCourant: opts.idUtilisateurCourant } : {}),
      fichierFlux: opts.pdfBase64,
      nomFichier: opts.nomFichier,
      syntaxeFlux: SYNTAXE_FACTURX,
      avecSignature: false,
    }),
  });
  const texte = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(texte); } catch { /* corps non JSON : gardé dans l'erreur */ }
  // codeRetour 0 = succès ; tout autre code porte un libellé d'erreur métier.
  if (!res.ok || (typeof data.codeRetour === "number" && data.codeRetour !== 0) || !data.numeroFluxDepot) {
    throw new Error(`dépôt refusé par Chorus Pro (${res.status}) : ${(data.libelle as string) ?? texte.slice(0, 300)}`);
  }
  return { numeroFluxDepot: String(data.numeroFluxDepot), codeRetour: data.codeRetour as number, libelle: data.libelle as string };
}

export type CompteRendu = { etat: string; libelle: string; raw: Record<string, unknown> };

/** Compte rendu de traitement d'un flux déposé (intégré, rejeté...). */
export async function consulterCompteRendu(opts: { jeton: string; compte: string; numeroFluxDepot: string }): Promise<CompteRendu> {
  const { apiBase } = configChorus();
  const res = await fetch(`${apiBase}/transverses/v1/consulterCR`, {
    method: "POST",
    headers: entetes(opts.jeton, opts.compte),
    body: JSON.stringify({ numeroFluxDepot: opts.numeroFluxDepot, syntaxeFlux: SYNTAXE_FACTURX }),
  });
  const texte = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(texte); } catch { /* idem */ }
  if (!res.ok) throw new Error(`compte rendu indisponible (${res.status}) : ${texte.slice(0, 300)}`);
  const etat = String(data.etatCourantFlux ?? "");
  return { etat, libelle: libelleEtatFlux(etat), raw: data };
}
