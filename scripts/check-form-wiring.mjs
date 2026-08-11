#!/usr/bin/env node
/**
 * Contrôle statique : tout champ lié à un formulaire doit être réellement envoyé.
 *
 * Pourquoi ce script existe. Deux fois en une journée, le même défaut est passé :
 * un champ ajouté au formulaire, absent de la charge utile envoyée à l'API. La
 * saisie vivait dans l'état React, l'utilisateur voyait « Enregistré », et la
 * valeur disparaissait au changement de page. Ni TypeScript ni le build ne
 * peuvent voir ça — les deux compilent parfaitement.
 *
 * Ce contrôle compare, pour chaque formulaire déclaré ci-dessous :
 *   1. les champs pilotés par l'interface,
 *   2. les champs présents dans la charge utile,
 *   3. les champs acceptés en écriture par la route API.
 *
 * Il échoue si un champ existe en (1) sans exister en (2) et (3).
 *
 * Usage : node scripts/check-form-wiring.mjs
 */

import { readFileSync } from "node:fs";

const uniq = (a) => [...new Set(a)].sort();
const grab = (re, s) => uniq([...s.matchAll(re)].map((m) => m[1]));

/**
 * `derived` : champs calculés côté serveur à partir d'autres champs. Ils sont
 * légitimement absents de la charge utile — les envoyer écraserait le calcul.
 */
const FORMS = [
  {
    nom: "Profil — identité et facturation",
    page: "app/(dashboard)/profil/page.tsx",
    api: "app/api/profile/route.ts",
    payload: /const mainFields = \{([\s\S]*?)\n    \};/,
    derived: ["address", "address_country"],
    // Champs sauvegardés par leurs propres boutons, hors du formulaire principal.
    ailleurs: ["subdomain", "reminder_intervals", "reminder_message", "cgv_text", "logo_url"],
  },
];

let echecs = 0;

for (const f of FORMS) {
  const page = readFileSync(f.page, "utf8");
  const api = readFileSync(f.api, "utf8");

  const pilotes = grab(/set\("(\w+)"/g, page);
  const m = f.payload.exec(page);
  if (!m) {
    console.error(`✗ ${f.nom} : charge utile introuvable dans ${f.page}`);
    echecs++;
    continue;
  }
  const envoyes = grab(/^\s*(\w+):/gm, m[1]);

  const ma = /const allowed = \[([\s\S]*?)\];/.exec(api);
  // Un champ peut être accepté de deux façons : par la liste blanche, ou traité
  // explicitement plus bas dans la route (`updates.champ = …`), ce que fait
  // l'adresse pour recomposer sa forme affichable.
  const acceptes = [
    ...(ma ? grab(/"(\w+)"/g, ma[1]) : []),
    ...grab(/updates\.(\w+)\s*=/g, api),
  ];

  const ignores = new Set([...f.derived, ...f.ailleurs]);
  const manquants = pilotes.filter(
    (c) => !ignores.has(c) && (!envoyes.includes(c) || !acceptes.includes(c))
  );
  const orphelins = envoyes.filter((c) => !ignores.has(c) && !pilotes.includes(c));

  if (manquants.length === 0 && orphelins.length === 0) {
    console.log(`✓ ${f.nom} — ${pilotes.length} champs, tous branchés de bout en bout`);
  } else {
    for (const c of manquants) {
      const ou = !envoyes.includes(c) ? "absent de la charge utile" : "refusé par l'API";
      console.error(`✗ ${f.nom} — « ${c} » est saisissable mais ${ou} : la valeur sera perdue`);
      echecs++;
    }
    for (const c of orphelins) {
      console.error(`✗ ${f.nom} — « ${c} » est envoyé mais n'est plus saisissable : valeur périmée écrasant la base`);
      echecs++;
    }
  }
}

process.exit(echecs > 0 ? 1 : 0);
