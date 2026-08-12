import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { SyncButton } from "./SyncButton";

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

  const [{ data: raccordement }, { data: factures }] = await Promise.all([
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

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">Factures reçues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Les factures électroniques que vos fournisseurs vous adressent via la Plateforme Agréée.
          </p>
        </div>
        {raccorde && <SyncButton derniere={raccordement?.last_sync_at ?? null} />}
      </div>

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
        <section className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden mt-6">
          <div className="overflow-x-auto">
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
                  const enRetard =
                    f.payment_due_date && new Date(f.payment_due_date) < new Date() &&
                    f.last_status_code !== "fr:212";
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
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/superpdp/invoices/${f.id}/download`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
                        >
                          Télécharger
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
