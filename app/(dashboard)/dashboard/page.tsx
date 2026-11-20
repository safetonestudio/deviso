import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTeamMember, getWorkspaceUserId } from "@/lib/workspace";
import type { Proposal } from "@/types";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductTour } from "@/components/ProductTour";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { ActionsGlobales } from "@/components/ActionsGlobales";
import { tauxCotisationCategorie, TAUX_COTISATIONS_VENTE } from "@/lib/tarifs-data";
import { SignalementsClient } from "@/components/SignalementsClient";
import { caMensuelHt as calculerCaMensuelHt, encaisseTtcDuMois, lignesRecettes, totauxParCategorie, type FactureRecette } from "@/lib/recettes";
import { jaugeFranchise } from "@/lib/seuils-micro";
import { HeroCa } from "@/components/dashboard/HeroCa";
import { BarreParts, Courbe } from "@/components/dashboard/MiniVisuels";
import { CaMensuelBarres } from "@/components/dashboard/CaMensuelBarres";
import { EcheanceCarte } from "@/components/dashboard/EcheanceCarte";
import { EcheanceTvaCarte } from "@/components/dashboard/EcheanceTvaCarte";
import { StatutAPreciser } from "@/components/dashboard/StatutAPreciser";
import { vueTableauDeBord, prochaineDeclarationTva } from "@/lib/statut-entreprise";
import { echeanceDossier } from "@/lib/cabinet-tva-calendrier";
import type { FactureCabinet } from "@/lib/cabinet-dossiers";
import { accord } from "@/lib/pluriel";
import { Receipt, FileText, ArrowRight, Plus, Wallet, Hourglass, CircleCheck, FileSignature } from "lucide-react";

