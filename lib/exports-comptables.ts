import { ventilationTva, type LigneMontant } from "./tva";

/**
 * Fabrication des exports comptables (FEC et CSV des factures).
 *
 * Source UNIQUE : l'export telecharge par le client depuis son espace et celui
 * que le cabinet recupere depuis son cockpit sortent de ces fonctions. Un
 * correctif ici vaut donc pour les deux, et le cabinet importe exactement le
 * fichier que son client verrait.
 *
 * Les fonctions sont pures : elles recoivent les factures deja lues, la
 * selection (annee, statuts, proprietaire) et le controle d'acces restent a la
 * charge de la route appelante.
 */

export interface FactureExport {
  invoice_number?: string | null;
  issue_date: string;
  due_date?: string | null;
  client_name?: string | null;
  client_company?: string | null;
  client_siren?: string | null;
  status: string;
  total_ht?: number | null;
  total_ttc?: number | null;
  tva_rate: number;
  items?: unknown;
  invoice_type?: string | null;
  type_code?: string | null;
  operation_category?: string | null;
  paid_at?: string | null;
  updated_at?: string | null;
  payment_link_url?: string | null;
}

/** Statuts qui entrent dans le FEC : une facture emise, payee ou non. */
export const STATUTS_FEC = ["sent", "paid"] as const;

export function estAvoir(inv: Pick<FactureExport, "invoice_type" | "type_code">): boolean {
  return inv.invoice_type === "avoir" || inv.type_code === "381";
}

function fecDate(dateStr: string): string {
  const d = new Date(dateStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
}

function amt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

/**
 * Code du compte auxiliaire client.
 *
 * Il etait derive de l'INDEX DE LA LIGNE dans l'export. Deux consequences :
 * un meme client changeait de code auxiliaire a chaque facture, et `C00001`
 * designait un client different d'une annee sur l'autre. Le lettrage
 * auxiliaire, la raison d'etre de cette colonne, etait donc inexploitable.
 *
 * On le derive du nom normalise du client, stable par construction. Un
 * prefixe alphabetique plus une empreinte courte : pas de collision en
 * pratique, et le meme client garde son code d'un exercice a l'autre.
 */
function clientCode(nomNormalise: string): string {
  let h = 0;
  for (let i = 0; i < nomNormalise.length; i++) {
    h = (h * 31 + nomNormalise.charCodeAt(i)) >>> 0;
  }
  return `C${String(h % 100000).padStart(5, "0")}`;
}

/** Contenu du FEC (separateur tabulation, fin de ligne CRLF). */
export function genererFec(invoices: FactureExport[]): string {
  const COLS = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
    "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
    "PieceRef", "PieceDate", "EcritureLib",
    "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate",
    "Montantdevise", "Idevise",
  ];

  const rows: string[][] = [COLS];

  invoices.forEach((inv, i) => {
    const date = fecDate(inv.issue_date);
    const ref = inv.invoice_number ?? "";
    const clientLib = (inv.client_company || inv.client_name || "CLIENT")
      .toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 17);

    /**
     * Un avoir s'enregistre en SENS INVERSE d'une facture.
     *
     * Les montants d'un avoir sont positifs (regle BR-27), le type du document
     * porte le sens. Le traiter comme une facture doublait le chiffre
     * d'affaires et la TVA collectee tout en gardant l'equilibre debit/credit,
     * donc sans que le controle de coherence du cabinet ne voie rien. On
     * inverse le sens des ecritures, ce qui laisse la trace de l'avoir.
     */
    const avoir = estAvoir(inv);
    const lib = `${avoir ? "Avoir" : "Facture"} ${ref}`;
    const numStr = `VT${String(i + 1).padStart(6, "0")}`;
    const cCode = clientCode(clientLib);
    const ht = +(inv.total_ht ?? 0).toFixed(2);
    const ttc = +(inv.total_ttc ?? 0).toFixed(2);
    const ventFec = ventilationTva((inv.items ?? []) as LigneMontant[], inv.tva_rate);

    // 706 « prestations de services » ou 707 « ventes de marchandises ».
    const compteVente = inv.operation_category === "goods" ? "707000" : "706000";
    const libelleVente =
      inv.operation_category === "goods" ? "Ventes de marchandises" : "Prestations de services";

    const row = (compte: string, compteLib: string, auxNum: string, auxLib: string, debit: number, credit: number) =>
      [numStr, date, compte, compteLib, auxNum, auxLib, ref, date, lib, amt(debit), amt(credit), "", "", date, "", ""];

    // Client : debite sur une facture (il doit), credite sur un avoir (on lui doit).
    rows.push(["VT", "Ventes", ...row("411000", "Clients", cCode, clientLib, avoir ? 0 : ttc, avoir ? ttc : 0)]);
    // Produit : credite sur une facture, debite sur un avoir.
    rows.push(["VT", "Ventes", ...row(compteVente, libelleVente, "", "", avoir ? ht : 0, avoir ? 0 : ht)]);
    for (const g of ventFec.groupes) {
      if (g.montant_tva <= 0) continue;
      const tvaG = +g.montant_tva.toFixed(2);
      rows.push(["VT", "Ventes", ...row("445710", `TVA collectee ${g.taux}%`, "", "", avoir ? tvaG : 0, avoir ? 0 : tvaG)]);
    }

    if (inv.status === "paid") {
      // Date d'encaissement reelle, pas `updated_at` (qui bouge a la moindre
      // modification et produisait des ecritures hors exercice).
      const payDate = fecDate(inv.paid_at || inv.updated_at || inv.issue_date);
      const payNum = `BQ${String(i + 1).padStart(6, "0")}`;
      const payLib = `${avoir ? "Remboursement" : "Reglement"} ${ref}`;

      const payRow = (compte: string, compteLib: string, auxNum: string, auxLib: string, debit: number, credit: number) =>
        [payNum, payDate, compte, compteLib, auxNum, auxLib, ref, payDate, payLib, amt(debit), amt(credit), "", "", payDate, "", ""];

      // Un avoir rembourse sort de la banque, il n'y entre pas.
      rows.push(["BQ", "Banque", ...payRow("512000", "Banque", "", "", avoir ? 0 : ttc, avoir ? ttc : 0)]);
      rows.push(["BQ", "Banque", ...payRow("411000", "Clients", cCode, clientLib, avoir ? ttc : 0, avoir ? 0 : ttc)]);
    }
  });

  return rows.map((r) => r.join("\t")).join("\r\n");
}

