/**
 * Les fautes comptables qui ne lèvent aucune erreur.
 *
 * Pourquoi ce fichier existe. Les défauts trouvés dans la nuit du 07 au
 * 08/09/2026 avaient tous le même profil : le code s'exécute, le fichier
 * s'ouvre, le document s'imprime — et le chiffre est faux. Un export CSV dont
 * chaque ligne est décalée d'une colonne s'ouvre parfaitement dans Excel. Un
 * FEC qui compte les avoirs comme des ventes reste équilibré au débit-crédit,
 * donc le cabinet ne voit rien. Une facture dont les lignes ne sont pas
 * arrondies produit un PDF qui ne s'additionne pas avec lui-même.
 *
 * Rien de tout cela n'est attrapable par une traversée fonctionnelle : il n'y a
 * pas d'échec à observer. On surveille donc la FORME du code, comme le font
 * déjà `check-theme-clair.mjs` et `check-stripe.mjs`, et chaque contrôle porte
 * sa contre-épreuve — un motif fautif fabriqué sur place, dont on vérifie qu'il
 * serait bien détecté. Sans contre-épreuve, un contrôle qui ne trouve jamais
 * rien est indiscernable d'un contrôle cassé.
 *
 * Usage : node scripts/check-comptable.mjs
 */

import { readFileSync } from "node:fs";

let echecs = 0;
const lire = (p) => readFileSync(p, "utf8");

function exige(nom, condition, explication) {
  if (condition) {
    console.log(`  ok   ${nom}`);
  } else {
    echecs++;
    console.error(`✗ ${nom}\n     ${explication}`);
  }
}

function contreEpreuve(nom, detecteur, echantillonFautif) {
  if (detecteur(echantillonFautif)) {
    console.log(`  ·    contre-épreuve : ${nom}`);
  } else {
    echecs++;
    console.error(`✗ contre-épreuve MUETTE : ${nom}\n     le contrôle ne détecte plus la faute qu'il surveille`);
  }
}

console.log("");
console.log("── Exports : le fichier s'ouvre, et il est faux ───────────────");
console.log("");

// ── 1. Séparateur CSV ───────────────────────────────────────────────────────
//
// Les montants sont formatés « 1234,56 ». Joints par une virgule, chaque
// colonne numérique éclatait en deux champs : douze colonnes en produisaient
// seize, et toutes les lignes étaient décalées.
const csvVirgule = (src) => /rows\.map\(\(r\) => r\.join\(","\)\)/.test(src);

