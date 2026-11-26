"use client";

/**
 * Page de détail d'une facture, dans le cadre commun devis / facture
 * (components/document/PageDocument.tsx), validé par Selim le 24/11/2026.
 *
 * Au centre, la feuille : la reproduction exacte du PDF Factur-X que reçoit le
 * client (components/document/FeuilleDocument.tsx, mêmes textes que
 * lib/invoice-pdf.tsx). À droite : Actions, Suivi, Facture électronique.
 *
 * Toutes les actions de l'ancien panneau sont reprises, avec leurs droits :
 * - envoyer, marquer envoyée, relancer, lien de paiement : acte « envoyer_facture » ;
 * - transmettre à la plateforme agréée : « transmettre_pa » ;
 * - déposer sur Chorus Pro : « deposer_chorus » ;
 * - marquer payée, pointage, établir un avoir, supprimer : titulaire seul.
 * Relance, lien de paiement et avoir sont gardés de la même façon côté serveur
 * (décision de Selim du 24/11/2026).
 */
import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send, CreditCard, MailCheck, Check, Bell, Download, RadioTower, ShieldCheck, Landmark, Undo2, RefreshCw,
} from "lucide-react";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { FacturXCompliance, problemesConformite } from "@/components/FacturXCompliance";
import { usePermission, useIsMember } from "@/components/PlanContext";
import { FeuilleDocument } from "@/components/document/FeuilleDocument";
import {
  PageDocument, Pastille, PanneauActions, BoutonPrincipal, BoutonListe, GroupeActions, Retour,
  ZoneSuppression, Suivi, Info, Bandeau, type EtapeSuivi, type Ton,
} from "@/components/document/PageDocument";
import { LIBELLE_NATURE } from "@/lib/nature-operation";
import { libelleStatut } from "@/lib/superpdp-statuts";
import { etatPdp } from "@/lib/superpdp-etat-facture";
import type { Invoice } from "@/types";
import { contenuFacture, type PaymentInfo } from "@/lib/facture-contenu";
import { MODES_REGLEMENT, type ModeReglement } from "@/lib/recettes";
import { estAPointer, joursDeRetard, ESPACEMENT_JOURS } from "@/lib/pointage-regles";
import { encaissementADeclarer } from "@/lib/encaissement-men";
import { couleurEtatChorus, libelleEtatFlux } from "@/lib/chorus-etats";

const STATUTS: Record<string, { libelle: string; ton: Ton }> = {
  draft: { libelle: "Brouillon", ton: "neutre" },
  sent: { libelle: "Envoyée", ton: "info" },
  paid: { libelle: "Payée", ton: "succes" },
  cancelled: { libelle: "Annulée", ton: "danger" },
};

const CHORUS_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DEPOSEE:             { label: "Déposée",               color: "blue" },
  EN_COURS_TRAITEMENT: { label: "En cours de traitement", color: "amber" },
  COMPLETEE:           { label: "Complétée",              color: "amber" },
  MISE_EN_PAIEMENT:    { label: "Mise en paiement",       color: "indigo" },
  MANDATEE:            { label: "Mandatée",               color: "emerald" },
  VALIDEE:             { label: "Validée",                color: "emerald" },
  SUSPENDUE:           { label: "Suspendue",              color: "amber" },
  REJETEE:             { label: "Rejetée",                color: "red" },
  ANNULEE:             { label: "Annulée",                color: "red" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "long", year: "numeric" });
}
const jourCourt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit" });

interface DonneesFeuille {
  invoice: Invoice;
  accentColor: string | null;
  modele: string | null;
  paymentInfo: PaymentInfo | null;
  linkedNumber: string | null;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [feuille, setFeuille] = useState<DonneesFeuille | null>(null);
  const [feuilleKo, setFeuilleKo] = useState(false);
  const [hasChorusPro, setHasChorusPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch(`/api/profile`).then((r) => r.json()),
    ]).then(([invoiceData, profileData]) => {
      setInvoice(invoiceData.invoice);
      // Le bouton Chorus Pro n'apparaît que si le fournisseur ID est configuré
      const p = profileData.profile;
      setHasChorusPro(!!(p?.chorus_pro_fournisseur_id || p?.chorus_pro_login));
    }).finally(() => setLoading(false));
    // La feuille se charge à part : la page et ses actions n'attendent pas.
    fetch(`/api/invoices/${id}/feuille`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DonneesFeuille) => setFeuille(d))
      .catch(() => setFeuilleKo(true));
  }, [id]);

  if (loading) return <div className="w-full text-center py-16 text-gray-500">Chargement…</div>;
  if (!invoice) return <div className="w-full text-center py-16 text-gray-400">Facture introuvable</div>;

  return (
    <div className="w-full">
      <FactureVue invoice={invoice} id={id} hasChorusPro={hasChorusPro} feuille={feuille} feuilleKo={feuilleKo} />
    </div>
  );
}

