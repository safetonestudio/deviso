/**
 * Rythme du résumé par e-mail du cabinet (20/11/2026) : le cron passe chaque
 * matin, resumeDu décide si c'est le jour. On simule des mois de passages
 * quotidiens et on compte les envois.
 *
 * Lancer : npx -y tsx scripts/e2e/resume-frequence.ts
 */
import { verifier, bilan } from "./lib.mjs";

(async () => {
  const { resumeDu, prochainEnvoi, rythmeEnClair, estFrequence, estJour } = await import("@/lib/cabinet-resume-frequence");
  type F = "hebdo" | "quinzaine" | "mensuel";
  const jourUtc = (iso: string) => new Date(`${iso}T06:00:00Z`);

  /** Simule un cron quotidien du `debut` pendant `jours` jours ; renvoie les dates d'envoi. */
  function simuler(debut: string, jours: number, f: F, jour: number, passage: string | null = null): string[] {
    const envois: string[] = [];
    let dernier = passage;
    const d = jourUtc(debut);
    for (let i = 0; i < jours; i++) {
      const iso = d.toISOString().slice(0, 10);
      if (resumeDu(d, f, jour, dernier)) {
        envois.push(iso);
        dernier = iso;
      }
      // Un second passage le même jour ne renvoie jamais.
      if (dernier === iso && resumeDu(d, f, jour, dernier)) envois.push(`DOUBLON ${iso}`);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return envois;
  }
  const jds = (l: string[]) => l.map((iso) => new Date(`${iso}T00:00:00Z`).getUTCDay());

  console.log("── Chaque semaine ─────────────────────────────────────────────");
  const hebdoLundi = simuler("2026-11-20", 56, "hebdo", 1);
  verifier("8 semaines : 8 envois", hebdoLundi.length === 8, hebdoLundi.join(" "));
  verifier("tous un lundi", jds(hebdoLundi).every((j) => j === 1));
  verifier("premier envoi : lundi 23 novembre", hebdoLundi[0] === "2026-11-23", hebdoLundi[0]);
  const hebdoJeudi = simuler("2026-11-20", 28, "hebdo", 4);
  verifier("jour choisi jeudi : tous un jeudi", hebdoJeudi.length === 4 && jds(hebdoJeudi).every((j) => j === 4), hebdoJeudi.join(" "));

  console.log("── Toutes les deux semaines ───────────────────────────────────");
  const quinz = simuler("2026-11-20", 84, "quinzaine", 2);
  verifier("12 semaines : 6 envois", quinz.length === 6, quinz.join(" "));
  verifier("tous un mardi", jds(quinz).every((j) => j === 2));
  const ecarts = quinz.slice(1).map((d, i) => (Date.parse(d) - Date.parse(quinz[i])) / 86_400_000);
  verifier("exactement 14 jours entre deux envois", ecarts.every((e) => e === 14), ecarts.join(","));
  const repris = simuler("2026-11-20", 20, "quinzaine", 2, "2026-11-17");
  verifier("dernier envoi le 17 : le suivant attend le 1er décembre", repris[0] === "2026-12-01", repris.join(" "));

  console.log("── Une fois par mois ──────────────────────────────────────────");
  const mens = simuler("2026-11-20", 365, "mensuel", 3);
  verifier("un an : 12 envois", mens.length === 12, mens.join(" "));
  verifier("tous un mercredi, entre le 1er et le 7 du mois", mens.every((d) => new Date(`${d}T00:00:00Z`).getUTCDay() === 3 && Number(d.slice(8)) <= 7));
  verifier("un seul par mois", new Set(mens.map((d) => d.slice(0, 7))).size === 12);

  console.log("── Jamais deux fois le même jour ──────────────────────────────");
  verifier("aucun doublon, quel que soit le rythme", [hebdoLundi, quinz, mens].flat().every((d) => !d.startsWith("DOUBLON")));

  console.log("── Affichage et contrôles ─────────────────────────────────────");
  verifier("prochain envoi affiché = premier envoi simulé", prochainEnvoi(jourUtc("2026-11-20"), "quinzaine", 2, null).toISOString().slice(0, 10) === quinz[0]);
  verifier("rythme en clair", rythmeEnClair("hebdo", 1) === "chaque lundi" && rythmeEnClair("quinzaine", 2) === "un mardi sur deux" && rythmeEnClair("mensuel", 5) === "le premier vendredi du mois");
  verifier("contre-épreuve : rythme inconnu refusé", !estFrequence("quotidien") && estFrequence("mensuel"));
  verifier("contre-épreuve : samedi, dimanche et texte refusés", !estJour(6) && !estJour(0) && !estJour("1") && estJour(5));

  bilan();
})();
