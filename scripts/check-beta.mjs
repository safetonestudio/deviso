#!/usr/bin/env node
/**
 * check:beta : la bêta se ferme d'un seul geste, et rien d'ancien ne s'est perdu.
 *
 * Exigence de Selim (24/11/2026) : à la fin de la bêta, repasser BETA_OUVERTE
 * à false (lib/beta.ts) doit remettre TOUS les comportements d'avant, sans
 * bug. Le risque n'est pas la bêta elle-même, c'est qu'un endroit ait été
 * réécrit pour la bêta en PERDANT l'ancien comportement : on ne le verrait
 * que le jour de la fermeture.
 *
 * Ce contrôle vérifie, sans rien lancer :
 *   1. l'interrupteur, une seule fois, dans lib/beta.ts ;
 *   2. pour chaque endroit qu'il commande, que la branche « bêta fermée »
 *      contient toujours l'ancien comportement (texte, lien, essai Stripe) ;
 *   3. qu'aucun fichier ne pointe le formulaire en dur hors de lib/beta.ts ;
 *   4. en exécutant lib/beta.ts avec l'interrupteur à false : l'appel
 *      redevient « Essayer 14 jours gratuitement » vers /signup, et les
 *      candidatures sont closes.
 *
 * Usage : npm run check:beta
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync, globSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

let echecs = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => {
  console.error(`  ✗ ${m}`);
  echecs++;
};
const lire = (f) => readFileSync(f, "utf8").replace(/\r\n/g, "\n");

export function verifier(lireFichier, fichiers) {
  let n = 0;
  const erreurs = [];
  const exiger = (f, aiguilles, raison) => {
    const src = lireFichier(f);
    for (const a of [].concat(aiguilles)) {
      if (!src.includes(a)) {
        erreurs.push(`${f} : ${raison} (attendu : ${JSON.stringify(a).slice(0, 90)})`);
        return;
      }
    }
    n++;
  };

  // 1. L'interrupteur
  const beta = lireFichier("lib/beta.ts");
  const occ = beta.match(/export const BETA_OUVERTE = (true|false);/g) ?? [];
  if (occ.length !== 1) erreurs.push("lib/beta.ts : BETA_OUVERTE doit être déclaré une seule fois, à true ou false");
  else n++;

  // 2. Chaque endroit commandé garde l'ancien comportement
  exiger("lib/beta.ts", ['lien: "/signup"', 'libelle: "Essayer 14 jours gratuitement"', 'libelleCourt: "Essai gratuit"', '"Essai gratuit de 14 jours, sans carte bancaire."'], "l'appel d'avant la bêta a disparu");
  exiger("app/page.tsx", ["BETA_OUVERTE ? <AppelBetaTesteurs /> : <TarifsTable />", 'import { TarifsTable } from "@/components/landing/TarifsTable";', 'price: grille("solo").mensuel', '"Essai gratuit de 14 jours, sans carte bancaire. Rien ne se déclenche à la fin."', '"Sans carte bancaire."'], "l'accueil d'avant la bêta n'est plus intact");
  exiger("components/landing/FreelanceLanding.tsx", ["BETA_OUVERTE ?", "Tarifs simples", 'price: grille("pro").mensuel', "14 jours d'essai gratuit."], "la section tarifs des pages métier a perdu sa version d'avant");
  exiger("components/site/PageSite.tsx", ["href={APPEL.lien}", "{APPEL.libelle}", "{APPEL.libelleCourt}"], "le bouton d'en-tête ne suit plus l'interrupteur");
  exiger("components/landing/WaitlistButton.tsx", ["BETA_OUVERTE ? APPEL.lien", "`/signup?plan=${plan}`"], "le bouton des articles a perdu son lien d'avant");
  exiger("app/(auth)/signup/page.tsx", ['!BETA_OUVERTE || invitationEquipe ? "libre"', "supabase.auth.signUp"], "l'inscription libre ne revient plus quand la bêta se ferme");
  exiger("app/api/stripe/checkout/route.ts", ["BETA_OUVERTE && !estBetaTesteur", "trial_period_days: 14", 'missing_payment_method: "cancel"'], "le paiement a perdu l'essai de 14 jours d'avant la bêta");
  exiger("app/(dashboard)/billing/page.tsx", ["BETA_OUVERTE && plan === \"free\"", "14 jours gratuits", "Commencer ton essai gratuit"], "la page Abonnement a perdu l'offre d'essai d'avant");
  exiger("app/(dashboard)/dashboard/page.tsx", ["!isPaid && !isMember && !BETA_OUVERTE", "Essai gratuit 14 jours"], "le bandeau d'offre du tableau de bord a disparu");
  exiger("app/cgu/page.tsx", ["{BETA_OUVERTE ? (", "Deviso propose deux formules", "{PRIX_SIEGE}"], "les CGU ont perdu la grille d'avant la bêta");
  exiger("components/DemoSession.tsx", ['BETA_OUVERTE ? LIEN_CANDIDATURE : "/signup"', '"Créer mon compte"'], "le bandeau de démo a perdu son lien d'avant");
  exiger("app/layout.tsx", ['"essai gratuit de 14 jours."', '"Essai gratuit sans carte bancaire."'], "les descriptions d'avant la bêta ont disparu");
  exiger("app/experts-comptables/page.tsx", ["BETA_OUVERTE", "14 jours d'essai. Factur-X", 'grille("solo").mensuel + " à "'], "la carte « Vos clients » d'avant la bêta a disparu");
  exiger("components/blog/BlogPost.tsx", ['BETA_OUVERTE ? APPEL.phrase : "Essai gratuit, sans carte bancaire."'], "la phrase d'avant la bêta a disparu");
  exiger("app/blog/checklist-reforme-facturation-2026/page.tsx", ['"Essayez gratuitement pendant 14 jours, sans carte bancaire."'], "la phrase d'avant la bêta a disparu");
  exiger("app/blog/liste-plateformes-agreees/page.tsx", ['"Essai de 14 jours, sans carte bancaire."'], "la phrase d'avant la bêta a disparu");
  exiger("components/landing/FaqAccueil.tsx", ["BETA_OUVERTE", "Que se passe-t-il à la fin de l'essai"], "la question d'avant la bêta a disparu");
  exiger("lib/beta-acces.ts", ["if (!BETA_OUVERTE || !profil) return false;", "if (!creeApresOuverture(profil.created_at)) return false;"], "un compte sans invitation resterait bloqué après la bêta, ou un compte existant serait bloqué");
  exiger("app/(auth)/login/page.tsx", ["isInvite || !BETA_OUVERTE", "S'inscrire gratuitement"], "le lien d'inscription de la connexion a perdu sa version d'avant");
  exiger("app/(dashboard)/layout.tsx", ['BETA_OUVERTE ? LIEN_CANDIDATURE : "/signup"', '"Créer mon vrai compte →"'], "le lien « Créer mon vrai compte » de la démo a perdu sa version d'avant");

  // 3. Le formulaire ne se pointe qu'à travers lib/beta.ts
  for (const f of fichiers) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "lib/beta.ts") continue;
    if (lireFichier(f).includes("#candidature\"") && !norm.endsWith("AppelBetaTesteurs.tsx")) {
      erreurs.push(`${norm} : lien vers le formulaire écrit en dur, passer par LIEN_CANDIDATURE ou APPEL.lien`);
    }
  }
  n++;
  return { n, erreurs };
}

async function simulerFermeture() {
  // Exécute une copie de lib/beta.ts avec l'interrupteur à false.
  const dir = mkdtempSync(join(tmpdir(), "check-beta-"));
  try {
    const src = lire("lib/beta.ts").replace("export const BETA_OUVERTE = true;", "export const BETA_OUVERTE = false;");
    const copie = join(dir, "beta.ts");
    writeFileSync(copie, src);
    const m = await import(pathToFileURL(copie).href);
    const erreurs = [];
    if (m.BETA_OUVERTE !== false) erreurs.push("la copie n'a pas pu être fermée");
    if (m.APPEL.lien !== "/signup") erreurs.push(`bêta fermée : le bouton mène à ${m.APPEL.lien}, attendu /signup`);
    if (m.APPEL.libelle !== "Essayer 14 jours gratuitement") erreurs.push(`bêta fermée : libellé « ${m.APPEL.libelle} »`);
    if (m.candidaturesOuvertes(new Date("2026-11-25T12:00:00Z")) !== false) erreurs.push("bêta fermée : les candidatures restent ouvertes");
    // Et dans l'autre sens : bêta ouverte, avant la date limite.
    const ouverte = await import(pathToFileURL(join(process.cwd(), "lib/beta.ts")).href);
    if (ouverte.BETA_OUVERTE && ouverte.APPEL.lien !== ouverte.LIEN_CANDIDATURE) erreurs.push("bêta ouverte : le bouton ne mène pas au formulaire");
    const fin = ouverte.finDeBeta(new Date("2026-11-30T10:00:00Z"));
    if (fin.toISOString() !== "2027-01-30T10:00:00.000Z") erreurs.push(`fin de bêta mal calculée : ${fin.toISOString()}`);
    return erreurs;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  console.log("check:beta, l'interrupteur de la bêta remet tout comme avant");
  const fichiers = globSync("{app,components,lib}/**/*.{ts,tsx}");
  const { n, erreurs } = verifier(lire, fichiers);
  erreurs.forEach(ko);
  const sim = await simulerFermeture();
  sim.forEach(ko);
  if (!sim.length) ok("lib/beta.ts exécuté interrupteur fermé : essai de 14 jours et /signup reviennent");

  // Contre-épreuve intégrée : sur une copie privée de l'ancien comportement, le
  // contrôle DOIT crier. Sinon il ne prouve rien.
  const amputee = (f) => {
    const s = lire(f);
    return f === "app/page.tsx" ? s.replace("BETA_OUVERTE ? <AppelBetaTesteurs /> : <TarifsTable />", "<AppelBetaTesteurs />") : s;
  };
  const contre = verifier(amputee, []);
  if (contre.erreurs.some((e) => e.startsWith("app/page.tsx"))) ok("contre-épreuve : un accueil privé de sa grille est bien refusé");
  else ko("contre-épreuve : le contrôle n'a pas vu l'accueil privé de sa grille");

  if (!erreurs.length) ok(`${n} endroits commandés par l'interrupteur, ancien comportement intact`);
  if (echecs) {
    console.error(`\ncheck:beta, ${echecs} défaut(s).`);
    process.exit(1);
  }
  console.log("check:beta, tout revient quand la bêta se ferme.");
}
