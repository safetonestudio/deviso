import { createAdminClient } from "@/lib/supabase/admin";
import { signalementsOuvertsDuClient } from "@/lib/cabinet-signalements";
import { SignalementAcquitter } from "./SignalementAcquitter";

const initiales = (nom: string) =>
  nom
    .replace(/^cabinet\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]!.toUpperCase())
    .join("") || "EC";

/**
 * Messages de l'expert-comptable, en tete du tableau de bord client : seuls
 * eux y figurent (les relances de devis et de factures sont dans l'onglet
 * Notifications). Lecture par la cle de service, bornee a l'espace du client.
 * Rien ne s'affiche s'il n'y a aucun signalement ouvert.
 */
export async function SignalementsClient({ workspaceId }: { workspaceId: string }) {
  const admin = createAdminClient();
  const signalements = await signalementsOuvertsDuClient(admin, workspaceId);
  if (signalements.length === 0) return null;

  const ids = [...new Set(signalements.map((s) => s.cabinet_id))];
  const { data: cabinets } = await admin.from("profiles").select("id, company_name, full_name").in("id", ids);
  const nomDe = (id: string) => {
    const c = cabinets?.find((x) => x.id === id);
    return c?.company_name || c?.full_name || "Ton cabinet";
  };

  return (
    <div className="space-y-3">
      {signalements.map((s) => {
        const nom = nomDe(s.cabinet_id);
        return (
          <section
            key={s.id}
            className="carte p-4 sm:p-5 grid gap-4 grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(0,1fr)_auto] items-center"
          >
            <div className="w-12 h-12 rounded-xl bg-ink text-ds-bg grid place-items-center font-display font-bold text-[15px]">
              {initiales(nom)}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-gray-400">
                <span className="text-ink font-semibold">{nom}</span>, ton expert-comptable ·{" "}
                <span className="text-amber-400 font-semibold">À traiter</span>
              </p>
              <p className="text-[15px] text-ink mt-1 whitespace-pre-wrap wrap-break-word">{s.message}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 flex gap-2 sm:justify-end">
              <SignalementAcquitter id={s.id} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
