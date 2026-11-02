import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTeamMember, getWorkspaceUserId } from "@/lib/workspace";
import type { Proposal } from "@/types";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CaUrssafWidget } from "@/components/CaUrssafWidget";
import { ProductTour } from "@/components/ProductTour";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { ActionsGlobales } from "@/components/ActionsGlobales";
import { tauxCotisationCategorie, TAUX_COTISATIONS_VENTE } from "@/lib/tarifs-data";
import { SignalementsClient } from "@/components/SignalementsClient";
import { caMensuelHt as calculerCaMensuelHt, encaisseTtcDuMois, lignesRecettes, totauxParCategorie, type FactureRecette } from "@/lib/recettes";
import { jaugeFranchise } from "@/lib/seuils-micro";
import { HeroCa } from "@/components/dashboard/HeroCa";
import { CaMensuelBarres } from "@/components/dashboard/CaMensuelBarres";
import { EcheanceCarte } from "@/components/dashboard/EcheanceCarte";
import { Receipt, FileText, ArrowRight, Plus } from "lucide-react";

const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  draft:    { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:     { label: "Envoyé",     color: "bg-blue-500/10 text-blue-400" },
  viewed:   { label: "Consulté",   color: "bg-amber-500/10 text-amber-400" },
  signed:   { label: "Signé",      color: "bg-emerald-500/10 text-emerald-400" },
  declined: { label: "Refusé",     color: "bg-red-500/10 text-red-400" },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: "Brouillon",  color: "bg-ds-elevated text-gray-400" },
  sent:      { label: "Envoyée",    color: "bg-blue-500/10 text-blue-400" },
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
    .select("id, invoice_number, client_name, client_email, status, total_ht, total_ttc, due_date, issue_date, paid_at, created_at, proposal_id, invoice_type, operation_category")
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
    supabase.from("profiles").select("tva_regime").eq("id", workspaceId).maybeSingle(),
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

  // Les échéances URSSAF affichées par le widget sont celles du
  // micro-entrepreneur. On ne les montre que lorsqu'on peut l'affirmer, la
  // franchise en base est le seul indice fiable dont on dispose, faute de
  // champ « forme juridique ». Le récapitulatif, lui, s'affiche pour tous :
  // savoir ce qu'on a encaissé par trimestre n'a pas de régime.
  const echeancesUrssaf = profilEspace?.tva_regime === "franchise";

  // Résumé porté par la barre fermée du récap CA/URSSAF (accordéon) : total HT
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
  const jauge = echeancesUrssaf
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
  const tvaTrimestre = echeancesUrssaf
    ? null
    : Math.round(
        lignesRecettes(inv as unknown as FactureRecette[], anneeCourante)
          .filter((l) => Math.floor((Number(l.date.slice(5, 7)) - 1) / 3) === currentQuarter)
          .reduce((t, l) => t + (l.ttc - l.ht), 0) * 100
      ) / 100;
  // Encaissé ce mois : date d'ENCAISSEMENT (paid_at), pas date de création de
  // la facture comme jusqu'au 24/10/2026. Même source que le livre des recettes.
  const caThisMonth = encaisseTtcDuMois(
    inv as unknown as FactureRecette[],
    `${anneeCourante}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const facturéThisMonth = inv
    .filter((i) => i.status !== "cancelled" && i.status !== "draft" && i.created_at >= monthStart)
    .reduce((s, i) => s + signeCa(i) * i.total_ttc, 0);

  // ── KPI 4 : Devis signés non encore facturés ─────────────────────────────
  const invoicedProposalIds = new Set(inv.filter((i) => i.proposal_id).map((i) => i.proposal_id));
  const toInvoice           = proposals.filter((p) => p.status === "signed" && !invoicedProposalIds.has(p.id));
  const toInvoiceAmount     = toInvoice.reduce((s, p) => s + p.total_ttc, 0);


  // ── Listes récentes ───────────────────────────────────────────────────────
  const recentProposals = proposals.slice(0, 4);
  const recentInvoices  = inv.slice(0, 4);

  return (
    <>
    <div className="space-y-6 w-full">

      <GuidedTourBanner pageKey="dashboard" />

      {/* ── En-tete : titre, actions, cloche et theme sur une ligne ── */}
      <div className="en-tete-page flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[34px] sm:text-[44px] font-bold text-ink tracking-tight leading-[1.05]">
            {isMember ? "Mon activité" : "Tableau de bord"}
          </h1>
          <p className="text-[15px] sm:text-[17px] text-gray-400 mt-2">
            {isMember ? "Tes devis et factures personnels" : "Vue d'ensemble de ton activité"}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap sm:mt-3">
          <Link
            href="/proposals/new"
            className={
              isPaid
                ? "flex items-center gap-2 border border-ds-border bg-ds-surface hover:bg-ds-elevated text-ink font-semibold px-5 h-11 rounded-xl transition-colors text-[15px]"
                : "flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-5 h-11 rounded-xl transition-colors text-[15px]"
            }
          >
            <Plus size={17} /> Nouveau devis
          </Link>
          {isPaid && (
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-5 h-11 rounded-xl transition-colors text-[15px]"
            >
              <FileText size={17} /> Nouvelle facture
            </Link>
          )}
          <ActionsGlobales />
        </div>
      </div>

      <SignalementsClient workspaceId={workspaceId} />

      {/* ── Upgrade banner (free, owners only) ── */}
      {!isPaid && !isMember && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 flex items-center justify-between gap-4 text-ink">
          <div>
            <div className="font-semibold text-sm">Passez à Solo, débloquez l&apos;IA, les factures et les relances</div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          label="Encours à encaisser"
          value={fmt(caToCollect)}
          point={overdueAmount > 0 ? "alerte" : "neutre"}
          trend={overdueAmount > 0 ? `dont ${fmt(overdueAmount)} en retard` : sentInvoices.length > 0 ? `${sentInvoices.length} facture${sentInvoices.length > 1 ? "s" : ""} envoyée${sentInvoices.length > 1 ? "s" : ""}` : "Aucune en attente"}
        />
        <KpiCard
          label="Devis en attente"
          value={fmt(pendingProposals.length > 0 ? totalDevisEnAttente : 0)}
          point="info"
          trend={pendingProposals.length > 0
            ? `${pendingProposals.length} devis, plus ancien ${oldestDevisAge} j`
            : "Aucun devis en cours"}
        />
        <KpiCard
          label="Encaissé ce mois"
          value={fmt(caThisMonth)}
          point="bon"
          trend={facturéThisMonth > caThisMonth
            ? `Facturé : ${fmt(facturéThisMonth)}`
            : new Date().toLocaleDateString("fr-FR", { month: "long" })}
        />
        <KpiCard
          label="Signés à facturer"
          value={fmt(toInvoice.length > 0 ? toInvoiceAmount : 0)}
          point="neutre"
          trend={toInvoice.length > 0
            ? `${toInvoice.length} devis prêt${toInvoice.length > 1 ? "s" : ""}`
            : "Tout est facturé"}
        />
      </div>

      {/* ── CA mois par mois et prochaine echeance ── */}
      {!isMember && (
        <div className="grid gap-5 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2 min-w-0">
            <CaMensuelBarres mensuelHt={caMensuelHt} moisCourant={now.getMonth()} annee={anneeCourante} />
          </div>
          <EcheanceCarte
            echeance={echeanceDepot}
            trimestre={currentQuarter + 1}
            caTrimestreHt={caTrimestreHt}
            annee={anneeCourante}
            cotisations={echeancesUrssaf ? cotisationsEstimees : null}
            acre={!!compteUrssaf?.acre}
          />
        </div>
      )}

      {/* ── Activité récente : devis + factures ── */}
      <div className={`grid gap-5 ${isPaid ? "lg:grid-cols-2" : ""}`}>

        {/* Devis récents */}
        <div className="carte overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold text-ink">Devis récents</h2>
                <p className="text-[14px] text-gray-400">Les quatre derniers</p>
              </div>
            <Link href="/proposals" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
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
            <div className="divide-y divide-ds-border">
              {recentProposals.map((proposal) => {
                const s   = PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.draft;
                const age = daysSince(proposal.created_at);
                return (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_minmax(110px,30%)_100px] items-center gap-3 mx-6 py-4 hover:opacity-80 transition-opacity group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink text-sm truncate">
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
                      <span className={`justify-self-start text-[13px] font-semibold px-3 py-1 rounded-full ${s.color}`}>{s.label}</span>
                      <span className="font-display font-semibold text-ink text-[15px] tabular-nums text-right justify-self-end">{fmt(proposal.total_ttc)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Factures récentes (Solo+) */}
        {isPaid && (
          <div className="carte overflow-hidden lg:order-first">
            <div className="px-6 pt-5 pb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold text-ink">Factures récentes</h2>
                <p className="text-[14px] text-gray-400">Les quatre dernières</p>
              </div>
              <Link href="/invoices" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
                Voir tout <ArrowRight size={11} />
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
              <div className="divide-y divide-ds-border">
                {recentInvoices.map((invoice) => {
                  const s         = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.draft;
                  const isOverdue = invoice.status === "sent" && invoice.due_date && new Date(invoice.due_date) < now;
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_minmax(110px,30%)_100px] items-center gap-3 mx-6 py-4 hover:opacity-80 transition-opacity group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink text-sm truncate">
                          {invoice.client_name || "-"}
                        </div>
                        <div className={`text-xs mt-0.5 truncate ${isOverdue ? "text-amber-400 font-medium" : "text-gray-400"}`}>
                          {invoice.invoice_number || "Facture"},{" "}
                          {isOverdue
                            ? `en retard depuis le ${new Date(invoice.due_date!).toLocaleDateString("fr-FR")}`
                            : invoice.due_date
                            ? `échéance ${new Date(invoice.due_date).toLocaleDateString("fr-FR")}`
                            : `créée le ${new Date(invoice.created_at).toLocaleDateString("fr-FR")}`}
                        </div>
                      </div>
                      <div className="contents">
                        <span className={`justify-self-start text-[13px] font-semibold px-3 py-1 rounded-full ${isOverdue ? "bg-amber-500/10 text-amber-400" : s.color}`}>
                          {isOverdue ? "En retard" : s.label}
                        </span>
                        <span className="font-display font-semibold text-ink text-[15px] tabular-nums text-right justify-self-end">{fmt(invoice.total_ttc)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Récap du CA encaissé, replié par défaut ── */}
      {/* Réservé au propriétaire : un collaborateur ne voit que ses propres
          documents, la somme n'aurait aucun sens comme récapitulatif de
          l'entreprise. Le total du trimestre et l'échéance restent lisibles
          sur la barre fermée ; le détail mois par mois s'ouvre au clic. */}
      {!isMember && (
        <details className="group carte overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none hover:bg-ds-elevated/40 transition-colors">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">
                {echeancesUrssaf ? "Récap CA, URSSAF" : "Récap chiffre d'affaires"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                T{currentQuarter + 1} en cours : <span className="text-gray-300 font-medium">{fmt(caTrimestreHt)} HT</span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {echeanceDepot && (
                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                  Dépôt {echeanceDepot}
                </span>
              )}
              <svg className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </summary>
          <div className="border-t border-ds-border">
            <CaUrssafWidget
              monthlyHT={caMensuelHt}
              currentMonth={now.getMonth()}
              currentYear={anneeCourante}
              echeancesUrssaf={echeancesUrssaf}
              bare
            />
          </div>
        </details>
      )}
    </div>

    <ProductTour isMember={isMember} />
    </>
  );
}