function FactureVue({ invoice, id, hasChorusPro, feuille, feuilleKo }: {
  invoice: Invoice;
  id: string;
  hasChorusPro: boolean;
  feuille: DonneesFeuille | null;
  feuilleKo: boolean;
}) {
  const router = useRouter();
  const [inv, setInv] = useState(invoice);
  const isMember = useIsMember();
  const peutEnvoyerFacture = usePermission("envoyer_facture");
  const peutTransmettrePa = usePermission("transmettre_pa");
  const peutDeposerChorus = usePermission("deposer_chorus");

  const [downloading, setDownloading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [messageLien, setMessageLien] = useState<{ ton: Ton; texte: ReactNode } | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [messageRelance, setMessageRelance] = useState<{ ton: Ton; texte: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [messageEnvoi, setMessageEnvoi] = useState<{ ton: Ton; texte: string } | null>(null);
  const [depositingChorus, setDepositingChorus] = useState(false);
  const [emission, setEmission] = useState(false);
  const [verification, setVerification] = useState(false);
  const [rapport, setRapport] = useState<{
    conforme: boolean;
    manques: string[];
    validation: { echecs: string[]; indisponible: string | null };
  } | null>(null);
  const [messagePdp, setMessagePdp] = useState<string | null>(null);
  // Le bac à sable partage un SIREN entre ses sociétés de test : c'est le seul
  // environnement où « adresse déduite » mérite un avertissement.
  const [sandboxPdp, setSandboxPdp] = useState(false);
  const [chorusRef, setChorusRef] = useState<string | null>(invoice.chorus_pro_ref || null);
  const [chorusError, setChorusError] = useState<string | null>(null);
  const [chorusStatus, setChorusStatus] = useState<{ label: string; color: string; motifRejet?: string | null } | null>(
    invoice.chorus_pro_status
      ? (CHORUS_STATUS_MAP[invoice.chorus_pro_status] ?? { label: libelleEtatFlux(invoice.chorus_pro_status), color: couleurEtatChorus(invoice.chorus_pro_status), motifRejet: invoice.chorus_pro_motif_rejet ?? null })
      : null
  );
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingAvoir, setCreatingAvoir] = useState(false);
  const [messageAvoir, setMessageAvoir] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    fetch("/api/superpdp/status")
      .then((r) => r.json())
      .then((d) => { if (vivant) setSandboxPdp(d?.sandbox === true); })
      .catch(() => {});
    return () => { vivant = false; };
  }, []);

  // ── La date d'encaissement, demandée là où elle change quelque chose ──────
  //
  // Sur une facture transmise à la plateforme agréée, marquer « payée »
  // déclenche le message `fr:212`, dont la date fixe la période d'exigibilité
  // de la TVA sur les prestations de services. Elle ne peut PAS être corrigée
  // après coup (un second `fr:212` serait une seconde déclaration), d'où la
  // demande avant plutôt qu'une correction après. Depuis le 24/10/2026, date
  // ET mode de règlement sont demandés à chaque encaissement, transmis ou
  // non : deux mentions obligatoires du livre des recettes.
  const [demandeDatePaiement, setDemandeDatePaiement] = useState(false);
  const [modeReglement, setModeReglement] = useState<ModeReglement>("virement");
  const [datePaiement, setDatePaiement] = useState(() => new Date().toISOString().slice(0, 10));
  const [pasEncoreAt, setPasEncoreAt] = useState<string | null>(invoice.pointage_pas_encore_at ?? null);
  const [envoiPasEncore, setEnvoiPasEncore] = useState(false);
  const [pointageDemande, setPointageDemande] = useState<"payee" | "pas-encore" | null>(null);
  useEffect(() => {
    // Liens du courriel de pointage : `?pointage=payee` ouvre la saisie de la
    // date ; `?pointage=pas-encore` met le bouton en évidence, l'enregistrement
    // exige un clic (jamais un simple chargement de page).
    const q = new URLSearchParams(window.location.search).get("pointage");
    if (q !== "payee" && q !== "pas-encore") return;
    setPointageDemande(q);
    if (q === "payee") setDemandeDatePaiement(true);
  }, []);
  // Pas de déclaration d'encaissement sous l'option TVA sur les débits (ni sur
  // une facture mixte sans prestation) : la date n'y part pas (lib/encaissement-men.ts).
  const encaissementConcerne = encaissementADeclarer(inv);
  const dateEncaissementRequise = Boolean(inv.superpdp_invoice_id) && !inv.superpdp_encaisse_at && encaissementConcerne;

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch(`/api/invoices/${id}/download`);
    if (!res.ok) { alert("Erreur lors de la génération"); setDownloading(false); return; }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? "facture.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  async function handleMarkPaid(dateEncaissement: string, mode: ModeReglement) {
    setMarkingPaid(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Date et mode d'encaissement : mentions du livre des recettes. La route
      // PATCH déclare elle-même l'encaissement (fr:212) à la plateforme.
      body: JSON.stringify({ status: "paid", paid_at: dateEncaissement, payment_mode: mode }),
    });
    const data = await res.json();
    if (res.ok) {
      setInv(data.invoice);
      setDemandeDatePaiement(false);
    }
    setMarkingPaid(false);
  }

  /**
   * L'avoir qui annule cette facture : seul chemin de correction d'une facture
   * déjà transmise. Il naît en brouillon et on y emmène l'utilisateur.
   */
  async function handleAvoir() {
    setCreatingAvoir(true);
    setMessageAvoir(null);
    const res = await fetch(`/api/invoices/${id}/avoir`, { method: "POST" });
    const data = await res.json();
    setCreatingAvoir(false);
    if (res.ok && data.avoir?.id) {
      // Un avoir qui annule une facture refusée ou rejetée ne se transmet pas
      // (spécifications externes DGFiP v3.2, p. 60) : on le dit avant.
      if (data.interne && data.avertissement) alert(data.avertissement);
      window.location.href = `/invoices/${data.avoir.id}`;
      return;
    }
    // Un avoir existe déjà : on montre celui-là.
    if (res.status === 409 && data.avoirId) {
      window.location.href = `/invoices/${data.avoirId}`;
      return;
    }
    setMessageAvoir(data.message || data.error || "Création de l'avoir impossible.");
  }

  async function handlePaymentLink() {
    setGeneratingLink(true);
    setMessageLien(null);
    const res = await fetch(`/api/invoices/${id}/payment-link`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      try { await navigator.clipboard.writeText(data.url); } catch { /* le lien reste affiché */ }
      setInv((prev) => ({ ...prev, payment_link_url: data.url }));
      // On dit ce que l'outil ne fera PAS : le lien envoie l'argent directement
      // à l'utilisateur, Deviso ne voit pas le paiement, et c'est le passage à
      // « payée » qui déclare l'encaissement à l'administration.
      setMessageLien({
        ton: "succes",
        texte: "Lien de paiement copié. Ce lien envoie l'argent directement sur ton compte : Deviso ne voit pas le paiement. Pense à marquer la facture « payée » quand tu seras réglé, c'est ce geste qui déclare l'encaissement à l'administration.",
      });
    } else if (data.error === "PAYMENT_NOT_CONFIGURED") {
      setMessageLien({
        ton: "attention",
        texte: <>Moyen de paiement non configuré. <Link href="/paiements" className="underline">Le configurer dans Paiements</Link></>,
      });
    } else {
      setMessageLien({ ton: "danger", texte: data.error || "Erreur" });
    }
    setGeneratingLink(false);
  }

  // Une facture remise autrement que par e-mail (lien copié, en main propre)
  // doit pouvoir être déclarée envoyée : relances et Chorus Pro en dépendent.
  async function handleMarkSent() {
    setMarkingSent(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });
    const data = await res.json();
    if (res.ok) setInv(data.invoice);
    else alert(data.error || "Erreur");
    setMarkingSent(false);
  }

  async function handleSendEmail() {
    if (!inv.client_email) return;
    setSendingEmail(true);
    setMessageEnvoi(null);
    const res = await fetch(`/api/invoices/${id}/send-email`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessageEnvoi({ ton: "succes", texte: `Facture envoyée à ${inv.client_email}.` });
      setInv((prev) => prev.status === "draft" ? { ...prev, status: "sent" } : prev);
    } else {
      setMessageEnvoi({ ton: "danger", texte: data.error || "Erreur lors de l'envoi" });
    }
    setSendingEmail(false);
  }

  async function handleSendReminder() {
    if (!inv.client_email) return;
    setSendingReminder(true);
    setMessageRelance(null);
    const res = await fetch(`/api/invoices/${id}/send-reminder`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setInv((prev) => ({ ...prev, reminder_count: data.reminder_count, last_reminder_sent_at: new Date().toISOString() }));
      setMessageRelance({ ton: "succes", texte: `Relance envoyée à ${inv.client_email}.` });
    } else {
      setMessageRelance({ ton: "danger", texte: data.error || "Erreur" });
    }
    setSendingReminder(false);
  }

  async function handleChorusDeposit() {
    setDepositingChorus(true);
    setChorusError(null);
    const res = await fetch(`/api/invoices/${id}/chorus-pro`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ref) {
      setChorusRef(data.ref);
      setTimeout(() => handleFetchStatus(), 2000);
    } else {
      setChorusError(data.error || "Erreur lors du dépôt");
    }
    setDepositingChorus(false);
  }

  async function handleFetchStatus() {
    setFetchingStatus(true);
    const res = await fetch(`/api/invoices/${id}/chorus-pro/status`);
    const data = await res.json();
    if (res.ok) {
      setChorusError(null);
      setChorusStatus({ label: data.label, color: data.color, motifRejet: data.motifRejet });
    } else {
      setChorusError(data.message || data.error || "Statut Chorus Pro indisponible pour le moment.");
    }
    setFetchingStatus(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  }

  async function handlePasEncore() {
    setEnvoiPasEncore(true);
    const res = await fetch(`/api/invoices/${id}/pas-encore`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPasEncoreAt(data.invoice?.pointage_pas_encore_at ?? new Date().toISOString());
    else alert(data.error || "Enregistrement impossible");
    setEnvoiPasEncore(false);
  }

  /** Passe la facture aux validateurs officiels, sans la transmettre. */
  async function verifierPdp() {
    setVerification(true);
    setRapport(null);
    try {
      const r = await fetch(`/api/superpdp/invoices/${inv.id}/valider`, { method: "POST" });
      const d = await r.json();
      if (r.ok) setRapport(d);
    } finally {
      setVerification(false);
    }
  }

  async function emettrePdp() {
    setEmission(true);
    setMessagePdp(null);
    try {
      const r = await fetch(`/api/superpdp/invoices/${inv.id}/emettre`, { method: "POST" });
      const res = await r.json();
      if (!r.ok) {
        setMessagePdp(res.message ?? "La transmission n'a pas abouti.");
        return;
      }
      window.location.reload();
    } catch {
      setMessagePdp("Connexion interrompue. Réessaie.");
    } finally {
      setEmission(false);
    }
  }

  // ── Ce qui est possible (mêmes règles que l'ancien panneau) ──
  // Un avoir n'appelle aucun règlement : ni lien de paiement, ni « payée », ni relance.
  const estAvoir = inv.invoice_type === "avoir";
  const canSendEmail = !!inv.client_email && inv.status !== "cancelled" && peutEnvoyerFacture;
  const canPaymentLink = !estAvoir && inv.status !== "paid" && inv.status !== "cancelled" && peutEnvoyerFacture;
  const canMarkPaid = !estAvoir && inv.status !== "paid" && inv.status !== "cancelled" && !isMember;
  const canMarkSent = inv.status === "draft" && peutEnvoyerFacture;
  const canRemind = !estAvoir && inv.status === "sent" && !!inv.client_email && peutEnvoyerFacture;
  const canAvoir = inv.status !== "draft" && !estAvoir && !isMember;
  const canChorus = inv.status === "sent" && !chorusRef && hasChorusPro && peutDeposerChorus;
  // Une facture ne se transmet qu'une fois : un second envoi arriverait en
  // double chez le client, qui la refuserait pour « DOUBLON ».
  const dejaTransmise = Boolean(inv.superpdp_invoice_id);
  const peutEmettre = inv.status !== "draft" && inv.status !== "cancelled" && !dejaTransmise && peutTransmettrePa;

  const aPointer = canMarkPaid && estAPointer(inv, new Date());
  const pasEncoreRecent =
    !!pasEncoreAt && Date.now() - new Date(pasEncoreAt).getTime() < ESPACEMENT_JOURS * 24 * 60 * 60 * 1000;

  // Même règle que la liste des factures, littéralement la même fonction.
  const etat = dejaTransmise ? etatPdp(inv, sandboxPdp) : null;
  const statutPdp = libelleStatut(inv.superpdp_status);
  const pdpEnEchec = inv.superpdp_status === "fr:210" || inv.superpdp_status === "fr:213";
  const conformite = problemesConformite(inv);

  // ── Le geste attendu : un seul bouton plein ──
  type Cle = "envoyer" | "marquerEnvoyee" | "payer" | "avoir" | "telecharger";
  const principal: Cle =
    pdpEnEchec && canAvoir ? "avoir"
    : inv.status === "draft" && canSendEmail ? "envoyer"
    : inv.status === "draft" && canMarkSent ? "marquerEnvoyee"
    : inv.status === "sent" && canMarkPaid ? "payer"
    : inv.status === "sent" && canSendEmail && estAvoir ? "envoyer"
    : "telecharger";

  const libelleEnvoi = sendingEmail ? "Envoi en cours…" : inv.status === "draft" ? "Envoyer au client" : "Renvoyer au client";
  const libelleRelance = sendingReminder ? "Envoi…" : inv.reminder_count > 0 ? `Relancer le client (${inv.reminder_count}/3)` : "Relancer le client";

  const formulairePaiement = canMarkPaid && demandeDatePaiement && (
    <div className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2.5">
      <label htmlFor="date-encaissement" className="block text-sm font-medium text-emerald-300">Payée le</label>
      <input
        id="date-encaissement"
        type="date"
        value={datePaiement}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setDatePaiement(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg bg-ds-elevated border border-ds-border text-gray-200 focus:outline-hidden focus:border-emerald-500/50"
      />
      <label htmlFor="mode-reglement" className="block text-sm font-medium text-emerald-300">Réglée par</label>
      <select
        id="mode-reglement"
        value={modeReglement}
        onChange={(e) => setModeReglement(e.target.value as ModeReglement)}
        className="w-full text-sm px-3 py-2 rounded-lg bg-ds-elevated border border-ds-border text-gray-200 focus:outline-hidden focus:border-emerald-500/50"
      >
        {(Object.keys(MODES_REGLEMENT) as ModeReglement[]).map((m) => (
          <option key={m} value={m}>{MODES_REGLEMENT[m]}</option>
        ))}
      </select>
      <p className="text-xs text-gray-400 leading-relaxed">
        {dateEncaissementRequise
          ? "Cette date part à l'administration avec la déclaration d'encaissement. Elle ne pourra plus être corrigée ensuite."
          : "Ces informations alimentent ton livre des recettes."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleMarkPaid(datePaiement, modeReglement)}
          disabled={markingPaid || !datePaiement}
          className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 disabled:opacity-50 transition-colors"
        >
          {markingPaid ? "Mise à jour…" : "Confirmer"}
        </button>
        <button
          type="button"
          onClick={() => setDemandeDatePaiement(false)}
          disabled={markingPaid}
          className="text-sm font-medium px-3 py-2 rounded-lg border border-ds-border hover:bg-ds-elevated/60 text-gray-400 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );

  const retourEnvoi = messageEnvoi && <Retour ton={messageEnvoi.ton}>{messageEnvoi.texte}</Retour>;
  const retourAvoir = messageAvoir && <Retour ton="danger">{messageAvoir}</Retour>;

  const boutonPrincipal =
    principal === "envoyer" ? (
      <>
        <BoutonPrincipal icone={Send} onClick={handleSendEmail} disabled={sendingEmail} sous={`Destinataire : ${inv.client_email}`}>
          {libelleEnvoi}
        </BoutonPrincipal>
        {retourEnvoi}
      </>
    ) : principal === "marquerEnvoyee" ? (
      <BoutonPrincipal icone={MailCheck} onClick={handleMarkSent} disabled={markingSent}>
        {markingSent ? "Mise à jour…" : "Marquer comme envoyée"}
      </BoutonPrincipal>
    ) : principal === "payer" ? (
      <>
        {!demandeDatePaiement && (
          <BoutonPrincipal icone={Check} onClick={() => setDemandeDatePaiement(true)} disabled={markingPaid} sous="Date et mode de règlement demandés">
            Marquer comme payée
          </BoutonPrincipal>
        )}
        {formulairePaiement}
      </>
    ) : principal === "avoir" ? (
      <>
        <BoutonPrincipal icone={Undo2} onClick={handleAvoir} disabled={creatingAvoir} sous="Seul moyen de corriger une facture transmise">
          {creatingAvoir ? "Création…" : "Établir un avoir"}
        </BoutonPrincipal>
        {retourAvoir}
      </>
    ) : (
      <BoutonPrincipal icone={Download} onClick={handleDownload} disabled={downloading} sous="Le PDF Factur-X reçu par le client">
        {downloading ? "Génération…" : "Télécharger le PDF"}
      </BoutonPrincipal>
    );

  const groupePa = (peutEmettre || canChorus || rapport || messagePdp || chorusError) && (
    <GroupeActions titre="Facture électronique">
      {peutEmettre && (
        <BoutonListe icone={ShieldCheck} onClick={verifierPdp} disabled={verification}>
          {verification ? "Vérification…" : "Vérifier avant de transmettre"}
        </BoutonListe>
      )}
      {rapport && (
        <Retour ton={rapport.conforme ? "succes" : "attention"}>
          {rapport.conforme ? (
            <span>Conforme : cette facture sera acceptée.</span>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Cette facture serait refusée :</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {[...rapport.manques, ...rapport.validation.echecs].slice(0, 6).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
              {rapport.validation.indisponible && (
                <p className="text-xs text-gray-500">Contrôle officiel indisponible : seuls nos propres contrôles ont été appliqués.</p>
              )}
            </div>
          )}
        </Retour>
      )}
      {peutEmettre && (
        <BoutonListe icone={RadioTower} onClick={emettrePdp} disabled={emission}>
          {emission ? "Transmission…" : "Transmettre à la plateforme agréée"}
        </BoutonListe>
      )}
      {messagePdp && <Retour ton="attention">{messagePdp}</Retour>}
      {canChorus && (
        <BoutonListe icone={Landmark} onClick={handleChorusDeposit} disabled={depositingChorus}>
          {depositingChorus ? "Dépôt en cours…" : "Déposer sur Chorus Pro"}
        </BoutonListe>
      )}
      {chorusError && <Retour ton="danger">{chorusError}</Retour>}
    </GroupeActions>
  );

  const actions = (
    <PanneauActions
      principal={<div className="space-y-2">{boutonPrincipal}</div>}
      autres={
        <>
          {canSendEmail && principal !== "envoyer" && (
            <>
              <BoutonListe icone={Send} onClick={handleSendEmail} disabled={sendingEmail}>{libelleEnvoi}</BoutonListe>
              {retourEnvoi}
            </>
          )}
          {canMarkSent && principal !== "marquerEnvoyee" && (
            <BoutonListe icone={MailCheck} onClick={handleMarkSent} disabled={markingSent}>
              {markingSent ? "Mise à jour…" : "Marquer comme envoyée"}
            </BoutonListe>
          )}
          {canMarkPaid && principal !== "payer" && (
            <>
              {!demandeDatePaiement && (
                <BoutonListe icone={Check} onClick={() => setDemandeDatePaiement(true)} disabled={markingPaid} ton="succes">
                  Marquer comme payée
                </BoutonListe>
              )}
              {formulairePaiement}
            </>
          )}
          {canRemind && (
            <>
              <BoutonListe icone={Bell} onClick={handleSendReminder} disabled={sendingReminder} ton="attention">{libelleRelance}</BoutonListe>
              {messageRelance && <Retour ton={messageRelance.ton}>{messageRelance.texte}</Retour>}
            </>
          )}
          {canPaymentLink && (
            <>
              <BoutonListe icone={CreditCard} onClick={handlePaymentLink} disabled={generatingLink}>
                {generatingLink ? "Génération…" : inv.payment_link_url ? "Copier le lien de paiement" : "Lien de paiement"}
              </BoutonListe>
              {messageLien && <Retour ton={messageLien.ton}>{messageLien.texte}</Retour>}
            </>
          )}
          {principal !== "telecharger" && (
            <BoutonListe icone={Download} onClick={handleDownload} disabled={downloading}>
              {downloading ? "Génération…" : "Télécharger le PDF"}
            </BoutonListe>
          )}
          {/* Un avoir est proposé sur toute facture sortie du brouillon : sous la
              réforme, une facture partie ne se modifie plus. */}
          {canAvoir && principal !== "avoir" && (
            <>
              <BoutonListe icone={Undo2} onClick={handleAvoir} disabled={creatingAvoir}>
                {creatingAvoir ? "Création…" : "Établir un avoir"}
              </BoutonListe>
              {retourAvoir}
            </>
          )}
          {groupePa}
        </>
      }
      danger={!isMember ? <ZoneSuppression libelle={estAvoir ? "Supprimer l'avoir" : "Supprimer la facture"} onConfirmer={handleDelete} enCours={deleting} /> : undefined}
    />
  );

  // ── Bandeau : un seul, le plus urgent ──
  let bandeau: ReactNode = null;
  if (aPointer) {
    const retard = joursDeRetard(inv.due_date as string, new Date());
    bandeau = (
      <Bandeau ton="attention">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-300">
              Échue depuis {retard} jour{retard > 1 ? "s" : ""}. A-t-elle été payée ?
            </p>
            <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
              {pasEncoreRecent
                ? `Noté le ${new Date(pasEncoreAt as string).toLocaleDateString("fr-FR")} : pas encore payée. On te reposera la question dans ${ESPACEMENT_JOURS} jours.`
                : inv.superpdp_invoice_id
                ? "Ce pointage déclare l'encaissement à l'administration : la date de paiement fixe le mois où la TVA est due."
                : "Ce pointage tient à jour ton livre des recettes et ce que voit ton expert-comptable."}
            </p>
          </div>
          {!pasEncoreRecent && !demandeDatePaiement && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDemandeDatePaiement(true)}
                className="min-h-10 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 transition-colors"
              >
                Oui, payée
              </button>
              <button
                type="button"
                onClick={handlePasEncore}
                disabled={envoiPasEncore}
                className={`min-h-10 text-sm font-medium px-3 py-2 rounded-lg border hover:bg-ds-elevated/60 text-gray-300 disabled:opacity-50 transition-colors ${pointageDemande === "pas-encore" ? "border-amber-500/60" : "border-ds-border"}`}
              >
                {envoiPasEncore ? "Enregistrement…" : "Pas encore"}
              </button>
            </div>
          )}
          {!pasEncoreRecent && demandeDatePaiement && (
            <p className="text-xs text-emerald-400 shrink-0">Saisis la date et le mode dans Actions.</p>
          )}
        </div>
      </Bandeau>
    );
  } else if (etat && (pdpEnEchec || etat.alerte)) {
    bandeau = (
      <Bandeau ton={pdpEnEchec ? "danger" : "attention"}>
        <p className={`text-sm font-medium ${pdpEnEchec ? "text-red-400" : "text-amber-300"}`}>
          Plateforme agréée : {etat.texte}{statutPdp && !etat.alerte ? ` (${statutPdp.texte})` : ""}.
        </p>
        {etat.alerte && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{etat.alerte}</p>}
        {pdpEnEchec && canAvoir && <p className="text-xs text-gray-400 mt-0.5">Pour la corriger, établis un avoir puis une nouvelle facture.</p>}
      </Bandeau>
    );
  } else if (conformite.blocking.length > 0) {
    bandeau = (
      <Bandeau ton="attention">
        <p className="text-sm font-medium text-amber-300">
          Cette facture serait refusée par une plateforme de facturation électronique :{" "}
          {conformite.blocking.length} élément{conformite.blocking.length > 1 ? "s manquent" : " manque"}.
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Le détail est dans le bloc « Facture électronique ».</p>
      </Bandeau>
    );
  }

  // ── Suivi ──
  const echue = !estAvoir && inv.status === "sent" && !!inv.due_date && new Date(inv.due_date) < new Date(new Date().toDateString());
  const etapes: EtapeSuivi[] = [
    { libelle: estAvoir ? "Avoir émis" : "Facture émise", date: jourCourt(inv.issue_date), faite: true },
    { libelle: estAvoir ? "Envoyé au client" : "Envoyée au client", faite: inv.status !== "draft" },
  ];
  if (inv.reminder_count > 0) {
    etapes.push({
      libelle: `Relance ${inv.reminder_count}/3`,
      date: inv.last_reminder_sent_at ? jourCourt(inv.last_reminder_sent_at) : null,
      faite: true,
      ton: "attention",
    });
  }
  if (dejaTransmise) {
    etapes.push({
      libelle: pdpEnEchec ? `Plateforme agréée : ${etat?.texte ?? "échec"}` : "Transmise à la plateforme agréée",
      date: inv.superpdp_status_date ? jourCourt(inv.superpdp_status_date) : null,
      faite: true,
      ton: pdpEnEchec ? "danger" : etat?.alerte ? "attention" : undefined,
    });
  }
  if (chorusRef) {
    etapes.push({
      libelle: `Déposée sur Chorus Pro${chorusStatus ? ` (${chorusStatus.label})` : ""}`,
      date: inv.chorus_pro_submitted_at ? jourCourt(inv.chorus_pro_submitted_at) : null,
      faite: true,
      ton: chorusStatus?.color === "red" ? "danger" : undefined,
    });
  }
  if (!estAvoir) {
    if (inv.status === "cancelled") {
      etapes.push({ libelle: "Annulée", faite: true, ton: "danger" });
    } else {
      etapes.push({
        libelle: inv.status === "paid"
          ? `Payée${inv.payment_mode ? ` (${MODES_REGLEMENT[inv.payment_mode].toLowerCase()})` : ""}`
          : echue ? "Échue, paiement attendu" : "Payée",
        date: inv.status === "paid" && inv.paid_at ? jourCourt(inv.paid_at) : echue && inv.due_date ? jourCourt(inv.due_date) : null,
        faite: inv.status === "paid" || echue,
        ton: echue ? "attention" : undefined,
      });
      if (dejaTransmise && encaissementConcerne) {
        etapes.push({
          libelle: "Encaissement déclaré à l'administration",
          date: inv.superpdp_encaisse_at ? jourCourt(inv.superpdp_encaisse_at) : null,
          faite: !!inv.superpdp_encaisse_at,
        });
      }
    }
  }

  // ── Facture électronique (informations) ──
  const natures = inv.items.map((it) => it.nature);
  const categorie =
    inv.operation_category === "services" ? "Prestations de services"
    : inv.operation_category === "goods" ? "Livraison de biens" : "Mixte, biens et prestations";
  const soldeDetail = inv.invoice_type === "solde" && (inv.deposit_percentage ?? 0) > 0 ? (() => {
    const pctAcompte = inv.deposit_percentage!;
    const originalTtc = inv.total_ttc / (1 - pctAcompte / 100);
    return { total: originalTtc, acompte: originalTtc - inv.total_ttc };
  })() : null;

  const informations = (
    <div>
      <Info libelle="Conformité">
        <FacturXCompliance invoice={inv} compact />
      </Info>
      <Info libelle="Format">PDF Factur-X (EN 16931), données de facturation intégrées</Info>
      <Info libelle="TVA">{inv.payment_on_debit ? "Acquittée sur les débits" : "Acquittée sur les encaissements"}</Info>
      <Info libelle="Nature de l'opération">
        {categorie}
        {natures.some(Boolean) && (
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-gray-500">
            {inv.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0">{it.description}</span>
                <span className="shrink-0 text-right">{it.nature ? LIBELLE_NATURE[it.nature] : "À préciser"}</span>
              </li>
            ))}
          </ul>
        )}
      </Info>
      {soldeDetail && (
        <Info libelle="Acompte déjà versé">
          <span className="flex justify-between gap-3"><span className="text-gray-500">Prestation totale</span><span className="tabular-nums">{fmt(soldeDetail.total)}</span></span>
          <span className="flex justify-between gap-3"><span className="text-gray-500">Acompte{inv.linked_invoice_number ? ` ${inv.linked_invoice_number}` : ""}</span><span className="tabular-nums">-{fmt(soldeDetail.acompte)}</span></span>
          <span className="flex justify-between gap-3 font-medium"><span>Solde à payer</span><span className="tabular-nums">{fmt(inv.total_ttc)}</span></span>
        </Info>
      )}
      <Info libelle="Plateforme agréée">
        {dejaTransmise ? (
          <div className="space-y-0.5">
            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${etat?.classe ?? "bg-ds-elevated text-gray-300"}`}>
              {etat?.texte ?? "Transmise"}
            </span>
            {/* Un code que notre table ne connaît pas s'affiche brut plutôt que
                de disparaître : leur nomenclature évolue. */}
            {(statutPdp || inv.superpdp_status) && (
              <p className="text-xs text-gray-500">Statut : {statutPdp?.texte ?? inv.superpdp_status}</p>
            )}
            {etat?.alerte && <p className="text-xs text-amber-400 leading-relaxed">{etat.alerte}</p>}
            {inv.superpdp_encaisse_at && <p className="text-xs text-gray-500">Encaissement déclaré (fr:212)</p>}
            {!inv.superpdp_encaisse_at && inv.status === "paid" && !encaissementConcerne && (
              <p className="text-xs text-gray-500">
                {inv.payment_on_debit
                  ? "Aucun encaissement à déclarer : la TVA est payée sur les débits."
                  : "Aucun encaissement à déclarer : la facture ne porte aucune prestation."}
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{inv.status === "draft" ? "Transmissible une fois envoyée" : "Non transmise"}</span>
        )}
      </Info>
      {chorusRef && (
        <Info libelle="Chorus Pro">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p>N° {chorusRef}</p>
              {chorusStatus && (
                <p className={`text-xs font-semibold ${
                  chorusStatus.color === "emerald" ? "text-emerald-400" :
                  chorusStatus.color === "amber" ? "text-amber-400" :
                  chorusStatus.color === "red" ? "text-red-400" :
                  chorusStatus.color === "indigo" ? "text-indigo-400" : "text-blue-400"
                }`}>{chorusStatus.label}</p>
              )}
              {chorusStatus?.motifRejet && <p className="text-xs text-red-400 leading-snug">{chorusStatus.motifRejet}</p>}
            </div>
            <button
              type="button"
              onClick={handleFetchStatus}
              disabled={fetchingStatus}
              title="Actualiser le statut"
              aria-label="Actualiser le statut Chorus Pro"
              className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-300 hover:bg-ds-elevated disabled:opacity-40 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </Info>
      )}
    </div>
  );

  // ── En-tête ──
  const st = echue ? { libelle: "Échue", ton: "attention" as Ton } : STATUTS[inv.status] ?? { libelle: inv.status, ton: "neutre" as Ton };
  const pastilles = (
    <>
      <Pastille ton={st.ton}>{st.libelle}</Pastille>
      {inv.invoice_type === "acompte" && <Pastille ton="succes">Acompte{inv.deposit_percentage ? ` ${inv.deposit_percentage} %` : ""}</Pastille>}
      {inv.invoice_type === "solde" && <Pastille ton="info">Solde</Pastille>}
      {estAvoir && <Pastille ton="attention">Avoir</Pastille>}
    </>
  );
  const dates = [
    `Émis${estAvoir ? "" : "e"} le ${fmtDate(inv.issue_date)}`,
    // Un avoir n'a pas d'échéance : il n'appelle aucun paiement.
    !estAvoir && inv.due_date ? `Échéance le ${fmtDate(inv.due_date)}` : null,
    inv.status === "paid" && inv.paid_at ? `Payée le ${fmtDate(inv.paid_at)}` : null,
  ].filter(Boolean).join(" · ");
  const sousLigne =
    estAvoir && inv.linked_invoice_number ? (
      <span className="text-amber-400">Annule la facture {inv.linked_invoice_number}</span>
    ) : inv.invoice_type === "solde" && inv.linked_invoice_number ? (
      <span className="text-gray-400">
        Acompte versé :{" "}
        <Link href={`/invoices?ref=${inv.linked_invoice_number}`} className="underline hover:text-gray-300">
          {inv.linked_invoice_number}
        </Link>
      </span>
    ) : inv.invoice_type === "acompte" ? (
      <span className="text-gray-400">Acompte de {inv.deposit_percentage} %, numérotation indépendante</span>
    ) : null;

  return (
    <PageDocument
      avantPage={<GuidedTourBanner pageKey="invoices_detail" />}
      retour={{ href: "/invoices", libelle: "Toutes les factures" }}
      titre={inv.client_company || inv.client_name || inv.invoice_number}
      numero={inv.invoice_number}
      pastilles={pastilles}
      dates={dates}
      sousLigne={sousLigne}
      bandeau={bandeau}
      feuille={
        feuille ? (
          <FeuilleDocument
            contenu={contenuFacture(feuille.invoice, { accent: feuille.accentColor, modele: feuille.modele }, feuille.paymentInfo, feuille.linkedNumber)}
            libelle={`Aperçu de la facture ${feuille.invoice.invoice_number}, identique au PDF`}
          />
        ) : feuilleKo ? (
          <div className="carte p-6 text-sm text-gray-400">
            L&apos;aperçu n&apos;a pas pu être chargé. Le PDF reste téléchargeable depuis Actions.
          </div>
        ) : (
          <div className="aspect-[210/297] w-full rounded-sm bg-ds-elevated" aria-label="Chargement de l&apos;aperçu" />
        )
      }
      actions={actions}
      suivi={<Suivi etapes={etapes} />}
      titreInformations="Facture électronique"
      informations={informations}
    />
  );
}
