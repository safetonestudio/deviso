import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import {
  SUPERPDP_API,
  exchangeCode,
  getConnection,
  saveConnection,
  superpdpConfig,
} from "@/lib/superpdp";
import { pousserRegimeTva } from "@/lib/superpdp-entreprise";

const SETTINGS = "/profil";

function back(req: NextRequest, params: Record<string, string>) {
  const url = new URL(SETTINGS, process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = NextResponse.redirect(url);
  for (const name of ["superpdp_state", "superpdp_verifier", "superpdp_uid"]) {
    res.cookies.set(name, "", { path: "/api/superpdp", maxAge: 0 });
  }
  return res;
}

/** Retour du tunnel d'autorisation Super PDP. */
export async function GET(req: NextRequest) {
  const cfg = superpdpConfig();
  if (!cfg) return back(req, { superpdp: "indisponible" });

  const q = req.nextUrl.searchParams;

  // L'utilisateur a refusé, ou Super PDP a renvoyé une erreur.
  const oauthError = q.get("error");
  if (oauthError) {
    return back(req, {
      superpdp: "erreur",
      detail: q.get("error_description") ?? oauthError,
    });
  }

  const code = q.get("code");
  const state = q.get("state");
  const expectedState = req.cookies.get("superpdp_state")?.value;
  const verifier = req.cookies.get("superpdp_verifier")?.value;
  const cookieUid = req.cookies.get("superpdp_uid")?.value;

  // Ces quatre cas échouaient sous un seul message, « la demande a expiré ou
  // n'a pas pu être vérifiée ». Ils n'ont pourtant ni la même cause ni le même
  // remède, et l'utilisateur ne pouvait pas savoir lequel le concernait : on a
  // passé un test à supposer une expiration là où le tunnel avait peut-être
  // simplement été ouvert deux fois. On les distingue.
  if (!code || !state) {
    // Retour sans code d'autorisation : tunnel interrompu, ou fermé avant la
    // dernière étape.
    return back(req, { superpdp: "interrompu" });
  }
  if (!expectedState || !verifier) {
    // Nos cookies ne sont plus là : la fenêtre de 30 minutes est passée.
    return back(req, { superpdp: "expire" });
  }
  if (state !== expectedState) {
    // Le state ne correspond pas au dernier tunnel ouvert. En pratique :
    // « Reconnecter » cliqué deux fois, et c'est le premier onglet qui revient.
    return back(req, { superpdp: "double" });
  }

  // On revalide la session : le cookie prouve l'origine de la requête, pas
  // l'identité. Sans cela, un lien de callback rejoué raccorderait l'entreprise
  // de la victime au compte Super PDP de l'attaquant.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return back(req, { superpdp: "session_perdue" });

  const workspaceId = await getWorkspaceUserId(user.id);
  if (cookieUid && cookieUid !== workspaceId) {
    return back(req, { superpdp: "erreur", detail: "Compte différent de celui du raccordement." });
  }

  try {
    const tokens = await exchangeCode(code, verifier);
    if (!tokens.refresh_token) {
      throw new Error("Super PDP n'a pas renvoyé de refresh token.");
    }

    // Récupération de l'entreprise raccordée. Un 403 ici est normal : Super PDP
    // vérifie le rattachement utilisateur/entreprise en différé.
    let companyId: string | null = null;
    let companyNumber: string | null = null;
    let companyNumberScheme: string | null = null;
    let status: "pending" | "verified" | "error" = "pending";

    const entetes = {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
    };

    const me = await fetch(`${SUPERPDP_API}/companies/me`, { headers: entetes, cache: "no-store" });
    if (me.ok) {
      const body = await me.json().catch(() => null);
      companyId = body?.id != null ? String(body.id) : (body?.company?.id ?? null);
      // Le numéro d'entreprise, distinct de l'identifiant interne. C'est lui que
      // la vérification de session compare au BT-30 de nos factures ; sans le
      // conserver ici, on émettait avec le SIREN du profil et l'émission était
      // refusée dès que les deux divergeaient. Voir SuperPdpConnection.
      companyNumber = body?.number != null ? String(body.number) : null;
      companyNumberScheme = body?.number_scheme != null ? String(body.number_scheme) : null;
    }

    // Le statut se LIT, il ne se déduit pas d'un 200.
    //
    // On posait `verified` dès que `/companies/me` répondait. C'était une
    // inférence : toute autre cause de non-200 — réseau, 500 — devenait
    // silencieusement « vérification en cours », avec `last_error` effacé. La
    // personne lisait « Super PDP vérifie… » pour une panne technique.
    //
    // `GET /oauth2_sessions/me` est la source d'autorité, et elle distingue ce
    // qu'un 403 confond : entreprise en revue, entreprise refusée, identité pas
    // encore vérifiée par l'utilisateur lui-même.
    const sessionRes = await fetch(`${SUPERPDP_API}/oauth2_sessions/me`, {
      headers: entetes,
      cache: "no-store",
    });
    if (sessionRes.ok) {
      const etat = (await sessionRes.json().catch(() => null)) as {
        company_verification_status?: "verified" | "needs_review" | "failed";
        user_identity_verification_status?: "verified" | "needs_review" | "failed" | "not_verified";
      } | null;
      if (etat?.company_verification_status) {
        status =
          etat.company_verification_status === "verified"
            ? "verified"
            : etat.company_verification_status === "failed"
              ? "error"
              : "pending";
      }
    } else if (me.ok) {
      // Repli sur l'ancienne inférence : si la fiche entreprise répond, la
      // session est au moins utilisable. Mieux que de rester bloqué en attente.
      status = "verified";
    }

    // Adresse de réception. C'est la seule information du raccordement qui
    // intéresse l'utilisateur : c'est ce qu'il communique à ses clients.
    // On écarte la ligne suffixée `_replyto`, adresse technique de retour pour
    // les messages de cycle de vie — l'afficher ferait croire à deux adresses.
    let directoryAddress: string | null = null;
    let directoryId: string | null = null;
    if (status === "verified") {
      const annuaire = await fetch(`${SUPERPDP_API}/directory_entries`, {
        headers: entetes,
        cache: "no-store",
      });
      if (annuaire.ok) {
        const body = await annuaire.json().catch(() => null);
        const ligne = (body?.data ?? []).find(
          (e: { is_replyto?: boolean }) => !e.is_replyto
        );
        if (ligne) {
          directoryAddress = ligne.identifier ?? null;
          directoryId = ligne.id != null ? String(ligne.id) : null;
        }
      }
    }

    // Rebranchement sur une AUTRE entreprise : les curseurs de synchronisation
    // ne veulent plus rien dire.
    //
    // `last_invoice_id` et `last_event_id` sont des bornes « ne me redonne rien
    // en dessous ». Rebrancher sans les remettre à zéro fait donc sauter, en
    // silence et définitivement, toutes les factures de la nouvelle entreprise
    // dont l'identifiant est inférieur à la borne héritée de l'ancienne —
    // c'est-à-dire l'antériorité complète d'une entreprise qui utilisait déjà
    // la Plateforme Agréée avant de passer par Deviso. Un débranchement suivi
    // d'un rebranchement efface la ligne et n'a pas ce problème ; refaire le
    // tunnel sans débrancher, ce que fait tout le monde, l'a.
    const ancien = await getConnection(workspaceId).catch(() => null);
    const changeEntreprise =
      Boolean(ancien?.company_id) && Boolean(companyId) && ancien!.company_id !== companyId;

    await saveConnection(workspaceId, {
      ...(changeEntreprise
        ? { last_invoice_id: null, last_event_id: null, last_sync_at: null }
        : {}),
      refresh_token: tokens.refresh_token,
      company_id: companyId,
      company_number: companyNumber,
      company_number_scheme: companyNumberScheme,
      directory_id: directoryId,
      directory_address: directoryAddress,
      session_status: status,
      last_error: null,
      connected_at: new Date().toISOString(),
      // On garde le jeton d'accès qu'on vient d'obtenir. Sans cela, le tout
      // premier appel d'API rafraîchirait immédiatement — donc ferait tourner
      // le refresh token — alors qu'on en a un tout neuf, valable 30 minutes.
      access_token: tokens.access_token,
      access_token_expires_at: new Date(
        Date.now() + (tokens.expires_in ?? 1800) * 1000
      ).toISOString(),
    });

    // Régime de TVA : à pousser dès le raccordement, sinon la première facture
    // B2C du client sera refusée sans qu'il comprenne pourquoi. Ce réglage
    // n'existe que par l'API — ni son interface Super PDP ni la nôtre ne le
    // montrent. Best-effort : un échec ne doit pas casser un raccordement qui
    // vient d'aboutir, et le prochain enregistrement de profil rattrapera.
    if (status === "verified") {
      const { data: profil } = await supabase
        .from("profiles")
        .select("tva_regime, tva_periodicite")
        .eq("id", workspaceId)
        .maybeSingle();
      if (profil) {
        const r = await pousserRegimeTva(workspaceId, profil);
        if (!r.ok && r.raison !== "inconnu") {
          console.error(`[superpdp/callback] régime de TVA non transmis : ${r.raison}`);
        }
      }
    }

    return back(req, { superpdp: status === "verified" ? "connecte" : "en_attente" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[superpdp/callback]", message);
    return back(req, { superpdp: "erreur", detail: message.slice(0, 200) });
  }
}