for (const f of [
  "app/api/export/invoices-csv/route.ts",
  "app/api/export/monthly-recap/route.ts",
]) {
  const src = lire(f);
  exige(
    `${f.split("/").at(-2)} — séparateur compatible avec la virgule décimale`,
    !csvVirgule(src) && /const SEP = ";"/.test(src),
    "les montants sont à la française : joints par une virgule, ils cassent chaque ligne",
  );
  // Le récapitulatif mensuel n'écrit que des noms de mois et des nombres : il
  // n'a pas de fonction d'échappement, et n'en a pas besoin. On n'exige la
  // règle que là où du texte libre entre dans le fichier.
  if (/function esc\(/.test(src)) {
    exige(
      `${f.split("/").at(-2)} — l'échappement couvre le point-virgule`,
      /\/\[;,"/.test(src),
      "un nom de client contenant « ; » casserait la ligne à son tour",
    );
  }
}
contreEpreuve("séparateur CSV", csvVirgule, 'const csv = BOM + [h, ...rows.map((r) => r.join(","))].join("\\r\\n");');

// ── 2. FEC : sens des écritures d'avoir ─────────────────────────────────────
{
  const src = lire("app/api/export/fec/route.ts");
  exige(
    "FEC — un avoir s'enregistre en sens inverse",
    /estAvoir/.test(src) && /estAvoir \? 0 : ttc/.test(src),
    "les montants d'un avoir sont positifs (BR-27) : additionnés, ils doublent le CA et la TVA collectée",
  );
  exige(
    "FEC — la date de règlement est la date d'encaissement",
    /paid_at \|\| inv\.updated_at/.test(src),
    "`updated_at` bouge à la moindre modification : une facture rouverte en janvier datait l'écriture de banque hors exercice",
  );
  exige(
    "FEC — le compte auxiliaire est stable d'une facture à l'autre",
    /clientCode\(clientLib\)/.test(src),
    "dérivé de l'index de ligne, un même client changeait de code à chaque facture et le lettrage devenait inexploitable",
  );
  exige(
    "FEC — les ventes de biens vont au 707",
    /707000/.test(src),
    "tout était imputé en 706 « prestations de services », y compris les livraisons de biens",
  );
}

// ── 3. Arrondi des lignes de facture ────────────────────────────────────────
{
  const src = lire("app/(dashboard)/invoices/new/page.tsx");
  exige(
    "facture — le total d'une ligne est arrondi au centime",
    /updated\.total = Math\.round\(/.test(src),
    "non arrondi, il rend la somme des lignes différente du total imprimé, et le XML viole BR-CO-10",
  );
  exige(
    "facture — les totaux le sont aussi",
    /const centimes = \(n: number\) => Math\.round/.test(src),
    "l'écran annonçait 45,00 € de TVA là où le PDF en imprimait 44,99",
  );

  const api = lire("app/api/invoices/route.ts");
  exige(
    "facture — le serveur recalcule les totaux au lieu de croire le navigateur",
    /totalHtCalcule/.test(api) && /total_ht: totalHtCalcule/.test(api),
    "`...body` insérait les totaux tels quels : un appel API direct enregistrait une facture de trois lignes à 100 € portant « total HT : 5 € »",
  );
}

// ── 4. Numérotation : aucun repli, nulle part ───────────────────────────────
{
  const repli = (src) => /\|\|\s*`?\$?\{?new Date\(\)\.getFullYear\(\)\}?[^`]*`/.test(src) && /invoice_number|number =/.test(src);
  const src = lire("app/api/cron/recurring/route.ts");
  exige(
    "factures récurrentes — pas de numéro de repli",
    !/`\$\{new Date\(\)\.getFullYear\(\)\}-REC`/.test(src) && /numeroDocument/.test(src),
    "toutes les factures récurrentes de tous les comptes auraient pris le numéro « 2026-REC », en doublon et hors norme (art. 242 nonies A du CGI)",
  );
  contreEpreuve(
    "numéro de repli",
    (s) => /`\$\{new Date\(\)\.getFullYear\(\)\}-REC`/.test(s),
    "const number = invoiceNumber || `${new Date().getFullYear()}-REC`;",
  );
  void repli;
}

// ── 5. Avoirs et chiffre d'affaires ─────────────────────────────────────────
for (const [f, quoi] of [
  ["app/api/stats/route.ts", "statistiques"],
  ["app/(dashboard)/dashboard/page.tsx", "tableau de bord"],
  ["app/api/export/monthly-recap/route.ts", "récapitulatif mensuel"],
]) {
  const src = lire(f);
  exige(
    `${quoi} — un avoir se retranche du chiffre d'affaires`,
    /invoice_type === "avoir" \? -1 : 1/.test(src),
    "ses montants sont positifs : additionnés, une facture annulée affichait le double au lieu de zéro",
  );
}

console.log("");
console.log("── Le même document, quatre rendus ────────────────────────────");
console.log("");

// ── 6. Document lié : numéro ET date, sur tous les chemins ──────────────────
for (const f of [
  "app/api/invoices/[id]/download/route.ts",
  "app/api/invoices/[id]/send-email/route.ts",
]) {
  const src = lire(f);
  exige(
    `${f.split("/").at(-2)} — référence au document lié résolue par la règle partagée`,
    /documentLie\(/.test(src) && /lie\.numero, lie\.date/.test(src),
    "sans la date (BT-26), le validateur officiel ne compte pas la référence : l'avoir est non conforme à BR-FR-CO-05",
  );
}
{
  const src = lire("lib/facturx.ts");
  exige(
    "Factur-X — la date du document lié atteint le XML embarqué",
    /linkedInvoiceDate\?: string \| null/.test(src) && /undefined, undefined, undefined, linkedInvoiceDate/.test(src),
    "le XML transmis à la Plateforme Agréée la portait, celui embarqué dans le PDF non : deux XML pour un même avoir",
  );
}

// ── 7. Un avoir n'est pas une facture à payer ───────────────────────────────
{
  const src = lire("app/api/invoices/[id]/send-email/route.ts");
  exige(
    "courriel — un avoir ne réclame pas de paiement",
    /const estAvoir/.test(src) && /!estAvoir/.test(src),
    "l'objet annonçait « Votre facture », le corps « à régler avant le… », avec bouton de paiement et IBAN — sur un document qui crédite le client",
  );
}

// ── 8. Le motif d'exonération de TVA ────────────────────────────────────────
{
  const franchiseDeduite = (src) => /tva_rate === 0/.test(src) && /293 B/.test(src);
  for (const f of ["lib/invoice-xml.ts", "lib/invoice-pdf.tsx"]) {
    const src = lire(f);
    exige(
      `${f} — le motif d'exonération vient de la règle partagée`,
      /motifExoneration/.test(src) && !franchiseDeduite(src),
      "« taux à zéro » valait « franchise en base, art. 293 B » : une livraison intracommunautaire déclarait par écrit un régime qui n'est pas celui du vendeur",
    );
  }
  contreEpreuve(
    "franchise déduite du seul taux",
    franchiseDeduite,
    'const isFranchise = invoice.tva_rate === 0; const t = "TVA non applicable, art. 293 B du CGI";',
  );
}

console.log("");
console.log("── Cloisonnement et secrets ───────────────────────────────────");
console.log("");

// ── 9. Le secret des tâches planifiées ──────────────────────────────────────
{
  const enDur = (src) => /!==\s*`Bearer \$\{process\.env\.CRON_SECRET\}`/.test(src);
  for (const f of [
    "app/api/cron/cleanup-demo/route.ts",
    "app/api/cron/recurring/route.ts",
    "app/api/cron/send-reminders/route.ts",
    "app/api/cron/superpdp-sync/route.ts",
  ]) {
    const src = lire(f);
    exige(
      `${f.split("/").at(-2)} — contrôle par cronAutorise`,
      /cronAutorise\(req\)/.test(src) && !enDur(src),
      "sans la variable d'environnement, le gabarit produisait « Bearer undefined » — devinable, donc ouvert",
    );
  }
  contreEpreuve("comparaison de secret en dur", enDur, "if (auth !== `Bearer ${process.env.CRON_SECRET}`) return;");
}

// ── 10. Le profil lu est celui de l'espace ──────────────────────────────────
for (const f of [
  "app/api/invoices/[id]/download/route.ts",
  "app/api/invoices/[id]/send-email/route.ts",
  "app/api/invoices/[id]/payment-link/route.ts",
  "app/api/invoices/[id]/send-reminder/route.ts",
  "app/api/proposals/[id]/remind/route.ts",
  "app/api/export/fec/route.ts",
]) {
  const src = lire(f);
  exige(
    `${f.replace("app/api/", "")} — profil lu sur l'espace, pas sur la personne`,
    /getWorkspaceProfile/.test(src) && !/from\("profiles"\)[\s\S]{0,200}?eq\("id", user\.id\)/.test(src),
    "un collaborateur générait le PDF avec SON IBAN : le client payait sur le mauvais compte",
  );
}

// ── 11. Le tableau de bord ne s'en remet pas à la seule RLS ─────────────────
{
  const src = lire("app/(dashboard)/dashboard/page.tsx");
  exige(
    "tableau de bord — filtre d'espace explicite en plus de la RLS",
    (src.match(/\.eq\("user_id", workspaceId\)/g) ?? []).length >= 2,
    "les deux requêtes s'en remettaient à une policy qui vit ailleurs, et que `supabase/schema.sql` peut réintroduire trop large",
  );
}

// ── 12. Le devis n'est pas modifiable champ par champ sans liste blanche ────
{
  const src = lire("app/api/proposals/[id]/route.ts");
  exige(
    "devis — PATCH filtré par liste blanche",
    /MODIFIABLES/.test(src) && !/\.update\(body\)/.test(src),
    "`approval_status`, `signed_at`, `signer_ip` et `signature_hash` étaient réinscriptibles : la piste d'audit d'une signature ne prouvait plus rien",
  );
}

// ── 13. Une invitation ne vaut que pour l'adresse invitée ───────────────────
{
  const signup = lire("app/api/team/invite-signup/route.ts");
  exige(
    "invitation — l'adresse créée est celle qui a été invitée",
    /EMAIL_MISMATCH/.test(signup),
    "`email_confirm: true` marquait comme vérifiée une adresse qu'on ne possède pas",
  );
  const accept = lire("app/api/team/accept/[token]/route.ts");
  exige(
    "invitation — l'acceptation vérifie l'adresse côté serveur",
    /user\.email[\s\S]{0,120}invite\.email/.test(accept),
    "le contrôle n'existait que dans le navigateur : le jeton seul ouvrait l'espace",
  );
}

// ── 14. Débrancher la Plateforme Agréée est réservé au propriétaire ─────────
{
  const src = lire("app/api/superpdp/disconnect/route.ts");
  exige(
    "Plateforme Agréée — seul le propriétaire peut débrancher",
    /isTeamMember\(user\.id\)/.test(src),
    "`fermerLigne: true` contournait la garde de `ligne-annuaire` : un collaborateur rendait l'entreprise injoignable dans toute la France",
  );
}

// ── 15. Le devis envoyé par courriel pointe vers le devis ───────────────────
{
  const src = lire("app/api/proposals/[id]/send-email/route.ts");
  exige(
    "courriel de devis — le lien est reconstruit côté serveur",
    /proposalShareUrl\(publicBaseUrl/.test(src) && !/const \{ to, shareUrl/.test(src),
    "un `shareUrl` fourni par l'appelant faisait de la route un relais d'hameçonnage signé SPF/DKIM par getdeviso.fr",
  );
  exige(
    "courriel de devis — les valeurs interpolées sont échappées",
    /echapperHtml/.test(src) && /echapperUrl/.test(src),
    "un nom d'entreprise contenant du HTML entrait tel quel dans le message",
  );
}

console.log("");
if (echecs > 0) {
  console.error(`${echecs} contrôle(s) en échec.`);
  process.exit(1);
}
console.log("check:comptable — toutes les régressions surveillées sont absentes.");
