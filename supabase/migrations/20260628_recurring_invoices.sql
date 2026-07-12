-- Migration: recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name text,
  client_email text,
  client_company text,
  client_address text,
  items jsonb NOT NULL DEFAULT '[]',
  tva_rate numeric DEFAULT 0,
  payment_terms text,
  notes text,
  interval text NOT NULL DEFAULT 'monthly',
  day_of_month integer NOT NULL DEFAULT 1,
  next_billing_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_billed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_all" ON recurring_invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
