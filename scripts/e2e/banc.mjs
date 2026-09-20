/**
 * Monte le banc d'essai Stripe, joue les deux traversées, démonte.
 *
 * Une commande, pour que la vérification reste faisable un jour où personne
 * n'a envie de lancer trois terminaux. Un banc qu'on ne lance jamais ne
 * protège de rien.
 *
 * Ce banc N'EST PAS dans `npm run verify` : il démarre un serveur Next et un
 * faux Stripe, ce qui prend une minute et suppose un port libre. Il se lance à
 * la main avant toute mise en ligne qui touche à l'abonnement, au webhook ou
 * aux sièges.
 *
 * Usage : npm run test:banc
 */

import { spawn, execSync } from "node:child_process";
import { setTimeout as attendre } from "node:timers/promises";

const PORT_FAUX = 12111;
const PORT_APP = 3100;
const BASE_FAUX = `http://127.0.0.1:${PORT_FAUX}`;
const BASE_APP = `http://127.0.0.1:${PORT_APP}`;

const enfants = [];
function lancer(commande, args, env = {}) {
  const p = spawn(commande, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  enfants.push(p);
  return p;
}
/**
 * Arrêter pour de bon, y compris sous Windows.
 *
 * `spawn` avec `shell: true` lance un `cmd` qui lance node : `p.kill()` tue le
 * `cmd` et laisse node écouter sur son port. Le banc suivant trouvait donc le
 * port pris, ne démarrait pas son propre serveur, et restait suspendu sur un
 * serveur de la fois d'avant — qui tournait encore l'ANCIEN code. Un banc qui
 * mesure une version qu'on croit avoir remplacée est pire qu'un banc absent.
 * `taskkill /T` tue l'arbre entier.
 */
function arreter() {
  for (const p of enfants) {
    try {
      if (process.platform === "win32" && p.pid) {
        execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: "ignore" });
      } else {
        p.kill();
      }
    } catch { /* déjà mort */ }
  }
}
process.on("exit", arreter);
process.on("SIGINT", () => { arreter(); process.exit(130); });

async function attendreQue(url, quoi, secondes = 90) {
  for (let i = 0; i < secondes; i++) {
    try {
      // Toute réponse HTTP suffit : on attend qu'un serveur réponde, pas qu'il
      // dise oui. `/api/profile` répond 401 sans session — un 401 prouve que
      // l'application est debout, et c'est exactement ce qu'on veut savoir.
      await fetch(url);
      return true;
    } catch { /* pas encore là */ }
    await attendre(1000);
  }
  console.error(`${quoi} n'a pas démarré en ${secondes} s.`);
  return false;
}

/** Un port encore tenu par un banc précédent fausserait toute la mesure. */
function libererPort(port) {
  if (process.platform !== "win32") return;
  try {
    const sortie = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    });
    for (const pid of new Set(sortie.trim().split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()))) {
      if (pid && pid !== "0") {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
        console.log(`  port ${port} libéré (processus ${pid} d'un banc précédent)`);
      }
    }
  } catch { /* port libre */ }
}

console.log("Montage du banc…");
libererPort(PORT_FAUX);
libererPort(PORT_APP);
lancer("node", ["scripts/e2e/faux-stripe.mjs", String(PORT_FAUX)]);
if (!(await attendreQue(`${BASE_FAUX}/_journal`, "Le faux Stripe", 20))) process.exit(1);
console.log(`  faux Stripe   ${BASE_FAUX}`);

lancer("npx", ["next", "dev", "-p", String(PORT_APP)], {
  STRIPE_API_BASE: BASE_FAUX,
  NEXT_PUBLIC_APP_URL: BASE_APP,
});
if (!(await attendreQue(`${BASE_APP}/api/profile`, "L'application", 120))) process.exit(1);
console.log(`  application   ${BASE_APP}`);

/*
 * Préchauffage.
 *
 * `next dev` compile chaque route à son PREMIER appel. Le banc a été coupé une
 * fois par un « Headers Timeout » sur `/api/stripe/checkout` : le scénario
 * attendait une réponse pendant que Turbopack compilait la route. Ce n'était
 * pas un échec de vérification, mais c'en avait l'air — et une traversée dont
 * on ne sait pas distinguer la panne du verdict ne sert à rien.
 *
 * On appelle donc chaque route sans session (401 immédiat, aucun effet) pour
 * que la compilation soit finie avant la première mesure.
 */
console.log("  préchauffage des routes…");
for (const route of ["/api/stripe/checkout", "/api/stripe/portal", "/api/webhooks/stripe", "/api/team/x"]) {
  try {
    await fetch(`${BASE_APP}${route}`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
  } catch { /* le but est de compiler, pas d'obtenir une réponse utile */ }
}

const env = { FAUX_STRIPE: BASE_FAUX, APP_LOCALE: BASE_APP };
let codeFinal = 0;

for (const traversee of ["abonnement", "webhook"]) {
  console.log("");
  const p = lancer("node", [`scripts/e2e/${traversee}.mjs`], env);
  p.stdout.on("data", (d) => process.stdout.write(d));
  p.stderr.on("data", (d) => process.stderr.write(d));
  const code = await new Promise((r) => p.on("close", r));
  if (code !== 0) codeFinal = code;
}

console.log("");
console.log("Démontage du banc.");
arreter();
process.exit(codeFinal);
