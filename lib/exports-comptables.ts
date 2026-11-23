import { arrondi2, tvaSurBase } from "./montants";
import { ventilationTva, tauxLigne, type LigneMontant } from "./tva";
import { estNatureLigne } from "./nature-operation";
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

/**
 * Un achat, normalise pour l'ecriture (20/11/2026). Deux sources, lues par
 * lib/achats-export.ts : les factures recues par la plateforme agreee
 * (fournisseurs francais) et les achats aupres de fournisseurs etrangers
 * (e-reporting). Montants en EUROS ; la devise d'origine est conservee pour
 * les colonnes Montantdevise / Idevise du FEC.
 */
export interface AchatExport {
  /** Numero de la facture du fournisseur. */
  ref: string;
  /** Date de la facture, AAAA-MM-JJ. */
  date: string;
  fournisseur: string;
  /** SIREN du fournisseur francais. */
  siren?: string | null;
  /** N° de TVA intracommunautaire du fournisseur etranger. */
  tvaIntra?: string | null;
  categorie?: "biens" | "services" | null;
  /** Montant hors taxe en euros. */
  ht: number;
  /** TVA par taux, en euros (deductible, ou autoliquidee si `autoliquidation`). */
  tvas: { taux: number; montant: number }[];
  /** Avoir recu : ecriture en sens inverse. */
  avoir?: boolean;
  /**
   * Achat a l'etranger : le fournisseur ne facture pas la TVA francaise,
   * l'acheteur la doit ET la deduit (4452 au credit, 44566x au debit), et le
   * fournisseur n'est du que du hors taxe.
   */
  autoliquidation?: boolean;
  /**
   * TVA ETRANGERE facturee par un fournisseur etranger : non deductible en
   * France, elle s'ajoute a la charge et au du fournisseur.
   */
  tvaEtrangere?: boolean;
  /** Dossier en franchise en base : aucune TVA deductible, elle va en charge. */
  nonDeductible?: boolean;
  /**
   * Facture d'ACOMPTE recue (type 386) : ce n'est pas encore une charge, c'est
   * une avance au fournisseur (4091). Sa TVA se deduit des maintenant.
   */
  acompte?: boolean;
  /**
   * Acomptes que cette facture de SOLDE reprend (montant deja verse, BT-113),
   * retrouves par lib/achats-export.ts. Le solde porte le total : on solde
   * l'avance et on ne deduit que la TVA qui ne l'a pas deja ete.
   */
  imputations?: {
    ref: string; ht: number; ttc: number; tvas: { taux: number; montant: number }[];
    /** TVA autoliquidee (AE) deja passee sur l'acompte. */
    autoliquidees?: { taux: number; montant: number }[];
  }[];
  /**
   * TVA AUTOLIQUIDEE sur une facture recue d'un fournisseur francais
   * (categorie AE : sous-traitance du batiment, art. 283-2 nonies du CGI) : la
   * facture ne porte pas de TVA, l'acheteur la doit (4452 au credit) et la
   * deduit (445662 au debit), ou la porte en charge en franchise. Le
   * fournisseur n'est du que de ce que dit la facture.
   */
  autoliquidees?: { taux: number; montant: number }[];
  /**
   * D'ou vient la TVA autoliquidee, pour la ventiler par sous-compte de 4452 :
   * fournisseur de l'UE (TVA due intracommunautaire), fournisseur hors UE, ou
   * autoliquidation interne francaise (categorie AE). Defaut : UE.
   */
  origineAutoliq?: "ue" | "hors_ue" | "france";
  /** Devise d'origine si autre que l'euro, et montant du fournisseur dans cette devise. */
  devise?: string | null;
  montantDevise?: number | null;
}

/**
 * Ecriture dont les debits ne valent pas les credits. Jamais exportee : la
 * route refuse le fichier en nommant la piece, plutot que de livrer au
 * cabinet une comptabilite fausse.
 */
