// Build silencieux. Execute `next build` mais retire la table des routes
// (~150 lignes reimprimees a chaque build) et les lignes de progression, qui
// n'apportent rien a une verification. Tout le reste est conserve tel quel :
// compilation, avertissements, erreurs, temps. Code de sortie = celui du build.
//
// Pourquoi : `verify:rendu` etait relance plusieurs fois par session, et la
// table des routes seule pesait plus que tout le reste du build reuni. Voir la
// Regle no5 de CLAUDE.md (economie de contexte).
import { spawnSync } from "node:child_process";

const r = spawnSync("npm", ["run", "build"], {
  encoding: "utf8",
  shell: true,
  maxBuffer: 64 * 1024 * 1024,
});

const texte = (r.stdout || "") + (r.stderr || "");

const estArbreRoutes = (l) => /^\s*[┌├│└]/.test(l); // ┌ ├ │ └
const estLegende = (l) =>
  /^Route \(app\)/.test(l) ||
  /^ƒ Proxy \(Middleware\)/.test(l) ||
  /^[○●ƒ]\s+\((Static|SSG|Dynamic)\)/.test(l) || // ○ ● ƒ
  /prerendered as|server-rendered on demand|uses generateStaticParams/.test(l);
const estProgression = (l) =>
  /Generating static pages using .* workers \(\d+\//.test(l) && !l.includes("✓"); // garde la ligne ✓ finale

let avaleBlancs = 0;
for (const l of texte.split(/\r?\n/)) {
  if (estArbreRoutes(l) || estLegende(l) || estProgression(l)) {
    avaleBlancs = 2;
    continue;
  }
  if (l.trim() === "" && avaleBlancs > 0) {
    avaleBlancs--;
    continue;
  }
  avaleBlancs = 0;
  console.log(l);
}

process.exit(r.status ?? 0);
