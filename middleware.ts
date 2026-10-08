import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  // Detect custom subdomain requests (e.g. monagence.getdeviso.fr)
  // Skip auth logic entirely, these are public-facing proposal views
  const isSubdomain =
    hostname.endsWith(".getdeviso.fr") &&
    !hostname.startsWith("www.") &&
    hostname !== "getdeviso.fr";

  if (isSubdomain) {
    // Let all subdomain traffic through untouched
    return NextResponse.next();
  }

  // Le chemin demandé, transmis aux composants serveur.
  //
  // Il l'était par `supabaseResponse.headers.set("x-pathname", …)`, tout en bas
  // de cette fonction. C'est un en-tête de RÉPONSE : il partait vers le
  // navigateur, on peut le lire dans l'onglet réseau, et n'atteignait jamais
  // le serveur. `headers().get("x-pathname")` dans `app/(dashboard)/layout.tsx`
  // valait donc TOUJOURS la chaîne vide, et les deux gardes qui en dépendent
  // étaient inertes :
  //
  //   - la restriction des pages sensibles pour un collaborateur invité
  //     (`/billing`, `/paiements`, `/stats`, `/crm`) ne se déclenchait jamais ;
  //   - le test « suis-je déjà sur /onboarding ? » était toujours vrai.
  //
  // Pour transmettre un en-tête au rendu serveur, il faut le poser sur la
  // REQUÊTE au moment de construire la réponse. C'est ce que fait
  // `NextResponse.next({ request: { headers } })`, et rien d'autre.
  const enTetes = new Headers(request.headers);
  enTetes.set("x-pathname", request.nextUrl.pathname);

  // Pages PUBLIQUES (marketing, blog, SEO, legal) : aucun utilisateur connecte
  // n'a besoin d'y etre rafraichi, et aucune redirection d'auth ne s'y applique.
  // On evite donc l'appel reseau `supabase.auth.getUser()` (gain de TTFB, qui
  // compte pour le referencement de ces pages). On continue malgre tout a poser
  // `x-pathname` sur la requete.
  //
  // Choix "fail-safe" VOLONTAIRE : on ENUMERE les pages publiques a sauter, on
  // ne devine PAS l'inverse. Toute route non listee (donc toute route app,
  // connue ou AJOUTEE plus tard) continue de passer par getUser, et garde ainsi
  // le rafraichissement de session et le gating. Oublier d'ajouter une page
  // publique ne coute qu'un peu de latence, jamais la securite d'une page app.
  const chemin = request.nextUrl.pathname;
  const prefixesPublics = [
    "/blog",
    "/combien-facturer",
    "/freelance-",
    "/a-propos",
    "/conformite",
    "/cgu",
    "/confidentialite",
    "/mentions-legales",
    "/forgot-password",
    "/reset-password",
  ];
  const estPagePublique =
    chemin === "/" || prefixesPublics.some((p) => chemin.startsWith(p));
  if (estPagePublique) {
    return NextResponse.next({ request: { headers: enTetes } });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: enTetes } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // On reconstruit les en-têtes à partir de la requête, qui porte
          // maintenant les cookies rafraîchis, et on y remet le chemin.
          // Réutiliser `enTetes` figé plus haut renverrait les anciens cookies
          // au rendu, et la session paraîtrait expirée un chargement sur deux.
          const enTetesAJour = new Headers(request.headers);
          enTetesAJour.set("x-pathname", request.nextUrl.pathname);
          supabaseResponse = NextResponse.next({ request: { headers: enTetesAJour } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protéger les routes dashboard
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/proposals");

  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rediriger les utilisateurs connectés hors des pages auth
  const isAuthRoute = ["/login", "/signup"].includes(request.nextUrl.pathname);
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|p/).*)" ],
};
