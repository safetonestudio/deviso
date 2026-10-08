import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { PaiementsClient } from "./PaiementsClient";

export const dynamic = "force-dynamic";

/**
 * Page Paiements clients, en rendu SERVEUR.
 *
 * Avant : page cliente qui faisait fetch('/api/profile') au montage pour
 * initialiser le formulaire. Desormais le profil est lu cote serveur et passe
 * en props, le formulaire est rempli des le premier rendu (plus d'ecran
 * d'attente). La requete calque EXACTEMENT GET /api/profile : meme client SSR
 * (RLS), meme filtre id = user.id. Les mutations restent cote client, inchangees.
 */
export default async function PaiementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <PaiementsClient initialProfile={(profile ?? {}) as Partial<Profile>} />;
}
