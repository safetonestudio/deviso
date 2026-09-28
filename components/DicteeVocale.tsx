"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

/**
 * Dictée vocale : on parle, le texte s'écrit dans le champ visé.
 *
 * S'appuie sur la reconnaissance vocale native du navigateur (Web Speech API),
 * donc sans coût ni serveur. Le composant est volontairement discret et sûr :
 *  - il ne s'affiche que si le navigateur sait le faire (Firefox ne le sait
 *    pas, Safari est capricieux) : ailleurs il rend `null`, la saisie clavier
 *    reste évidemment intacte ;
 *  - il ne fait qu'AJOUTER du texte via `onTexteFinal`, il ne remplace ni
 *    n'efface jamais ce que l'utilisateur a tapé ;
 *  - toute erreur (micro refusé, réseau) est affichée en clair, jamais avalée.
 *
 * Les types Web Speech ne sont pas dans la lib DOM standard : on déclare le
 * minimum nécessaire ici plutôt que d'élargir la configuration TypeScript.
 */

interface ResultatReco {
  0: { transcript: string };
  isFinal: boolean;
}
interface EvenementReco {
  resultIndex: number;
  results: { length: number; [i: number]: ResultatReco };
}
interface InstanceReco {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EvenementReco) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type ConstructeurReco = new () => InstanceReco;

function lireConstructeur(): ConstructeurReco | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructeurReco;
    webkitSpeechRecognition?: ConstructeurReco;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function DicteeVocale({
  onTexteFinal,
  titre = "Dicter au micro",
}: {
  onTexteFinal: (texte: string) => void;
  titre?: string;
}) {
  const [supporte, setSupporte] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [interim, setInterim] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const recoRef = useRef<InstanceReco | null>(null);

  useEffect(() => {
    setSupporte(lireConstructeur() !== null);
    // Arrêt propre si le composant est démonté pendant l'écoute.
    return () => {
      try {
        recoRef.current?.abort();
      } catch {
        /* rien : le nettoyage ne doit jamais lever */
      }
    };
  }, []);

  const demarrer = () => {
    const Constructeur = lireConstructeur();
    if (!Constructeur) return;
    setErreur(null);
    setInterim("");

    const reco = new Constructeur();
    reco.lang = "fr-FR";
    reco.continuous = true;
    reco.interimResults = true;

    reco.onresult = (e) => {
      let definitif = "";
      let provisoire = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) definitif += r[0].transcript;
        else provisoire += r[0].transcript;
      }
      if (definitif.trim()) onTexteFinal(definitif.trim());
      setInterim(provisoire);
    };

    reco.onerror = (e) => {
      // « no-speech » et « aborted » sont bénins (silence, arrêt volontaire).
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setErreur("Micro refusé. Autorisez le microphone pour ce site, puis réessayez.");
      } else if (e.error === "network") {
        setErreur("La reconnaissance vocale n'a pas pu joindre le réseau. Réessayez.");
      } else {
        setErreur("La dictée s'est interrompue. Réessayez, ou tapez le texte.");
      }
      setEcoute(false);
    };

    reco.onend = () => {
      setEcoute(false);
      setInterim("");
    };

    try {
      reco.start();
      recoRef.current = reco;
      setEcoute(true);
    } catch {
      setErreur("Impossible de démarrer la dictée. Réessayez.");
    }
  };

  const arreter = () => {
    try {
      recoRef.current?.stop();
    } catch {
      /* onend fera le ménage */
    }
    setEcoute(false);
    setInterim("");
  };

  if (!supporte) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={ecoute ? arreter : demarrer}
        aria-pressed={ecoute}
        className={
          ecoute
            ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors"
            : "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-ds-border text-gray-300 hover:bg-ds-elevated transition-colors"
        }
      >
        {ecoute ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <Square size={13} className="shrink-0" />
            Arrêter la dictée
          </>
        ) : (
          <>
            <Mic size={15} className="shrink-0" />
            {titre}
          </>
        )}
      </button>

      {ecoute && (
        <span className="text-xs text-gray-500 max-w-xs text-right">
          {interim ? `« ${interim} »` : "Parlez, le texte s'écrit tout seul…"}
        </span>
      )}
      {erreur && <span className="text-xs text-red-400 max-w-xs text-right">{erreur}</span>}
    </div>
  );
}
