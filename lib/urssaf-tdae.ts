/**
 * Client de l'API Tierce Déclaration auto-entrepreneur (TDAE) de l'URSSAF.
 *
 * Sources (relues le 24/10/2026) :
 *  - ACOSS-Documentation-API-TDAEV1 v1.5.0 (PDF du portail API URSSAF) ;
 *  - contrat Swagger 2.0 de production, version 1.5.1
 *    (host api.urssaf.fr, basePath /tiersdecl/v1/ae).
 *
 * Authentification : OAuth2 Client Credentials, jeton sur
 * https://api.urssaf.fr/api/oauth/v1/token, scope `tiersdecl.ae`.
 * Quota : 300 requêtes par minute (HTTP 429 au-delà).
 *
 * Services couverts (le télépaiement SEPA, API 060 à 075, est volontairement
 * hors périmètre de départ, cf. demande d'habilitation D99994) :
 *  - 020 GET    /comptes   vérification du compte, périodicité, mandat présent
 *  - 030 POST   /mandats   notification du mandat (mail envoyé à l'AE)
 *  - 031 DELETE /mandats   annulation du mandat (mail envoyé à l'AE)
 *  - 040 POST   /estimer   estimation des cotisations
 *  - 050 POST   /declarer  télédéclaration du CA (mail envoyé à l'AE ; une
 *                          nouvelle déclaration sur la même période ouverte
 *                          annule et remplace la précédente)
 *
 * Le NIR est déprécié par l'URSSAF : seul le SIRET est transmis.
 *
 * Modes (variable URSSAF_TDAE_MODE) :
 *  - absent       : fonction inactive, aucune route n'est exposée ;
 *  - "simulation" : aucun appel réseau, réponses produites par le simulateur
 *                   ci-dessous qui applique les règles et erreurs documentées ;
 *  - "sandbox"    : bac à sable URSSAF (URL fournies à l'ouverture de l'accès) ;
 *  - "production" : exige en plus URSSAF_TDAE_PRODUCTION_AUTORISEE=oui. Une
 *                   déclaration sociale transmise à tort n'est pas un bug qu'on
 *                   corrige en silence : on ne l'active qu'après un parcours
 *                   complet réussi en bac à sable.
 */
import {
  type Periodicite,
  type PeriodeTdae,
  periodeADeclarer,
  periodeConformeA,
  dateExigibilite,
} from "@/lib/urssaf-periodes";

// ---------------------------------------------------------------------------
// Types du contrat
// ---------------------------------------------------------------------------

/** Objet CaAe : montants entiers en euros, centimes non comptabilisés. */
export type CaAe = {
  caVente: number;
  caLocation: number;
  caPrestationService: number;
  caPrestationAutres: number;
  recettesCipav: number;
};

export type CategorieCa = keyof CaAe;

/**
 * Catégories de CA de l'objet CaAe, avec leur intitulé URSSAF. Le
 * micro-entrepreneur choisit la sienne une fois, au moment du mandat.
 */
export const CATEGORIES_CA: Record<CategorieCa, string> = {
  caPrestationAutres: "Prestations de services libérales non réglementées (BNC, régime général)",
  caPrestationService: "Prestations de services commerciales ou artisanales (BIC)",
  caVente: "Vente de marchandises",
  recettesCipav: "Profession libérale relevant de la CIPAV",
  caLocation: "Location de meublé de tourisme classé",
};

export function estCategorieCa(v: unknown): v is CategorieCa {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(CATEGORIES_CA, v);
}

/** Objet Compte (API 020). date_etat et exoAccrePresent : documentation PDF. */
export type CompteAe = {
  mandatPresent: boolean;
  periodicite: Periodicite;
  /** Date d'affiliation (début d'activité), format JJ/MM/AAAA côté URSSAF. */
  date_etat?: string;
  exoAccrePresent?: boolean;
};

/** Objet MontantsAe (contrat 1.5.1, champs « VL » = versement libératoire). */
export type MontantsAe = {
  montantTotal: number;
  montantVente?: number;
  montantVenteVL?: number;
  montantLocation?: number;
  montantLocationVL?: number;
  montantPrestationService?: number;
  montantPrestationServiceVL?: number;
  montantPrestationAutres?: number;
  montantPrestationAutresVL?: number;
  montantFormationProfessionnelle?: number;
  montantCipav?: number;
  montantCipavVL?: number;
  taxeCMAVente?: number;
  taxeCMAService?: number;
  taxeCCIVente?: number;
  taxeCCIService?: number;
  montantRegulAcre?: number;
  montantDeduction?: number;
};

