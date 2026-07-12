import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Helpers date ─────────────────────────────────────────────────────────────
const now = new Date();
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
const tsAgo = (d: number) =>
  new Date(now.getTime() - d * 86400000).toISOString();

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seedDemoData(userId: string) {
  const admin = createAdminClient();

  // 1. Profile, Marie Durand, graphiste UX/UI, Studio Créatif MD, Pro
  // Utilise upsert (pas update) pour gérer le cas où le trigger Supabase
  // n'a pas encore créé la ligne profiles au moment de l'exécution.
  await admin
    .from("profiles")
    .upsert({
      id: userId,
      full_name: "Marie Durand",
      company_name: "Studio Créatif MD",
      siret: "82134756100018",
      address: "12 rue de la Paix, 75001 Paris",
      email: "marie@studiocreatimd.fr",
      phone: "06 12 34 56 78",
      plan: "pro",
      subscription_status: "active",
      tva_regime: "normal",
      proposal_color: "#6366f1",
      payment_method: "bank",
      bank_iban: "FR76 3000 6000 0112 3456 7890 189",
      bank_bic: "BNPAFRPPXXX",
      bank_account_name: "Studio Créatif MD",
      is_demo: true,
      reminder_intervals: [3, 7, 14],
      require_approval: false,
    }, { onConflict: "id" });

  const seller = {
    seller_name: "Marie Durand",
    seller_company: "Studio Créatif MD",
    seller_siren: "82134756100018",
    seller_address: "12 rue de la Paix, 75001 Paris",
    seller_tva_number: "FR82134756100",
  };

  // ── Clients récurrents ──────────────────────────────────────────────────────
  // 1. Agence Lumière (Sophie Martin), Lyon, client principal branding
  // 2. StartupX (Lucas Petit), Paris, consulting + maintenance
  // 3. Cabinet Martin & Associés (Pierre Bernard), Bordeaux, juridique
  // 4. Boutique Élégance (Camille Rousseau), Toulouse, e-commerce
  // 5. Mairie de Saint-Cloud (Thomas Lefebvre), B2G, Chorus Pro

  // 2. Catalogue de prestations (types fixed/hourly)
  await admin.from("service_catalog").insert([
    // ── Prestations à prix fixe ──
    {
      user_id: userId,
      name: "Création logo + charte graphique",
      description:
        "Logo vectoriel déclinable + charte complète (typographies, couleurs, règles d'usage). Livrable : fichiers sources AI/PDF + guide de marque.",
      unit: "forfait",
      unit_price: 1800,
      type: "fixed",
    },
    {
      user_id: userId,
      name: "Audit UX complet",
      description:
        "Analyse heuristique Nielsen, parcours utilisateur, rapport de recommandations priorisées. Délai : 5 jours ouvrés.",
      unit: "forfait",
      unit_price: 800,
      type: "fixed",
    },
    {
      user_id: userId,
      name: "Landing page complète",
      description:
        "Design + intégration HTML/CSS ou CMS (WordPress/Webflow). Responsive, SEO on-page optimisé. Délai : 5 jours ouvrés.",
      unit: "forfait",
      unit_price: 1500,
      type: "fixed",
    },
    {
      user_id: userId,
      name: "Maquettes Figma (wireframes → haute fidélité)",
      description:
        "Wireframes basse fidélité + maquettes haute fidélité desktop & mobile. Handoff Figma avec tokens de design.",
      unit: "forfait",
      unit_price: 1200,
      type: "fixed",
    },
    {
      user_id: userId,
      name: "Refonte UI site web",
      description:
        "Refonte complète identité visuelle web. De l'audit à la livraison des maquettes Figma. Inclut 2 cycles de révisions.",
      unit: "forfait",
      unit_price: 2000,
      type: "fixed",
    },
    {
      user_id: userId,
      name: "Droits de cession (web + print + réseaux)",
      description:
        "Cession des droits d'auteur pour exploitation web, print et réseaux sociaux. Durée illimitée, monde entier.",
      unit: "forfait",
      unit_price: 600,
      type: "fixed",
    },
    // ── Prestations horaires ──
    {
      user_id: userId,
      name: "Consulting UX / design",
      description:
        "Session de consulting : audit rapide, recommandations, revue de maquettes. Compte-rendu fourni sous 24h.",
      unit: "heure",
      unit_price: 150,
      type: "hourly",
    },
    {
      user_id: userId,
      name: "Formation design (intra-entreprise)",
      description:
        "Formation UX/UI pour équipes en présentiel ou distanciel. Supports de cours inclus. Minimum 4h.",
      unit: "heure",
      unit_price: 200,
      type: "hourly",
    },
    {
      user_id: userId,
      name: "Retouches et révisions",
      description:
        "Modifications sur livrables hors forfait. Facturation au temps réel. Délai de livraison : 48h.",
      unit: "heure",
      unit_price: 90,
      type: "hourly",
    },
  ]);

  // 3. Devis (proposals), mix de statuts pour showcaser toutes les features
  await admin.from("proposals").insert([
    // ── DEV-2026-001, Signé avec e-signature ────────────────────────────────
    {
      user_id: userId,
      created_by: userId,
      proposal_number: "DEV-2026-001",
      title: "Refonte identité visuelle complète, Agence Lumière",
      client_name: "Sophie Martin",
      client_email: "contact@agence-lumiere.fr",
      client_company: "Agence Lumière",
      client_address: "45 avenue des Arts, 69001 Lyon",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Création logo + charte graphique", quantity: 1, unit: "forfait", unit_price: 1800, total: 1800 },
        { id: crypto.randomUUID(), description: "Maquettes Figma (wireframes → haute fidélité)", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + print + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      total_ht: 4400, tva_rate: 20, total_ttc: 5280,
      status: "signed",
      valid_until: daysAgo(45),
      payment_terms: "30% à la commande, 70% à la livraison, Pénalités de retard : 3× taux légal (art. L441-10 C.Com.)",
      notes: "Livraison en 5 semaines. Inclut 2 cycles de révisions. Fichiers sources livrés à réception du solde.",
      share_token: crypto.randomUUID(),
      signed_at: tsAgo(52),
      signer_name: "Sophie Martin",
      viewed_at: tsAgo(58),
      reminder_count: 0,
      created_at: tsAgo(65),
      updated_at: tsAgo(52),
    },
    // ── DEV-2026-002, Signé B2G (Chorus Pro) ────────────────────────────────
    {
      user_id: userId,
      created_by: userId,
      proposal_number: "DEV-2026-002",
      title: "Audit UX + maquettes portail citoyen",
      client_name: "Thomas Lefebvre",
      client_email: "numerique@saint-cloud.fr",
      client_company: "Mairie de Saint-Cloud",
      client_address: "2 place Charles de Gaulle, 92210 Saint-Cloud",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet du portail citoyen", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Maquettes Figma (wireframes → haute fidélité)", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Consulting UX, Comité de pilotage (4 séances)", quantity: 4, unit: "heure", unit_price: 150, total: 600 },
      ],
      total_ht: 2600, tva_rate: 20, total_ttc: 3120,
      status: "signed",
      valid_until: daysAgo(28),
      payment_terms: "Paiement à 30 jours fin de mois, Facturation via Chorus Pro",
      notes: "Marché public. Numéro d'engagement : MP-2026-041.",
      share_token: crypto.randomUUID(),
      signed_at: tsAgo(46),
      signer_name: "Thomas Lefebvre",
      viewed_at: tsAgo(50),
      reminder_count: 0,
      created_at: tsAgo(56),
      updated_at: tsAgo(46),
    },
    // ── DEV-2026-003, Envoyé + relancé (showcase relances) ──────────────────
    {
      user_id: userId,
      created_by: userId,
      proposal_number: "DEV-2026-003",
      title: "Refonte UI site web + landing page",
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Refonte UI site web (8 pages clés)", quantity: 1, unit: "forfait", unit_price: 2000, total: 2000 },
        { id: crypto.randomUUID(), description: "Landing page complète (page acquisition)", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      total_ht: 4100, tva_rate: 20, total_ttc: 4920,
      status: "sent",
      valid_until: daysFromNow(12),
      payment_terms: "40% à la commande, 60% à la livraison, Pénalités : 3× taux légal",
      notes: "Délai de réalisation : 4 semaines. Hébergement non inclus.",
      share_token: crypto.randomUUID(),
      signed_at: null,
      signer_name: null,
      viewed_at: tsAgo(8),
      reminder_count: 1,
      last_reminder_sent_at: tsAgo(5),
      created_at: tsAgo(18),
      updated_at: tsAgo(5),
    },
    // ── DEV-2026-004, Vu (en attente de signature) ───────────────────────────
    {
      user_id: userId,
      created_by: userId,
      proposal_number: "DEV-2026-004",
      title: "Refonte e-commerce Boutique Élégance",
      client_name: "Camille Rousseau",
      client_email: "contact@boutique-elegance.fr",
      client_company: "Boutique Élégance",
      client_address: "22 rue du Commerce, 31000 Toulouse",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet boutique en ligne", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Refonte UI site web (12 pages clés)", quantity: 1, unit: "forfait", unit_price: 2000, total: 2000 },
        { id: crypto.randomUUID(), description: "Maquettes Figma desktop + mobile", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      total_ht: 4600, tva_rate: 20, total_ttc: 5520,
      status: "viewed",
      valid_until: daysFromNow(22),
      payment_terms: "30% à la commande, 40% mi-projet, 30% à la livraison",
      notes: "Intégration Shopify incluse. Délai : 6 semaines. Option maintenance disponible.",
      share_token: crypto.randomUUID(),
      signed_at: null,
      signer_name: null,
      viewed_at: tsAgo(3),
      reminder_count: 0,
      created_at: tsAgo(12),
      updated_at: tsAgo(3),
    },
    // ── DEV-2026-005, Brouillon (showcase draft) ────────────────────────────
    {
      user_id: userId,
      created_by: userId,
      proposal_number: "DEV-2026-005",
      title: "Formation UX/UI, 2 jours, Cabinet Martin",
      client_name: "Pierre Bernard",
      client_email: "contact@cabinetmartin.fr",
      client_company: "Cabinet Martin & Associés",
      client_address: "8 place de la Bourse, 33000 Bordeaux",
      items: [
        { id: crypto.randomUUID(), description: "Formation design intra-entreprise, 2 journées × 7h", quantity: 14, unit: "heure", unit_price: 200, total: 2800 },
        { id: crypto.randomUUID(), description: "Supports de cours personnalisés (création)", quantity: 1, unit: "forfait", unit_price: 400, total: 400 },
      ],
      total_ht: 3200, tva_rate: 20, total_ttc: 3840,
      status: "draft",
      valid_until: daysFromNow(30),
      payment_terms: "100% à la commande, Annulation possible jusqu'à J-7",
      notes: "Dates à confirmer. Présentiel à Bordeaux ou distanciel.",
      share_token: crypto.randomUUID(),
      signed_at: null,
      signer_name: null,
      viewed_at: null,
      reminder_count: 0,
      created_at: tsAgo(2),
      updated_at: tsAgo(2),
    },
  ]);

  // 4. Factures, 12 mois (juillet 2025 → juin 2026)
  //    Saisonnalité réaliste : été calme, rentrée forte, hiver modéré, printemps soutenu
  //    CA total ~34 000 € HT sur 12 mois (solo graphiste/UX Pro)
  await admin.from("invoices").insert([
    // ═══ H2 2025 ════════════════════════════════════════════════════════════

    // ── Juillet 2025, 1 800 € HT ─────────────────────────────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-001",
      ...seller,
      client_name: "Sophie Martin",
      client_email: "contact@agence-lumiere.fr",
      client_company: "Agence Lumière",
      client_address: "45 avenue des Arts, 69001 Lyon",
      items: [
        { id: crypto.randomUUID(), description: "Création logo + charte graphique", quantity: 1, unit: "forfait", unit_price: 1800, total: 1800 },
      ],
      total_ht: 1800, tva_rate: 20, total_ttc: 2160,
      status: "paid",
      issue_date: daysAgo(365), due_date: daysAgo(335),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(365), updated_at: tsAgo(336),
    },

    // ── Août 2025, 1 800 € HT (consulting) ───────────────────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-002",
      ...seller,
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Consulting UX / design, Juillet–Août 2025", quantity: 12, unit: "heure", unit_price: 150, total: 1800 },
      ],
      total_ht: 1800, tva_rate: 20, total_ttc: 2160,
      status: "paid",
      issue_date: daysAgo(335), due_date: daysAgo(305),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(335), updated_at: tsAgo(306),
    },

    // ── Septembre 2025, 2 000 € HT (audit + maquettes) ──────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-003",
      ...seller,
      client_name: "Pierre Bernard",
      client_email: "contact@cabinetmartin.fr",
      client_company: "Cabinet Martin & Associés",
      client_address: "8 place de la Bourse, 33000 Bordeaux",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet site cabinet", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Maquettes Figma (wireframes → haute fidélité)", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
      ],
      total_ht: 2000, tva_rate: 20, total_ttc: 2400,
      status: "paid",
      issue_date: daysAgo(305), due_date: daysAgo(275),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(305), updated_at: tsAgo(276),
    },
    // ── Septembre 2025, 1 500 € HT (landing page) ────────────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-004",
      ...seller,
      client_name: "Sophie Martin",
      client_email: "contact@agence-lumiere.fr",
      client_company: "Agence Lumière",
      client_address: "45 avenue des Arts, 69001 Lyon",
      items: [
        { id: crypto.randomUUID(), description: "Landing page complète (refonte page services)", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 },
      ],
      total_ht: 1500, tva_rate: 20, total_ttc: 1800,
      status: "paid",
      issue_date: daysAgo(290), due_date: daysAgo(260),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(290), updated_at: tsAgo(261),
    },

    // ── Octobre 2025, 2 600 € HT (refonte UI boutique) ───────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-005",
      ...seller,
      client_name: "Camille Rousseau",
      client_email: "contact@boutique-elegance.fr",
      client_company: "Boutique Élégance",
      client_address: "22 rue du Commerce, 31000 Toulouse",
      items: [
        { id: crypto.randomUUID(), description: "Refonte UI boutique en ligne (8 pages clés)", quantity: 1, unit: "forfait", unit_price: 2000, total: 2000 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      total_ht: 2600, tva_rate: 20, total_ttc: 3120,
      status: "paid",
      issue_date: daysAgo(274), due_date: daysAgo(244),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(274), updated_at: tsAgo(245),
    },
    // ── Octobre 2025, 2 000 € HT (refonte UI StartupX) ──────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-006",
      ...seller,
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Refonte UI site web StartupX (6 pages)", quantity: 1, unit: "forfait", unit_price: 2000, total: 2000 },
      ],
      total_ht: 2000, tva_rate: 20, total_ttc: 2400,
      status: "paid",
      issue_date: daysAgo(260), due_date: daysAgo(230),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(260), updated_at: tsAgo(231),
    },

    // ── Novembre 2025, 1 600 € HT (formation design) ─────────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-007",
      ...seller,
      client_name: "Sophie Martin",
      client_email: "contact@agence-lumiere.fr",
      client_company: "Agence Lumière",
      client_address: "45 avenue des Arts, 69001 Lyon",
      items: [
        { id: crypto.randomUUID(), description: "Formation design intra-entreprise, 8h", quantity: 8, unit: "heure", unit_price: 200, total: 1600 },
      ],
      total_ht: 1600, tva_rate: 20, total_ttc: 1920,
      status: "paid",
      issue_date: daysAgo(244), due_date: daysAgo(214),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(244), updated_at: tsAgo(215),
    },
    // ── Novembre 2025, 1 500 € HT (consulting Cabinet) ──────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-008",
      ...seller,
      client_name: "Pierre Bernard",
      client_email: "contact@cabinetmartin.fr",
      client_company: "Cabinet Martin & Associés",
      client_address: "8 place de la Bourse, 33000 Bordeaux",
      items: [
        { id: crypto.randomUUID(), description: "Consulting UX / design, Oct.–Nov. 2025", quantity: 10, unit: "heure", unit_price: 150, total: 1500 },
      ],
      total_ht: 1500, tva_rate: 20, total_ttc: 1800,
      status: "paid",
      issue_date: daysAgo(230), due_date: daysAgo(200),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(230), updated_at: tsAgo(201),
    },

    // ── Décembre 2025, 1 800 € HT (maquettes + droits) ──────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2025-009",
      ...seller,
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Maquettes Figma nouvelle app (wireframes → haute fidélité)", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      total_ht: 1800, tva_rate: 20, total_ttc: 2160,
      status: "paid",
      issue_date: daysAgo(213), due_date: daysAgo(183),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(213), updated_at: tsAgo(184),
    },

    // ═══ S1 2026 ════════════════════════════════════════════════════════════

    // ── Janvier 2026, 1 500 € HT (landing page Boutique) ─────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-001",
      ...seller,
      client_name: "Camille Rousseau",
      client_email: "contact@boutique-elegance.fr",
      client_company: "Boutique Élégance",
      client_address: "22 rue du Commerce, 31000 Toulouse",
      items: [
        { id: crypto.randomUUID(), description: "Landing page complète, Collection printemps 2026", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 },
      ],
      total_ht: 1500, tva_rate: 20, total_ttc: 1800,
      status: "paid",
      issue_date: daysAgo(180), due_date: daysAgo(150),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(180), updated_at: tsAgo(151),
    },

    // ── Février 2026, 1 700 € HT (audit + consulting Cabinet) ───────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-002",
      ...seller,
      client_name: "Pierre Bernard",
      client_email: "contact@cabinetmartin.fr",
      client_company: "Cabinet Martin & Associés",
      client_address: "8 place de la Bourse, 33000 Bordeaux",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet site cabinet (refonte partielle)", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Consulting UX / design, Suivi recommandations", quantity: 6, unit: "heure", unit_price: 150, total: 900 },
      ],
      total_ht: 1700, tva_rate: 20, total_ttc: 2040,
      status: "paid",
      issue_date: daysAgo(149), due_date: daysAgo(119),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(149), updated_at: tsAgo(120),
    },

    // ── Mars 2026, 3 500 € HT (refonte UI + landing Agence) ──────────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-003",
      ...seller,
      client_name: "Sophie Martin",
      client_email: "contact@agence-lumiere.fr",
      client_company: "Agence Lumière",
      client_address: "45 avenue des Arts, 69001 Lyon",
      items: [
        { id: crypto.randomUUID(), description: "Refonte UI site web Agence Lumière", quantity: 1, unit: "forfait", unit_price: 2000, total: 2000 },
        { id: crypto.randomUUID(), description: "Landing page complète (page cas clients)", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 },
      ],
      total_ht: 3500, tva_rate: 20, total_ttc: 4200,
      status: "paid",
      issue_date: daysAgo(120), due_date: daysAgo(90),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(120), updated_at: tsAgo(91),
    },

    // ── Avril 2026, 2 200 € HT (formation + consulting StartupX) ─────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-004",
      ...seller,
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Formation design intra-entreprise, 8h", quantity: 8, unit: "heure", unit_price: 200, total: 1600 },
        { id: crypto.randomUUID(), description: "Consulting UX / design, Workshop produit", quantity: 4, unit: "heure", unit_price: 150, total: 600 },
      ],
      total_ht: 2200, tva_rate: 20, total_ttc: 2640,
      status: "paid",
      issue_date: daysAgo(90), due_date: daysAgo(60),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(90), updated_at: tsAgo(61),
    },

    // ── Mai 2026, 1 800 € HT (maquettes + droits Boutique) ───────────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-005",
      ...seller,
      client_name: "Camille Rousseau",
      client_email: "contact@boutique-elegance.fr",
      client_company: "Boutique Élégance",
      client_address: "22 rue du Commerce, 31000 Toulouse",
      items: [
        { id: crypto.randomUUID(), description: "Maquettes Figma collection été, desktop + mobile", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      total_ht: 1800, tva_rate: 20, total_ttc: 2160,
      status: "paid",
      issue_date: daysAgo(60), due_date: daysAgo(30),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(60), updated_at: tsAgo(31),
    },
    // ── Mai 2026, 2 600 € HT, B2G Mairie Saint-Cloud (Chorus Pro) ───────
    {
      user_id: userId,
      invoice_number: "FAC-2026-006",
      ...seller,
      client_name: "Thomas Lefebvre",
      client_email: "numerique@saint-cloud.fr",
      client_company: "Mairie de Saint-Cloud",
      client_address: "2 place Charles de Gaulle, 92210 Saint-Cloud",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX portail citoyen", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Maquettes Figma portail citoyen (wireframes → haute fidélité)", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Consulting UX, Comité de pilotage (4 séances)", quantity: 4, unit: "heure", unit_price: 150, total: 600 },
      ],
      total_ht: 2600, tva_rate: 20, total_ttc: 3120,
      status: "paid",
      issue_date: daysAgo(55), due_date: daysAgo(25),
      payment_terms: "30 jours fin de mois, Chorus Pro",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      chorus_pro_ref: "CHR-2026-0048372",
      chorus_pro_submitted_at: tsAgo(55),
      reminder_count: 0,
      created_at: tsAgo(55), updated_at: tsAgo(26),
    },

    // ── Juin 2026, 1 800 € HT, payée (logo client référencé) ───────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-007",
      ...seller,
      client_name: "Sophie Martin",
      client_email: "contact@agence-lumiere.fr",
      client_company: "Agence Lumière",
      client_address: "45 avenue des Arts, 69001 Lyon",
      items: [
        { id: crypto.randomUUID(), description: "Création logo + charte graphique (client référencé Agence Lumière)", quantity: 1, unit: "forfait", unit_price: 1800, total: 1800 },
      ],
      total_ht: 1800, tva_rate: 20, total_ttc: 2160,
      status: "paid",
      issue_date: daysAgo(22), due_date: daysAgo(8),
      payment_terms: "14 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(22), updated_at: tsAgo(2),
    },
    // ── Juin 2026, 660 € HT, envoyée en retard (showcase relances) ──────
    {
      user_id: userId,
      invoice_number: "FAC-2026-008",
      ...seller,
      client_name: "Pierre Bernard",
      client_email: "contact@cabinetmartin.fr",
      client_company: "Cabinet Martin & Associés",
      client_address: "8 place de la Bourse, 33000 Bordeaux",
      items: [
        { id: crypto.randomUUID(), description: "Retouches et révisions, Charte graphique", quantity: 4, unit: "heure", unit_price: 90, total: 360 },
        { id: crypto.randomUUID(), description: "Consulting UX, Bilan semestriel", quantity: 2, unit: "heure", unit_price: 150, total: 300 },
      ],
      total_ht: 660, tva_rate: 20, total_ttc: 792,
      status: "sent",
      issue_date: daysAgo(18), due_date: daysAgo(4), // échéance dépassée → relance active
      payment_terms: "14 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 1,
      last_reminder_sent_at: tsAgo(3),
      created_at: tsAgo(18), updated_at: tsAgo(3),
    },
    // ── Juin 2026, acompte 30% envoyé (showcase feature acompte) ─────────
    {
      user_id: userId,
      invoice_number: "AC-2026-001",
      ...seller,
      client_name: "Camille Rousseau",
      client_email: "contact@boutique-elegance.fr",
      client_company: "Boutique Élégance",
      client_address: "22 rue du Commerce, 31000 Toulouse",
      items: [
        { id: crypto.randomUUID(), description: "Refonte e-commerce Boutique Élégance, Acompte 30%", quantity: 1, unit: "forfait", unit_price: 1380, total: 1380 },
      ],
      total_ht: 1380, tva_rate: 20, total_ttc: 1656,
      status: "sent",
      issue_date: daysAgo(10), due_date: daysFromNow(20),
      payment_terms: "30 jours net",
      invoice_type: "acompte", deposit_percentage: 30,
      type_code: "380", operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: tsAgo(10), updated_at: tsAgo(10),
    },
    // ── Juin 2026, brouillon maintenance récurrente ──────────────────────
    {
      user_id: userId,
      invoice_number: "FAC-2026-009",
      ...seller,
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Maintenance et support technique, Juin 2026", quantity: 1, unit: "forfait", unit_price: 400, total: 400 },
      ],
      total_ht: 400, tva_rate: 20, total_ttc: 480,
      status: "draft",
      issue_date: daysAgo(0), due_date: daysFromNow(30),
      payment_terms: "30 jours net",
      invoice_type: "standard", type_code: "380",
      operation_category: "services", payment_on_debit: false,
      reminder_count: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  ]);

  // 5. Membres d'équipe
  await admin.from("team_members").insert([
    {
      owner_id: userId,
      email: "thomas.petit@studiocreatimd.fr",
      role: "member",
      status: "accepted",
      invited_at: tsAgo(45),
      accepted_at: tsAgo(43),
      invite_token: crypto.randomUUID(),
    },
    {
      owner_id: userId,
      email: "emma.bernard@studiocreatimd.fr",
      role: "member",
      status: "accepted",
      invited_at: tsAgo(20),
      accepted_at: tsAgo(19),
      invite_token: crypto.randomUUID(),
    },
  ]);

  // 6. Facture récurrente (maintenance StartupX)
  await admin.from("recurring_invoices").insert([
    {
      user_id: userId,
      client_name: "Lucas Petit",
      client_email: "hello@startupx.io",
      client_company: "StartupX",
      client_address: "12 rue du Faubourg, 75011 Paris",
      items: [
        { id: crypto.randomUUID(), description: "Maintenance et support technique mensuel", quantity: 1, unit: "forfait", unit_price: 400, total: 400 },
      ],
      tva_rate: 20,
      payment_terms: "30 jours net",
      notes: "Contrat de maintenance signé le 01/01/2026",
      interval: "monthly",
      day_of_month: 1,
      next_billing_date: daysFromNow(2),
      active: true,
    },
  ]);

  // 7. Modèles de devis (alignés sur le catalogue)
  await admin.from("proposal_templates").insert([
    {
      user_id: userId,
      created_by: userId,
      name: "Identité visuelle complète",
      description: "Audit + logo + charte + maquettes + droits. Modèle standard mission de branding.",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Création logo + charte graphique", quantity: 1, unit: "forfait", unit_price: 1800, total: 1800 },
        { id: crypto.randomUUID(), description: "Maquettes Figma (wireframes → haute fidélité)", quantity: 1, unit: "forfait", unit_price: 1200, total: 1200 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + print + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      tva_rate: 20,
      payment_terms: "30% à la commande, 70% à la livraison, Pénalités : 3× taux légal",
      notes: "Inclut 2 cycles de révisions. Délai : 5 semaines.",
    },
    {
      user_id: userId,
      created_by: userId,
      name: "Refonte site web complète",
      description: "Audit → refonte UI → landing page. Sites vitrines et sites d'entreprise.",
      items: [
        { id: crypto.randomUUID(), description: "Audit UX complet", quantity: 1, unit: "forfait", unit_price: 800, total: 800 },
        { id: crypto.randomUUID(), description: "Refonte UI site web", quantity: 1, unit: "forfait", unit_price: 2000, total: 2000 },
        { id: crypto.randomUUID(), description: "Landing page complète (page d'acquisition)", quantity: 1, unit: "forfait", unit_price: 1500, total: 1500 },
        { id: crypto.randomUUID(), description: "Droits de cession (web + réseaux)", quantity: 1, unit: "forfait", unit_price: 600, total: 600 },
      ],
      tva_rate: 20,
      payment_terms: "40% à la commande, 60% à la livraison",
      notes: "Délai : 4 semaines. Hébergement et nom de domaine non inclus.",
    },
    {
      user_id: userId,
      created_by: userId,
      name: "Accompagnement mensuel UX/design",
      description: "Consulting + retouches. Pour startups et équipes produit.",
      items: [
        { id: crypto.randomUUID(), description: "Consulting UX / design, Sessions mensuelles", quantity: 8, unit: "heure", unit_price: 150, total: 1200 },
        { id: crypto.randomUUID(), description: "Retouches et révisions, Livrables du mois", quantity: 4, unit: "heure", unit_price: 90, total: 360 },
      ],
      tva_rate: 20,
      payment_terms: "Paiement mensuel, Préavis 1 mois",
      notes: "Engagement minimum 3 mois. Sessions en visio ou présentiel Paris.",
    },
  ]);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  // ── Rate limit : 3 démos par IP par heure ────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: rateRows } = await admin
    .from("demo_rate_limits")
    .select("count")
    .eq("ip", ip)
    .gte("window_start", oneHourAgo);

  const totalAttempts = (rateRows ?? []).reduce((sum, r) => sum + (r.count ?? 1), 0);

  if (totalAttempts >= 3) {
    return NextResponse.json(
      { error: "Trop de démos lancées depuis cette adresse. Réessayez dans une heure." },
      { status: 429 }
    );
  }

  // Enregistrer cette tentative
  await admin
    .from("demo_rate_limits")
    .insert({ ip, window_start: new Date().toISOString(), count: 1 })
    .then(() => {
      // Nettoyage des entrées > 2h en arrière-plan
      admin
        .from("demo_rate_limits")
        .delete()
        .lt("window_start", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .then(() => {});
    });

  // Générer un email unique pour le compte démo
  const demoId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const demoEmail = `demo_${demoId}@deviso.internal`;
  const demoPassword = crypto.randomUUID(); // mot de passe aléatoire unique, usage unique

  // Créer le compte avec mot de passe (nécessaire pour le sign-in direct)
  const { data: newUser, error: createError } =
    await admin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { is_demo: true, full_name: "Marie Durand" },
    });

  if (createError || !newUser.user) {
    console.error("[demo/start] createUser:", createError);
    return NextResponse.json(
      { error: "Impossible de créer le compte démo" },
      { status: 500 }
    );
  }

  const userId = newUser.user.id;

  // Seed les données
  try {
    await seedDemoData(userId);
  } catch (e: any) {
    console.error("[demo/start] seedDemoData:", e);
  }

  // Sign-in via REST API pour obtenir les tokens JWT
  const signInRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    }
  );

  if (!signInRes.ok) {
    const errText = await signInRes.text();
    return NextResponse.json(
      { error: `Sign-in démo échoué: ${errText}` },
      { status: 500 }
    );
  }

  const { access_token, refresh_token } = await signInRes.json();

  return NextResponse.json({ access_token, refresh_token });
}
