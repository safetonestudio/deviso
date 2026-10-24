import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Pilotage" };
export const dynamic = "force-dynamic";

type Ligne = {
  user_id: string;
  email: string | null;
  entreprise: string | null;
  plan: string | null;
  abonnement: string | null;
  inscrit_le: string | null;
  derniere_connexion: string | null;
  nb_devis: number;
  nb_factures: number;
  nb_erreurs_pa: number;
  raccordement: string | null;
  nb_achats_bloques: number;
};

const date = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const FORMULE: Record<string, string> = { free: "Sans abonnement", solo: "Solo", pro: "Pro" };

const ABONNEMENT: Record<string, { texte: string; ton: string }> = {
  active: { texte: "Payant", ton: "text-emerald-400" },
  trialing: { texte: "Essai", ton: "text-amber-400" },
  past_due: { texte: "Impayé", ton: "text-red-400" },
  canceled: { texte: "Résilié", ton: "text-gray-400" },
};

/**
 * Pilotage : que font les utilisateurs de Deviso, compte par compte.
 *
 * Reserve aux adresses ADMIN_EMAILS. Un autre compte recoit une 404, pas un
 * refus : l'existence de la page n'a pas a etre revelee. Ne montre que des
 * compteurs et des etats, jamais le contenu d'un devis ou d'une facture, qui
 * appartient aux clients de nos utilisateurs.
 */
export default async function Pilotage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!estAdmin(user.email)) notFound();

  const { data, error } = await createAdminClient().rpc("admin_pilotage");
  const lignes = (data ?? []) as Ligne[];

  const payants = lignes.filter((l) => l.abonnement === "active").length;
  const essais = lignes.filter((l) => l.abonnement === "trialing").length;
  const raccordes = lignes.filter((l) => l.raccordement === "verified").length;
  const alertes = lignes.filter((l) => l.nb_erreurs_pa + l.nb_achats_bloques > 0).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Pilotage</h1>
        <p className="text-sm text-gray-400 mt-1">
          Comptes réels uniquement (démos exclues). Compteurs et états seulement, jamais le contenu des documents.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4">Lecture impossible : {error.message}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          ["Comptes", lignes.length],
          ["Payants", payants],
          ["En essai", essais],
          ["Raccordés PA", raccordes],
          ["Avec alerte", alertes],
        ].map(([libelle, valeur]) => (
          <div key={libelle as string} className="bg-ds-surface border border-ds-border rounded-xl p-4">
            <p className="text-xs text-gray-400">{libelle}</p>
            <p className="text-2xl font-semibold text-white tabular-nums mt-1">{valeur}</p>
          </div>
        ))}
      </div>

      <div className="bg-ds-surface border border-ds-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ds-border text-left">
              <th className="px-4 py-3 font-medium text-gray-400">Compte</th>
              <th className="px-4 py-3 font-medium text-gray-400">Formule</th>
              <th className="px-4 py-3 font-medium text-gray-400">Inscrit</th>
              <th className="px-4 py-3 font-medium text-gray-400">Dernière connexion</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">Devis</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">Factures</th>
              <th className="px-4 py-3 font-medium text-gray-400">Plateforme Agréée</th>
              <th className="px-4 py-3 font-medium text-gray-400">Alertes</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              const ab = l.abonnement ? ABONNEMENT[l.abonnement] : undefined;
              return (
                <tr key={l.user_id} className="border-b border-ds-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <span className="text-white">{l.entreprise || "Sans nom"}</span>
                    <span className="block text-xs text-gray-500">{l.email}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {FORMULE[l.plan ?? "free"] ?? l.plan}
                    {ab && <span className={`block text-xs ${ab.ton}`}>{ab.texte}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{date(l.inscrit_le)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{date(l.derniere_connexion)}</td>
                  <td className="px-4 py-3 text-gray-300 text-right tabular-nums">{l.nb_devis}</td>
                  <td className="px-4 py-3 text-gray-300 text-right tabular-nums">{l.nb_factures}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l.raccordement === "verified" ? (
                      <span className="text-emerald-400">Raccordé</span>
                    ) : l.raccordement ? (
                      <span className="text-amber-400">En cours</span>
                    ) : (
                      <span className="text-gray-500">Non raccordé</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l.nb_erreurs_pa + l.nb_achats_bloques === 0 ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <span className="text-red-400">
                        {l.nb_erreurs_pa > 0 && `${l.nb_erreurs_pa} facture(s) en erreur`}
                        {l.nb_erreurs_pa > 0 && l.nb_achats_bloques > 0 && ", "}
                        {l.nb_achats_bloques > 0 && `${l.nb_achats_bloques} achat(s) bloqué(s)`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