export type ResultatEstimation = { montants: MontantsAe; periode?: PeriodeTdae };

export type ResultatDeclaration = {
  montants: MontantsAe;
  /** Date d'exigibilité, AAAA-MM-JJ. */
  dateExigibilite: string;
  /** Numéro de certificat URSSAF, 8 chiffres, stable si la déclaration est remplacée. */
  certificat: string;
  /** Identifiant technique propre à chaque déclaration (23 caractères max). */
  idDeclaration: string;
};

/**
 * Somme réellement due après une déclaration (§ 3.5.3) :
 * montantTotal + montantRegulAcre + montantDeduction.
 */
export function cotisationsDues(m: MontantsAe): number {
  return m.montantTotal + (m.montantRegulAcre ?? 0) + (m.montantDeduction ?? 0);
}

/** CaAe complet : la catégorie choisie porte le montant, les autres valent 0. */
export function construireCa(categorie: CategorieCa, montant: number): CaAe {
  const ca: CaAe = { caVente: 0, caLocation: 0, caPrestationService: 0, caPrestationAutres: 0, recettesCipav: 0 };
  ca[categorie] = montant;
  return ca;
}

// ---------------------------------------------------------------------------
// Erreurs
// ---------------------------------------------------------------------------

/** Codes d'erreur documentés (§ 3.1 à 3.5), plus ceux propres à Deviso. */
export type CodeErreurTdae =
  | "PARAM_INVALIDE"
  | "ERR_PARAM_MULTIPLES"
  | "CPTE_INCONNU"
  | "ABN_INCONNU"
  | "SIRET_DEJA_MANDATE"
  | "MDT_INCONNU"
  | "MDT_HORS_PERIODE"
  | "APPEL_INCONNU"
  | "PERIODICITE_INVALIDE"
  | "ERR_TECHNIQUE"
  | "QUOTA_DEPASSE"
  | "AUTH_REFUSEE"
  | "CONFIG_ABSENTE"
  | "INCONNU";

/** Message affiché à l'utilisateur, en clair, pour chaque code. */
export const MESSAGES_ERREUR: Record<CodeErreurTdae, string> = {
  PARAM_INVALIDE: "L'URSSAF a refusé un des éléments transmis. Vérifiez votre SIRET et votre date de naissance.",
  ERR_PARAM_MULTIPLES: "Requête refusée par l'URSSAF (paramètres en double).",
  CPTE_INCONNU: "Aucun compte auto-entrepreneur actif n'est rattaché à ce SIRET à l'URSSAF.",
  ABN_INCONNU: "Votre compte existe à l'URSSAF mais aucun accès en ligne n'y est actif. Créez votre espace sur autoentrepreneur.urssaf.fr.",
  SIRET_DEJA_MANDATE: "Un autre service déclare déjà pour vous à l'URSSAF. Un seul tiers déclarant est possible à la fois : révoquez d'abord l'autre mandat.",
  MDT_INCONNU: "Aucun mandat n'autorise Deviso à déclarer pour vous. Donnez d'abord votre mandat.",
  MDT_HORS_PERIODE: "Votre mandat a été donné après la date limite de cette période : déclarez-la directement sur autoentrepreneur.urssaf.fr.",
  APPEL_INCONNU: "Cette période n'est pas ouverte à la déclaration à l'URSSAF (trop tôt, ou déjà close).",
  PERIODICITE_INVALIDE: "La période ne correspond pas à votre rythme de déclaration connu de l'URSSAF (mensuel ou trimestriel).",
  ERR_TECHNIQUE: "L'URSSAF rencontre une erreur technique. Réessayez plus tard.",
  QUOTA_DEPASSE: "Trop de demandes envoyées à l'URSSAF en peu de temps. Réessayez dans une minute.",
  AUTH_REFUSEE: "Deviso n'a pas pu s'authentifier auprès de l'URSSAF. L'équipe est prévenue.",
  CONFIG_ABSENTE: "La déclaration URSSAF n'est pas encore disponible.",
  INCONNU: "Réponse inattendue de l'URSSAF. Réessayez plus tard.",
};

