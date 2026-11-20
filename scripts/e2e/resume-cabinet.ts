/**
 * Résumé du lundi au cabinet (20/11/2026), construit sur les vraies données,
 * SANS rien envoyer : on appelle construireResume et on lit le résultat.
 *
 * Cabinet de test : deviso-demo-cabinet@example.com, rattaché au compte de
 * test Super PDP (dossier réel, non démo) et à trois dossiers de démo. On
 * vérifie aussi que les dossiers de démonstration sont exclus et que les
 * adresses de test ne reçoivent jamais rien.
 *
 * Lancer : npx -y tsx scripts/e2e/resume-cabinet.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { verifier, bilan } from "./lib.mjs";

if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  const { construireResume, adresseDeTest } = await import("@/lib/cabinet-resume");
  const { dossiersDuCabinet } = await import("@/lib/cabinet-acces");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  console.log("── Adresses de test ───────────────────────────────────────────");
  verifier("example.com ne reçoit rien", adresseDeTest("deviso-demo-cabinet@example.com"));
  verifier("le domaine de démonstration ne reçoit rien", adresseDeTest("cabinet.martel@demo.getdeviso.fr"));
  verifier("une vraie adresse reçoit", !adresseDeTest("contact@cabinet-durand.fr"));

  console.log("── Résumé du cabinet de test ──────────────────────────────────");
  const { data: cab } = await admin.from("profiles").select("id").eq("email", "deviso-demo-cabinet@example.com").maybeSingle();
  verifier("le cabinet de test existe", !!cab?.id);
  if (!cab?.id) return bilan();
  const tous = await dossiersDuCabinet(admin, cab.id);
  const { data: demos } = await admin.from("profiles").select("id, company_name, full_name").in("id", tous).eq("is_demo", true);
  const { data: reels } = await admin.from("profiles").select("id, company_name, full_name").in("id", tous).eq("is_demo", false);

  const r = await construireResume(admin, cab.id);
  verifier("un résumé est produit (le dossier réel a des points à traiter)", !!r);
  if (!r) return bilan();
  verifier("objet lisible, séparateur en point médian, sans emoji", /^Votre portefeuille Deviso · /.test(r.sujet) && !/\p{Extended_Pictographic}/u.test(r.sujet), r.sujet);
  const cadratin = String.fromCharCode(0x2014);
  verifier("aucun tiret cadratin", !r.html.includes(cadratin) && !r.texte.includes(cadratin));
  const nomReel = (reels ?? [])[0]?.company_name || (reels ?? [])[0]?.full_name || "";
  verifier("le dossier réel y figure", !!nomReel && r.html.includes(nomReel.replace(/&/g, "&amp;")), nomReel);
  const nomsDemo = (demos ?? []).map((d) => d.company_name || d.full_name).filter(Boolean) as string[];
  verifier("aucun dossier de démonstration n'y figure", nomsDemo.every((n) => !r.html.includes(n)), nomsDemo.join(", "));
  verifier("chaque dossier mène à sa fiche", /\/cabinet\/[0-9a-f-]{36}/.test(r.html));
  verifier("le moyen de ne plus le recevoir est indiqué", /ne plus le recevoir/.test(r.html) && r.html.includes("/cabinet/parametres?vue=notifications"));

  console.log("── Contre-épreuve : un cabinet sans dossier réel ──────────────");
  const { data: martel } = await admin.from("profiles").select("id").eq("email", "cabinet.martel@demo.getdeviso.fr").maybeSingle();
  if (martel?.id) {
    const rm = await construireResume(admin, martel.id);
    verifier("cabinet dont tous les dossiers sont des démos : aucun résumé", rm === null);
  }

  bilan();
}

main();
