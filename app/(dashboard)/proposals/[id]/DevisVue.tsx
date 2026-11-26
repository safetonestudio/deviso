"use client";

/**
 * Page de détail d'un devis, dans le cadre commun devis / facture
 * (components/document/PageDocument.tsx).
 *
 * Reprend toutes les fonctions des anciens ProposalActions et ShareSection,
 * avec les mêmes droits :
 * - envoyer par e-mail, marquer envoyé, copier le lien de partage, relancer :
 *   acte « envoyer_devis » (le titulaire l'a toujours ; relance gardée aussi
 *   côté serveur, décision de Selim du 24/11/2026) ;
 * - convertir en facture, télécharger le PDF : tout membre (créer une facture
 *   est ouvert à tout membre) ;
 * - supprimer : titulaire seul.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send, Bell, Download, FileText, Coins, CircleCheck, ChevronDown, Link2, MailCheck, ReceiptText,
} from "lucide-react";
import type { Proposal, Profile } from "@/types";
import { usePermission } from "@/components/PlanContext";
import { FeuilleDocument } from "@/components/document/FeuilleDocument";
import { contenuDevis, type ProfilDevis } from "@/lib/devis-contenu";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { LIBELLE_NATURE } from "@/lib/nature-operation";
import {
  PageDocument, Pastille, PanneauActions, BoutonPrincipal, BoutonListe, Retour, ZoneSuppression,
  Suivi, Info, type Ton, type EtapeSuivi,
} from "@/components/document/PageDocument";

const STATUTS: Record<string, { libelle: string; ton: Ton }> = {
  draft: { libelle: "Brouillon", ton: "neutre" },
  sent: { libelle: "Envoyé", ton: "info" },
  viewed: { libelle: "Consulté", ton: "attention" },
  signed: { libelle: "Signé", ton: "succes" },
  declined: { libelle: "Refusé", ton: "danger" },
};

const jour = (d: string) => new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
const jourCourt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit" });

interface Props {
  proposal: Proposal;
  profile: (ProfilDevis & Partial<Profile>) | null;
  shareUrl: string;
  isOwner: boolean;
}

export default function DevisVue({ proposal, profile, shareUrl, isOwner }: Props) {
  const router = useRouter();
  const peutEnvoyer = usePermission("envoyer_devis");

  // ── États (repris de ProposalActions et ShareSection) ──
  const [copie, setCopie] = useState(false);
  const [telechargement, setTelechargement] = useState(false);
  const [erreurPdf, setErreurPdf] = useState<string | null>(null);

  // Le PDF du devis, au même modèle que la facture (/api/proposals/[id]/pdf).
  // Il remplace « Imprimer ou enregistrer en PDF », qui passait par la fenêtre
  // d'impression du navigateur.
  const telechargerPdf = async () => {
    setTelechargement(true);
    setErreurPdf(null);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const nom = (res.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/)?.[1] ?? "devis.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = nom; a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErreurPdf("Le PDF n'a pas pu être généré. Réessaie dans un instant.");
    }
    setTelechargement(false);
  };
  const [marquage, setMarquage] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [relance, setRelance] = useState(false);
  const [nbRelances, setNbRelances] = useState(proposal.reminder_count || 0);
  const [messageRelance, setMessageRelance] = useState<{ ton: Ton; texte: string } | null>(null);

  const [formEmail, setFormEmail] = useState(false);
  const [emailTo, setEmailTo] = useState(proposal.client_email || "");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<string | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState("");

  const [conversion, setConversion] = useState(false);
  const [acompte, setAcompte] = useState(false);
  const [pct, setPct] = useState(30);
  const conversionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function dehors(e: MouseEvent) {
      if (conversionRef.current && !conversionRef.current.contains(e.target as Node)) {
        setConversion(false);
        setAcompte(false);
      }
    }
    document.addEventListener("mousedown", dehors);
    return () => document.removeEventListener("mousedown", dehors);
  }, []);

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt("Copie le lien :", shareUrl);
    }
  };

  const marquerEnvoye = async () => {
    setMarquage(true);
    await fetch(`/api/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });
    router.refresh();
    setMarquage(false);
  };

  const supprimer = async () => {
    setSuppression(true);
    await fetch(`/api/proposals/${proposal.id}`, { method: "DELETE" });
    router.push("/proposals");
  };

  const relancer = async () => {
    if (!proposal.client_email) return;
    setRelance(true);
    setMessageRelance(null);
    const res = await fetch(`/api/proposals/${proposal.id}/remind`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNbRelances(data.reminder_count);
      setMessageRelance({ ton: "succes", texte: `Relance envoyée à ${proposal.client_email}.` });
      router.refresh();
    } else {
      setMessageRelance({ ton: "danger", texte: data.error || "Erreur lors de l'envoi" });
    }
    setRelance(false);
  };

  const envoyerEmail = async () => {
    if (!emailTo) return;
    setEnvoi(true);
    setErreurEnvoi("");
    const res = await fetch(`/api/proposals/${proposal.id}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: emailTo,
        shareUrl,
        senderName: profile?.company_name || profile?.full_name || "Votre prestataire",
        proposalTitle: proposal.title,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErreurEnvoi(data.error || "Erreur lors de l'envoi");
    } else {
      setEnvoye(emailTo);
      setFormEmail(false);
      router.refresh();
    }
    setEnvoi(false);
  };

  // ── Ce qui est possible à ce statut (mêmes règles qu'avant) ──
  const statut = proposal.status;
  const estBrouillon = statut === "draft";
  const peutMarquerEnvoye = estBrouillon && peutEnvoyer;
  const peutConvertir = ["signed", "sent", "viewed"].includes(statut);
  const peutRelancer = ["sent", "viewed"].includes(statut) && !!proposal.client_email && peutEnvoyer;
  const libelleRelance = relance ? "Envoi…" : nbRelances > 0 ? `Relancer le client (${nbRelances}/3)` : "Relancer le client";

  // ── Le geste attendu : un seul bouton plein ──
  type Cle = "email" | "relancer" | "convertir" | "telecharger";
  const principal: Cle =
    estBrouillon && peutEnvoyer ? "email"
    : statut === "signed" && peutConvertir ? "convertir"
    : peutRelancer ? "relancer"
    : peutConvertir ? "convertir"
    : "telecharger";

  const blocEmail = formEmail && (
    <div className="rounded-lg border border-ds-border p-3 space-y-2">
      <label htmlFor="devis-email" className="block text-sm font-medium text-ink">Adresse du client</label>
      <input
        id="devis-email"
        type="email"
        value={emailTo}
        onChange={(e) => setEmailTo(e.target.value)}
        placeholder="email@client.fr"
        className="w-full bg-ds-elevated border border-ds-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-gray-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
      />
      <p className="text-xs text-gray-500">
        Le client reçoit un e-mail avec le lien de signature et une explication simple du processus.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={envoyerEmail}
          disabled={envoi || !emailTo}
          className="flex-1 text-sm bg-indigo-600 text-ink font-semibold px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
        <button
          type="button"
          onClick={() => setFormEmail(false)}
          className="text-sm border border-ds-border text-gray-400 px-3 py-2 rounded-lg hover:bg-ds-elevated transition-colors"
        >
          Annuler
        </button>
      </div>
      {erreurEnvoi && <p className="text-xs text-red-400">{erreurEnvoi}</p>}
    </div>
  );

  const menuConversion = conversion && (
    <div className="rounded-lg border border-ds-border py-1 text-sm">
      {!acompte ? (
        <>
          <Link href={`/invoices/new?from_proposal=${proposal.id}`} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-ds-elevated transition-colors">
            <FileText size={17} className="shrink-0 text-gray-400" />
            <span><span className="block font-medium text-ink">Facture standard</span><span className="block text-xs text-gray-400">Règlement intégral</span></span>
          </Link>
          <button type="button" onClick={() => setAcompte(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-ds-elevated transition-colors text-left">
            <Coins size={17} className="shrink-0 text-gray-400" />
            <span><span className="block font-medium text-ink">Facture d&apos;acompte</span><span className="block text-xs text-gray-400">Versement partiel (AC-AAAA-NNN)</span></span>
          </button>
          <Link href={`/invoices/new?from_proposal=${proposal.id}&type=solde`} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-ds-elevated transition-colors">
            <CircleCheck size={17} className="shrink-0 text-gray-400" />
            <span><span className="block font-medium text-ink">Facture de solde</span><span className="block text-xs text-gray-400">Solde après acompte</span></span>
          </Link>
        </>
      ) : (
        <div className="px-3 py-2.5">
          <p className="font-medium text-ink mb-2">Pourcentage d&apos;acompte</p>
          <div className="flex gap-2 mb-3">
            {[30, 40, 50].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPct(v)}
                aria-pressed={pct === v}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  pct === v ? "bg-green-600 border-green-600 text-ink" : "border-ds-border text-gray-300 hover:bg-ds-elevated"
                }`}
              >
                {v} %
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <label htmlFor="devis-pct" className="text-xs text-gray-400 shrink-0">Autre :</label>
            <input
              id="devis-pct"
              type="number"
              min={1}
              max={99}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-full bg-ds-elevated border border-ds-border rounded-lg px-2 py-1 text-sm text-ink"
            />
            <span className="text-gray-400 text-sm">%</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAcompte(false)} className="flex-1 py-1.5 rounded-lg border border-ds-border text-xs text-gray-400 hover:bg-ds-elevated">
              ← Retour
            </button>
            <Link
              href={`/invoices/new?from_proposal=${proposal.id}&type=acompte&pct=${pct}`}
              className="flex-1 py-1.5 rounded-lg bg-green-700 text-ink text-xs font-medium text-center hover:bg-green-800 transition-colors"
            >
              Créer {pct} %
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const basculerConversion = () => { setConversion((o) => !o); setAcompte(false); };

  // ── Bouton principal ──
  const boutonPrincipal =
    principal === "email" ? (
      <BoutonPrincipal
        icone={Send}
        onClick={() => setFormEmail((o) => !o)}
        sous={proposal.client_email ? `Destinataire : ${proposal.client_email}` : "Adresse du client à saisir"}
      >
        Envoyer au client
      </BoutonPrincipal>
    ) : principal === "relancer" ? (
      <BoutonPrincipal icone={Bell} onClick={relancer} disabled={relance} sous={`Destinataire : ${proposal.client_email}`}>
        {libelleRelance}
      </BoutonPrincipal>
    ) : principal === "convertir" ? (
      <BoutonPrincipal icone={ReceiptText} onClick={basculerConversion} sous="Facture standard, d'acompte ou de solde">
        <span className="flex items-center justify-between gap-2">Convertir en facture<ChevronDown size={16} className={conversion ? "rotate-180" : ""} /></span>
      </BoutonPrincipal>
    ) : (
      <BoutonPrincipal icone={Download} onClick={telechargerPdf} disabled={telechargement} sous="Le PDF tel que le reçoit le client">
        {telechargement ? "Génération…" : "Télécharger le PDF"}
      </BoutonPrincipal>
    );

  const actions = (
    <PanneauActions
      principal={
        <div ref={principal === "convertir" ? conversionRef : undefined} className="space-y-2">
          {boutonPrincipal}
          {principal === "email" && blocEmail}
          {principal === "convertir" && menuConversion}
          {principal === "relancer" && messageRelance && <Retour ton={messageRelance.ton}>{messageRelance.texte}</Retour>}
          {erreurPdf && <Retour ton="danger">{erreurPdf}</Retour>}
          {envoye && (
            <Retour ton="succes">E-mail envoyé à {envoye}. Le devis passe en statut « Envoyé ».</Retour>
          )}
        </div>
      }
      autres={
        <>
          {peutEnvoyer && principal !== "email" && (
            <>
              <BoutonListe icone={Send} onClick={() => setFormEmail((o) => !o)} ariaExpanded={formEmail}>
                {estBrouillon ? "Envoyer par e-mail" : "Renvoyer par e-mail"}
              </BoutonListe>
              {blocEmail}
            </>
          )}
          {peutMarquerEnvoye && (
            <BoutonListe icone={MailCheck} onClick={marquerEnvoye} disabled={marquage}>
              {marquage ? "…" : "Marquer envoyé"}
            </BoutonListe>
          )}
          {peutRelancer && principal !== "relancer" && (
            <>
              <BoutonListe icone={Bell} onClick={relancer} disabled={relance} ton="attention">{libelleRelance}</BoutonListe>
              {messageRelance && <Retour ton={messageRelance.ton}>{messageRelance.texte}</Retour>}
            </>
          )}
          {peutConvertir && principal !== "convertir" && (
            <div ref={conversionRef} className="space-y-1">
              <BoutonListe
                icone={ReceiptText}
                onClick={basculerConversion}
                ariaExpanded={conversion}
                ton="succes"
                droite={<ChevronDown size={15} className={`shrink-0 ${conversion ? "rotate-180" : ""}`} />}
              >
                Convertir en facture
              </BoutonListe>
              {menuConversion}
            </div>
          )}
          {peutEnvoyer && (
            <BoutonListe icone={Link2} onClick={copierLien}>{copie ? "Lien copié" : "Copier le lien de partage"}</BoutonListe>
          )}
          {principal !== "telecharger" && (
            <BoutonListe icone={Download} onClick={telechargerPdf} disabled={telechargement}>
              {telechargement ? "Génération…" : "Télécharger le PDF"}
            </BoutonListe>
          )}
        </>
      }
      danger={isOwner ? <ZoneSuppression libelle="Supprimer le devis" onConfirmer={supprimer} enCours={suppression} /> : undefined}
    />
  );

  // ── Suivi ──
  const envoyeOuPlus = ["sent", "viewed", "signed", "declined"].includes(statut);
  const etapes: EtapeSuivi[] = [
    { libelle: "Créé", date: jourCourt(proposal.created_at), faite: true },
    { libelle: "Envoyé", faite: envoyeOuPlus },
    { libelle: "Consulté par le client", date: proposal.viewed_at ? jourCourt(proposal.viewed_at) : null, faite: !!proposal.viewed_at },
  ];
  if (nbRelances > 0) {
    etapes.push({
      libelle: `Relance ${nbRelances}/3`,
      date: proposal.last_reminder_sent_at ? jourCourt(proposal.last_reminder_sent_at) : null,
      faite: true,
      ton: "attention",
    });
  }
  if (statut === "declined") {
    etapes.push({ libelle: "Refusé", faite: true, ton: "danger" });
  } else {
    etapes.push({
      libelle: proposal.signer_name ? `Signé par ${proposal.signer_name}` : "Signé",
      date: proposal.signed_at ? jourCourt(proposal.signed_at) : null,
      faite: statut === "signed",
    });
  }

  // ── Informations ──
  const natures = proposal.items.reduce(
    (acc, it) => {
      if (it.nature === "services") acc.services++;
      else if (it.nature === "goods") acc.goods++;
      else acc.aPreciser++;
      return acc;
    },
    { services: 0, goods: 0, aPreciser: 0 }
  );
  const resumeNature = [
    natures.services ? `${natures.services} ${natures.services > 1 ? "prestations" : "prestation"}` : null,
    natures.goods ? `${natures.goods} ${natures.goods > 1 ? "biens" : "bien"}` : null,
    natures.aPreciser ? `${natures.aPreciser} à préciser` : null,
  ].filter(Boolean).join(", ");
  const expire = !!proposal.valid_until && new Date(proposal.valid_until) < new Date() && statut !== "signed";

  const informations = (
    <div>
      {peutEnvoyer && proposal.share_token && (
        <Info libelle="Lien de partage">
          <span className="block font-mono text-xs text-gray-400 truncate" title={shareUrl}>{shareUrl}</span>
        </Info>
      )}
      <Info libelle="Destinataire">{proposal.client_email || "Aucune adresse sur ce devis"}</Info>
      {proposal.valid_until && (
        <Info libelle="Validité">
          <span className={expire ? "text-amber-400" : undefined}>
            {expire ? "Dépassée depuis le " : "Jusqu'au "}{jour(proposal.valid_until)}
          </span>
        </Info>
      )}
      <Info libelle="Nature des lignes">
        {resumeNature || "Aucune ligne"}
        {proposal.items.some((it) => it.nature) && (
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-gray-500">
            {proposal.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0">{it.description}</span>
                <span className="shrink-0 text-right">{it.nature ? LIBELLE_NATURE[it.nature] : "À préciser"}</span>
              </li>
            ))}
          </ul>
        )}
      </Info>
      <Info libelle="Conditions générales de vente">
        {profile?.cgv_text ? "Jointes au devis, à la suite du document" : "Aucune (à rédiger dans Paramètres)"}
      </Info>
    </div>
  );

  const st = STATUTS[statut] ?? STATUTS.draft;
  const dates = [
    `Créé le ${jour(proposal.created_at)}`,
    proposal.valid_until ? `Valable jusqu'au ${jour(proposal.valid_until)}` : null,
    proposal.viewed_at ? `Consulté le ${jour(proposal.viewed_at)}` : null,
  ].filter(Boolean).join(" · ");

  const contenu = contenuDevis(proposal, profile, { marque: profile?.plan === "free" });
  const libelleFeuille = `Aperçu du devis ${proposal.proposal_number ?? ""}, tel que le voit le client`;

  return (
    <PageDocument
      avantPage={<GuidedTourBanner pageKey="proposals_detail" />}
      retour={{ href: "/proposals", libelle: "Tous les devis" }}
      titre={proposal.title}
      numero={proposal.proposal_number}
      pastilles={<Pastille ton={st.ton}>{st.libelle}</Pastille>}
      dates={dates}
      feuille={
        <div className="zone-impression">
          <FeuilleDocument contenu={contenu} libelle={libelleFeuille} partie="premiere" />
        </div>
      }
      suiteFeuille={
        contenu.annexe ? (
          <div className="zone-impression">
            <FeuilleDocument contenu={contenu} libelle={libelleFeuille} partie="annexe" />
          </div>
        ) : undefined
      }
      actions={actions}
      suivi={<Suivi etapes={etapes} />}
      titreInformations="Informations"
      informations={informations}
    />
  );
}