export class ErreurTdae extends Error {
  constructor(
    public readonly code: CodeErreurTdae,
    public readonly status: number,
    public readonly detail?: string
  ) {
    super(MESSAGES_ERREUR[code]);
    this.name = "ErreurTdae";
  }
}

const CODES_CONNUS = new Set<string>(Object.keys(MESSAGES_ERREUR));

/** Traduit une réponse d'erreur HTTP de l'API en ErreurTdae. */
export function erreurDepuisReponse(status: number, corps: unknown): ErreurTdae {
  if (status === 429) return new ErreurTdae("QUOTA_DEPASSE", status);
  if (status === 401 || status === 403) return new ErreurTdae("AUTH_REFUSEE", status);
  const c = corps && typeof corps === "object" ? (corps as Record<string, unknown>) : {};
  // La documentation montre des codes entourés d'espaces (" PARAM_INVALIDE ").
  const code = typeof c.code === "string" ? c.code.trim() : "";
  const detail = typeof c.description === "string" ? c.description.trim() : undefined;
  if (CODES_CONNUS.has(code)) return new ErreurTdae(code as CodeErreurTdae, status, detail);
  if (status >= 500) return new ErreurTdae("ERR_TECHNIQUE", status, detail);
  return new ErreurTdae("INCONNU", status, detail);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type ModeTdae = "simulation" | "sandbox" | "production";

export type ConfigTdae = {
  mode: ModeTdae;
  apiUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
};

const URL_PRODUCTION = "https://api.urssaf.fr";
const TOKEN_PRODUCTION = "https://api.urssaf.fr/api/oauth/v1/token";
export const SCOPE_TDAE = "tiersdecl.ae";
const BASE_PATH = "/tiersdecl/v1/ae";

/**
 * Lit la configuration. Renvoie null quand la fonction est inactive : les
 * routes répondent alors 404, rien n'est montré à l'utilisateur.
 */
export function lireConfigTdae(env: Record<string, string | undefined> = process.env): ConfigTdae | null {
  const mode = env.URSSAF_TDAE_MODE;
  if (mode === "simulation") {
    return { mode, apiUrl: "simulation", tokenUrl: "simulation", clientId: "", clientSecret: "" };
  }
  if (mode !== "sandbox" && mode !== "production") return null;
  if (mode === "production" && env.URSSAF_TDAE_PRODUCTION_AUTORISEE !== "oui") return null;
  const clientId = env.URSSAF_TDAE_CLIENT_ID ?? "";
  const clientSecret = env.URSSAF_TDAE_CLIENT_SECRET ?? "";
  // Les adresses du bac à sable ne sont pas publiées : elles arrivent avec
  // l'accès. On refuse de deviner, la configuration doit les donner.
  const apiUrl = env.URSSAF_TDAE_API_URL ?? (mode === "production" ? URL_PRODUCTION : "");
  const tokenUrl = env.URSSAF_TDAE_TOKEN_URL ?? (mode === "production" ? TOKEN_PRODUCTION : "");
  if (!clientId || !clientSecret || !apiUrl || !tokenUrl) return null;
  return { mode, apiUrl: apiUrl.replace(/\/+$/, ""), tokenUrl, clientId, clientSecret };
}

// ---------------------------------------------------------------------------
// Transport réel (sandbox et production)
// ---------------------------------------------------------------------------

type Fetch = typeof fetch;

let jetonEnCache: { valeur: string; expireA: number; cle: string } | null = null;

async function jeton(cfg: ConfigTdae, f: Fetch): Promise<string> {
  const cle = `${cfg.tokenUrl}|${cfg.clientId}`;
  if (jetonEnCache && jetonEnCache.cle === cle && jetonEnCache.expireA > Date.now()) return jetonEnCache.valeur;
  const res = await f(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      scope: SCOPE_TDAE,
    }),
  });
  if (!res.ok) throw new ErreurTdae("AUTH_REFUSEE", res.status);
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new ErreurTdae("AUTH_REFUSEE", res.status);
  // Marge d'une minute pour ne jamais présenter un jeton qui expire en route.
  const duree = Math.max(60, (j.expires_in ?? 300) - 60) * 1000;
  jetonEnCache = { valeur: j.access_token, expireA: Date.now() + duree, cle };
  return j.access_token;
}

