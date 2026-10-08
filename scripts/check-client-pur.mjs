/**
 * Garde : aucun composant client ne doit embarquer de code serveur.
 *
 * Contexte. Un fichier `"use client"` qui importe (meme indirectement) un
 * module serveur fait embarquer tout ce graphe dans le bundle navigateur.
 * C'est arrive avec la page Profil : un simple `import { PERIODICITES_TVA }`
 * remontait jusqu'a `lib/superpdp.ts` (qui importe `crypto` et le client
 * Supabase admin), soit ~452 Ko de polyfills crypto cote client ET du code a
 * cle de service expose dans le navigateur.
 *
 * Ce script suit le graphe d'imports de chaque fichier client et echoue si ce
 * graphe atteint une "feuille" interdite :
 *   - le module `crypto` / `node:crypto` ;
 *   - `lib/superpdp.ts` (crypto + admin) ;
 *   - `lib/supabase/admin.ts` (clef de service).
 *
 * Les imports de type (`import type`, `export type`) sont ignores : ils sont
 * effaces a la compilation et ne pesent pas dans le bundle.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const DENIED_FILES = [
  path.join(ROOT, "lib", "superpdp.ts"),
  path.join(ROOT, "lib", "supabase", "admin.ts"),
].map((p) => path.normalize(p));

const DENIED_BARE = new Set(["crypto", "node:crypto"]);

const SCAN_DIRS = ["app", "components", "lib"].map((d) => path.join(ROOT, d));
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

/** Tous les fichiers .ts / .tsx sous les dossiers scannes. */
function collecter(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collecter(path.join(dir, entry.name), acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

const lireCache = new Map();
function lire(file) {
  if (!lireCache.has(file)) lireCache.set(file, fs.readFileSync(file, "utf8"));
  return lireCache.get(file);
}

function estClient(file) {
  const tete = lire(file).slice(0, 600);
  return /^\s*(["'])use client\1/m.test(tete);
}

/** Specifiers importes par un fichier, hors imports de type (effaces au build). */
const importsCache = new Map();
function specifiers(file) {
  if (importsCache.has(file)) return importsCache.get(file);
  const src = lire(file);
  const specs = [];

  // import ... from "x"  /  export ... from "x"  (on saute `type`)
  const re = /\b(import|export)\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[2]) continue; // import/export type -> efface au build
    specs.push(m[4]);
  }
  // import "x" (effet de bord)
  const re2 = /\bimport\s+["']([^"']+)["']/g;
  while ((m = re2.exec(src))) specs.push(m[1]);
  // import("x") (dynamique)
  const re3 = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = re3.exec(src))) specs.push(m[1]);

  importsCache.set(file, specs);
  return specs;
}

/** Resout un specifier interne (@/ ou relatif) vers un fichier, sinon null. */
function resoudre(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // paquet externe
  const essais = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".js",
    base + ".mjs",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const t of essais) {
    try {
      if (fs.existsSync(t) && fs.statSync(t).isFile()) return path.normalize(t);
    } catch {}
  }
  return null;
}

function estFichierInterdit(f) {
  return DENIED_FILES.includes(path.normalize(f));
}

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");

/** Renvoie la chaine d'imports jusqu'a une feuille interdite, ou null. */
function chaineInterdite(file, vus) {
  for (const spec of specifiers(file)) {
    if (DENIED_BARE.has(spec)) return [spec];
    const r = resoudre(spec, file);
    if (!r) continue;
    if (estFichierInterdit(r)) return [rel(r)];
    if (vus.has(r)) continue;
    vus.add(r);
    const sous = chaineInterdite(r, vus);
    if (sous) return [rel(r), ...sous];
  }
  return null;
}

function main() {
  const fichiers = [];
  for (const d of SCAN_DIRS) collecter(d, fichiers);

  const clients = fichiers.filter(estClient);
  const violations = [];
  for (const c of clients) {
    const chaine = chaineInterdite(c, new Set([c]));
    if (chaine) violations.push({ client: rel(c), chaine });
  }

  // Contre-epreuves : prouver que la detection fonctionne.
  const cp = [];
  cp.push(["le module serveur superpdp.ts est bien dans la liste interdite", estFichierInterdit(path.join(ROOT, "lib", "superpdp.ts"))]);
  cp.push(["crypto est bien une feuille interdite", DENIED_BARE.has("crypto")]);
  cp.push(["@/lib/superpdp se resout bien vers le fichier interdit", (() => {
    const r = resoudre("@/lib/superpdp", path.join(ROOT, "app", "x.tsx"));
    return r !== null && estFichierInterdit(r);
  })()]);
  cp.push(["un import de type n'est PAS compte", (() => {
    // simulate: a file importing only a type from superpdp ne doit pas remonter
    const faux = 'import type { Foo } from "@/lib/superpdp";\n';
    const tmp = path.join(ROOT, "scripts", ".cp-client-pur.tmp.ts");
    fs.writeFileSync(tmp, '"use client";\n' + faux);
    importsCache.delete(tmp); lireCache.delete(tmp);
    const chaine = chaineInterdite(tmp, new Set([tmp]));
    fs.unlinkSync(tmp);
    return chaine === null;
  })()]);
  cp.push(["un import runtime vers superpdp EST detecte", (() => {
    const tmp = path.join(ROOT, "scripts", ".cp-client-pur2.tmp.ts");
    fs.writeFileSync(tmp, '"use client";\nimport { x } from "@/lib/superpdp";\n');
    importsCache.delete(tmp); lireCache.delete(tmp);
    const chaine = chaineInterdite(tmp, new Set([tmp]));
    fs.unlinkSync(tmp);
    return Array.isArray(chaine);
  })()]);

  console.log("");
  console.log("-- check:client-pur, aucun code serveur dans un fichier client --");
  console.log(`  ${clients.length} fichier(s) client analyse(s), ${fichiers.length} fichier(s) au total`);

  let ok = true;

  for (const [label, pass] of cp) {
    if (pass) console.log(`  .    contre-epreuve : ${label}`);
    else { console.log(`  FAIL contre-epreuve cassee : ${label}`); ok = false; }
  }

  if (violations.length === 0) {
    console.log("  ok   aucun fichier client ne remonte vers crypto / supabase admin / superpdp.ts");
  } else {
    ok = false;
    for (const v of violations) {
      console.log(`  FAIL ${v.client}`);
      console.log(`       chaine : ${v.client} -> ${v.chaine.join(" -> ")}`);
    }
  }

  console.log("");
  if (!ok) {
    console.log(`check:client-pur ECHEC, ${violations.length} fuite(s) serveur->client. Extraire la valeur pure dans un module sans import serveur (ex. lib/superpdp-constantes.ts) et l'importer de la.`);
    process.exit(1);
  }
  console.log("check:client-pur, aucune fuite de code serveur dans le bundle client.");
}

main();
