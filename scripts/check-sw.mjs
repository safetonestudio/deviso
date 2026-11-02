// Garde du service worker : il ne doit jamais mettre en cache une reponse en
// erreur. La v1 le faisait : apres un redemarrage ou un deploiement, une page
// sans mise en forme etait resservie indefiniment depuis le cache.
import { readFileSync } from "node:fs";

const src = readFileSync("public/sw.js", "utf8");
const echecs = [];
if (!/res\.ok/.test(src)) echecs.push("aucun controle res.ok avant mise en cache");
const puts = src.match(/cache\.put\(/g) ?? [];
if (puts.length !== 1) echecs.push(`cache.put doit passer par une seule fonction filtree (trouve ${puts.length})`);
if (!/function mettreEnCache[\s\S]*?if \(!cachable\(res\)\) return;[\s\S]*?cache\.put\(/.test(src)) echecs.push("cache.put n'est pas precede du filtre cachable(res)");
if (/CACHE_NAME = "deviso-v1"/.test(src)) echecs.push("nom de cache v1 : les caches empoisonnes ne seraient pas purges");

// Contre-epreuve : l'ancienne version doit etre detectee.
const v1 = 'fetch(request).then((res) => { const clone = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); })';
if (/res\.ok/.test(v1)) { console.error("contre-epreuve check:sw cassee"); process.exit(1); }

if (echecs.length) {
  console.error("check:sw\n  " + echecs.join("\n  "));
  process.exit(1);
}
console.log("✓ Service worker : seules les reponses saines du site sont mises en cache.");
