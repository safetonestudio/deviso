import { TriangleAlert } from "lucide-react";
import type { TonExplication } from "@/lib/superpdp-explications";

/**
 * Bloc d'explication affiche dans le volet deplie des pages Super PDP :
 * "ce qui se passe" + "marche a suivre". Jamais sur la ligne repliee.
 */
export function ExplicationProbleme({
  ton,
  probleme,
  etapes,
}: {
  ton: TonExplication;
  probleme: string;
  etapes: string[];
}) {
  const cadre =
    ton === "alerte" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5";
  const icone = ton === "alerte" ? "text-red-400" : "text-amber-400";
  const titre = ton === "alerte" ? "text-red-300" : "text-amber-300";
  return (
    <div className={`rounded-lg border px-4 py-3 mb-4 ${cadre}`}>
      <p className={`text-sm font-semibold mb-1 flex items-center gap-2 ${titre}`}>
        <TriangleAlert size={16} className={`shrink-0 ${icone}`} />
        Ce qui se passe
      </p>
      <p className="text-sm text-gray-300 mb-2.5">{probleme}</p>
      <p className="text-xs font-semibold text-gray-400 mb-1">Marche à suivre</p>
      <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
        {etapes.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ol>
    </div>
  );
}