export class EcritureDesequilibree extends Error {
  constructor(public piece: string, public ecart: number) {
    super(`Ecriture ${piece} desequilibree de ${ecart.toFixed(2)} EUR : export refuse`);
  }
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

/**
 * Code du compte auxiliaire fournisseur : « F » + SIREN pour un fournisseur
 * francais, « F » + n° de TVA pour un fournisseur etranger, a defaut une
 * empreinte du nom. Stable d'un export a l'autre.
 */
function fournisseurCode(siren: string | null | undefined, tvaIntra: string | null | undefined, nomNormalise: string): string {
  const chiffres = (siren ?? "").replace(/\D/g, "");
  if (chiffres.length === 9 || chiffres.length === 14) return `F${chiffres.slice(0, 9)}`;
  const tva = (tvaIntra ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (tva.length >= 4) return `F${tva}`.slice(0, 17);
  let h = 0;
  for (let i = 0; i < nomNormalise.length; i++) h = (h * 31 + nomNormalise.charCodeAt(i)) >>> 0;
  return `F${h.toString(36).toUpperCase()}`;
}

/** Texte venu d'un tiers (numero, nom) : sans tabulation ni retour a la ligne, qui casseraient les colonnes. */
const texteSur = (s: string) => s.replace(/[\t\r\n]+/g, " ").trim();

const libelleTiers = (nom: string) =>
  nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 17);

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

/**
 * Ventilation d'une facture entre ventes de biens et prestations, LIGNE PAR
 * LIGNE (23/11/2026). Avant, une facture mixte partait en entier en 706 avec
 * sa TVA exigible a la facturation ; desormais chaque ligne qui porte sa
 * nature (`items[].nature`, lib/nature-operation.ts) va a son compte (707 /
 * 706), et la TVA de ses prestations suit la regle des prestations
 * (exigible a l'encaissement, compte d'attente 44574, sauf option debits).
 *
 * Ligne SANS nature : lecture historique, inchangee. Elle prend la nature de
 * la facture ; sur une facture mixte, elle part en 706 avec TVA exigible a la
 * facturation, comme avant. On ne reclasse pas un passe qu'on ne connait pas.
 *
 * L'equilibre est garanti par construction : le HT des prestations est le HT
 * de la facture MOINS celui des biens, et pour chaque taux la TVA mise en
 * attente est la TVA du taux MOINS la part exigible. Les totaux de la facture
 * (client, TVA par taux) sont donc ceux d'avant, seule leur repartition change.
 */
export type VentilationNature = {
  biensHt: number;
  servicesHt: number;
  /** Par taux : TVA exigible a la facturation et TVA en attente d'encaissement. */
  tvas: { taux: number; exigible: number; attente: number }[];
};

export function ventilationParNature(inv: FactureExport): VentilationNature {
  const ht = arrondi2(inv.total_ht ?? 0);
  const lignes = ((inv.items ?? []) as (LigneMontant & { nature?: unknown })[]);
  const vent = ventilationTva(lignes, inv.tva_rate);
  const attenteFacture = tvaSurEncaissements(inv);
  const debits = !!inv.payment_on_debit;
  const cat = inv.operation_category;

  // Nature et exigibilite de chaque ligne.
  const parts = lignes.map((l) => {
    const total = arrondi2(Number(l.total) || 0);
    const taux = tauxLigne(l, inv.tva_rate);
    if (estNatureLigne(l.nature)) {
      const biens = l.nature === "goods";
      return { total, taux, biens, attente: !biens && !debits };
    }
    return { total, taux, biens: cat === "goods", attente: attenteFacture };
  });

  let biensHt: number;
  let servicesHt: number;
  if (parts.length === 0) {
    biensHt = cat === "goods" ? ht : 0;
    servicesHt = arrondi2(ht - biensHt);
  } else if (parts.every((p) => p.biens)) {
    biensHt = ht;
    servicesHt = 0;
  } else {
    biensHt = arrondi2(parts.filter((p) => p.biens).reduce((s, p) => s + p.total, 0));
    servicesHt = arrondi2(ht - biensHt);
  }

  const tvas = vent.groupes
    .filter((g) => g.montant_tva > 0)
    .map((g) => {
      const duTaux = parts.filter((p) => p.taux === g.taux);
      const total = arrondi2(g.montant_tva);
      // Pas de lignes lisibles (facture sans detail) : regle de la facture.
      if (duTaux.length === 0) return { taux: g.taux, exigible: attenteFacture ? 0 : total, attente: attenteFacture ? total : 0 };
      if (duTaux.every((p) => p.attente)) return { taux: g.taux, exigible: 0, attente: total };
      if (duTaux.every((p) => !p.attente)) return { taux: g.taux, exigible: total, attente: 0 };
      const baseExigible = arrondi2(duTaux.filter((p) => !p.attente).reduce((s, p) => s + p.total, 0));
      const exigible = Math.min(total, tvaSurBase(baseExigible, g.taux));
      return { taux: g.taux, exigible, attente: arrondi2(total - exigible) };
    });

  return { biensHt, servicesHt, tvas };
}

export type LigneEcriture = {
  compte: string; compteLib: string; auxNum: string; auxLib: string; debit: number; credit: number;
  lettrage?: string; dateLet?: string;
  /** Rang du reglement lettre (0, 1, 2...) : chaque format en tire son propre code. */
  rangLettrage?: number;
  /** SIREN du tiers, sur les lignes client ou fournisseur (formats qui codent l'auxiliaire autrement). */
  siren?: string | null;
  /** Nature du tiers d'une ligne auxiliaire (Quadra : C ou F, collectif 411 ou 401). */
  tiers?: "client" | "fournisseur";
  /** Montant dans la devise d'origine, et cette devise (FEC : Montantdevise, Idevise). */
  montantDevise?: number;
  devise?: string;
};
type Ligne = LigneEcriture;
/** Ecriture triee et numerotee, commune au FEC et aux formats des logiciels. Dates AAAAMMJJ. */
export type EcritureComptable = {
  journal: string; journalLib: string; num: string; date: string; ref: string; lib: string;
  /** Vente (porte la piece : le PDF de la facture), reglement ou achat. */
  nature: "vente" | "reglement" | "achat";
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
export function ecrituresComptables(
  invoices: FactureExport[],
  plan: PlanComptesFec = PLAN_PAR_DEFAUT,
  achats: AchatExport[] = [],
): EcritureComptable[] {

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
    const ht = arrondi2(inv.total_ht ?? 0);
    const ttc = arrondi2(inv.total_ttc ?? 0);
    const ventNat = ventilationParNature(inv);
    const payee = inv.status === "paid";
    const payDate = payee ? fecDate(inv.paid_at || inv.updated_at || inv.issue_date) : "";
    const rang = nLettrage;
    const lettre = payee ? codeLettrage(nLettrage++) : undefined;


    // Sens d'une ligne : `debitSurFacture` dit si elle est au debit sur une
    // facture ; un avoir inverse tout.
    const sens = (montant: number, debitSurFacture: boolean) =>
      debitSurFacture !== avoir ? { debit: montant, credit: 0 } : { debit: 0, credit: montant };

    // Produits : 707 « ventes de marchandises » et/ou 706 « prestations de
    // services », ventiles ligne par ligne (ventilationParNature). Credites sur
    // une facture, debites sur un avoir. Toujours au moins une ligne produit.
    const produits: Ligne[] = [];
    if (ventNat.biensHt !== 0) produits.push({ compte: plan.ventesBiens, compteLib: "Ventes de marchandises", auxNum: "", auxLib: "", ...sens(ventNat.biensHt, false) });
    if (ventNat.servicesHt !== 0) produits.push({ compte: plan.ventesServices, compteLib: "Prestations de services", auxNum: "", auxLib: "", ...sens(ventNat.servicesHt, false) });
    if (produits.length === 0) {
      const biens = inv.operation_category === "goods";
      produits.push({ compte: biens ? plan.ventesBiens : plan.ventesServices, compteLib: biens ? "Ventes de marchandises" : "Prestations de services", auxNum: "", auxLib: "", ...sens(ht, false) });
    }
    const tvasAttente = ventNat.tvas.filter((t) => t.attente > 0);

    const lignesVente: Ligne[] = [
      // Client : debite sur une facture (il doit), credite sur un avoir.
      { compte: plan.clients, compteLib: "Clients", auxNum: cCode, auxLib: clientLib, ...sens(ttc, true), lettrage: lettre, dateLet: lettre ? payDate : undefined, rangLettrage: lettre ? rang : undefined, siren: inv.client_siren, tiers: "client" },
      ...produits,
      ...ventNat.tvas.flatMap((t) => [
        ...(t.exigible > 0 ? [{ compte: plan.tvaCollectee, compteLib: `TVA collectee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.exigible, false) }] : []),
        ...(t.attente > 0 ? [{ compte: plan.tvaNonExigible, compteLib: `TVA collectee non exigible ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.attente, false) }] : []),
      ]),
    ];
    ecritures.push({ journal: plan.journalVentes, journalLib: "Ventes", date, ref, lib, nature: "vente", lignes: lignesVente, ordre: i * 2 });

    if (payee) {
      const payLib = `${avoir ? "Remboursement" : "Reglement"} ${ref}`;
      const lignesBanque: Ligne[] = [
        // Un avoir rembourse sort de la banque, il n'y entre pas.
        { compte: plan.banque, compteLib: "Banque", auxNum: "", auxLib: "", ...sens(ttc, true) },
        { compte: plan.clients, compteLib: "Clients", auxNum: cCode, auxLib: clientLib, ...sens(ttc, false), lettrage: lettre, dateLet: payDate, rangLettrage: rang, siren: inv.client_siren, tiers: "client" },
      ];
      // Le paiement rend la TVA exigible : du compte d'attente au 44571.
      for (const t of tvasAttente) {
        lignesBanque.push({ compte: plan.tvaNonExigible, compteLib: `TVA collectee non exigible ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.attente, true) });
        lignesBanque.push({ compte: plan.tvaCollectee, compteLib: `TVA collectee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.attente, false) });
      }
      ecritures.push({ journal: plan.journalBanque, journalLib: "Banque", date: payDate, ref, lib: payLib, nature: "reglement", lignes: lignesBanque, ordre: i * 2 + 1 });
    }
  });

  // ── Achats : journal des achats ─────────────────────────────────────────
  //
  // Facture d'un fournisseur francais : charge et TVA deductible au debit,
  // fournisseur au credit pour le TTC. Achat a l'etranger (autoliquidation) :
  // le fournisseur n'est du que du hors taxe ; la TVA francaise est due par
  // l'acheteur (4452 au credit) et deductible dans le meme temps (44566x au
  // debit). Un avoir recu inverse le tout. Le fournisseur est credite de la
  // SOMME des autres lignes : l'ecriture est toujours equilibree.
  achats.forEach((a, j) => {
    const fLib = libelleTiers(a.fournisseur || "FOURNISSEUR");
    const fCode = fournisseurCode(a.siren, a.tvaIntra, fLib);
    const ref = texteSur(a.ref);
    const avoir = !!a.avoir;
    const sens = (montant: number, debitSurFacture: boolean) =>
      debitSurFacture !== avoir ? { debit: montant, credit: 0 } : { debit: 0, credit: montant };
    const ht = arrondi2(a.ht);
    const tvasTotales = a.tvas.map((t) => ({ taux: t.taux, montant: arrondi2(t.montant) })).filter((t) => t.montant > 0);
    // Solde d'acompte : la TVA deja deduite sur l'acompte ne se deduit pas une
    // seconde fois. On la retire du meme taux (a defaut, du premier).
    const imputations = !avoir && !a.autoliquidation ? a.imputations ?? [] : [];
    const compteTvaDue =
      a.origineAutoliq === "hors_ue" ? plan.tvaAutoliquideeHorsUe : a.origineAutoliq === "france" ? plan.tvaAutoliquideeFrance : plan.tvaAutoliquidee;
    const tvas = tvasTotales.map((t) => ({ ...t }));
    if (!a.nonDeductible && !a.tvaEtrangere) {
      for (const imp of imputations) {
        for (const ti of imp.tvas) {
          // Au meme taux seulement. Un taux de l'acompte absent du solde (solde
          // exonere, ou taux different) : sa TVA deja deduite est reprise
          // (ligne negative a ce taux), jamais deplacee sur un autre taux.
          const cible = tvas.find((t) => t.taux === ti.taux);
          if (cible) cible.montant = arrondi2(cible.montant - ti.montant);
          else tvas.push({ taux: ti.taux, montant: arrondi2(-ti.montant) });
        }
      }
    }
    const tvaRetiree = arrondi2(tvasTotales.reduce((s, t) => s + t.montant, 0) - tvas.reduce((s, t) => s + t.montant, 0));
    const biens = a.categorie === "biens";
    // La charge porte le HT, plus toute TVA qui ne se deduit pas : TVA
    // etrangere, ou TVA d'un dossier en franchise.
    let charge = ht;
    let duFournisseur = ht;
    const lignesTva: Ligne[] = [];
    for (const t of tvas) {
      if (a.autoliquidation) {
        // TVA due (4452) dans tous les cas ; deductible (44566x) sauf franchise,
        // ou elle est une charge.
        if (a.nonDeductible) charge += t.montant;
        else lignesTva.push({ compte: plan.tvaDeductibleAutoliq, compteLib: `TVA deductible autoliquidee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.montant, true) });
        lignesTva.push({ compte: compteTvaDue, compteLib: `TVA due autoliquidee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.montant, false) });
      } else if (a.tvaEtrangere || a.nonDeductible) {
        charge += t.montant;
        duFournisseur += t.montant;
      } else {
        if (t.montant !== 0) lignesTva.push({ compte: plan.tvaDeductible, compteLib: `TVA deductible ${t.taux}%`, auxNum: "", auxLib: "", ...sens(t.montant, true) });
        duFournisseur += t.montant;
      }
    }
    // Autoliquidation d'une facture francaise (AE) : due et deductible, sans
    // toucher au du fournisseur.
    // Solde d'un acompte AE : la TVA autoliquidee de l'acompte a deja ete
    // passee (due et deduite) ; on ne passe que le reste. En franchise, la
    // charge porte bien le total : la part de l'acompte, portee en 4091 avec
    // l'avance, en sort avec elle (voir l'imputation plus bas).
    const autoliqRestante = (a.autoliquidees ?? []).map((t) => ({ ...t }));
    let autoliqImputee = 0;
    for (const imp of imputations) {
      for (const ti of imp.autoliquidees ?? []) {
        // Meme taux d'abord ; a defaut, sur la part AE du solde quel que soit
        // son taux (le total du 4452 reste juste, le cabinet est prevenu par
        // lib/achats-export.ts que les taux different).
        const cible = autoliqRestante.find((t) => t.taux === ti.taux) ?? autoliqRestante[0];
        if (cible) cible.montant = arrondi2(cible.montant - ti.montant);
        // En franchise, l'avance soldee porte cette TVA (4091) : la charge la
        // recoit dans tous les cas, sinon l'ecriture serait desequilibree.
        autoliqImputee += ti.montant;
      }
    }
    if (a.nonDeductible) charge += autoliqImputee;
    for (const t of autoliqRestante) {
      const m = arrondi2(t.montant);
      if (m === 0) continue;
      if (a.nonDeductible) charge += m;
      else lignesTva.push({ compte: plan.tvaDeductibleAutoliq, compteLib: `TVA deductible autoliquidee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(m, true) });
      lignesTva.push({ compte: compteTvaDue, compteLib: `TVA due autoliquidee ${t.taux}%`, auxNum: "", auxLib: "", ...sens(m, false) });
    }
    // Le fournisseur est du du TTC de la facture : la TVA retiree ci-dessus
    // reste due, elle a seulement deja ete deduite.
    duFournisseur += tvaRetiree;
    const lignes: Ligne[] = [
      // Un acompte n'est pas une charge : avance au fournisseur (4091).
      a.acompte
        ? { compte: plan.avancesFournisseurs, compteLib: "Acomptes verses aux fournisseurs", auxNum: "", auxLib: "", ...sens(arrondi2(charge), true) }
        : { compte: biens ? plan.achatsBiens : plan.achatsServices, compteLib: biens ? "Achats de marchandises" : "Achats de prestations", auxNum: "", auxLib: "", ...sens(arrondi2(charge), true) },
      ...lignesTva,
    ];
    // Solde : l'avance est soldee (HT, ou TTC si la TVA n'etait pas
    // deductible, comme elle a ete portee a l'acompte) ; le fournisseur n'est
    // plus du que du reste.
    for (const imp of imputations) {
      // En franchise, l'acompte AE a aussi porte sa TVA autoliquidee en 4091.
      const autoliqImp = a.nonDeductible ? (imp.autoliquidees ?? []).reduce((x, t) => x + t.montant, 0) : 0;
      const avance = a.nonDeductible || a.tvaEtrangere ? imp.ttc + autoliqImp : imp.ht;
      lignes.push({ compte: plan.avancesFournisseurs, compteLib: `Acompte ${texteSur(imp.ref)} impute`, auxNum: "", auxLib: "", ...sens(arrondi2(avance), false) });
      duFournisseur -= imp.ttc;
    }
    const devise = a.devise && a.devise !== "EUR" && a.montantDevise ? { montantDevise: arrondi2(a.montantDevise), devise: a.devise } : {};
    lignes.push({
      compte: plan.fournisseurs, compteLib: "Fournisseurs", auxNum: fCode, auxLib: fLib,
      ...sens(arrondi2(duFournisseur), false), siren: a.siren ?? null, tiers: "fournisseur", ...devise,
    });
    ecritures.push({
      journal: plan.journalAchats, journalLib: "Achats", date: fecDate(a.date), ref,
      lib: `${avoir ? "Avoir" : "Facture"} ${ref} ${fLib}`.trim(), nature: "achat", lignes,
      ordre: 1_000_000 + j,
    });
  });

  // Une ligne negative (reprise de TVA d'un acompte, fournisseur qui nous doit
  // apres un solde inferieur a l'acompte) s'ecrit dans l'autre colonne : un
  // debit de -100 est un credit de 100. Le FEC et Quadra ecrivent ainsi
  // exactement la meme chose, sans montant negatif.
  for (const e of ecritures) {
    e.lignes = e.lignes
      .map((l) => {
        const net = arrondi2(l.debit - l.credit);
        return { ...l, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
      });
    // Garde : une ecriture desequilibree ne sort jamais, meme d'un centime.
    const ecart = arrondi2(e.lignes.reduce((x, l) => x + l.debit - l.credit, 0));
    if (ecart !== 0) throw new EcritureDesequilibree(e.ref, ecart);
  }

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
export function genererFec(invoices: FactureExport[], plan: PlanComptesFec = PLAN_PAR_DEFAUT, achats: AchatExport[] = []): string {
  const COLS = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
    "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
    "PieceRef", "PieceDate", "EcritureLib",
    "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate",
    "Montantdevise", "Idevise",
  ];
  const rows: string[][] = [COLS];
  for (const e of ecrituresComptables(invoices, plan, achats)) {
    for (const l of e.lignes) {
      rows.push([
        e.journal, e.journalLib, e.num, e.date,
        l.compte, l.compteLib, l.auxNum, l.auxLib,
        e.ref, e.date, e.lib,
        amt(l.debit), amt(l.credit), l.lettrage ?? "", l.dateLet ?? "", e.date,
        l.montantDevise !== undefined ? amt(l.montantDevise) : "", l.devise ?? "",
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
