import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { SyncButton } from "./SyncButton";
import { BoutonRefus } from "./BoutonRefus";

export const metadata: Metadata = { title: "Factures reçues" };
export const dynamic = "force-dynamic";

/**
 * Statuts de cycle de vie, tableau 8 du dossier de spécifications externes de
 * la DGFiP, version 3.2 du 30/04/2026.
 *
 * ⚠️ Cette table a d'abord été écrite de mémoire, et elle était décalée d'un
 * cran à partir du code 204. Une facture **refusée** (210) s'affichait
 * « Paiement transmis ». Recopiée depuis le document officiel le 12/08/2026 :
 * ne pas la modifier sans rouvrir ce document.
 *
 * `obligatoire` reprend la colonne « Caractère » : quatre statuts seulement le
 * sont — 200 et 213 posés par les plateformes, 210 par le destinataire, 212 par
 * le fournisseur.
 */
const STATUTS: Record<
  string,
  { texte: string; ton: "neutre" | "attention" | "bien"; obligatoire?: boolean }
> = {
  "fr:200": { texte: "Déposée", ton: "neutre", obligatoire: true },
  "fr:201": { texte: "Émise par la plateforme", ton: "neutre" },
  "fr:202": { texte: "Reçue par la plateforme", ton: "neutre" },
  "fr:203": { texte: "Mise à disposition", ton: "neutre" },
  "fr:204": { texte: "Prise en charge", ton: "neutre" },
  "fr:205": { texte: "Approuvée", ton: "bien" },
  "fr:206": { texte: "Approuvée partiellement", ton: "attention" },
  "fr:207": { texte: "En litige", ton: "attention" },
  "fr:208": { texte: "Suspendue", ton: "attention" },
  "fr:209": { texte: "Complétée", ton: "neutre" },
  "fr:210": { texte: "Refusée", ton: "attention", obligatoire: true },
  "fr:211": { texte: "Paiement transmis", ton: "neutre" },
  "fr:212": { texte: "Encaissée", ton: "bien", obligatoire: true },
  "fr:213": { texte: "Rejetée", ton: "attention", obligatoire: true },
};

const euros = (v: number | null, devise: string | null) =>
  v === null
    ? "—"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise || "EUR" }).format(v);

const jour = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/**
 * Une facture est-elle réellement en retard de paiement ?
 *
 * L'échéance dépassée ne suffit pas. Une facture **encaissée** (212) est payée,
 * et une facture **refusée** (210) ou **rejetée** (213) est annulée — le
 * fournisseur doit passer un avoir. Les afficher en rouge réclamerait un
 * paiement pour des factures qui n'ont plus lieu d'être payées, et noierait les
 * vrais retards au milieu.
 *
 * Constaté sur une capture de Selim : une facture refusée gardait son échéance
 * en rouge.
 */
const CLOTUREES = new Set(["fr:210", "fr:212", "fr:213"]);

function estEnRetard(f: { payment_due_date: string | null; last_status_code: string | null }) {
  if (!f.payment_due_date) return false;
  if (f.last_status_code && CLOTUREES.has(f.last_status_code)) return false;
  return new Date(f.payment_due_date) < new Date();
}

type Facture = {
  id: number;
  number: string | null;
  issue_date: string | null;
  payment_due_date: string | null;
  seller_name: string | null;
  total_with_vat: number | null;
  currency_code: string | null;
  last_status_code: string | null;
  received_at: string | null;
};

