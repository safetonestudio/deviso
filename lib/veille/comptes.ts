import type { createAdminClient } from "@/lib/supabase/admin";
import { deleteDemoAccount } from "@/lib/demo-cleanup";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Comptes de démonstration jetables pour la veille quotidienne.
 *
 * Créés directement (et non par /api/demo/start) : pas de limite par IP, pas de
 * jeu de données de 1 200 lignes à semer, et un profil réduit à ce que les
 * chemins contrôlés exigent. `is_demo: true` : aucun courriel, aucun dépôt chez
 * un tiers ne peut en partir (lib/resend.ts, lib/garde-demo.ts), et la purge
 * des démonstrations les efface si la veille n'a pas pu le faire elle-même.
 */
export type CompteJetable = { userId: string; email: string; cookie: string };

const projet = () => new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0];

export async function creerCompteJetable(admin: Admin, nom: string): Promise<CompteJetable> {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const email = `demo_${id}_veille@deviso.internal`;
  const motDePasse = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { is_demo: true, full_name: nom },
  });
  if (error || !data.user) throw new Error(`création du compte jetable : ${error?.message ?? "sans réponse"}`);
  const userId = data.user.id;
  const { error: eProfil } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: nom,
      company_name: nom,
      siret: "82134756100018",
      address: "1 rue du Banc, 33000 Bordeaux",
      address_street: "1 rue du Banc",
      address_postcode: "33000",
      address_city: "Bordeaux",
      address_country: "FR",
      email: "veille@example.fr",
      plan: "pro",
      subscription_status: "active",
      tva_regime: "franchise",
      statut_juridique: "micro",
      is_demo: true,
      demo_last_seen_at: new Date().toISOString(),
      require_approval: false,
      // Sans moyen de paiement, la création de facture est refusée (403).
      payment_method: "bank",
      bank_iban: "FR76 3000 6000 0112 3456 7890 189",
      bank_bic: "BNPAFRPPXXX",
      bank_account_name: nom,
    },
    { onConflict: "id" },
  );
  if (eProfil) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`profil du compte jetable : ${eProfil.message}`);
  }

  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
    body: JSON.stringify({ email, password: motDePasse }),
  });
  if (!r.ok) {
    await deleteDemoAccount(admin, userId);
    throw new Error(`connexion du compte jetable : HTTP ${r.status}`);
  }
  const { access_token, refresh_token } = await r.json();
  // Même cookie que celui que pose le client Supabase du navigateur (voir scripts/e2e/lib.mjs).
  const session = {
    access_token,
    refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  const cookie = `sb-${projet()}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  return { userId, email, cookie };
}

export async function supprimerComptes(admin: Admin, comptes: (CompteJetable | null)[]): Promise<string[]> {
  const echecs: string[] = [];
  for (const c of comptes) {
    if (!c) continue;
    const r = await deleteDemoAccount(admin, c.userId);
    if (!r.deleted) echecs.push(`${c.userId} : ${r.reason ?? "inconnu"}`);
  }
  return echecs;
}
