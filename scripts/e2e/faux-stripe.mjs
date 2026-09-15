/**
 * Un faux Stripe, pour traverser ce qu'un vrai Stripe ne laisserait pas traverser.
 *
 * Le tunnel d'abonnement ne pouvait pas être vérifié : le compte est en mode
 * réel, et prouver qu'un changement de formule MODIFIE l'abonnement au lieu
 * d'en créer un second supposait un abonnement vivant, donc un débit. Les
 * traversées s'arrêtaient donc à la porte, et c'est précisément derrière cette
 * porte que se trouvait le défaut : un client Solo qui passait à Pro repartait
 * avec deux abonnements facturés en parallèle.
 *
 * Ce serveur implémente les seuls endpoints que Deviso appelle, en mémoire. Il
 * ne simule pas Stripe : il en imite la forme des réponses et, surtout, il
 * ENREGISTRE chaque appel reçu. C'est le journal des appels qui fait la preuve
 * — « a-t-on appelé subscriptions.update, ou checkout.sessions.create ? » est
 * une question à laquelle aucune relecture de code ne répond avec certitude.
 *
 * Usage : node scripts/e2e/faux-stripe.mjs [port]
 *   GET /_journal    → tous les appels reçus depuis le démarrage
 *   POST /_etat      → installe un état de départ (clients, abonnements)
 *   POST /_raz       → vide le journal et l'état
 */

import { createServer } from "node:http";

const PORT = Number(process.argv[2] ?? 12111);

/** État en mémoire. */
let clients = new Map();
let abonnements = new Map();
let journal = [];
let compteur = 0;

const id = (prefixe) => `${prefixe}_${(++compteur).toString().padStart(6, "0")}`;

/** Le corps d'une requête Stripe est du form-urlencoded, parfois imbriqué. */
function parseCorps(texte) {
  const plat = {};
  for (const [k, v] of new URLSearchParams(texte)) plat[k] = v;
  return plat;
}

function json(res, code, objet) {
  const corps = JSON.stringify(objet);
  res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(corps) });
  res.end(corps);
}

function erreur(res, code, message, type = "invalid_request_error") {
  return json(res, code, { error: { type, message } });
}

/** Un abonnement au format que le SDK attend. */
function formerAbonnement(sub) {
  return {
    id: sub.id,
    object: "subscription",
    customer: sub.customer,
    status: sub.status,
    trial_end: sub.trial_end ?? null,
    cancel_at_period_end: false,
    metadata: sub.metadata ?? {},
    items: {
      object: "list",
      data: sub.items.map((a) => ({
        id: a.id,
        object: "subscription_item",
        quantity: a.quantity,
        price: { id: a.price, object: "price", recurring: { interval: "month" } },
      })),
      has_more: false,
      url: `/v1/subscription_items?subscription=${sub.id}`,
    },
  };
}

