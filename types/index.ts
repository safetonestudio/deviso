export type ProposalStatus = "draft" | "sent" | "viewed" | "signed" | "declined";

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
  title: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  description: string | null;
  items: ProposalItem[];
  total_ht: number;
  tva_rate: number;
  total_ttc: number;
  status: ProposalStatus;
  valid_until: string | null;
  payment_terms: string | null;
  notes: string | null;
  ai_brief: string | null;
  share_token: string | null;
  signed_at: string | null;
  viewed_at: string | null;
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

  // Client
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  client_siren: string | null;
  client_address: string | null;
  delivery_address: string | null;

  // Vendeur
  seller_name: string | null;
  seller_company: string | null;
  seller_siren: string | null;
  seller_address: string | null;
  seller_tva_number: string | null;

  // Lignes
  items: ProposalItem[];
  total_ht: number;
  tva_rate: number;
  total_ttc: number;

  // Mentions légales 2026
  type_code: string;
  operation_category: OperationCategory;
  payment_on_debit: boolean;

  // Dates & conditions
  issue_date: string;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;

  status: InvoiceStatus;
  facturx_pdf_path: string | null;
  created_at: string;
  updated_at: string;
}
