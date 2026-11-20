-- Paramètres du cabinet (20/11/2026) : logiciel de production, qui décide du
-- format des écritures exportées (lib/logiciels-comptables.ts), et PDF joints
-- par défaut. Colonnes optionnelles ; la valeur est contrôlée par PATCH /api/profile.
alter table public.profiles add column if not exists logiciel_comptable text;
alter table public.profiles add column if not exists export_pdf_defaut boolean not null default false;
comment on column public.profiles.logiciel_comptable is 'Expert-comptable : logiciel de production (identifiant de lib/logiciels-comptables.ts), null = FEC standard.';
comment on column public.profiles.export_pdf_defaut is 'Expert-comptable : joindre les PDF des factures par défaut à l''export.';