const serveur = createServer((req, res) => {
  let corps = "";
  req.on("data", (c) => (corps += c));
  req.on("end", () => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const chemin = url.pathname;
    const params = req.method === "POST" ? parseCorps(corps) : Object.fromEntries(url.searchParams);

    // ── Contrôle du banc ────────────────────────────────────────────────
    if (chemin === "/_journal") return json(res, 200, { journal });
    if (chemin === "/_raz") {
      clients = new Map(); abonnements = new Map(); journal = []; compteur = 0;
      return json(res, 200, { ok: true });
    }
    if (chemin === "/_etat") {
      const etat = JSON.parse(corps || "{}");
      for (const c of etat.clients ?? []) clients.set(c.id, c);
      for (const s of etat.abonnements ?? []) abonnements.set(s.id, s);
      return json(res, 200, { clients: clients.size, abonnements: abonnements.size });
    }

    journal.push({ methode: req.method, chemin, params, at: Date.now() });

    // ── customers ───────────────────────────────────────────────────────
    if (chemin === "/v1/customers" && req.method === "POST") {
      const c = { id: id("cus"), object: "customer", email: params.email ?? null, metadata: {} };
      clients.set(c.id, c);
      return json(res, 200, c);
    }
    const mCus = chemin.match(/^\/v1\/customers\/([^/]+)$/);
    if (mCus && req.method === "GET") {
      const c = clients.get(mCus[1]);
      if (!c) return erreur(res, 404, `No such customer: '${mCus[1]}'`);
      return json(res, 200, c);
    }

    // ── subscriptions ───────────────────────────────────────────────────
    const mSub = chemin.match(/^\/v1\/subscriptions\/([^/]+)$/);
    if (mSub && req.method === "GET") {
      const s = abonnements.get(mSub[1]);
      if (!s) return erreur(res, 404, `No such subscription: '${mSub[1]}'`);
      return json(res, 200, formerAbonnement(s));
    }
    if (mSub && req.method === "POST") {
      const s = abonnements.get(mSub[1]);
      if (!s) return erreur(res, 404, `No such subscription: '${mSub[1]}'`);
      // items[0][id] + items[0][price] : remplacement d'un article
      const articleId = params["items[0][id]"];
      const nouveauPrix = params["items[0][price]"];
      if (articleId && nouveauPrix) {
        const a = s.items.find((x) => x.id === articleId);
        if (!a) return erreur(res, 400, `No such subscription item: '${articleId}'`);
        a.price = nouveauPrix;
      }
      if (params["metadata[target_plan]"]) {
        s.metadata = { ...(s.metadata ?? {}), target_plan: params["metadata[target_plan]"] };
      }
      return json(res, 200, formerAbonnement(s));
    }

    // ── subscription_items ──────────────────────────────────────────────
    if (chemin === "/v1/subscription_items" && req.method === "POST") {
      const s = abonnements.get(params.subscription);
      if (!s) return erreur(res, 404, `No such subscription: '${params.subscription}'`);
      const a = { id: id("si"), price: params.price, quantity: Number(params.quantity ?? 1) };
      s.items.push(a);
      return json(res, 200, { id: a.id, object: "subscription_item", quantity: a.quantity, price: { id: a.price } });
    }
    const mItem = chemin.match(/^\/v1\/subscription_items\/([^/]+)$/);
    if (mItem && req.method === "POST") {
      for (const s of abonnements.values()) {
        const a = s.items.find((x) => x.id === mItem[1]);
        if (a) {
          if (params.quantity !== undefined) a.quantity = Number(params.quantity);
          if (params.price) a.price = params.price;
          return json(res, 200, { id: a.id, object: "subscription_item", quantity: a.quantity, price: { id: a.price } });
        }
      }
      return erreur(res, 404, `No such subscription item: '${mItem[1]}'`);
    }
    if (mItem && req.method === "DELETE") {
      for (const s of abonnements.values()) {
        const i = s.items.findIndex((x) => x.id === mItem[1]);
        if (i >= 0) {
          s.items.splice(i, 1);
          return json(res, 200, { id: mItem[1], object: "subscription_item", deleted: true });
        }
      }
      return erreur(res, 404, `No such subscription item: '${mItem[1]}'`);
    }

    // ── checkout ────────────────────────────────────────────────────────
    if (chemin === "/v1/checkout/sessions" && req.method === "POST") {
      const sid = id("cs");
      return json(res, 200, {
        id: sid,
        object: "checkout.session",
        url: `https://faux-stripe.local/c/pay/${sid}`,
        customer: params.customer ?? null,
        mode: params.mode,
        metadata: {},
      });
    }

    // ── portail ─────────────────────────────────────────────────────────
    if (chemin === "/v1/billing_portal/sessions" && req.method === "POST") {
      const sid = id("bps");
      return json(res, 200, { id: sid, object: "billing_portal.session", url: `https://faux-stripe.local/p/${sid}` });
    }

    return erreur(res, 404, `Unrecognized request URL (${req.method}: ${chemin}).`);
  });
});

serveur.listen(PORT, "127.0.0.1", () => {
  console.log(`faux-stripe écoute sur http://127.0.0.1:${PORT}`);
});
