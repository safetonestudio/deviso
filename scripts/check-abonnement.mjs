/**
 * check:abonnement — deux règles de facturation que le code ne doit plus perdre.
 *
 * ── 1. Un abonnement en cours se modifie, il ne se double pas ──────────────
 *
 * `/api/stripe/checkout` ouvrait un tunnel de paiement quoi qu'il arrive. Un
 * client Solo qui cliquait « Passer à Pro » repartait donc avec DEUX
 * abonnements actifs, 18 € + 34 € tous les mois, et le webhook écrasait
 * `stripe_subscription_id` au passage : Deviso ne savait même plus que le
 * premier existait.
 *
 * Ce n'était pas une hypothèse. Le 11/07/2026, le client cus_UrZfhGPUjRshd1 a
 * porté un Solo et un Pro en parallèle pendant vingt-huit jours. Les deux
 * essais se sont éteints faute de carte : c'est la seule raison pour laquelle
 * personne n'a rien payé.
 *
 * La règle : tout fichier qui crée une session Stripe en `mode: "subscription"`
 * doit d'abord lire `stripe_subscription_id` et appeler `subscriptions.update`.
 *
 * ── 2. Les sièges se calculent, ils ne s'incrémentent pas ─────────────────
 *
 * L'ancien `addSeatToSubscription` faisait `quantity + 1` à chaque invitation
 * acceptée — dès le PREMIER collaborateur, alors que les CGU vendent « 3
 * utilisateurs inclus, le titulaire et 2 membres ». Dix euros par mois facturés
 * en trop, sur la page qui affichait la promesse inverse. Et un compteur dérive :
 * le double clic sur un lien d'invitation avait déjà fait facturer deux sièges
 * pour un collaborateur.
 *
 * La règle : la quantité de sièges se déduit de `siegesDus()`, qui lit les
 * membres actifs. Aucun `quantity: … + 1` ni `- 1` ailleurs.
 *
 * ⚠️ Ce que ce contrôle NE couvre PAS :
 *   · que `MEMBRES_INCLUS` vaut ce que disent les CGU — c'est une lecture
 *     humaine, faite le 15/09/2026 : « le titulaire du compte et 2 membres » ;
 *   · que la modification d'abonnement fonctionne réellement chez Stripe :
 *     il faudrait un abonnement vivant, donc un débit réel ;
 *   · le portail Stripe, dont `subscription_update` est désactivé côté
 *     tableau de bord et qu'aucun script ne peut configurer.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = process.cwd();
const IGNORE = new Set(["node_modules", ".next", ".git", "public"]);

const CREATION_ABONNEMENT = /checkout\.sessions\.create\s*\(/;
const MODE_ABONNEMENT = /mode:\s*["']subscription["']/;
const LIT_EXISTANT = /stripe_subscription_id/;
const MODIFIE_EXISTANT = /subscriptions\.update\s*\(/;

const QUANTITE_INCREMENTEE = /quantity:\s*\(?[^,\n)]*\)?\s*[+-]\s*1\b/;
const ECRIT_SIEGE = /subscriptionItems\.(create|update)\s*\(/;
const CALCULE_SIEGES = /siegesDus\s*\(/;

function fichiers(dossier, acc = []) {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const p = join(dossier, e.name);
    if (e.isDirectory()) fichiers(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const problemes = [];
let lus = 0;

for (const dossier of ["app", "lib"]) {
  for (const f of fichiers(join(RACINE, dossier))) {
    lus++;
    const src = readFileSync(f, "utf8");
    const rel = relative(RACINE, f).replace(/\\/g, "/");

    if (CREATION_ABONNEMENT.test(src) && MODE_ABONNEMENT.test(src)) {
      if (!LIT_EXISTANT.test(src) || !MODIFIE_EXISTANT.test(src)) {
        problemes.push({
          fichier: rel,
          quoi: "crée un abonnement sans traiter celui qui existe déjà",
          quoiFaire:
            "lire profiles.stripe_subscription_id, et si l'abonnement est vivant, " +
            "remplacer son article de plan par stripe.subscriptions.update().",
        });
      }
    }

    if (ECRIT_SIEGE.test(src) && !CALCULE_SIEGES.test(src)) {
      problemes.push({
        fichier: rel,
        quoi: "écrit une quantité de sièges sans passer par siegesDus()",
        quoiFaire:
          "déduire la quantité du nombre de membres actifs via siegesDus() " +
          "(lib/stripe-seats.ts), jamais d'un incrément.",
      });
    }

    if (QUANTITE_INCREMENTEE.test(src)) {
      problemes.push({
        fichier: rel,
        quoi: "incrémente ou décrémente une quantité d'abonnement",
        quoiFaire:
          "poser la quantité calculée. Un compteur dérive dès qu'un appel se " +
          "perd ou se rejoue ; un calcul depuis l'état réel répare au lieu de dériver.",
      });
    }
  }
}

/** Contre-épreuves : le contrôle voit-il encore les deux défauts d'origine ? */
const CONTRE_EPREUVES = [
  {
    quoi: "un checkout d'abonnement sans lecture de l'abonnement existant",
    source: `await stripe.checkout.sessions.create({ mode: "subscription", line_items: [] });`,
    detecte: (src) =>
      CREATION_ABONNEMENT.test(src) &&
      MODE_ABONNEMENT.test(src) &&
      (!LIT_EXISTANT.test(src) || !MODIFIE_EXISTANT.test(src)),
  },
  {
    quoi: "une quantité de sièges incrémentée",
    source: `await stripe.subscriptionItems.update(item.id, { quantity: (item.quantity ?? 0) + 1 });`,
    detecte: (src) => QUANTITE_INCREMENTEE.test(src),
  },
  {
    quoi: "une écriture de siège qui ne calcule pas",
    source: `await stripe.subscriptionItems.create({ subscription: id, price: p, quantity: 3 });`,
    detecte: (src) => ECRIT_SIEGE.test(src) && !CALCULE_SIEGES.test(src),
  },
];

const ratees = CONTRE_EPREUVES.filter((c) => !c.detecte(c.source));
if (ratees.length > 0) {
  console.error("check:abonnement — le contrôle ne voit plus ce qu'il surveille :");
  for (const r of ratees) console.error(`  raté : ${r.quoi}\n    ${r.source}`);
  process.exit(1);
}

if (problemes.length === 0) {
  for (const c of CONTRE_EPREUVES) console.log(`  ·    contre-épreuve : ${c.quoi} bien détecté`);
  console.log(
    `check:abonnement — ${lus} fichiers. Aucun second abonnement possible, ` +
      `aucune quantité de sièges incrémentée.`
  );
  process.exit(0);
}

console.error(`check:abonnement — ${problemes.length} problème(s) :\n`);
for (const p of problemes) {
  console.error(`  ${p.fichier}`);
  console.error(`    ${p.quoi}`);
  console.error(`    → ${p.quoiFaire}\n`);
}
process.exit(1);