async function appeler<T>(
  cfg: ConfigTdae,
  f: Fetch,
  methode: "GET" | "POST" | "DELETE",
  chemin: string,
  query: Record<string, string>,
  corps?: unknown
): Promise<T | null> {
  const url = `${cfg.apiUrl}${BASE_PATH}${chemin}?${new URLSearchParams(query)}`;
  const envoyer = async () =>
    f(url, {
      method: methode,
      headers: {
        Authorization: `Bearer ${await jeton(cfg, f)}`,
        Accept: "application/json",
        ...(corps !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  let res = await envoyer();
  if (res.status === 401) {
    // Jeton révoqué côté URSSAF avant son expiration annoncée : un seul
    // renouvellement, jamais de boucle.
    jetonEnCache = null;
    res = await envoyer();
  }
  const texte = await res.text();
  let json: unknown = null;
  try {
    json = texte ? JSON.parse(texte) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw erreurDepuisReponse(res.status, json);
  return json as T | null;
}

// ---------------------------------------------------------------------------
// Interface commune
// ---------------------------------------------------------------------------

export interface ClientTdae {
  mode: ModeTdae;
  verifierCompte(siret: string): Promise<CompteAe>;
  notifierMandat(siret: string, dateNaissance: string): Promise<void>;
  annulerMandat(siret: string, dateNaissance: string): Promise<void>;
  estimer(siret: string, ca: CaAe): Promise<ResultatEstimation>;
  declarer(siret: string, ca: CaAe, periode: PeriodeTdae): Promise<ResultatDeclaration>;
}

const SIRET = /^\d{14}$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

function controlerSiret(siret: string) {
  if (!SIRET.test(siret)) throw new ErreurTdae("PARAM_INVALIDE", 400, "Le SIRET doit comporter 14 chiffres");
}

function controlerDate(d: string) {
  const ok = DATE_ISO.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z")) && new Date(d + "T00:00:00Z").toISOString().startsWith(d);
  if (!ok) throw new ErreurTdae("PARAM_INVALIDE", 400, "Date de naissance invalide");
}

function controlerCa(ca: CaAe) {
  for (const [k, v] of Object.entries(ca)) {
    if (!Number.isInteger(v) || v < 0) throw new ErreurTdae("PARAM_INVALIDE", 400, `Le paramètre ${k} n'est pas une valeur numérique`);
  }
}

function clientReel(cfg: ConfigTdae, f: Fetch): ClientTdae {
  return {
    mode: cfg.mode,
    async verifierCompte(siret) {
      controlerSiret(siret);
      const c = await appeler<CompteAe>(cfg, f, "GET", "/comptes", { siret });
      if (!c || (c.periodicite !== "M" && c.periodicite !== "T")) throw new ErreurTdae("INCONNU", 200, "Compte sans périodicité");
      return c;
    },
    async notifierMandat(siret, dateNaissance) {
      controlerSiret(siret);
      controlerDate(dateNaissance);
      await appeler(cfg, f, "POST", "/mandats", { siret, dateNaissance });
    },
    async annulerMandat(siret, dateNaissance) {
      controlerSiret(siret);
      controlerDate(dateNaissance);
      await appeler(cfg, f, "DELETE", "/mandats", { siret, dateNaissance });
    },
    async estimer(siret, ca) {
      controlerSiret(siret);
      controlerCa(ca);
      const r = await appeler<ResultatEstimation>(cfg, f, "POST", "/estimer", { siret }, { ca });
      if (!r?.montants) throw new ErreurTdae("INCONNU", 200, "Estimation sans montants");
      return r;
    },
    async declarer(siret, ca, periode) {
      controlerSiret(siret);
      controlerCa(ca);
      const r = await appeler<ResultatDeclaration>(cfg, f, "POST", "/declarer", { siret }, { ca, periode });
      if (!r?.montants || !r.certificat || !r.idDeclaration) throw new ErreurTdae("INCONNU", 200, "Déclaration sans accusé");
      return r;
    },
  };
}

// ---------------------------------------------------------------------------
// Simulateur (mode "simulation" et tests)
// ---------------------------------------------------------------------------

/**
 * Taux FICTIFS du simulateur. Ils ne servent qu'à produire des réponses de la
 * bonne forme : en sandbox comme en production, c'est l'URSSAF qui calcule.
 */
const TAUX_SIMULATION: Record<CategorieCa, number> = {
  caVente: 0.123,
  caLocation: 0.06,
  caPrestationService: 0.212,
  caPrestationAutres: 0.261,
  recettesCipav: 0.232,
};
const CHAMP_MONTANT: Record<CategorieCa, keyof MontantsAe> = {
  caVente: "montantVente",
  caLocation: "montantLocation",
  caPrestationService: "montantPrestationService",
  caPrestationAutres: "montantPrestationAutres",
  recettesCipav: "montantCipav",
};

export type FicheSimulee = {
  periodicite: Periodicite;
  /** null : la première date de naissance transmise est retenue. */
  dateNaissance: string | null;
  debutActivite: string;
  mandatAt: string | null;
};

export type EtatSimulation = {
  /** Comptes connus du simulateur : SIRET => fiche. Absent => CPTE_INCONNU. */
  comptes: Map<string, FicheSimulee>;
  /**
   * Fiche créée à la volée pour un SIRET inconnu (null => CPTE_INCONNU). En
   * mode "simulation" en ligne, tout SIRET est reconnu sauf ceux qui
   * commencent par 000, réservés au cas « compte inconnu ».
   */
  ficheParDefaut?: (siret: string) => FicheSimulee | null;
  /** Date du jour simulée, AAAA-MM-JJ. */
  aujourdhui: () => string;
  /** Certificats déjà délivrés : SIRET|période => certificat (stable si remplacé). */
  certificats: Map<string, string>;
};

/** SIRET de démonstration reconnu par défaut en simulation. */
export const SIRET_SIMULATION = "12345678901234";

export function etatSimulationParDefaut(): EtatSimulation {
  return {
    comptes: new Map([[SIRET_SIMULATION, { periodicite: "T" as Periodicite, dateNaissance: "1975-10-01", debutActivite: "2020-03-01", mandatAt: null }]]),
    ficheParDefaut: (siret) =>
      siret.startsWith("000") ? null : { periodicite: "T", dateNaissance: null, debutActivite: "2020-01-01", mandatAt: null },
    aujourdhui: () => new Date().toISOString().slice(0, 10),
    certificats: new Map(),
  };
}

function montantsSimules(ca: CaAe): MontantsAe {
  const m: MontantsAe = { montantTotal: 0, montantFormationProfessionnelle: 0 };
  for (const k of Object.keys(ca) as CategorieCa[]) {
    const v = Math.floor(ca[k] * TAUX_SIMULATION[k] + 0.5);
    (m[CHAMP_MONTANT[k]] as number) = v;
    m.montantTotal += v;
  }
  const ff = Math.floor((ca.caPrestationAutres + ca.caPrestationService + ca.recettesCipav) * 0.002 + ca.caVente * 0.001 + 0.5);
  m.montantFormationProfessionnelle = ff;
  m.montantTotal += ff;
  return m;
}

export function clientSimulation(etat: EtatSimulation = etatSimulationParDefaut()): ClientTdae {
  const compte = (siret: string) => {
    controlerSiret(siret);
    let c = etat.comptes.get(siret);
    if (!c) {
      const f = etat.ficheParDefaut?.(siret) ?? null;
      if (f) etat.comptes.set(siret, (c = f));
    }
    if (!c) throw new ErreurTdae("CPTE_INCONNU", 400, "Aucun compte Auto-Entrepreneur actif trouvé avec ces paramètres");
    return c;
  };
  const exigerMandat = (siret: string) => {
    const c = compte(siret);
    if (!c.mandatAt) throw new ErreurTdae("MDT_INCONNU", 400, "Pas de mandat connu pour le compte de votre demande");
    return c;
  };
  return {
    mode: "simulation",
    async verifierCompte(siret) {
      const c = compte(siret);
      const [a, m, j] = c.debutActivite.split("-");
      return { mandatPresent: !!c.mandatAt, periodicite: c.periodicite, date_etat: `${j}/${m}/${a}`, exoAccrePresent: false };
    },
    async notifierMandat(siret, dateNaissance) {
      const c = compte(siret);
      controlerDate(dateNaissance);
      c.dateNaissance ??= dateNaissance;
      if (dateNaissance !== c.dateNaissance) throw new ErreurTdae("PARAM_INVALIDE", 400, "Date de naissance non conforme");
      if (c.mandatAt) throw new ErreurTdae("SIRET_DEJA_MANDATE", 400, "Il existe déjà un autre établissement mandataire pour ce SIRET");
      c.mandatAt = etat.aujourdhui();
    },
    async annulerMandat(siret, dateNaissance) {
      const c = compte(siret);
      controlerDate(dateNaissance);
      c.dateNaissance ??= dateNaissance;
      if (dateNaissance !== c.dateNaissance) throw new ErreurTdae("PARAM_INVALIDE", 400, "Date de naissance non conforme");
      if (!c.mandatAt) throw new ErreurTdae("PARAM_INVALIDE", 400, "Aucun mandat à supprimer correspondant à vos données d'entrée");
      c.mandatAt = null;
    },
    async estimer(siret, ca) {
      const c = exigerMandat(siret);
      controlerCa(ca);
      return { montants: montantsSimules(ca), periode: periodeADeclarer(c.periodicite, etat.aujourdhui()) };
    },
    async declarer(siret, ca, periode) {
      const c = exigerMandat(siret);
      controlerCa(ca);
      if (!periodeConformeA(periode, c.periodicite)) throw new ErreurTdae("PERIODICITE_INVALIDE", 400, "La périodicité ne correspond pas à celle connue du compte");
      // Seule la période écoulée est ouverte (le simulateur ignore le cumul des
      // premières périodes en début d'activité, que l'URSSAF gère elle-même).
      const ouverte = periodeADeclarer(c.periodicite, etat.aujourdhui());
      if (JSON.stringify(ouverte) !== JSON.stringify(periode)) {
        throw new ErreurTdae("APPEL_INCONNU", 400, "Période non ouverte pour le compte de votre demande");
      }
      const exigibilite = dateExigibilite(periode, c.periodicite, c.debutActivite);
      if (c.mandatAt! > exigibilite) throw new ErreurTdae("MDT_HORS_PERIODE", 400, "Période non couverte par le mandat de tierce déclaration");
      const cle = `${siret}|${JSON.stringify(periode)}`;
      const certificat = etat.certificats.get(cle) ?? String(10000000 + etat.certificats.size * 7919).slice(0, 8);
      etat.certificats.set(cle, certificat);
      const idDeclaration = ("SIM" + Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 23);
      return { montants: montantsSimules(ca), dateExigibilite: exigibilite, certificat, idDeclaration };
    },
  };
}

// ---------------------------------------------------------------------------
// Fabrique
// ---------------------------------------------------------------------------

let simulationPartagee: EtatSimulation | null = null;

/** Client selon la configuration, ou null si la fonction est inactive. */
export function clientTdae(cfg: ConfigTdae | null = lireConfigTdae(), f: Fetch = fetch): ClientTdae | null {
  if (!cfg) return null;
  if (cfg.mode === "simulation") {
    simulationPartagee ??= etatSimulationParDefaut();
    return clientSimulation(simulationPartagee);
  }
  return clientReel(cfg, f);
}

/**
 * En simulation, chaque requête serverless peut démarrer avec un état vierge :
 * on recale la fiche du SIRET sur ce que Deviso a enregistré (mandat donné ou
 * non), pour que le simulateur réponde comme le ferait l'URSSAF.
 */
export function amorcerSimulation(siret: string, fiche: Partial<FicheSimulee>) {
  simulationPartagee ??= etatSimulationParDefaut();
  const base = simulationPartagee.comptes.get(siret) ?? simulationPartagee.ficheParDefaut?.(siret);
  if (base) simulationPartagee.comptes.set(siret, { ...base, ...fiche });
}

/** Exposé pour les tests uniquement : oublie le jeton en cache. */
export function _oublierJeton() {
  jetonEnCache = null;
}