export default async function FacturesRecues() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  // Quelle entreprise regarde-t-on, au juste.
  //
  // Le 29/08/2026, Selim a cherché pendant deux heures des factures reçues qui
  // existaient bel et bien — sur son compte. Son navigateur était connecté au
  // compte fournisseur, dont la boîte est vide par construction. Rien sur
  // l'écran ne permettait de s'en apercevoir : l'adresse d'annuaire s'affichait
  // bien, mais `0225:315143296_57700` et `..._57701` ne se distinguent que par
  // un chiffre, et aucun humain ne retient ça.
  //
  // Une page qui montre le contenu d'un compte doit dire de quel compte il
  // s'agit. C'est vrai pour quiconque a un compte de test à côté du sien.
  const profil = await getWorkspaceProfile<{ company_name: string | null }>(
    workspaceId,
    "company_name"
  );
  const nomCompte = profil?.company_name?.trim() || user.email || "compte sans nom";

  const [{ data: raccordement }, { data: factures, error: erreurLecture }] = await Promise.all([
    admin
      .from("superpdp_connections")
      .select("session_status, directory_address, last_sync_at")
      .eq("user_id", workspaceId)
      .maybeSingle(),
    // Seules les entrantes : les sortantes sont déjà dans « Factures », les
    // afficher ici ferait doublon et brouillerait le sens de la page.
    supabase
      .from("superpdp_invoices")
      .select("id, number, issue_date, payment_due_date, seller_name, total_with_vat, currency_code, last_status_code, received_at")
      .eq("direction", "in")
      .order("issue_date", { ascending: false, nullsFirst: false })
      .limit(200),
  ]);

  const raccorde = raccordement?.session_status === "verified";
  const liste = (factures ?? []) as Facture[];

  // Cadre commun des pages de liste — `max-w-5xl mx-auto`, aligné sur
  // « Factures » qui sert de référence. Ici seule la largeur était posée : sans
  // `mx-auto` la page se collait à gauche pendant que les voisines étaient
  // centrées.
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">Factures reçues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Les factures électroniques que vos fournisseurs vous adressent via la Plateforme Agréée.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Compte affiché :{" "}
            <span className="text-gray-300 font-medium">{nomCompte}</span>
            {user.email && nomCompte !== user.email && (
              <span className="text-gray-600"> · {user.email}</span>
            )}
          </p>
        </div>
        {raccorde && <SyncButton derniere={raccordement?.last_sync_at ?? null} />}
      </div>

      {/* L'adresse de réception n'était visible que sur l'écran vide. C'est
          pourtant l'information qu'un fournisseur demande, et on la demande
          justement quand on a déjà des factures — pas quand on n'en a aucune.
          Elle reste donc affichée en permanence, sélectionnable d'un geste. */}
      {raccorde && raccordement?.directory_address && (
        <p className="text-xs text-gray-500 mt-3">
          Vos fournisseurs vous adressent leurs factures à{" "}
          <span className="font-mono text-gray-300 select-all">
            {raccordement.directory_address}
          </span>
        </p>
      )}

      {!raccorde ? (
        // Pas de tableau vide trompeur : sans raccordement, l'absence de
        // factures ne veut pas dire qu'on n'en a pas reçu — elle veut dire
        // qu'on ne peut pas en recevoir. Ce n'est pas la même information.
        <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">Vous n&apos;êtes pas encore raccordé</p>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            À partir du 1ᵉʳ septembre 2026, toutes les entreprises doivent pouvoir recevoir des
            factures électroniques. Le raccordement se fait depuis vos paramètres.
          </p>
          <a
            href="/profil"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Aller aux paramètres
          </a>
        </section>
      ) : erreurLecture ? (
        // Une lecture qui échoue affichait « Aucune facture reçue » : le même
        // repli silencieux que celui qui numérotait toutes les factures 001.
        // Une panne doit se voir, sinon elle se lit comme une absence — et une
        // absence de factures reçues, sous la réforme, se lit comme « rien à
        // payer ». Il n'y a pas de repli acceptable ici.
        <section className="bg-ds-surface border border-red-500/30 rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">
            Impossible de lire vos factures reçues
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Vous en avez peut-être. Cette page n&apos;a pas pu les charger, alors elle ne
            prétend pas que vous n&apos;en avez aucune. Réessayez dans un instant ; si le
            problème persiste, signalez-le avec ce détail&nbsp;:
          </p>
          <p className="mt-3 text-xs font-mono text-red-400/90 break-all max-w-md mx-auto">
            {erreurLecture.message}
          </p>
        </section>
      ) : liste.length === 0 ? (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-6 mt-6 text-center">
          <p className="text-white font-medium mb-1">Aucune facture reçue pour l&apos;instant</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Vos fournisseurs peuvent vous adresser leurs factures à l&apos;adresse{" "}
            <span className="font-mono text-gray-400 select-all">
              {raccordement?.directory_address ?? "—"}
            </span>
            .
          </p>
        </section>
      ) : (
        <>
          {/* ── Téléphone : une carte par facture ───────────────────────────
              Le tableau à sept colonnes débordait et imposait un défilement
              horizontal. Constaté par Selim sur son téléphone : le bouton
              « Télécharger » n'était atteignable qu'en faisant glisser, donc
              seulement par quelqu'un qui savait déjà qu'il existait. Une action
              qu'on ne trouve qu'en connaissant son existence n'existe pas.

              L'ordre des informations suit celui du regard : qui m'écrit,
              combien, pour quand. Le numéro de facture passe en dernier — il ne
              sert qu'à retrouver la pièce, jamais à décider. */}
          <section className="lg:hidden space-y-3 mt-6">
            {liste.map((f) => {
              const statut = f.last_status_code ? STATUTS[f.last_status_code] : undefined;
              const enRetard = estEnRetard(f);
              return (
                <article
                  key={f.id}
                  className="bg-ds-surface border border-ds-border rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{f.seller_name ?? "—"}</p>
                      <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
                        {f.number ?? "—"}
                      </p>
                    </div>
                    <p className="text-white font-semibold whitespace-nowrap shrink-0">
                      {euros(f.total_with_vat, f.currency_code)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        statut?.ton === "bien"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : statut?.ton === "attention"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-ds-elevated text-gray-400"
                      }`}
                    >
                      {statut?.texte ?? f.last_status_code ?? "—"}
                    </span>
                    <span className={enRetard ? "text-red-400 font-medium" : "text-gray-500"}>
                      {enRetard ? "En retard depuis le" : "Échéance"} {jour(f.payment_due_date)}
                    </span>
                  </div>

                  {/* Pleine largeur : c'est la seule action de la carte, et le
                      pouce doit la trouver sans viser. */}
                  <a
                    href={`/api/superpdp/invoices/${f.id}/download`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border border-ds-border text-indigo-400 text-sm font-semibold hover:bg-ds-elevated transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Télécharger la facture
                  </a>

                  <div className="mt-2 text-center">
                    <BoutonRefus
                      factureId={f.id}
                      fournisseur={f.seller_name ?? "ce fournisseur"}
                      dejaRefusee={f.last_status_code === "fr:210"}
                    />
                  </div>
                </article>
              );
            })}
          </section>

          {/* ── Ordinateur : tableau ─────────────────────────────────────── */}
          <section className="hidden lg:block bg-ds-surface border border-ds-border rounded-xl overflow-hidden mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ds-border text-left">
                  <th className="px-4 py-3 font-medium text-gray-400">Fournisseur</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Numéro</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Émise le</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Échéance</th>
                  <th className="px-4 py-3 font-medium text-gray-400 text-right">Montant TTC</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {liste.map((f) => {
                  const statut = f.last_status_code ? STATUTS[f.last_status_code] : undefined;
                  const enRetard = estEnRetard(f);
                  return (
                    <tr key={f.id} className="border-b border-ds-border last:border-0 hover:bg-ds-elevated/40">
                      <td className="px-4 py-3 text-white font-medium">{f.seller_name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{f.number ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400">{jour(f.issue_date)}</td>
                      <td className={`px-4 py-3 ${enRetard ? "text-red-400 font-medium" : "text-gray-400"}`}>
                        {jour(f.payment_due_date)}
                      </td>
                      <td className="px-4 py-3 text-white text-right whitespace-nowrap">
                        {euros(f.total_with_vat, f.currency_code)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            statut?.ton === "bien"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : statut?.ton === "attention"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-ds-elevated text-gray-400"
                          }`}
                        >
                          {/* Un code inconnu s'affiche tel quel plutôt que
                              « Inconnu » : leur nomenclature évolue, et un code
                              brut reste consultable, contrairement à un mot
                              vide de sens. */}
                          {statut?.texte ?? f.last_status_code ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={`/api/superpdp/invoices/${f.id}/download`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
                          >
                            Télécharger
                          </a>
                          <BoutonRefus
                            factureId={f.id}
                            fournisseur={f.seller_name ?? "ce fournisseur"}
                            dejaRefusee={f.last_status_code === "fr:210"}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
