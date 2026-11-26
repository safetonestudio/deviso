/**
 * Essai au BAC À SABLE Super PDP : une facture MIXTE (BT-23 = M1, lignes de
 * biens ET lignes de prestations) est-elle acceptée, traitée et acheminée ?
 *
 * Pourquoi ce script existe (24/11/2026). Le pré-contrôle de Deviso
 * (lib/superpdp-precontrole.ts) refuse toute facture `mixed`, sur la foi d'une
 * phrase de la page « E-reporting » de Super PDP. Les textes permettent la
 * facture mixte (FAQ DGFiP, BT-23 racine M). Il faut savoir par l'expérience
 * où tombe réellement la limite : B2B domestique, ou seulement B2C.
 *
 * Le pré-contrôle est donc CONTOURNÉ ici, et ici seulement : le script
 * fabrique le XML avec le code de production (generateFacturXml), le valide
 * avec le validateur public, puis le dépose directement par l'API. Aucune
 * ligne n'est écrite dans `invoices` ; seul le jeton OAuth du compte de test
 * peut être renouvelé en base (comportement normal de superpdpFetch).
 *
 * Gardes : UNIQUEMENT le compte de test Atelier Lumière, raccordé au bac à
 * sable (`company_number_scheme = sandbox`, `verified`), et SUPERPDP_SANDBOX=true
 * (client OAuth du poste). Tout autre compte est refusé avant le moindre appel.
 *
 * Lancer : npx -y tsx scripts/e2e/mixte-bac-a-sable.ts [b2b|b2c|tout]
 * Journal JSON : chemin passé par MIXTE_JOURNAL (sinon ./mixte-bac-a-sable.json)
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// .env.local : celui du worktree s'il existe, sinon celui du dépôt principal.
for (const p of [".env.local", join(process.cwd(), "..", "..", "..", ".env.local")]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  break;
}

const COMPTE_TEST = "ac3abc18-d1ee-4b21-b0ec-bf6f17767e31"; // superpdp-test@getdeviso.fr
const INTERDIT = "767be0c3-6978-4a43-a15f-454fa38146e3"; // compte réel de Selim
const SIREN_PARTAGE = "315143296"; // SIREN commun des sociétés fictives du bac à sable
const ADRESSE_TRICATEL = "0225:315143296_57700"; // destinataire B2B du bac à sable

const mode = (process.argv[2] ?? "tout").toLowerCase();
const journal: Record<string, unknown>[] = [];
const note = (etape: string, donnees: unknown) => {
  const e = { t: new Date().toISOString(), etape, donnees };
  journal.push(e);
  console.log(`\n── ${etape}\n${JSON.stringify(donnees, null, 2).slice(0, 4000)}`);
};
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (process.env.SUPERPDP_SANDBOX !== "true") {
    console.error("Refus : SUPERPDP_SANDBOX doit valoir true (client OAuth du poste).");
    process.exit(1);
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { superpdpFetch, getConnection } = await import("@/lib/superpdp");
  const { generateFacturXml } = await import("@/lib/invoice-xml");
  const { validerFacture } = await import("@/lib/superpdp-validation");
  const { natureOperation } = await import("@/lib/superpdp-nature");
  const { deduireCategorie } = await import("@/lib/nature-operation");

  const userId = COMPTE_TEST;
  if ((userId as string) === INTERDIT) process.exit(1);
  const admin = createAdminClient();
  const { data: cx } = await admin
    .from("superpdp_connections")
    .select("user_id, company_number_scheme, session_status, directory_address, company_number")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: profil } = await admin.from("profiles").select("email, is_demo").eq("id", userId).maybeSingle();
  if (
    !cx || cx.company_number_scheme !== "sandbox" || cx.session_status !== "verified" ||
    profil?.email !== "superpdp-test@getdeviso.fr" || profil?.is_demo
  ) {
    console.error("Refus : le compte de test n'est pas raccordé au bac à sable (ou n'est pas celui attendu).", cx, profil);
    process.exit(1);
  }
  note("garde", { userId, scheme: cx.company_number_scheme, statut: cx.session_status, vendeur: cx.directory_address });
  const connexion = await getConnection(userId);

  const pdp = async (chemin: string, init: RequestInit = {}) => {
    const r = await superpdpFetch(userId, chemin, init);
    const texte = await r.text();
    let corps: unknown = texte;
    try { corps = JSON.parse(texte); } catch { /* texte brut */ }
    return { status: r.status, corps };
  };

  const jour = new Date().toISOString().slice(0, 10);
  const echeance = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const suffixe = Date.now().toString(36).toUpperCase();

  // Lignes : un tirage d'art (bien) et une prestation de prise de vue (service),
  // indépendantes l'une de l'autre, même taux de 20 %.
  const lignes = [
    { description: "Tirage d'art 60x90 encadré", quantity: 2, unit: "unité", unit_price: 300, total: 600, nature: "goods", tva_rate: 20 },
    { description: "Prise de vue en studio (demi-journée)", quantity: 1, unit: "forfait", unit_price: 400, total: 400, nature: "services", tva_rate: 20 },
  ];
  const baseFacture = {
    seller_company: "Atelier Lumière",
    seller_name: "Camille Fontaine",
    seller_siren: SIREN_PARTAGE,
    seller_street: "12 rue des Arts",
    seller_postcode: "33000",
    seller_city: "Bordeaux",
    seller_country: "FR",
    operation_category: "mixed",
    items: lignes,
    total_ht: 1000,
    tva_rate: 20,
    total_ttc: 1200,
    issue_date: jour,
    due_date: echeance,
    // MIXTE_ACOMPTE=1 : facture d'acompte (386) tirée d'un devis mixte.
    type_code: process.env.MIXTE_ACOMPTE ? "386" : "380",
    invoice_type: process.env.MIXTE_ACOMPTE ? "acompte" : "standard",
    payment_terms: "30 jours net",
    status: "sent",
  };
  {
    note("catégorie déduite des lignes par lib/nature-operation", deduireCategorie(lignes as never));
  }

  const cas: { nom: string; facture: Record<string, unknown> }[] = [];
  if (mode === "b2b" || mode === "tout") {
    cas.push({
      nom: "B2B domestique",
      facture: {
        ...baseFacture,
        id: `mixte-b2b-${suffixe}`,
        invoice_number: `MIXTE-B2B-${suffixe}`,
        client_name: "Tricatel",
        client_company: "Tricatel",
        client_siren: SIREN_PARTAGE,
        client_directory_address: ADRESSE_TRICATEL,
        client_street: "Avenue de la République",
        client_postcode: "37170",
        client_city: "Chambray-lès-Tours",
        client_country: "FR",
      },
    });
  }
  if (mode === "b2c" || mode === "tout") {
    cas.push({
      nom: "B2C (particulier)",
      facture: {
        ...baseFacture,
        id: `mixte-b2c-${suffixe}`,
        invoice_number: `MIXTE-B2C-${suffixe}`,
        client_name: "Jeanne Martin",
        client_email: "jeanne.martin.e2e@example.fr",
        client_street: "8 cours de l'Intendance",
        client_postcode: "33000",
        client_city: "Bordeaux",
        client_country: "FR",
      },
    });
  }

  if (mode === "b2bint" || mode === "tout") {
    cas.push({
      nom: "B2BInt (entreprise belge)",
      facture: {
        ...baseFacture,
        id: `mixte-int-${suffixe}`,
        invoice_number: `MIXTE-INT-${suffixe}`,
        client_name: "Studio Lumen",
        client_company: "Studio Lumen SRL",
        client_vat_number: "BE0477472701",
        client_email: "compta.e2e@example.be",
        client_street: "Rue Royale 10",
        client_postcode: "1000",
        client_city: "Bruxelles",
        client_country: "BE",
      },
    });
  }

  for (const c of cas) {
    const f = c.facture;
    const nature = natureOperation(f as never);
    // deux derniers paramètres : adresse destinataire (B2B) et date doc lié
    const xml = generateFacturXml(
      f as never, null, undefined,
      connexion?.directory_address ?? null, connexion?.company_number ?? null,
      nature === "B2B" ? ADRESSE_TRICATEL : null, null,
    );
    const bt23 = xml.match(/BusinessProcessSpecifiedDocumentContextParameter><ram:ID>([^<]+)</)?.[1];
    writeFileSync(join(process.env.MIXTE_XML_DIR ?? ".", `${f.invoice_number}.xml`), xml);
    note(`${c.nom} : XML produit`, { numero: f.invoice_number, nature, bt23, octets: xml.length });

    const rapport = await validerFacture(xml, `${f.invoice_number}.xml`);
    note(`${c.nom} : validateur public (/validation_reports)`, rapport);

    const params = new URLSearchParams({ processing_rule: nature, external_id: String(f.id).slice(0, 36) });
    const form = new FormData();
    form.append("file", new Blob([xml], { type: "application/xml" }), `${f.invoice_number}.xml`);
    const depot = await pdp(`/invoices?${params}`, { method: "POST", body: form });
    note(`${c.nom} : POST /invoices?${params}`, depot);
    const idPdp = (depot.corps as { id?: number })?.id;
    if (depot.status >= 300 || !idPdp) continue;

    // Attendre la fin de l'ingestion : un statut autre que api:uploaded.
    let evenements: { status_code?: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const ev = await pdp(`/invoice_events?invoice_id=${idPdp}&limit=100`);
      evenements = ((ev.corps as { data?: unknown[] })?.data ?? []) as { status_code?: string }[];
      if (evenements.some((e) => e.status_code && e.status_code !== "api:uploaded")) break;
      await attendre(10000);
    }
    note(`${c.nom} : événements après ingestion`, evenements);
    const facturePdp = await pdp(`/invoices/${idPdp}`);
    const fp = facturePdp.corps as Record<string, unknown>;
    note(`${c.nom} : GET /invoices/${idPdp} (résumé)`, {
      status: facturePdp.status,
      processing_rule: fp?.processing_rule,
      direction: fp?.direction,
      events: fp?.events,
      cles: fp && typeof fp === "object" ? Object.keys(fp) : null,
    });
    if (nature === "B2C") {
      note(`${c.nom} : /b2c_transactions`, await pdp(`/b2c_transactions?invoice_id=${idPdp}&limit=20`));
    }

    // fr:212 : d'abord la part services seule (400 HT -> 480 TTC), puis le total si refusé.
    const services = lignes.filter((l) => l.nature === "services").reduce((s, l) => s + l.total, 0);
    // MIXTE_212=sans-detail : corps minimal du produit (Super PDP calcule les montants lui-même).
    const essais = process.env.MIXTE_212 === "sans-detail"
      ? [{ nom: "sans détail (montants calculés par Super PDP)", montant: null as string | null }]
      : [
          { nom: "part services seule", montant: (services * 1.2).toFixed(2) as string | null },
          { nom: "total de la facture", montant: (1200).toFixed(2) as string | null },
        ];
    for (const e of essais) {
      const corps = {
        invoice_id: idPdp,
        status_code: "fr:212",
        // MIXTE_212=sans-date : bloc MEN sans date (paiement pointé sans date).
        ...(e.montant
          ? { details: [{ reported_data: [{ type_code: "MEN", amount: e.montant, currency_code: "EUR", value_percent: "20.00", ...(process.env.MIXTE_212 === "sans-date" ? {} : { date: jour }) }] }] }
          : {}),
      };
      const r = await pdp("/invoice_events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      note(`${c.nom} : fr:212 ${e.nom} (MEN ${e.montant})`, { envoye: corps, reponse: r });
      if (r.status < 300) break;
    }
    await attendre(5000);
    const fin = await pdp(`/invoice_events?invoice_id=${idPdp}&limit=100`);
    note(`${c.nom} : événements finaux`, fin.corps);
    if (nature === "B2C") {
      note(`${c.nom} : /b2c_transactions (fin)`, await pdp(`/b2c_transactions?invoice_id=${idPdp}&limit=20`));
    }
  }

  writeFileSync(process.env.MIXTE_JOURNAL ?? "mixte-bac-a-sable.json", JSON.stringify(journal, null, 2));
  console.log("\nJournal écrit.");
})().catch((e) => {
  console.error(e);
  writeFileSync(process.env.MIXTE_JOURNAL ?? "mixte-bac-a-sable.json", JSON.stringify(journal, null, 2));
  process.exit(1);
});
