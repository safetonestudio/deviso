/**
 * Facture REÇUE fictive, au format exact de la plateforme agréée : la ligne
 * `superpdp_invoices` et son `en_invoice` conforme au schéma officiel de
 * Super PDP (docs/superpdp/openapi.json). Sert au jeu de démonstration et au
 * banc d'essai comptable (scripts/e2e/scenarios.ts), qui valide chaque facture
 * contre ce schéma.
 *
 * Pourquoi un générateur : les factures de démonstration écrites à la main le
 * 20/11 n'avaient pas la forme réelle (type de document en texte au lieu d'un
 * entier, ni lignes, ni ventilation de TVA). Un test sur des données qui n'ont
 * pas la forme du réel prouve ce qu'on a imaginé, pas ce que la plateforme
 * envoie.
 */
export type LigneRecue = { libelle: string; ht: number; taux: number; categorie?: "S" | "E" | "AE" | "Z" };

export type FactureRecue = {
  numero: string;
  date: string;
  fournisseur: { nom: string; siren: string };
  /** UNTDID 1001 : 380 facture, 386 acompte, 381 avoir, 261/262/396/502/503 autres avoirs. */
  type?: number;
  lignes: LigneRecue[];
  /** Montant déjà versé (BT-113), sur une facture de solde. */
  dejaVerse?: number;
  /** Factures précédentes citées (BT-25), par exemple l'acompte que solde la facture. */
  precedentes?: { numero: string; type?: number }[];
  /** Dernier statut de cycle de vie (fr:200 déposée, fr:210 refusée, fr:213 rejetée...). */
  statut?: string;
  /** Ventilation de TVA vide (le tableau reste présent, exigé par le schéma) : la lecture doit se rabattre sur les lignes. */
  sansVentilation?: boolean;
  /** Devise de la facture (défaut EUR) et, si elle n'est pas l'euro, TVA en euros portée par la facture (BT-111). */
  devise?: string;
  tvaEuros?: number;
};

const m = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

export function enInvoice(f: FactureRecue, acheteur: string): Record<string, unknown> {
  const parTaux = new Map<string, { base: number; tva: number; taux: number; categorie: string }>();
  for (const l of f.lignes) {
    const categorie = l.categorie ?? (l.taux > 0 ? "S" : "E");
    const cle = `${categorie}|${l.taux}`;
    const g = parTaux.get(cle) ?? { base: 0, tva: 0, taux: l.taux, categorie };
    g.base += l.ht;
    g.tva += categorie === "S" ? (l.ht * l.taux) / 100 : 0;
    parTaux.set(cle, g);
  }
  const groupes = [...parTaux.values()].map((g) => ({ ...g, tva: Math.round(g.tva * 100) / 100 }));
  const ht = f.lignes.reduce((s, l) => s + l.ht, 0);
  const tva = groupes.reduce((s, g) => s + g.tva, 0);
  const ttc = ht + tva;
  const totals: Record<string, unknown> = {
    sum_invoice_lines_amount: m(ht),
    total_without_vat: m(ht),
    total_vat_amount: { value: m(tva), currency_code: f.devise ?? "EUR" },
    total_with_vat: m(ttc),
    amount_due_for_payment: m(ttc - (f.dejaVerse ?? 0)),
  };
  if (f.dejaVerse) totals.paid_amount = m(f.dejaVerse);
  if (f.tvaEuros !== undefined) totals.total_vat_amount_accounting_currency = { value: m(f.tvaEuros), currency_code: "EUR" };
  const en: Record<string, unknown> = {
    number: f.numero,
    issue_date: f.date,
    type_code: f.type ?? 380,
    currency_code: f.devise ?? "EUR",
    ...(f.tvaEuros !== undefined ? { vat_accounting_currency_code: "EUR" } : {}),
    process_control: { business_process_type: "B1", specification_identifier: "urn:cen.eu:en16931:2017" },
    seller: {
      name: f.fournisseur.nom,
      electronic_address: { value: `0225:${f.fournisseur.siren}`, scheme: "0225" },
      postal_address: { country_code: "FR" },
      legal_registration_identifier: { value: f.fournisseur.siren, scheme: "0002" },
    },
    buyer: { name: acheteur, postal_address: { country_code: "FR" } },
    totals,
    vat_break_down: f.sansVentilation ? [] : groupes.map((g) => ({
      vat_category_taxable_amount: m(g.base),
      vat_category_tax_amount: m(g.tva),
      vat_category_code: g.categorie,
      ...(g.categorie === "S" ? { vat_category_rate: m(g.taux) } : {}),
    })),
    lines: f.lignes.map((l, i) => ({
      identifier: String(i + 1),
      net_amount: m(l.ht),
      invoiced_quantity: "1.0000",
      invoiced_quantity_code: "C62",
      price_details: { item_net_price: m(l.ht) },
      item_information: { name: l.libelle },
      vat_information: {
        invoiced_item_vat_category_code: l.categorie ?? (l.taux > 0 ? "S" : "E"),
        ...(l.taux > 0 ? { invoiced_item_vat_rate: m(l.taux) } : {}),
      },
    })),
  };
  if (f.precedentes?.length) {
    en.preceding_invoice_references = f.precedentes.map((p) => ({ reference: p.numero, ...(p.type ? { preceding_invoice_type_code: p.type } : {}) }));
  }
  return en;
}

/** La ligne `superpdp_invoices` telle que la synchronisation l'écrit (lib/superpdp-sync.ts). */
export function ligneSuperpdp(f: FactureRecue, userId: string, id: number, acheteur: string) {
  const en = enInvoice(f, acheteur);
  const t = en.totals as Record<string, unknown>;
  return {
    id,
    user_id: userId,
    direction: "in",
    processing_rule: "B2B",
    number: f.numero,
    issue_date: f.date,
    payment_due_date: f.date,
    currency_code: f.devise ?? "EUR",
    seller_name: f.fournisseur.nom,
    buyer_name: acheteur,
    total_without_vat: Number(t.total_without_vat),
    total_vat: Number((t.total_vat_amount as { value: string }).value),
    total_with_vat: Number(t.total_with_vat),
    amount_due: Number(t.amount_due_for_payment),
    last_status_code: f.statut ?? "fr:200",
    en_invoice: en,
    received_at: `${f.date}T09:00:00Z`,
    synced_at: new Date().toISOString(),
  };
}

