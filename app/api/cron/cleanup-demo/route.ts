import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Supprime les comptes démo de plus de 2h
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Lister tous les utilisateurs (Supabase ne filtre pas par email côté admin)
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("[cleanup-demo] listUsers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const demoUsers = (data.users ?? []).filter(
    (u) =>
      u.email?.endsWith("@deviso.internal") &&
      u.created_at < cutoff
  );

  let deleted = 0;
  for (const u of demoUsers) {
    // Supprimer données liées (au cas où pas de cascade)
    await admin.from("proposals").delete().eq("user_id", u.id);
    await admin.from("invoices").delete().eq("user_id", u.id);
    await admin.from("team_members").delete().eq("owner_id", u.id);
    await admin.from("recurring_invoices").delete().eq("user_id", u.id);
    // Supprimer le compte auth (cascade sur profiles)
    const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
    if (!delErr) deleted++;
  }

  console.log(`[cleanup-demo] supprimé ${deleted}/${demoUsers.length} comptes démo`);
  return NextResponse.json({ deleted, total: demoUsers.length });
}
