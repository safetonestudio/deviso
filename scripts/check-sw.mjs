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

// En local (next dev), les fichiers /_next/static/ ne changent pas de nom quand leur
// contenu change : servis depuis le cache, ils faisaient tourner l'ancien code face au
// rendu serveur (erreur d'hydratation, page d'accueil rechargee en boucle, 20/11/2026).
const ignoreLocal = (sw) => /const LOCAL = [^;]*localhost/.test(sw) && /addEventListener\("fetch", \(event\) => \{\s*if \(LOCAL\) return;/.test(sw);
if (!ignoreLocal(src)) echecs.push("sur un hote local, le fetch doit sortir avant toute interception (if (LOCAL) return;)");
const reg = readFileSync("components/ServiceWorker.tsx", "utf8");
const enregistreHorsProd = (r) => !/if \(process\.env\.NODE_ENV !== "production"\) \{[\s\S]*?unregister\(\)[\s\S]*?return;[\s\S]*?\}[\s\S]*?\.register\(/.test(r);
if (enregistreHorsProd(reg)) echecs.push("components/ServiceWorker.tsx enregistre le service worker hors production");

// Contre-epreuves : l'ancienne version doit etre detectee.
if (ignoreLocal(src.replace(/if \(LOCAL\) return;\s*const \{ request \}/, "const { request }"))) { console.error("contre-epreuve check:sw (fetch local) cassee"); process.exit(1); }
if (!enregistreHorsProd('navigator.serviceWorker.register("/sw.js")')) { console.error("contre-epreuve check:sw (enregistrement) cassee"); process.exit(1); }
const v1 = 'fetch(request).then((res) => { const clone = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)); })';
if (/res\.ok/.test(v1)) { console.error("contre-epreuve check:sw cassee"); process.exit(1); }

if (echecs.length) {
  console.error("check:sw\n  " + echecs.join("\n  "));
  process.exit(1);
}
console.log("✓ Service worker : seules les reponses saines du site sont mises en cache, et rien en local.");
