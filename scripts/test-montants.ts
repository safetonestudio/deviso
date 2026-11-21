/**
 * Arithmétique monétaire exacte (lib/montants.ts) : cas connus, puis toutes les
 * bases de 0,01 € à 10 000 € à chaque taux français, contre une référence en
 * entiers. Contre-épreuve : l'ancienne règle (Math.round(x * 100) / 100) y fait
 * des milliers d'erreurs, comptées et exigées non nulles pour que le contrôle
 * prouve qu'il sait les voir.
 */
import { produitArrondi, tvaSurBase, arrondi2 } from "@/lib/montants";
import { ventilationTva } from "@/lib/tva";

let echecs = 0;
const ok = (n: string, c: boolean, d = "") => { console.log(`  ${c ? "ok  " : "ÉCHEC"} ${n}${c ? "" : " " + d}`); if (!c) echecs++; };

ok("10,05 € à 10 % = 1,01 €", tvaSurBase(10.05, 10) === 1.01, String(tvaSurBase(10.05, 10)));
ok("1,45 € à 10 % = 0,15 €", tvaSurBase(1.45, 10) === 0.15);
ok("1,005 arrondi = 1,01", arrondi2(1.005) === 1.01);
ok("-1,005 arrondi = -1,01", arrondi2(-1.005) === -1.01);
ok("3 × 0,335 = 1,01", produitArrondi(3, 0.335) === 1.01);
ok("100 € à 8,5 % = 8,50 €", tvaSurBase(100, 8.5) === 8.5);
ok("333,33 € à 1,05 % = 3,50 €", tvaSurBase(333.33, 1.05) === 3.5);
ok("0,1 + 0,2 = 0,30", arrondi2(0.1 + 0.2) === 0.3);
ok("12 345 678,91 € à 20 %", tvaSurBase(12345678.91, 20) === 2469135.78);
const v = ventilationTva([{ total: 10.05, tva_rate: 10 }], 10);
ok("ventilation d'une facture : 10,05 € à 10 % donne 1,01 € de TVA et 11,06 € TTC", v.total_tva === 1.01 && v.total_ttc === 11.06, JSON.stringify(v));

const taux = [20, 10, 8.5, 5.5, 2.1, 1.05, 0.9];
let faux = 0;
let ancien = 0;
for (let c = 1; c <= 1_000_000; c++) {
  const base = c / 100;
  for (const t of taux) {
    const ref = Math.floor((c * Math.round(t * 100) * 2 + 10000) / 20000) / 100;
    if (tvaSurBase(base, t) !== ref) faux++;
    if (Math.round(((base * t) / 100) * 100) / 100 !== ref) ancien++;
  }
}
ok("toutes les bases de 0,01 € à 10 000 €, 7 taux : aucun écart", faux === 0, `${faux} écart(s)`);
ok("contre-épreuve : l'ancienne règle se trompe et le contrôle le voit", ancien > 0, `${ancien}`);
console.log(`\n${echecs === 0 ? "test:montants, tout passe" : `test:montants, ${echecs} échec(s)`} (ancienne règle : ${ancien} TVA fausses d'un centime)`);
process.exit(echecs ? 1 : 0);
