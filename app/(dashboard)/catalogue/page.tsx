import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId } from "@/lib/workspace";
import { CatalogueClient, type CatalogItem } from "./CatalogueClient";

export const dynamic = "force-dynamic";

/**
 * Page Services (catalogue), en rendu SERVEUR.
 *
 * Avant : la page etait entierement cliente et recuperait la liste via
 * `fetch('/api/catalog')` au montage (cascade HTML -> bundle JS -> requete).
 * Desormais la liste est lue cote serveur et passee en props : elle est deja
 * presente au premier rendu, sans cascade ni ecran de chargement.
 *
 * La requete calque EXACTEMENT celle de `GET /api/catalog` : meme client admin
 * (un membre doit lire le catalogue du proprietaire, hors RLS) et surtout le
 * meme filtre de portee `user_id = workspaceId`, qui est la garantie de
 * securite. Aucune autre logique n'est dupliquee : le gate Pro et les mutations
 * restent dans le composant client, inchanges.
 */
export default async function CataloguePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getWorkspaceUserId(user.id);

  const admin = createAdminClient();
  const { data } = await admin
    .from("service_catalog")
    .select("*")
    .eq("user_id", workspaceId)
    .order("name", { ascending: true });

  const initialItems = (data ?? []) as CatalogItem[];

  return <CatalogueClient initialItems={initialItems} />;
}
