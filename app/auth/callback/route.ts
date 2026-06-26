import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import { welcomeEmailHtml } from "@/lib/emails/welcome";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Envoi email de bienvenue (non bloquant)
      const fullName = data.user.user_metadata?.full_name ?? "";
      const email = data.user.email;

      if (email) {
        resend.emails.send({
          from: "noreply@getdeviso.fr",
          to: email,
          subject: "Bienvenue sur Deviso 👋",
          html: welcomeEmailHtml(fullName),
        }).catch((err) => {
          console.error("[Resend] Erreur envoi email bienvenue:", err);
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
