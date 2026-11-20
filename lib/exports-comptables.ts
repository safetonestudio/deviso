import { ventilationTva, type LigneMontant } from "./tva";
import { PLAN_PAR_DEFAUT, type PlanComptesFec } from "./plan-comptes-fec";

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
  /** Option pour la TVA d'apres les debits (prestations de services). */
  payment_on_debit?: boolean | null;
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
 * Il etait derive de l'INDEX DE LA LIGNE dans l'export (code different a
 * chaque facture), puis du nom du client (stable, mais un client renomme
 * changeait de compte et le cabinet voyait apparaitre un doublon). Depuis le
 * 20/11/2026 : le SIREN quand on l'a, identifiant legal qui ne bouge pas ; a
 * defaut, une empreinte du nom normalise.
 */
function clientCode(siren: string | null | undefined, nomNormalise: string): string {
  const chiffres = (siren ?? "").replace(/\D/g, "");
  if (chiffres.length === 9 || chiffres.length === 14) return `C${chiffres.slice(0, 9)}`;
  let h = 0;
  for (let i = 0; i < nomNormalise.length; i++) {
    h = (h * 31 + nomNormalise.charCodeAt(i)) >>> 0;
  }
  return `C${String(h % 100000).padStart(5, "0")}`;
}

/** Code de lettrage : AAA, AAB, ... (trois lettres, 17 576 codes par fichier). */
function codeLettrage(n: number): string {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return a[Math.floor(n / 676) % 26] + a[Math.floor(n / 26) % 26] + a[n % 26];
}

/**
 * TVA exigible a l'encaissement (prestations de services sans option pour
 * les debits) : a la facture, la TVA va au compte d'attente 44574 « TVA
 * collectee non exigible » ; au paiement, elle passe au 44571. Sans cette
 * separation, le cabinet devait reprendre a la main la TVA de chaque
 * prestation non encore payee avant de declarer. Livraisons de biens et
 * operations mixtes : TVA exigible a la facturation, directement en 44571.
 */
function tvaSurEncaissements(inv: FactureExport): boolean {
  const services = inv.operation_category !== "goods" && inv.operation_category !== "mixed";
  return services && !inv.payment_on_debit;
}

export type LigneEcriture = {
  compte: string; compteLib: string; auxNum: string; auxLib: string; debit: number; credit: number;
  lettrage?: string; dateLet?: string;
  /** Rang du reglement lettre (0, 1, 2...) : chaque format en tire son propre code. */
  rangLettrage?: number;
  /** SIREN du client, sur les lignes client (formats qui codent l'auxiliaire autrement). */
  siren?: string | null;
};
type Ligne = LigneEcriture;
/** Ecriture triee et numerotee, commune au FEC et aux formats des logiciels. Dates AAAAMMJJ. */
export type EcritureComptable = {
  journal: string; journalLib: string; num: string; date: string; ref: string; lib: string;
  /** Vente (porte la piece : le PDF de la facture) ou reglement. */
  nature: "vente" | "reglement";
  lignes: LigneEcriture[];
};
type Ecriture = Omit<EcritureComptable, "num"> & { ordre: number };

/**
 * Contenu du FEC (separateur tabulation, fin de ligne CRLF), conforme a
 * l'article A47 A-1 du LPF et importable sans retouche (20/11/2026) :
 * ecritures triees par date de validation, numerotees en continu par journal,
 * lettrage entre la facture et son reglement sur le compte client, TVA sur
 * encaissements en compte d'attente.
 *
 * Choix assume, PAS de compte 4191 pour les acomptes : Deviso emet l'acompte
 * puis un solde qui ne facture que le reste. Chaque document est donc une
 * vente a part entiere ; passer l'acompte en 4191 laisserait ce compte non
 * solde, la facture de solde ne reprenant pas l'acompte.
 */
