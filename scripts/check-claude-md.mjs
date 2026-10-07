// Garde de taille et de structure de CLAUDE.md.
// CLAUDE.md est gitignore mais relu EN ENTIER a chaque demarrage de session :
// chaque ligne se paie sur chaque tache. On refuse le gonflement a la source.
//   - plafond de lignes (au-dela, condenser ou archiver vers ARCHIVE.md) ;
//   - un seul bloc "### Reprise" (un journal de reprise remplace le precedent).
// Absent de la machine (ex. CI) => on ignore, pas d'echec.
import { readFileSync } from "node:fs";

const MAX_LIGNES = 900;
const chemin = "CLAUDE.md";

let txt;
try {
  txt = readFileSync(chemin, "utf8");
} catch {
  console.log("check:claude-md ignore (CLAUDE.md absent sur cette machine)");
  process.exit(0);
}

const lignes = txt.split("\n").length;
const reprises = (txt.match(/^### Reprise/gm) || []).length;
const erreurs = [];

if (lignes > MAX_LIGNES) {
  erreurs.push(
    `CLAUDE.md fait ${lignes} lignes (plafond ${MAX_LIGNES}). ` +
    `Condenser, ou deplacer un recit clos vers ARCHIVE.md en ne gardant que son titre dans l'index.`
  );
}
if (reprises > 1) {
  erreurs.push(
    `${reprises} blocs "### Reprise" (1 seul autorise). ` +
    `Une nouvelle reprise remplace la precedente ; l'ancienne part dans ARCHIVE.md.`
  );
}

if (erreurs.length) {
  console.error("check:claude-md ECHEC :\n- " + erreurs.join("\n- "));
  process.exit(1);
}
console.log(`check:claude-md OK (${lignes} lignes, ${reprises} bloc Reprise)`);
