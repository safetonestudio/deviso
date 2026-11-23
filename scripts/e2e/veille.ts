/**
 * La veille quotidienne alerte-t-elle UNE fois, puis se tait-elle, puis
 * annonce-t-elle le retour à la normale ? (app/api/cron/veille, lib/veille/)
 *
 *  1. La règle de décision, seule (lib/veille/decision.ts) : toutes les
 *     transitions, dont un détail d'erreur qui change sans que la panne change.
 *  2. La route, en mode essai (état « essai », aucun courriel, aucun compte
 *     réel lu), sur de vrais comptes de démonstration jetables :
 *       a. on CASSE un chemin (retrait du lien cabinet-dossier) : l'alerte part
 *          et nomme le résumé cabinet et les exports du cabinet ;
 *       b. même panne le lendemain : silence ;
 *       c. chemin réparé : message de retour à la normale ;
 *       d. tout va bien : silence.
 *     Les comptes jetables sont supprimés à chaque passage.
 *
 * La route n'existe en production qu'une fois déployée : avant, viser un
 * serveur local (E2E_BASE_URL=http://localhost:3000).
 *
 * Lancer : npx -y tsx scripts/e2e/veille.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { verifier, bilan, BASE } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

(async () => {
  const { decider } = await import("@/lib/veille/decision");
  const { createAdminClient } = await import("@/lib/supabase/admin");

  // ── 1. La règle ─────────────────────────────────────────────────────────────
  console.log("── Décision : une alerte par panne ─────────────────────────");
  const t0 = new Date("2026-11-20T05:15:00Z");
  const t1 = new Date("2026-11-21T05:15:00Z");
  const r = (id: string, ok: boolean, detail = "") => ({ id, libelle: `Contrôle ${id}`, ok, detail });

  const calme = decider({}, [r("a", true), r("b", true)], t0);
  verifier("tout va bien et allait bien : silence", calme.alerte === null && Object.keys(calme.pannes).length === 0);

  const casse = decider({}, [r("a", false, "HTTP 500"), r("b", true)], t0);
  verifier("un chemin casse : alerte « panne »", casse.alerte?.genre === "panne" && casse.alerte.nouvelles.join() === "a");
  verifier("l'alerte cite le détail de la panne", !!casse.alerte?.texte.includes("HTTP 500"));

  const encore = decider(casse.pannes, [r("a", false, "HTTP 502, autre message"), r("b", true)], t1);
  verifier("même panne, autre message d'erreur : silence", encore.alerte === null);
  verifier("la panne garde sa date de début", encore.pannes.a?.depuis === t0.toISOString());

  const deux = decider(encore.pannes, [r("a", false), r("b", false, "délai")], t1);
  verifier("seconde panne : nouvelle alerte, qui rappelle la première", deux.alerte?.genre === "panne" && deux.alerte.nouvelles.join() === "b" && deux.alerte.enCours.join() === "a");

  const mieux = decider(deux.pannes, [r("a", true), r("b", false)], t1);
  verifier("une panne réparée sur deux : « amélioration »", mieux.alerte?.genre === "amelioration" && mieux.alerte.reparees.join() === "a");

  const repare = decider(mieux.pannes, [r("a", true), r("b", true)], t1);
  verifier("tout réparé : « retour à la normale »", repare.alerte?.genre === "retour" && repare.alerte.sujet.includes("retour à la normale"));
  verifier("puis silence", decider(repare.pannes, [r("a", true), r("b", true)], t1).alerte === null);
  verifier("aucun tiret cadratin ni emoji dans les messages", [casse, deux, mieux, repare].every((d) => !/[—\u{1F300}-\u{1FAFF}]/u.test(`${d.alerte?.sujet}${d.alerte?.texte}`)));

  // ── 2. La route, en mode essai ──────────────────────────────────────────────
  console.log("");
  console.log(`── Route /api/cron/veille, mode essai (${BASE}) ─────────────`);
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.log("CRON_SECRET absent de .env.local : la suite est ignorée.");
    process.exit(bilan() > 0 ? 1 : 0);
  }
  const sans = await fetch(`${BASE}/api/cron/veille?essai=1`);
  verifier("refusée sans le secret", sans.status === 401, `HTTP ${sans.status}`);

  const admin = createAdminClient();
  await admin.from("veille_etat").delete().eq("cle", "essai");

  const passer = async (casser: boolean) => {
    const q = `essai=1&scenarios=achat-simple-assujetti${casser ? "&casser=lien-cabinet" : ""}`;
    const rep = await fetch(`${BASE}/api/cron/veille?${q}`, { headers: { authorization: `Bearer ${secret}` } });
    const corps = await rep.json().catch(() => ({}));
    if (rep.status !== 200) console.log(JSON.stringify(corps).slice(0, 400));
    return { status: rep.status, ...corps } as {
      status: number; alerte: { genre: string; sujet: string; texte: string } | null; envoi: string | null;
      enPanne: string[]; nonJoues: string[]; nettoyage: string[]; resultats: { id: string; ok: boolean; detail?: string }[];
    };
  };

  const a = await passer(true);
  verifier("chemin cassé : la veille répond", a.status === 200, `HTTP ${a.status}`);
  verifier("chemin cassé : l'alerte part", a.alerte?.genre === "panne", JSON.stringify(a.alerte?.sujet));
  verifier("elle nomme le résumé cabinet", a.enPanne?.includes("resume-cabinet") && !!a.alerte?.texte.includes("Résumé cabinet"));
  verifier("elle nomme les exports du cabinet", a.enPanne?.includes("export:achat-simple-assujetti"));
  verifier("les chemins intacts ne sont pas cités", ["relance-devis", "relance-facture", "pointage"].every((id) => !a.enPanne?.includes(id)), (a.resultats ?? []).filter((x) => !x.ok).map((x) => `${x.id}: ${x.detail}`).join(" | "));
  verifier("mode essai : rien n'est envoyé", a.envoi === "non (essai)", String(a.envoi));
  verifier("comptes jetables supprimés", (a.nettoyage ?? []).length === 0, (a.nettoyage ?? []).join(", "));

  const b = await passer(true);
  verifier("même panne au passage suivant : silence", b.status === 200 && b.alerte === null && b.enPanne?.includes("resume-cabinet"), JSON.stringify(b.alerte));

  const c = await passer(false);
  verifier("chemin réparé : retour à la normale", c.alerte?.genre === "retour", JSON.stringify(c.alerte?.sujet) + " " + (c.resultats ?? []).filter((x) => !x.ok).map((x) => `${x.id}: ${x.detail}`).join(" | "));

  const d = await passer(false);
  verifier("tout va bien : silence", d.status === 200 && d.alerte === null && (d.enPanne ?? []).length === 0, JSON.stringify(d.enPanne));

  const { data: restes } = await admin.from("profiles").select("id").eq("is_demo", true).like("company_name", "Veille, %");
  verifier("aucun compte jetable de la veille ne reste en base", (restes ?? []).length === 0, `${restes?.length} restant(s)`);
  await admin.from("veille_etat").delete().eq("cle", "essai");

  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
})();
