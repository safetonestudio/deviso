import { createAdminClient } from "@/lib/supabase/admin";
import { signalementsOuvertsDuClient } from "@/lib/cabinet-signalements";
import { SignalementAcquitter } from "./SignalementAcquitter";

const horodatage = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "long" } as Intl.DateTimeFormatOptions);

/**
 * Bandeau du tableau de bord client : les signalements ouverts envoyes par son
 * expert-comptable. Lecture par la cle de service, bornee a l'espace du client.
 * Rien ne s'affiche s'il n'y a aucun signalement ouvert.
 */
export async function SignalementsClient({ workspaceId }: { workspaceId: string }) {
  const admin = createAdminClient();
  const signalements = await signalementsOuvertsDuClient(admin, workspaceId);
  if (signalements.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <h2 className="text-ink font-semibold text-sm mb-2">
        Votre expert-comptable vous signale {signalements.length > 1 ? `${signalements.length} points` : "un point"} à vérifier
      </h2>
      <ul className="space-y-2">
        {signalements.map((s) => (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 bg-ds-surface border border-ds-border rounded-lg p-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{s.message}</p>
              <p className="text-xs text-gray-500 mt-1">{horodatage(s.created_at)}</p>
            </div>
            <SignalementAcquitter id={s.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
