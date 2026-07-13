export type ProposalStatus = "draft" | "sent" | "viewed" | "signed" | "declined";

export interface TimeEntry {
  id: string;
  user_id: string;
  description: string;
  date: string;
  hours: number;
  hourly_rate: number;
  client_name: string | null;
  client_email: string | null;
  billed: boolean;
  invoice_id: string | null;
  created_at: string;
}
export type TvaRegime = "franchise" | "normal" | "intermediaire" | "reduit" | "super_reduit";

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface Proposal {
  id: string;
  user_id: string;
  created_by: string | null;
  proposal_number: string | null;
  title: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  client_address: string | null;
  client_siren: string | null;
  description: string | null;
  items: ProposalItem[];
  total_ht: number;
  tva_rate: number;
  total_ttc: number;
  status: ProposalStatus;
  approval_status: "pending_review" | "approved" | "rejected" | null;
  valid_until: string | null;
  payment_terms: string | null;
  notes: string | null;
  ai_brief: string | null;
  share_token: string | null;
  signed_at: string | null;
  signer_name: string | null;
  viewed_at: string | null;
  reminder_count: number;
  last_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  siret: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  tva_number: string | null;
  tva_regime: TvaRegime | null;
  plan: "free" | "solo" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  proposal_template: string | null;
  proposal_color: string | null;
  require_approval: boolean;
  subdomain: string | null;
  reminder_intervals: number[] | null;
  reminder_message: string | null;
  // Paiement client
  payment_method: "none" | "link" | "bank" | "both";
  payment_link_provider: string | null;
  payment_link_profile: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_account_name: string | null;
  // Email domaine personnalisé (Pro)
  email_domain: string | null;
  email_domain_resend_id: string | null;
  email_domain_verified: boolean;
  // Numérotation acomptes
  invoice_count_acompte: number;
  // Chorus Pro (B2G, Réforme 2026)
  chorus_pro_login: string | null;
  chorus_pro_password: string | null;
  chorus_pro_fournisseur_id: number | null;
  chorus_pro_bank_code: number | null;
  chorus_pro_user_id: number | null;
  // CGV
  cgv_text: string | null;
  created_at: string;
}

export interface GeneratedProposal {
  title: string;
  items: Omit<ProposalItem, "id">[];
  total_ht: number;
  tva_rate: number;
  total_ttc: number;
  valid_days: number;
  payment_terms: string;
  notes: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";
export type OperationCategory = "services" | "goods" | "mixed";

export interface Invoice {
  id: string;
  user_id: string;
  proposal_id: string | null;
  invoice_number: string;

  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  client_siren: string | null;
  client_address: string | null;
  delivery_address: string | null;

  seller_name: string | null;
  seller_company: string | null;
  seller_siren: string | null;
  seller_address: string | null;
  seller_tva_number: string | null;

  items: ProposalItem[];
  total_ht: number;
  tva_rate: number;
  total_ttc: number;

  type_code: string;
  operation_category: OperationCategory;
  payment_on_debit: boolean;

  issue_date: string;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;

  status: InvoiceStatus;
  payment_link_url: string | null;
  stripe_payment_link_id: string | null;
  facturx_pdf_path: string | null;
  last_reminder_sent_at: string | null;
  reminder_count: number;
  // Acompte / Solde
  invoice_type: "standard" | "acompte" | "solde";
  linked_invoice_id: string | null;
  linked_invoice_number: string | null; // jointure virtuelle (non stockée, enrichie à la volée)
  deposit_percentage: number | null;
  // Chorus Pro (B2G)
  chorus_pro_ref: string | null;
  chorus_pro_submitted_at: string | null;
  chorus_pro_status: string | null;
  chorus_pro_status_date: string | null;
  chorus_pro_motif_rejet: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringInvoice {
  id: string;
  user_id: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  client_address: string | null;
  items: ProposalItem[];
  tva_rate: number;
  payment_terms: string | null;
  notes: string | null;
  interval: "monthly" | "quarterly" | "yearly";
  day_of_month: number;
  next_billing_date: string;
  active: boolean;
  last_billed_at: string | null;
  created_at: string;
}
