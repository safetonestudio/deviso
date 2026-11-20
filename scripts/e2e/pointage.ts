/**
 * Relance de pointage (20/11/2026) : demander au titulaire si une facture
 * échue a été payée, pour que la déclaration d'encaissement ne dépende plus
 * de sa mémoire.
 *
 * 1. Règles (pures) : on simule des semaines de passages quotidiens du cron.
 * 2. Courriel : contenu, accents, liens, échappement.
 * 3. Chemin réel : facture échue créée par l'API, « pas encore » posé par la
 *    route, relu par l'API, puis « payée », puis la route refuse.
 *
 * Lancer : npx -y tsx scripts/e2e/pointage.ts
 * (E2E_BASE_URL=http://localhost:3000 pour viser un serveur local)
 */
import { openSession, anonymous, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

(async () => {
  const { pointageDu, sansReponse, construirePointage, estAPointer, MAX_DEMANDES, lienPointage } = await import("@/lib/pointage-paiement");
  type F = Parameters<typeof pointageDu>[0];

  const base = (o: Partial<F> = {}): F => ({
    id: "00000000-0000-0000-0000-000000000001",
    invoice_number: "F-2026-042",
    status: "sent",
    invoice_type: "standard",
    due_date: "2026-10-01",
    total_ttc: 1200,
    client_name: "Jean <b>Client</b>",
    client_company: null,
    superpdp_invoice_id: null,
    pointage_demande_at: null,
    pointage_demande_nb: 0,
    pointage_pas_encore_at: null,
    ...o,
  });
  const jour = (iso: string, h = 8) => new Date(`${iso}T${String(h).padStart(2, "0")}:00:00Z`);

  /** Simule le cron chaque jour à 9 h (Paris) ; `reponses` : jour → « pas encore ». */
  function simuler(f: F, debut: string, jours: number, reponses: string[] = []): string[] {
    const envois: string[] = [];
    const d = jour(debut);
    for (let i = 0; i < jours; i++) {
      const iso = d.toISOString().slice(0, 10);
      if (reponses.includes(iso)) f.pointage_pas_encore_at = new Date(`${iso}T07:30:00Z`).toISOString();
      if (pointageDu(f, d)) {
        envois.push(iso);
        f.pointage_demande_at = d.toISOString();
        f.pointage_demande_nb = (f.pointage_demande_nb ?? 0) + 1;
      }
      if (pointageDu(f, d)) envois.push(`DOUBLON ${iso}`);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return envois;
  }

  console.log("── Règles ───────────────────────────────────────────────────");
  verifier("pas de question le jour de l'échéance", !pointageDu(base(), jour("2026-10-01")));
  verifier("première question le lendemain de l'échéance", pointageDu(base(), jour("2026-10-02")));
  verifier("pas de question avant l'échéance", !pointageDu(base(), jour("2026-09-20")));
  verifier("jamais sur une facture payée", !pointageDu(base({ status: "paid" }), jour("2026-10-10")));
  verifier("jamais sur un brouillon", !pointageDu(base({ status: "draft" }), jour("2026-10-10")));
  verifier("jamais sur un avoir", !pointageDu(base({ invoice_type: "avoir" }), jour("2026-10-10")));
  verifier("jamais sans échéance", !pointageDu(base({ due_date: null }), jour("2026-10-10")));

  const sansRep = simuler(base(), "2026-09-25", 90);
  verifier(
    `sans réponse : une question par semaine, ${MAX_DEMANDES} au plus, aucun doublon`,
    sansRep.length === MAX_DEMANDES && !sansRep.some((x) => x.startsWith("DOUBLON")) && sansRep[0] === "2026-10-02" && sansRep[1] === "2026-10-09",
    sansRep.join(", ")
  );
  const avecRep = simuler(base(), "2026-09-25", 30, ["2026-10-05"]);
  verifier(
    "« pas encore » le 05/10 repousse la question suivante au 12/10",
    avecRep[0] === "2026-10-02" && avecRep[1] === "2026-10-12",
    avecRep.join(", ")
  );

  // Heure de Paris : le 1er au soir en UTC est déjà le 2 à Paris.
  verifier("échéance jugée à l'heure de Paris", estAPointer(base(), new Date("2026-10-01T22:30:00Z")));

  console.log("");
  console.log("── Signal cabinet ───────────────────────────────────────────");
  const maint = jour("2026-10-20");
  verifier("une seule question : pas encore « sans réponse »", !sansReponse(base({ pointage_demande_nb: 1, pointage_demande_at: "2026-10-02T07:00:00Z" }), maint));
  verifier("deux questions sans réponse : signal", sansReponse(base({ pointage_demande_nb: 2, pointage_demande_at: "2026-10-09T07:00:00Z" }), maint));
  verifier("deux questions, « pas encore » après la dernière : pas de signal", !sansReponse(base({ pointage_demande_nb: 2, pointage_demande_at: "2026-10-09T07:00:00Z", pointage_pas_encore_at: "2026-10-10T07:00:00Z" }), maint));
  verifier("deux questions, « pas encore » avant la dernière : signal", sansReponse(base({ pointage_demande_nb: 2, pointage_demande_at: "2026-10-16T07:00:00Z", pointage_pas_encore_at: "2026-10-05T07:00:00Z" }), maint));

  console.log("");
  console.log("── Courriel ─────────────────────────────────────────────────");
  const un = construirePointage([base()], { prenom: "Camille Martin", base: "https://getdeviso.fr", maintenant: maint });
  verifier("objet à une facture", un.sujet === "Facture F-2026-042 échue · a-t-elle été payée ?", un.sujet);
  verifier("salue par le prénom", un.html.includes("Bonjour Camille,"));
  verifier("nom du client échappé", un.html.includes("Jean &lt;b&gt;Client&lt;/b&gt;") && !un.html.includes("<b>Client</b>"));
  verifier("lien « payée »", un.html.includes(lienPointage("https://getdeviso.fr", base().id, "payee")) && un.texte.includes("?pointage=payee"));
  verifier("lien « pas encore »", un.html.includes("?pointage=pas-encore") && un.texte.includes("?pointage=pas-encore"));
  verifier("retard affiché (19 jours)", un.html.includes("19 jours"));
  verifier("montant en euros", /1\s?200,00\s?€/.test(un.html));
  verifier("non transmise : parle du livre des recettes", un.html.includes("livre des recettes") && !un.html.includes("administration"));
  const tr = construirePointage([base({ superpdp_invoice_id: "x" })], { prenom: null, base: "https://getdeviso.fr", maintenant: maint });
  verifier("transmise : explique la déclaration d'encaissement", tr.html.includes("déclare l'encaissement à l'administration"));
  verifier("sans prénom : « Bonjour, »", tr.html.includes("Bonjour,"));
  const douze = construirePointage(Array.from({ length: 12 }, (_, i) => base({ id: `id-${i}`, invoice_number: `F-${i}` })), { prenom: null, base: "https://getdeviso.fr", maintenant: maint });
  verifier("plusieurs : objet au pluriel", douze.sujet === "12 factures échues à pointer · ont-elles été payées ?", douze.sujet);
  verifier("au plus 10 affichées, le reste renvoie à la liste", douze.html.includes("F-9") && !douze.html.includes("F-10 ") && douze.html.includes("Et 2 autres"));
  const CADRATIN = String.fromCharCode(0x2014);
  verifier("ni tiret cadratin ni emoji", ![un, tr, douze].some((m) => (m.sujet + m.html + m.texte).includes(CADRATIN) || /[\u{1F300}-\u{1FAFF}]/u.test(m.sujet + m.html + m.texte)));

  // ── 3. Chemin réel ─────────────────────────────────────────────────────
  console.log("");
  console.log("── Chemin réel : facture échue, « pas encore », relecture ───");
  const doc = (o: unknown) => JSON.stringify(o);
  const owner = await openSession("pointage");
  const cree = await owner.call("/api/invoices", {
    method: "POST",
    body: doc({
      client_name: "Client Pointage", client_email: "pointage@example.fr", client_company: "Pointage SARL",
      client_street: "3 rue des Tests", client_postcode: "33000", client_city: "Bordeaux", client_siren: "552100554",
      seller_company: "Studio Témoin", seller_siren: "103340857",
      seller_street: "1 rue Vendeur", seller_postcode: "33170", seller_city: "Gradignan",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 500, total: 500 }],
      total_ht: 500, tva_rate: 0, total_ttc: 500,
      issue_date: "2026-09-01", due_date: "2026-10-01",
      operation_category: "services", type_code: "380", invoice_type: "standard",
    }),
  });
  const id = cree.body?.invoice?.id;
  verifier("facture créée", !!id, `HTTP ${cree.status} ${JSON.stringify(cree.body).slice(0, 160)}`);

  const brouillon = await owner.call(`/api/invoices/${id}/pas-encore`, { method: "POST" });
  verifier("« pas encore » refusé sur un brouillon", brouillon.status === 404, `HTTP ${brouillon.status}`);

  await owner.call(`/api/invoices/${id}`, { method: "PATCH", body: doc({ status: "sent" }) });
  const lue = (await owner.call(`/api/invoices/${id}`)).body?.invoice;
  verifier("la facture envoyée et échue est « à pointer »", !!lue && estAPointer(lue, new Date()), `statut ${lue?.status}, échéance ${lue?.due_date}`);
  verifier("colonnes de pointage présentes à la relecture", lue && "pointage_demande_nb" in lue && "pointage_pas_encore_at" in lue);

  const anon = await anonymous.call(`/api/invoices/${id}/pas-encore`, { method: "POST" });
  verifier("anonyme : refusé", anon.status === 401, `HTTP ${anon.status}`);

  const membre = await openSession("pointage-membre");
  await linkAsTeamMember(owner, membre);
  const parMembre = await membre.call(`/api/invoices/${id}/pas-encore`, { method: "POST" });
  verifier("membre d'équipe : refusé (pointer est un acte du titulaire)", parMembre.status === 403, `HTTP ${parMembre.status}`);

  const autre = await openSession("pointage-autre");
  const parAutre = await autre.call(`/api/invoices/${id}/pas-encore`, { method: "POST" });
  verifier("autre espace : introuvable", parAutre.status === 404, `HTTP ${parAutre.status}`);

  const pe = await owner.call(`/api/invoices/${id}/pas-encore`, { method: "POST" });
  verifier("titulaire : « pas encore » enregistré", pe.status === 200 && !!pe.body?.invoice?.pointage_pas_encore_at, `HTTP ${pe.status}`);
  const relue = (await owner.call(`/api/invoices/${id}`)).body?.invoice;
  verifier("relu par l'API de la facture", !!relue?.pointage_pas_encore_at && relue.status === "sent");

  const paye = await owner.call(`/api/invoices/${id}`, { method: "PATCH", body: doc({ status: "paid", paid_at: "2026-10-15", payment_mode: "virement" }) });
  verifier("puis marquée payée avec sa date", paye.status === 200 && paye.body?.invoice?.paid_at?.startsWith("2026-10-15"), `HTTP ${paye.status}`);
  const apres = await owner.call(`/api/invoices/${id}/pas-encore`, { method: "POST" });
  verifier("« pas encore » refusé sur une facture payée", apres.status === 404, `HTTP ${apres.status}`);
  verifier("une facture payée n'est plus à pointer", !estAPointer(paye.body?.invoice ?? { status: "paid", invoice_type: null, due_date: null }, new Date()));

  console.log("");
  process.exit(bilan() > 0 ? 1 : 0);
})();