/** Contenu du CSV des factures (point-virgule, BOM UTF-8 pour Excel). */
export function genererCsvFactures(invoices: FactureExport[]): string {
  function esc(val: string | null | undefined): string {
    if (!val) return "";
    const str = String(val).replace(/"/g, '""');
    return /[;,"\n\r]/.test(str) ? `"${str}"` : str;
  }
  function fmtDate(d: string | null | undefined): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("fr-FR");
  }
  function fmtAmt(n: number | null | undefined): string {
    if (n == null) return "0,00";
    return n.toFixed(2).replace(".", ",");
  }

  const STATUS_FR: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Payée",
    cancelled: "Annulée",
  };

  const headers = [
    "Numéro", "Date d'émission", "Date d'échéance", "Client", "Entreprise client",
    "SIREN client", "Statut", "Montant HT (€)", "TVA %", "Montant TVA (€)",
    "Montant TTC (€)", "Lien de paiement",
  ];

  const rows = invoices.map((inv) => {
    const tva = (inv.total_ttc ?? 0) - (inv.total_ht ?? 0);
    return [
      esc(inv.invoice_number), esc(fmtDate(inv.issue_date)), esc(fmtDate(inv.due_date)),
      esc(inv.client_name), esc(inv.client_company), esc(inv.client_siren),
      esc(STATUS_FR[inv.status] ?? inv.status), fmtAmt(inv.total_ht), fmtAmt(inv.tva_rate),
      fmtAmt(tva), fmtAmt(inv.total_ttc), esc(inv.payment_link_url),
    ];
  });

  // Point-virgule : il va avec la virgule decimale (une virgule eclatait
  // chaque montant en deux colonnes), et c'est ce qu'Excel attend en francais.
  const BOM = "﻿";
  const SEP = ";";
  return BOM + [headers.join(SEP), ...rows.map((r) => r.join(SEP))].join("\r\n");
}

/** Nom de fichier sur, a partir d'un nom de dossier libre. */
export function segmentFichier(nom: string): string {
  return (
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "dossier"
  );
}
