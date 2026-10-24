/**
 * API Tierce Déclaration auto-entrepreneur (URSSAF) : règles et client.
 *
 * Aucun appel réseau : le transport réel est éprouvé contre un faux serveur qui
 * vérifie la forme exacte des requêtes (OAuth2 client credentials, chemins,
 * paramètres, corps) ; le simulateur est éprouvé sur les cas d'erreur
 * documentés. Références : documentation ACOSS TDAE v1.5.0 et contrat Swagger
 * de production 1.5.1.
 *
 * Lancer : npm run test:urssaf-tdae
 */
import { verifier, bilan } from "./lib.mjs";

async function main() {
  const P = await import("@/lib/urssaf-periodes");
  const T = await import("@/lib/urssaf-tdae");

  // --- Arrondi (§ 3.5.1, exemples de la documentation) ---------------------
  verifier("arrondi 1458,53 => 1459", P.arrondiUrssaf(1458.53) === 1459);
  verifier("arrondi 1458,50 => 1459", P.arrondiUrssaf(1458.5) === 1459);
  verifier("arrondi 2365,47 => 2365", P.arrondiUrssaf(2365.47) === 2365);
  verifier("arrondi insensible aux flottants (0,1 x 5 + 0,3 = 0,8 => 1)", P.arrondiUrssaf(0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.3) === 1);
  // 2,20 + 18,90 + 0,40 vaut 21,499999999999996 en virgule flottante : un
  // arrondi naïf donnerait 21 au lieu de 22.
  verifier("arrondi insensible aux flottants (2,20 + 18,90 + 0,40 = 21,50 => 22)", P.arrondiUrssaf([2.2, 18.9, 0.4].reduce((x, y) => x + y, 0)) === 22);

  // --- Exigibilité standard --------------------------------------------------
  const ex = P.exigibiliteStandard;
  verifier("T1 exigible le 30 avril", ex({ annee: 2026, trimestre: 1 }) === "2026-04-30");
  verifier("T2 exigible le 31 juillet", ex({ annee: 2026, trimestre: 2 }) === "2026-07-31");
  verifier("T3 exigible le 31 octobre", ex({ annee: 2026, trimestre: 3 }) === "2026-10-31");
  verifier("T4 exigible le 31 janvier suivant", ex({ annee: 2025, trimestre: 4 }) === "2026-01-31");
  verifier("décembre exigible le 31 janvier suivant", ex({ annee: 2025, mois: 12 }) === "2026-01-31");
  verifier("janvier exigible fin février", ex({ annee: 2026, mois: 1 }) === "2026-02-28");
  verifier("janvier bissextile exigible le 29 février", ex({ annee: 2028, mois: 1 }) === "2028-02-29");

  // --- Première exigibilité : tableaux de la documentation, page 18 ---------
  const pe = P.premiereExigibilite;
  const mensuel: [string, string][] = [
    ["2026-01-15", "2026-05-31"], ["2026-02-10", "2026-06-30"], ["2026-03-01", "2026-07-31"],
    ["2026-04-30", "2026-08-31"], ["2026-05-02", "2026-09-30"], ["2026-06-20", "2026-10-31"],
    ["2026-07-01", "2026-11-30"], ["2026-08-31", "2026-12-31"], ["2026-09-15", "2027-01-31"],
    ["2026-10-24", "2027-02-28"], ["2026-11-03", "2027-03-31"], ["2026-12-31", "2027-04-30"],
  ];
  verifier("premières échéances mensuelles conformes au tableau (12 cas)", mensuel.every(([d, e]) => pe(d, "M") === e),
    mensuel.filter(([d, e]) => pe(d, "M") !== e).map(([d, e]) => `${d}: ${pe(d, "M")} au lieu de ${e}`).join(" ; "));
  const trimestriel: [string, string][] = [
    ["2026-01-01", "2026-07-31"], ["2026-03-31", "2026-07-31"], ["2026-04-01", "2026-10-31"],
    ["2026-06-30", "2026-10-31"], ["2026-07-14", "2027-01-31"], ["2026-09-30", "2027-01-31"],
    ["2026-10-01", "2027-04-30"], ["2026-12-31", "2027-04-30"],
  ];
  verifier("premières échéances trimestrielles conformes au tableau (8 cas)", trimestriel.every(([d, e]) => pe(d, "T") === e),
    trimestriel.filter(([d, e]) => pe(d, "T") !== e).map(([d, e]) => `${d}: ${pe(d, "T")} au lieu de ${e}`).join(" ; "));
  verifier("début récent : T3 repoussé à la première échéance",
    P.dateExigibilite({ annee: 2026, trimestre: 3 }, "T", "2026-08-01") === "2027-01-31");
  verifier("activité ancienne : échéance standard", P.dateExigibilite({ annee: 2026, trimestre: 3 }, "T", "2020-03-01") === "2026-10-31");

  // --- Période à déclarer ----------------------------------------------------
  const pad = P.periodeADeclarer;
  verifier("24/10/2026 trimestriel => T3 2026", JSON.stringify(pad("T", "2026-10-24")) === JSON.stringify({ annee: 2026, trimestre: 3 }));
  verifier("24/10/2026 mensuel => septembre 2026", JSON.stringify(pad("M", "2026-10-24")) === JSON.stringify({ annee: 2026, mois: 9 }));
  verifier("10/01/2026 trimestriel => T4 2025", JSON.stringify(pad("T", "2026-01-10")) === JSON.stringify({ annee: 2025, trimestre: 4 }));
  verifier("10/01/2026 mensuel => décembre 2025", JSON.stringify(pad("M", "2026-01-10")) === JSON.stringify({ annee: 2025, mois: 12 }));
  verifier("libellé trimestre", P.libellePeriode({ annee: 2026, trimestre: 1 }) === "1er trimestre 2026" && P.libellePeriode({ annee: 2026, trimestre: 3 }) === "3e trimestre 2026");
  verifier("libellé mois", P.libellePeriode({ annee: 2026, mois: 9 }) === "septembre 2026");

  // --- CA de la période depuis le livre des recettes ------------------------
  const l = (date: string, ht: number, dateEstimee = false) =>
    ({ id: date + ht, date, dateEstimee, numero: "F", client: "C", nature: "N", ht, ttc: ht, mode: null });
  const lignes = [l("2026-06-30", 999), l("2026-07-01", 1000.25), l("2026-08-15", 500.25, true), l("2026-09-30", -200), l("2026-10-01", 777)];
  const ca = P.caDeLaPeriode(lignes, { annee: 2026, trimestre: 3 });
  verifier("CA T3 : bornes incluses, avoir déduit, hors période exclus", ca.encaisseHt === 1300.5 && ca.nombre === 3, JSON.stringify(ca));
  verifier("CA T3 déclarable arrondi (1300,50 => 1301)", ca.montantDeclarable === 1301);
  verifier("CA T3 signale la date estimée", ca.datesEstimees === 1);
  const neg = P.caDeLaPeriode([l("2026-09-02", -50)], { annee: 2026, mois: 9 });
  verifier("CA négatif ramené à 0 et signalé", neg.montantDeclarable === 0 && neg.negatifRamene);

  verifier("période valide (mois)", P.estPeriodeValide({ annee: 2026, mois: 9 }));
  verifier("période refusée : mois ET trimestre", !P.estPeriodeValide({ annee: 2026, mois: 9, trimestre: 3 }));
  verifier("période refusée : ni mois ni trimestre", !P.estPeriodeValide({ annee: 2026 }));
  verifier("période refusée : trimestre 5", !P.estPeriodeValide({ annee: 2026, trimestre: 5 }));

  // --- Erreurs ---------------------------------------------------------------
  const e1 = T.erreurDepuisReponse(400, { code: " PARAM_INVALIDE ", message: "x", description: " Le paramètre caVente n'est pas une valeur numérique" });
  verifier("code entouré d'espaces reconnu (doc § 3.4.3)", e1.code === "PARAM_INVALIDE" && e1.detail?.startsWith("Le paramètre"));
  verifier("429 => QUOTA_DEPASSE", T.erreurDepuisReponse(429, null).code === "QUOTA_DEPASSE");
  verifier("500 sans code => ERR_TECHNIQUE", T.erreurDepuisReponse(502, "<html>").code === "ERR_TECHNIQUE");
  verifier("400 code inconnu => INCONNU", T.erreurDepuisReponse(400, { code: "NOUVEAU" }).code === "INCONNU");
  verifier("cotisations dues = total + régul ACRE + déduction (§ 3.5.3)",
    T.cotisationsDues({ montantTotal: 1678, montantRegulAcre: 12, montantDeduction: -30 }) === 1660);
  verifier("CaAe complet, une seule catégorie renseignée",
    JSON.stringify(T.construireCa("caPrestationAutres", 1301)) === JSON.stringify({ caVente: 0, caLocation: 0, caPrestationService: 0, caPrestationAutres: 1301, recettesCipav: 0 }));

  // --- Configuration -----------------------------------------------------------
  verifier("sans mode : fonction inactive", T.lireConfigTdae({}) === null);
  verifier("production sans autorisation explicite : inactive",
    T.lireConfigTdae({ URSSAF_TDAE_MODE: "production", URSSAF_TDAE_CLIENT_ID: "a", URSSAF_TDAE_CLIENT_SECRET: "b" }) === null);
  const prod = T.lireConfigTdae({ URSSAF_TDAE_MODE: "production", URSSAF_TDAE_PRODUCTION_AUTORISEE: "oui", URSSAF_TDAE_CLIENT_ID: "a", URSSAF_TDAE_CLIENT_SECRET: "b" });
  verifier("production autorisée : adresses du contrat par défaut", prod?.apiUrl === "https://api.urssaf.fr" && prod?.tokenUrl === "https://api.urssaf.fr/api/oauth/v1/token");
  verifier("sandbox sans adresses fournies : inactive (on ne devine pas)",
    T.lireConfigTdae({ URSSAF_TDAE_MODE: "sandbox", URSSAF_TDAE_CLIENT_ID: "a", URSSAF_TDAE_CLIENT_SECRET: "b" }) === null);

  // --- Transport réel contre un faux serveur ---------------------------------
  const appels: { url: string; init: RequestInit }[] = [];
  let jetonsEmis = 0;
  let refuserUneFois = false;
  const fauxFetch = (async (url: string, init: RequestInit = {}) => {
    appels.push({ url, init });
    const rep = (status: number, corps: unknown) => new Response(corps === null ? "" : JSON.stringify(corps), { status });
    if (url === "https://sbx.test/token") {
      jetonsEmis++;
      return rep(200, { access_token: `jeton-${jetonsEmis}`, token_type: "Bearer", expires_in: 3600 });
    }
    const auth = (init.headers as Record<string, string>).Authorization;
    if (refuserUneFois) { refuserUneFois = false; return rep(401, null); }
    if (!auth?.startsWith("Bearer jeton-")) return rep(401, null);
    const u = new URL(url);
    if (u.pathname === "/tiersdecl/v1/ae/comptes") return rep(200, { mandatPresent: true, periodicite: "T", date_etat: "01/03/2010", exoAccrePresent: false });
    if (u.pathname === "/tiersdecl/v1/ae/mandats") return rep(200, null);
    if (u.pathname === "/tiersdecl/v1/ae/declarer") {
      const corps = JSON.parse(String(init.body));
      if (corps.periode.trimestre === 2) return rep(400, { code: "APPEL_INCONNU", message: "appel inconnu", description: "Période non ouverte pour le compte de votre demande" });
      return rep(200, { montants: { montantTotal: 1678 }, dateExigibilite: "2026-10-31", certificat: "56335826", idDeclaration: "W1dl9W2Oa4R6ab3UlQAqxF3" });
    }
    return rep(404, null);
  }) as unknown as typeof fetch;
  T._oublierJeton();
  const cfg = T.lireConfigTdae({ URSSAF_TDAE_MODE: "sandbox", URSSAF_TDAE_API_URL: "https://sbx.test/", URSSAF_TDAE_TOKEN_URL: "https://sbx.test/token", URSSAF_TDAE_CLIENT_ID: "id", URSSAF_TDAE_CLIENT_SECRET: "secret" });
  const reel = T.clientTdae(cfg, fauxFetch)!;
  const compte = await reel.verifierCompte("12345678901234");
  verifier("API 020 : réponse lue", compte.periodicite === "T" && compte.mandatPresent);
  const jetonReq = appels[0];
  const form = new URLSearchParams(String(jetonReq.init.body));
  verifier("jeton : client credentials + scope tiersdecl.ae, en formulaire",
    jetonReq.init.method === "POST" && form.get("grant_type") === "client_credentials" && form.get("scope") === "tiersdecl.ae" && form.get("client_id") === "id"
      && (jetonReq.init.headers as Record<string, string>)["Content-Type"] === "application/x-www-form-urlencoded");
  verifier("API 020 : GET /tiersdecl/v1/ae/comptes?siret=…, sans NIR",
    appels[1].init.method === "GET" && appels[1].url === "https://sbx.test/tiersdecl/v1/ae/comptes?siret=12345678901234");
  await reel.notifierMandat("12345678901234", "1975-10-01");
  const m = appels.at(-1)!;
  verifier("API 030 : POST /mandats avec siret et dateNaissance en paramètres, sans corps",
    m.init.method === "POST" && m.url.endsWith("/tiersdecl/v1/ae/mandats?siret=12345678901234&dateNaissance=1975-10-01") && m.init.body === undefined);
  await reel.annulerMandat("12345678901234", "1975-10-01");
  verifier("API 031 : DELETE /mandats", appels.at(-1)!.init.method === "DELETE");
  const d = await reel.declarer("12345678901234", T.construireCa("caPrestationAutres", 1301), { annee: 2026, trimestre: 3 });
  const dReq = appels.at(-1)!;
  verifier("API 050 : corps { ca, periode } conforme au contrat",
    JSON.stringify(JSON.parse(String(dReq.init.body))) === JSON.stringify({ ca: { caVente: 0, caLocation: 0, caPrestationService: 0, caPrestationAutres: 1301, recettesCipav: 0 }, periode: { annee: 2026, trimestre: 3 } }));
  verifier("API 050 : accusé lu (certificat, idDeclaration)", d.certificat === "56335826" && d.idDeclaration.length <= 23);
  verifier("jeton réutilisé tant qu'il est valide", jetonsEmis === 1);
  refuserUneFois = true;
  await reel.verifierCompte("12345678901234");
  verifier("401 : jeton renouvelé une seule fois puis succès", jetonsEmis === 2);
  try {
    await reel.declarer("12345678901234", T.construireCa("caPrestationAutres", 1), { annee: 2026, trimestre: 2 });
    verifier("API 050 : période fermée rejetée", false);
  } catch (e) {
    verifier("API 050 : période fermée => APPEL_INCONNU", e instanceof T.ErreurTdae && e.code === "APPEL_INCONNU" && e.status === 400);
  }
  const avant = appels.length;
  try { await reel.verifierCompte("1234"); } catch (e) {
    verifier("SIRET invalide refusé avant tout appel", e instanceof T.ErreurTdae && e.code === "PARAM_INVALIDE" && appels.length === avant);
  }
  try { await reel.declarer("12345678901234", T.construireCa("caVente", 12.5), { annee: 2026, trimestre: 3 }); } catch (e) {
    verifier("montant non entier refusé avant tout appel", e instanceof T.ErreurTdae && e.code === "PARAM_INVALIDE" && appels.length === avant);
  }

  // --- Simulateur : cas d'erreur documentés ----------------------------------
  const etat = T.etatSimulationParDefaut();
  etat.aujourdhui = () => "2026-10-24";
  etat.ficheParDefaut = () => null;
  const sim = T.clientSimulation(etat);
  const attendre = async (libelle: string, code: string, f: () => Promise<unknown>) => {
    try { await f(); verifier(libelle, false, "aucune erreur"); } catch (e) {
      verifier(libelle, e instanceof T.ErreurTdae && e.code === code, e instanceof T.ErreurTdae ? e.code : String(e));
    }
  };
  const S = T.SIRET_SIMULATION;
  const caT3 = T.construireCa("caPrestationAutres", 1301);
  await attendre("compte inconnu => CPTE_INCONNU", "CPTE_INCONNU", () => sim.verifierCompte("99999999999999"));
  await attendre("estimation sans mandat => MDT_INCONNU", "MDT_INCONNU", () => sim.estimer(S, caT3));
  await attendre("mandat, mauvaise date de naissance => PARAM_INVALIDE", "PARAM_INVALIDE", () => sim.notifierMandat(S, "1980-01-01"));
  await sim.notifierMandat(S, "1975-10-01");
  verifier("mandat notifié : visible à l'API 020", (await sim.verifierCompte(S)).mandatPresent === true);
  await attendre("second mandat => SIRET_DEJA_MANDATE", "SIRET_DEJA_MANDATE", () => sim.notifierMandat(S, "1975-10-01"));
  await attendre("période mensuelle sur compte trimestriel => PERIODICITE_INVALIDE", "PERIODICITE_INVALIDE", () => sim.declarer(S, caT3, { annee: 2026, mois: 9 }));
  await attendre("période non ouverte => APPEL_INCONNU", "APPEL_INCONNU", () => sim.declarer(S, caT3, { annee: 2026, trimestre: 2 }));
  const est = await sim.estimer(S, caT3);
  verifier("estimation : montants et période", est.montants.montantTotal > 0 && est.periode?.trimestre === 3);
  const d1 = await sim.declarer(S, caT3, { annee: 2026, trimestre: 3 });
  verifier("déclaration : certificat à 8 chiffres, exigibilité 31/10", /^\d{8}$/.test(d1.certificat) && d1.dateExigibilite === "2026-10-31" && d1.idDeclaration.length <= 23);
  const d2 = await sim.declarer(S, T.construireCa("caPrestationAutres", 1400), { annee: 2026, trimestre: 3 });
  verifier("redéclaration : même certificat, nouvel idDeclaration (annule et remplace)", d2.certificat === d1.certificat && d2.idDeclaration !== d1.idDeclaration);
  await sim.annulerMandat(S, "1975-10-01");
  await attendre("après annulation => MDT_INCONNU", "MDT_INCONNU", () => sim.declarer(S, caT3, { annee: 2026, trimestre: 3 }));
  etat.comptes.get(S)!.mandatAt = "2026-11-02";
  await attendre("mandat signé après l'exigibilité => MDT_HORS_PERIODE", "MDT_HORS_PERIODE", () => sim.declarer(S, caT3, { annee: 2026, trimestre: 3 }));

  const ouvert = T.etatSimulationParDefaut();
  const simOuvert = T.clientSimulation(ouvert);
  await attendre("simulation en ligne : SIRET en 000 => CPTE_INCONNU", "CPTE_INCONNU", () => simOuvert.verifierCompte("00012345678901"));
  await simOuvert.notifierMandat("55555555555555", "1990-05-05");
  verifier("simulation en ligne : tout autre SIRET reconnu, date retenue", (await simOuvert.verifierCompte("55555555555555")).mandatPresent);

  bilan();
}

main();