export function ecrituresComptables(invoices: FactureExport[], plan: PlanComptesFec = PLAN_PAR_DEFAUT): EcritureComptable[] {

  const ecritures: Ecriture[] = [];
  let nLettrage = 0;

  invoices.forEach((inv, i) => {
    const date = fecDate(inv.issue_date);
    const ref = inv.invoice_number ?? "";
    const clientLib = (inv.client_company || inv.client_name || "CLIENT")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 17);

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
    const cCode = clientCode(inv.client_siren, clientLib);
    const ht = +(inv.total_ht ?? 0).toFixed(2);
    const ttc = +(inv.total_ttc ?? 0).toFixed(2);
    const ventFec = ventilationTva((inv.items ?? []) as LigneMontant[], inv.tva_rate);
    const attente = tvaSurEncaissements(inv);
    const payee = inv.status === "paid";
    const payDate = payee ? fecDate(inv.paid_at || inv.updated_at || inv.issue_date) : "";
    const rang = nLettrage;
    const lettre = payee ? codeLettrage(nLettrage++) : undefined;

    // 706 « prestations de services » ou 707 « ventes de marchandises ».
    const compteVente = inv.operation_category === "goods" ? plan.ventesBiens : plan.ventesServices;
    const libelleVente =
      inv.operation_category === "goods" ? "Ventes de marchandises" : "Prestations de services";

    // Sens d'une ligne : `debitSurFacture` dit si elle est au debit sur une
    // facture ; un avoir inverse tout.
    const sens = (montant: number, debitSurFacture: boolean) =>
      debitSurFacture !== avoir ? { debit: montant, credit: 0 } : { debit: 0, credit: montant };

    const tvas = ventFec.groupes
      .filter((g) => g.montant_tva > 0)
      .map((g) => ({ taux: g.taux, montant: +g.montant_tva.toFixed(2) }));

    const lignesVente: Ligne[] = [
      // Client : debite sur une facture (il doit), credite sur un avoir.
      { compte: plan.clients, compteLib: "Clients", auxNum: cCode, auxLib: clientLib, ...sens(ttc, true), lettrage: lettre, dateLet: lettre ? payDate : undefined, rangLettrage: lettre ? rang : undefined, siren: inv.client_siren },
      // Produit : credite sur une facture, debite sur un avoir.
      { compte: compteVente, compteLib: libelleVente, auxNum: "", auxLib: "", ...sens(ht, false) },
      ...tvas.map((t) => ({
        compte: attente ? plan.tvaNonExigible : plan.tvaCollectee,
        compteLib: attente ? `TVA collectee non exigible ${t.taux}%` : `TVA collectee ${t.taux}%`,
        auxNum: "", auxLib: "", ...sens(t.montant, false),
      })),
    ];
    ecritures.push({ journal: plan.journalVentes, journalLib: "Ventes", date, ref, lib, nature: "vente", lignes: lignesVente, ordre: i * 2 });

    if (payee) {
      const payLib = `${avoir ? "Remboursement" : "Reglement"} ${ref}`;
      const lignesBanque: Ligne[] = [
        // Un avoir rembourse sort de la banque, il n'y entre pas.
        { compte: plan.banque, compteLib: "Banque", auxNum: "", auxLib: "", ...sens(ttc, true) },
        { compte: plan.clients, compteLib: "Clients", auxNum: cCode, auxLib: clientLib, ...sens(ttc, false), lettrage: lettre, dateLet: payDate, rangLettrage: rang, siren: inv.client_siren },
      ];
      // Le paiement rend la TVA exigible : du compte d'attente au 44571.
      if (attente) {
        for (const t of tvas) {
          lignesBanque.push({ compte: plan.tvaNonExigible, compteLib: `TVA collectee non exigible ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.montant, true) });
          lignesBanque.push({ compte: plan.tvaCollectee, compteLib: `TVA collectee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.montant, false) });
        }
      }
      ecritures.push({ journal: plan.journalBanque, journalLib: "Banque", date: payDate, ref, lib: payLib, nature: "reglement", lignes: lignesBanque, ordre: i * 2 + 1 });
    }
  });

  // L'article A47 A-1 veut les ecritures dans l'ordre chronologique de
  // validation ; la numerotation suit cet ordre, continue dans chaque journal.
  ecritures.sort((a, b) => (a.date === b.date ? a.ordre - b.ordre : a.date < b.date ? -1 : 1));
  const compteurs: Record<string, number> = {};
  return ecritures.map(({ ordre: _ordre, ...e }) => {
    compteurs[e.journal] = (compteurs[e.journal] ?? 0) + 1;
    return { ...e, num: `${e.journal}${String(compteurs[e.journal]).padStart(6, "0")}` };
  });
}

/**
 * Contenu du FEC (separateur tabulation, fin de ligne CRLF), conforme a
 * l'article A47 A-1 du LPF : voir ecrituresComptables pour le detail.
 */
export function genererFec(invoices: FactureExport[], plan: PlanComptesFec = PLAN_PAR_DEFAUT): string {
  const COLS = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
    "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
    "PieceRef", "PieceDate", "EcritureLib",
    "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate",
    "Montantdevise", "Idevise",
  ];
  const rows: string[][] = [COLS];
  for (const e of ecrituresComptables(invoices, plan)) {
    for (const l of e.lignes) {
      rows.push([
        e.journal, e.journalLib, e.num, e.date,
        l.compte, l.compteLib, l.auxNum, l.auxLib,
        e.ref, e.date, e.lib,
        amt(l.debit), amt(l.credit), l.lettrage ?? "", l.dateLet ?? "", e.date,
        "", "",
      ]);
    }
  }
  return rows.map((r) => r.join("\t")).join("\r\n");
}

/**
 * Nom de fichier du FEC prevu par l'article A47 A-1 : SIREN, « FEC », date de
 * cloture AAAAMMJJ. Les logiciels des cabinets le reconnaissent tel quel.
 * Sans SIREN connu, un nom lisible.
 */
export function nomFichierFec(siren: string | null | undefined, annee: string, repli: string): string {
  const chiffres = (siren ?? "").replace(/\D/g, "");
  return chiffres.length >= 9 ? `${chiffres.slice(0, 9)}FEC${annee}1231.txt` : `FEC_${annee}_${repli}.txt`;
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