const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:     { label: "Envoyé",     color: "bg-ds-elevated text-ink" },
  viewed:   { label: "Consulté",   color: "bg-indigo-500/10 text-indigo-400" },
  signed:   { label: "Signé",      color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé",     color: "bg-red-500/10 text-red-400" },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:      { label: "Envoyée",    color: "bg-ds-elevated text-ink" },
  paid:      { label: "Payée",      color: "bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Annulée",    color: "bg-red-500/10 text-red-400" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isMember = await isTeamMember(user.id);
  const workspaceId = await getWorkspaceUserId(user.id);

  // Le filtre d'espace est écrit ici, en plus de la RLS.
  //
  // Ces deux requêtes s'en remettaient entièrement à la politique de sécurité
  // de la base : côté application, rien ne disait à quel espace elles se
  // limitent. C'est un pari sur une configuration qui vit ailleurs, et le
  // fichier `supabase/schema.sql` versionné dans ce dépôt contient justement
  // une ancienne policy qui, réappliquée, ouvrirait la lecture des devis de
  // tous les comptes. Le jour où elle reviendrait, cet écran afficherait les
  // cinquante derniers devis de toute la plateforme sans que rien ne casse.
  //
  // Deux verrous valent mieux qu'un quand le second est une ligne.
  let proposalsQuery = supabase
    .from("proposals")
    .select("id, title, client_name, status, total_ttc, created_at, signed_at")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  let invoicesQuery = supabase
    .from("invoices")
    .select("id, invoice_number, client_name, client_email, status, total_ht, total_ttc, due_date, issue_date, paid_at, created_at, proposal_id, invoice_type, operation_category, user_id, tva_rate, items, type_code")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false });

  if (isMember) {
    proposalsQuery = proposalsQuery.eq("created_by", user.id);
    invoicesQuery  = invoicesQuery.eq("created_by", user.id);
  }

  const [{ data: allProposals }, { data: invoices }, { data: profile }, { data: profilEspace }, { data: compteUrssaf }] = await Promise.all([
    proposalsQuery,
    invoicesQuery,
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    supabase.from("profiles").select("tva_regime, tva_periodicite, statut_juridique").eq("id", workspaceId).maybeSingle(),
    supabase.from("urssaf_tdae_comptes").select("categorie_ca, acre").eq("user_id", workspaceId).maybeSingle(),
  ]);

  const proposals = (allProposals ?? []) as Proposal[];
  const inv       = invoices ?? [];
  const plan      = profile?.plan ?? "free";
  const isPaid    = plan !== "free";

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // ── KPI 1 : Encours à encaisser ──────────────────────────────────────────
  //
  // Un avoir est un montant qu'on REND. Le compter dans l'encours gonflerait
  // ce qu'on attend de ses clients du montant même qu'on leur doit, et le
  // ferait apparaître en retard dès le lendemain de son émission.
  const sentInvoices    = inv.filter((i) => i.status === "sent" && i.invoice_type !== "avoir");
  const caToCollect     = sentInvoices.reduce((s, i) => s + i.total_ttc, 0);
  const overdueInvoices = sentInvoices.filter(
    (i) => i.due_date && new Date(i.due_date) < now
  );
  const overdueAmount   = overdueInvoices.reduce((s, i) => s + i.total_ttc, 0);

  // ── KPI 2 : Devis en attente ──────────────────────────────────────────────
  const pendingProposals    = proposals.filter((p) => ["sent", "viewed"].includes(p.status));
  const totalDevisEnAttente = pendingProposals.reduce((s, p) => s + p.total_ttc, 0);
  const devisConsultes      = pendingProposals.filter((p) => p.status === "viewed").length;
  const oldestDevisAge      = pendingProposals.length > 0
    ? Math.max(...pendingProposals.map((p) => daysSince(p.created_at)))
    : 0;

  // ── KPI 3 : Encaissé vs Facturé ce mois ──────────────────────────────────
  // Même règle que pour l'encours, et pour la même raison : un avoir se
  // retranche. Elle était appliquée au KPI 1 et oubliée ici, dans le même
  // fichier, dix lignes plus bas. Une facture encaissée puis annulée par un
  // avoir affichait « encaissé ce mois » au double du montant réel.
  const signeCa = (i: { invoice_type?: string | null }) => (i.invoice_type === "avoir" ? -1 : 1);

  // ── Récap du chiffre d'affaires encaissé, mois par mois ──────────────────
  //
  // Le composant existait déjà, complet et soigné, mais n'était monté nulle
  // part, alors que le tour du produit le promet noir sur blanc (« le widget
  // URSSAF te donne ton CA trimestriel et annuel, prêt à reporter dans ta
  // déclaration »). Promettre une fonctionnalité qu'on n'affiche pas est un
  // défaut à part entière : l'utilisateur la cherche, ne la trouve pas, et
  // doute du reste.
  //
  // Deux choix de fond dans ce calcul :
  //
  //   - **la date retenue est celle de l'ENCAISSEMENT** (`paid_at`), pas celle
  //     d'émission. C'est la règle du micro-entrepreneur, qui déclare ce qu'il
  //     a effectivement perçu sur la période. Une facture émise en mars et
  //     réglée en avril appartient à avril. À défaut de `paid_at`, on retombe
  //     sur la date d'émission plutôt que d'ignorer la facture ;
  //   - **hors taxes, avoirs retranchés**, comme partout ailleurs depuis
  //     l'audit du 08/09 : c'est ce chiffre-là qu'on reporte sur une
  //     déclaration, et la TVA collectée n'appartient pas à l'entreprise.
  const anneeCourante = now.getFullYear();
  // Calcul partagé avec le livre des recettes (lib/recettes.ts).
  const caMensuelHt = calculerCaMensuelHt(inv as unknown as FactureRecette[], anneeCourante);

  // Vue adaptee a l'entreprise (lib/statut-entreprise.ts) : echeance URSSAF
  // pour le micro-entrepreneur seulement, jauge de franchise pour toute
  // entreprise en franchise, echeance de TVA pour les assujettis. Rien n'est
  // deduit du regime de TVA : un micro peut etre assujetti, une societe en franchise.
  const vue = vueTableauDeBord(profilEspace?.statut_juridique, profilEspace?.tva_regime);
  const echeancesUrssaf = vue.echeanceUrssaf;

  // Total HT du trimestre en cours (carte d'echeance et bloc heros) : total HT
  // du trimestre en cours, et l'échéance de dépôt quand elle s'applique.
  // Calculé côté serveur pour rester lisible sans ouvrir l'accordéon.
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const caTrimestreHt =
    caMensuelHt[currentQuarter * 3] +
    caMensuelHt[currentQuarter * 3 + 1] +
    caMensuelHt[currentQuarter * 3 + 2];
  const URSSAF_DEADLINES = ["30 avril", "31 juillet", "31 octobre", "31 janvier"];
  const echeanceDepot = echeancesUrssaf ? URSSAF_DEADLINES[currentQuarter] : null;

  // Bloc heros : CA encaisse de l'annee et distance au seuil de franchise.
  // Meme calcul que le livre des recettes (lignes encaissees, avoirs deduits),
  // ventile par categorie : le seuil des prestations n'est pas celui des ventes.
  const totauxAnnee = totauxParCategorie(lignesRecettes(inv as unknown as FactureRecette[], anneeCourante));
  const caAnneeHt = Math.round((totauxAnnee.biens.ht + totauxAnnee.services.ht) * 100) / 100;
  const jauge = vue.jaugeFranchise
    ? jaugeFranchise({ biens: totauxAnnee.biens.ht, services: totauxAnnee.services.ht })
    : null;
  // Cotisations estimees du trimestre : CA x taux 2026 de la categorie Urssaf
  // (lib/tarifs-data.ts). Categorie inconnue : seule une activite 100 % vente
  // de biens permet d'estimer sans la deviner.
  const lignesTrimestre = lignesRecettes(inv as unknown as FactureRecette[], anneeCourante)
    .filter((l) => Math.floor((Number(l.date.slice(5, 7)) - 1) / 3) === currentQuarter);
  const tauxCotisations =
    tauxCotisationCategorie(compteUrssaf?.categorie_ca) ??
    (lignesTrimestre.length > 0 && lignesTrimestre.every((l) => l.categorie === "biens") ? TAUX_COTISATIONS_VENTE : null);
  const cotisationsEstimees = tauxCotisations !== null ? Math.round(caTrimestreHt * tauxCotisations) : null;

  // Assujettis a la TVA : la TVA percue sur les encaissements du trimestre,
  // a reverser lors de la declaration. Meme source (lignes du livre).
  const tvaTrimestre = vue.jaugeFranchise
    ? null
    : Math.round(
        lignesRecettes(inv as unknown as FactureRecette[], anneeCourante)
          .filter((l) => Math.floor((Number(l.date.slice(5, 7)) - 1) / 3) === currentQuarter)
          .reduce((t, l) => t + (l.ttc - l.ht), 0) * 100
      ) / 100;
  // Prochaine declaration de TVA des assujettis : memes montants que le
  // calendrier TVA du cabinet, pour que l'entrepreneur et son comptable lisent
  // le meme chiffre.
  const periodiciteTva = profilEspace?.tva_periodicite ?? null;
  const echeanceTva = !vue.echeanceTva
    ? null
    : periodiciteTva
      ? (() => {
          const prochaine = prochaineDeclarationTva(periodiciteTva, now);
          const p = echeanceDossier(periodiciteTva, inv as unknown as FactureCabinet[], now)[prochaine.periode];
          return { formulaire: periodiciteTva === "simplified" ? "CA12" as const : "CA3" as const, periode: p.libelle, depot: prochaine.depot, baseHt: p.base_ht, tva: p.tva, enCours: prochaine.periode === "enCours" };
        })()
      : { formulaire: null, periode: "", depot: "", baseHt: 0, tva: 0, enCours: false };
  const colonneEcheances = !!echeanceDepot || !!echeanceTva;

  // Encaissé ce mois : date d'ENCAISSEMENT (paid_at), pas date de création de
  // la facture comme jusqu'au 24/10/2026. Même source que le livre des recettes.
  const caThisMonth = encaisseTtcDuMois(
    inv as unknown as FactureRecette[],
    `${anneeCourante}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  // Courbe de la tuile : les mois ecoules de l'annee (six au plus), meme
  // serie que le graphique en dessous.
  const sixDerniersMois = caMensuelHt.slice(Math.max(0, now.getMonth() - 5), now.getMonth() + 1);
  // Evolution par rapport au mois precedent, meme source et meme base (TTC
  // encaisse). Pas de pastille sans mois de comparaison : un pourcentage sur
  // zero ne veut rien dire.
  const moisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const caMoisPrecedent = encaisseTtcDuMois(
    inv as unknown as FactureRecette[],
    `${moisPrecedent.getFullYear()}-${String(moisPrecedent.getMonth() + 1).padStart(2, "0")}`
  );
  const deltaMois = caMoisPrecedent > 0
    ? (() => {
        const pct = Math.round(((caThisMonth - caMoisPrecedent) / caMoisPrecedent) * 100);
        return { value: `${Math.abs(pct)} % vs ${moisPrecedent.toLocaleDateString("fr-FR", { month: "short" })}`, positive: pct >= 0 };
      })()
    : null;
  const facturéThisMonth = inv
    .filter((i) => i.status !== "cancelled" && i.status !== "draft" && i.created_at >= monthStart)
    .reduce((s, i) => s + signeCa(i) * i.total_ttc, 0);

  // ── KPI 4 : Devis signés non encore facturés ─────────────────────────────
  const invoicedProposalIds = new Set(inv.filter((i) => i.proposal_id).map((i) => i.proposal_id));
  const toInvoice           = proposals.filter((p) => p.status === "signed" && !invoicedProposalIds.has(p.id));
  const toInvoiceAmount     = toInvoice.reduce((s, p) => s + p.total_ttc, 0);
  const devisSignes         = proposals.filter((p) => p.status === "signed").length;


  // ── Listes récentes ───────────────────────────────────────────────────────
  const recentProposals = proposals.slice(0, 4);
  const recentInvoices  = inv.slice(0, 4);

  return (
    <>
    <div className="space-y-4 sm:space-y-5 w-full">

      <GuidedTourBanner pageKey="dashboard" />

      {/* ── En-tete : titre, actions, cloche et theme sur une ligne ── */}
      <div className="en-tete-page flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-ink tracking-tight leading-[1.15]">
            {isMember ? "Mon activité" : "Tableau de bord"}
          </h1>
          <p className="text-[14px] text-gray-400 mt-1">
            {isMember ? "Tes devis et factures personnels" : "Vue d'ensemble de ton activité"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/proposals/new"
            className={
              isPaid
                ? "flex items-center gap-2 border border-ds-border bg-ds-surface hover:bg-ds-elevated text-ink font-semibold px-4 h-10 rounded-lg transition-colors text-sm"
                : "flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-4 h-10 rounded-lg transition-colors text-sm"
            }
          >
            <Plus size={16} /> Nouveau devis
          </Link>
          {isPaid && (
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-4 h-10 rounded-lg transition-colors text-sm"
            >
              <FileText size={16} /> Nouvelle facture
            </Link>
          )}
          <ActionsGlobales />
        </div>
      </div>

      <SignalementsClient workspaceId={workspaceId} />

      {/* Statut non renseigne : on le demande plutot que de le deviner. */}
      {!isMember && vue.statutInconnu && <StatutAPreciser />}

      {/* ── Upgrade banner (free, owners only) ── */}
      {!isPaid && !isMember && (
        <div className="bg-linear-to-r/srgb from-indigo-600 to-violet-600 rounded-xl p-5 flex items-center justify-between gap-4 text-ink">
          <div>
            <div className="font-semibold text-sm">Passe à Solo, débloque l&apos;IA, les factures et les relances</div>
            <div className="text-xs text-indigo-200 mt-0.5">Essai gratuit 14 jours · sans carte bancaire</div>
          </div>
          <Link
            href="/billing"
            className="shrink-0 bg-white text-indigo-600 hover:opacity-90 text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Voir les offres →
          </Link>
        </div>
      )}

      {/* ── Heros : CA encaisse de l'annee et seuil de TVA ── */}
      {!isMember && (
        <HeroCa
          annee={anneeCourante}
          caAnneeHt={caAnneeHt}
          caTrimestreHt={caTrimestreHt}
          trimestre={currentQuarter + 1}
          caMoisTtc={caThisMonth}
          jauge={jauge}
          tvaTrimestre={tvaTrimestre}
        />
      )}

      {/* ── Indicateurs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          dense
          href="/invoices"
          icon={Wallet}
          visuel={caToCollect > 0 ? (
            <BarreParts
              description={`Encours : ${fmt(caToCollect - overdueAmount)} à jour, ${fmt(overdueAmount)} en retard`}
              parts={[
                { valeur: caToCollect - overdueAmount, classe: "bg-indigo-500", libelle: `À jour ${fmt(caToCollect - overdueAmount)}` },
                { valeur: overdueAmount, classe: "bg-amber-500", libelle: `En retard ${fmt(overdueAmount)}` },
              ]}
            />
          ) : undefined}
          label="Encours à encaisser"
          value={fmt(caToCollect)}
          point={overdueAmount > 0 ? "alerte" : "neutre"}
          trend={caToCollect > 0 ? undefined : sentInvoices.length > 0 ? `${sentInvoices.length} facture${sentInvoices.length > 1 ? "s" : ""} envoyée${sentInvoices.length > 1 ? "s" : ""}` : "Aucune en attente"}
        />
        <KpiCard
          dense
          href="/proposals"
          icon={Hourglass}
          visuel={pendingProposals.length > 0 ? (
            <BarreParts
              description={`Devis en attente : ${devisConsultes} ${accord(devisConsultes, "consulté")}, ${pendingProposals.length - devisConsultes} ${accord(pendingProposals.length - devisConsultes, "envoyé")} non ${accord(pendingProposals.length - devisConsultes, "ouvert")}`}
              parts={[
                { valeur: devisConsultes, classe: "bg-indigo-500", libelle: `Consulté${devisConsultes > 1 ? "s" : ""} ${devisConsultes}` },
                { valeur: pendingProposals.length - devisConsultes, classe: "bg-gray-400", libelle: `Non ouvert${pendingProposals.length - devisConsultes > 1 ? "s" : ""} ${pendingProposals.length - devisConsultes}` },
              ]}
            />
          ) : undefined}
          label="Devis en attente"
          value={fmt(pendingProposals.length > 0 ? totalDevisEnAttente : 0)}
          point="neutre"
          trend={pendingProposals.length > 0 ? undefined : "Aucun devis en cours"}
        />
        <KpiCard
          dense
          href="/livre-recettes"
          icon={CircleCheck}
          delta={deltaMois ?? undefined}
          visuel={<Courbe valeurs={sixDerniersMois} description="Encaissements hors taxes des derniers mois de l'année" legende={`${sixDerniersMois.length} derniers mois`} />}
          label="Encaissé ce mois"
          value={fmt(caThisMonth)}
          point="bon"
          trend={sixDerniersMois.length >= 2 && Math.max(...sixDerniersMois) > 0
            ? undefined
            : facturéThisMonth > caThisMonth ? `Facturé : ${fmt(facturéThisMonth)}` : new Date().toLocaleDateString("fr-FR", { month: "long" })}
        />
        <KpiCard
          dense
          href="/proposals"
          icon={FileSignature}
          visuel={devisSignes > 0 ? (
            <BarreParts
              description={`Devis signés : ${devisSignes - toInvoice.length} ${accord(devisSignes - toInvoice.length, "facturé")}, ${toInvoice.length} à facturer`}
              parts={[
                { valeur: devisSignes - toInvoice.length, classe: "bg-indigo-500", libelle: `Facturé${devisSignes - toInvoice.length > 1 ? "s" : ""} ${devisSignes - toInvoice.length}` },
                { valeur: toInvoice.length, classe: "bg-gray-400", libelle: `À facturer ${toInvoice.length}` },
              ]}
            />
          ) : undefined}
          label="Signés à facturer"
          value={fmt(toInvoice.length > 0 ? toInvoiceAmount : 0)}
          point="neutre"
          trend={devisSignes > 0 ? undefined : "Aucun devis signé"}
        />
      </div>

      {/* ── CA mois par mois et prochaine echeance ── */}
      {!isMember && (
        <div className="grid gap-4 lg:grid-cols-3 items-stretch">
          {/* Sans echeance applicable (ni URSSAF ni TVA), pas de carte de
              remplacement : le graphique prend toute la largeur. */}
          <div className={`${colonneEcheances ? "lg:col-span-2" : "lg:col-span-3"} min-w-0`}>
            <CaMensuelBarres mensuelHt={caMensuelHt} moisCourant={now.getMonth()} annee={anneeCourante} />
          </div>
          {colonneEcheances && (
            <div className="flex flex-col gap-4 min-w-0">
              {echeanceDepot && <EcheanceCarte
                echeance={echeanceDepot}
                trimestre={currentQuarter + 1}
                caTrimestreHt={caTrimestreHt}
                annee={anneeCourante}
                cotisations={cotisationsEstimees}
                acre={!!compteUrssaf?.acre}
              />}
              {echeanceTva && <EcheanceTvaCarte {...echeanceTva} />}
            </div>
          )}
        </div>
      )}

      {/* ── Activité récente : devis + factures ── */}
      <div className={`grid gap-4 ${isPaid ? "lg:grid-cols-2" : ""}`}>

        {/* Devis récents */}
        <div className="carte overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">Devis récents</h2>
            <Link href="/proposals" className="text-[13px] font-medium text-gray-300 hover:text-ink transition-colors flex items-center gap-1 min-h-9">
              Voir tout <ArrowRight size={13} />
            </Link>
          </div>

          {recentProposals.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="Aucun devis pour l'instant"
                description="Crée ton premier devis en décrivant ton projet à l'IA."
                action={
                  <Link
                    href="/proposals/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-ink font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-block"
                  >
                    Créer un devis
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(110px,30%)_100px] gap-3 px-5 py-2 border-y border-ds-border bg-ds-elevated text-[12px] font-medium text-gray-400">
                <span>Devis</span><span>Statut</span><span className="text-right">Montant TTC</span>
              </div>
              <div className="divide-y divide-ds-border">
              {recentProposals.map((proposal) => {
                const s   = PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.draft;
                const age = daysSince(proposal.created_at);
                return (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_minmax(110px,30%)_100px] items-center gap-3 px-5 py-3 hover:bg-ds-elevated focus-visible:bg-ds-elevated transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink text-sm break-words sm:truncate">
                        {proposal.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {proposal.client_name || "-"}
                        {", "}
                        <span className={age >= 7 && ["sent", "viewed"].includes(proposal.status) ? "text-amber-500" : ""}>
                          {age === 0 ? "aujourd'hui" : `il y a ${age}j`}
                        </span>
                      </div>
                    </div>
                    <div className="contents">
                      <span className={`justify-self-start text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      <span className="font-semibold text-ink text-sm tabular-nums text-right justify-self-end">{fmt(proposal.total_ttc)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            </>
          )}
        </div>

        {/* Factures récentes (Solo+) */}
        {isPaid && (
          <div className="carte overflow-hidden lg:order-first">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-ink">Factures récentes</h2>
              <Link href="/invoices" className="text-[13px] font-medium text-gray-300 hover:text-ink transition-colors flex items-center gap-1 min-h-9">
                Voir tout <ArrowRight size={13} />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Receipt}
                  title="Aucune facture"
                  description="Convertis un devis signé en facture en un clic."
                  action={
                    <Link
                      href="/invoices/new"
                      className="bg-ds-elevated border border-ds-border hover:bg-ds-border text-ink font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-block"
                    >
                      Créer une facture
                    </Link>
                  }
                />
              </div>
            ) : (
              <>
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(110px,30%)_100px] gap-3 px-5 py-2 border-y border-ds-border bg-ds-elevated text-[12px] font-medium text-gray-400">
                <span>Client</span><span>Statut</span><span className="text-right">Montant TTC</span>
              </div>
              <div className="divide-y divide-ds-border">
                {recentInvoices.map((invoice) => {
                  const s         = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.draft;
                  const isOverdue = invoice.status === "sent" && invoice.due_date && new Date(invoice.due_date) < now;
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_minmax(110px,30%)_100px] items-center gap-3 px-5 py-3 hover:bg-ds-elevated focus-visible:bg-ds-elevated transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink text-sm break-words sm:truncate">
                          {invoice.client_name || "-"}
                        </div>
                        <div className={`text-xs mt-0.5 break-words sm:truncate ${isOverdue ? "text-amber-400 font-medium" : "text-gray-400"}`}>
                          {invoice.invoice_number || "Facture"},{" "}
                          {isOverdue
                            ? `en retard depuis le ${new Date(invoice.due_date!).toLocaleDateString("fr-FR")}`
                            : invoice.due_date
                            ? `échéance ${new Date(invoice.due_date).toLocaleDateString("fr-FR")}`
                            : `créée le ${new Date(invoice.created_at).toLocaleDateString("fr-FR")}`}
                        </div>
                      </div>
                      <div className="contents">
                        <span className={`justify-self-start text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${isOverdue ? "bg-amber-500/10 text-amber-400" : s.color}`}>
                          {isOverdue ? "En retard" : s.label}
                        </span>
                        <span className="font-semibold text-ink text-sm tabular-nums text-right justify-self-end">{fmt(invoice.total_ttc)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>

    <ProductTour isMember={isMember} />
    </>
  );
}
