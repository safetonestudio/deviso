#!/usr/bin/env node
/**
 * Contrôle statique : tout champ saisissable doit être réellement envoyé.
 *
 * Pourquoi ce script existe. Deux fois en deux jours, le même défaut est passé :
 * un champ ajouté au formulaire, absent de la charge utile envoyée à l'API. La
 * saisie vivait dans l'état React, l'utilisateur voyait « Enregistré », et la
 * valeur disparaissait au changement de page. Ni TypeScript ni le build ne
 * peuvent voir ça — les deux compilent parfaitement.
 *
 * Deux façons de lier un champ coexistent dans le projet, d'où deux modes :
 *   · « objet » — `value={profile.x}` avec `set("x", …)`   (page profil)
 *   · « états » — `value={monEtat}` avec un `useState`      (devis, factures…)
 *
 * Usage : node scripts/check-form-wiring.mjs
 */

import { readFileSync } from "node:fs";

const uniq = (a) => [...new Set(a)].sort();
const grab = (re, s) => uniq([...s.matchAll(re)].map((m) => m[1]));

/**
 * Extrait le corps du `JSON.stringify({…})` qui suit un appel à `fetch` vers
 * `route`. Nécessaire parce qu'une page peut contenir plusieurs envois — la
 * page devis en a trois, dont deux vers l'IA.
 */
function chargeUtile(source, marqueur) {
  // Une page contient souvent plusieurs envois vers la même route : lecture
  // initiale, enregistrement du formulaire, sauvegardes annexes. On parcourt
  // donc tous les objets littéraux passés à JSON.stringify et on retient celui
  // qui contient `marqueur` — un champ que seule la bonne charge utile possède.
  const blocs = [];
  const re = /JSON\.stringify\(|const mainFields\s*=\s*/g;
  let m;
  while ((m = re.exec(source))) {
    const debut = source.indexOf("{", m.index + m[0].length - 1);
    if (debut === -1) continue;
    let profondeur = 0;
    let k = debut;
    for (; k < source.length; k++) {
      if (source[k] === "{") profondeur++;
      else if (source[k] === "}" && --profondeur === 0) break;
    }
    blocs.push(source.slice(debut, k + 1));
  }
  return blocs.find((b) => b.includes(marqueur)) ?? null;
}

const FORMULAIRES = [
  {
    nom: "Profil — identité et facturation",
    mode: "objet",
    page: "app/(dashboard)/profil/page.tsx",
    api: "app/api/profile/route.ts",
    route: "/api/profile",
    marqueur: "tva_regime:",
    // Champs calculés côté serveur : les envoyer écraserait le calcul.
    derives: ["address", "address_country"],
    // Champs enregistrés par leurs propres boutons, hors du formulaire principal.
    ailleurs: ["subdomain", "reminder_intervals", "reminder_message", "cgv_text", "logo_url", "require_approval"],
  },
  {
    nom: "Paiements",
    mode: "etats",
    page: "app/(dashboard)/paiements/page.tsx",
    api: "app/api/profile/route.ts",
    marqueur: "payment_method:",
    derives: [],
    ailleurs: ["method", "provider"],
  },
  {
    nom: "Nouveau devis",
    mode: "etats",
    page: "app/(dashboard)/proposals/new/page.tsx",
    marqueur: "client_siren:",
    derives: [],
    // Champs pilotant la génération par IA, pas l'enregistrement du devis.
    ailleurs: ["brief", "refineInput", "durationHours", "durationMinutes"],
  },
  {
    nom: "Nouvelle facture (standard, acompte, solde)",
    mode: "etats",
    page: "app/(dashboard)/invoices/new/page.tsx",
    marqueur: "seller_siren:",
    derives: [],
    ailleurs: ["durationHours", "durationMinutes"],
  },
];

let echecs = 0;

for (const f of FORMULAIRES) {
  const page = readFileSync(f.page, "utf8");
  const corps = chargeUtile(page, f.marqueur);
  if (!corps) {
    console.error(`✗ ${f.nom} : charge utile contenant « ${f.marqueur} » introuvable dans ${f.page}`);
    echecs++;
    continue;
  }

  // Ce que l'utilisateur peut saisir : uniquement les champs contrôlés.
  const etats = new Set(grab(/const \[(\w+),\s*set\w+\]\s*=\s*useState/g, page));
  const saisissables =
    f.mode === "objet"
      ? grab(/set\("(\w+)"/g, page)
      : uniq([
          ...grab(/\bvalue=\{(\w+)\}/g, page),
          ...grab(/\bchecked=\{(\w+)\}/g, page),
        // On ne retient que les états déclarés : `value={m}` dans un `map` est
        // une variable de boucle, pas un champ saisi par l'utilisateur.
        ]).filter((c) => etats.has(c));

  const ignores = new Set([...f.derives, ...f.ailleurs]);
  const manquants = saisissables.filter((c) => {
    if (ignores.has(c)) return false;
    // En mode « états », il suffit que la variable apparaisse dans la charge utile.
    return f.mode === "objet"
      ? !new RegExp(`^\\s*${c}:`, "m").test(corps)
      : !new RegExp(`\\b${c}\\b`).test(corps);
  });

  // Champs envoyés que plus personne ne pilote : ils réécrivent une valeur
  // périmée par-dessus la base. C'est ainsi que `require_approval`, réglé sur la
  // page Équipe, était annulé en enregistrant son profil.
  let orphelins = [];
  if (f.mode === "objet") {
    const envoyes = grab(/^\s*(\w+):/gm, corps);
    orphelins = envoyes.filter((c) => !ignores.has(c) && !saisissables.includes(c));
  }

  // Côté route, on ne vérifie la liste blanche que là où il en existe une.
  // Ailleurs, c'est la traversée de bout en bout qui fait foi.
  let refuses = [];
  if (f.api) {
    const api = readFileSync(f.api, "utf8");
    const ma = /const allowed = \[([\s\S]*?)\];/.exec(api);
    if (ma) {
      const acceptes = [
        ...grab(/"(\w+)"/g, ma[1]),
        // Un champ peut aussi être traité explicitement plus bas (`updates.x = …`),
        // ce que fait l'adresse pour recomposer sa forme affichable.
        ...grab(/updates\.(\w+)\s*=/g, api),
      ];
      const envoyes = grab(/^\s*(\w+):/gm, corps);
      refuses = envoyes.filter((c) => !ignores.has(c) && !acceptes.includes(c));
    }
  }

  if (!manquants.length && !orphelins.length && !refuses.length) {
    console.log(`✓ ${f.nom} — ${saisissables.length} champs saisissables, tous transmis`);
    continue;
  }

  for (const c of manquants) {
    console.error(`✗ ${f.nom} — « ${c} » est saisissable mais absent de la charge utile : la valeur sera perdue`);
    echecs++;
  }
  for (const c of refuses) {
    console.error(`✗ ${f.nom} — « ${c} » est envoyé mais refusé par la route : la valeur sera ignorée`);
    echecs++;
  }
  for (const c of orphelins) {
    console.error(`✗ ${f.nom} — « ${c} » est envoyé mais n'est plus saisissable : valeur périmée écrasant la base`);
    echecs++;
  }
}

process.exit(echecs > 0 ? 1 : 0);
