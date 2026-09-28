"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

/**
 * Dictée vocale : on parle, l'audio est transcrit en texte dans le champ visé.
 *
 * Enregistre le micro avec le mécanisme standard du navigateur (getUserMedia +
 * MediaRecorder), puis envoie l'audio à `/api/transcription` (Whisper). Ce choix
 * plutôt que la reconnaissance native (Web Speech API) parce que celle-ci ne
 * marche pas partout : Brave la désactive, Firefox ne la gère pas. getUserMedia,
 * lui, est supporté partout et demande l'autorisation micro normalement.
 *
 * Sûr et discret :
 *  - ne s'affiche que si le navigateur sait enregistrer (null sinon) ;
 *  - n'AJOUTE que du texte via `onTexteFinal`, n'efface jamais la saisie ;
 *  - coupe le micro dès l'arrêt (aucun flux qui traîne) ;
 *  - affiche en clair les erreurs (micro refusé, transcription impossible).
 */

const MIMES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function extensionPour(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

type Etat = "idle" | "enregistrement" | "transcription";

export function DicteeVocale({
  onTexteFinal,
  titre = "Dicter au micro",
}: {
  onTexteFinal: (texte: string) => void;
  titre?: string;
}) {
  const [supporte, setSupporte] = useState(false);
  const [etat, setEtat] = useState<Etat>("idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const morceauxRef = useRef<Blob[]>([]);

  const couperFlux = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    setSupporte(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof window.MediaRecorder !== "undefined"
    );
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* le nettoyage ne doit jamais lever */
      }
      couperFlux();
    };
  }, []);

  const demarrer = async () => {
    setErreur(null);
    let stream: MediaStream;
    try {
      // Déclenche la demande d'autorisation micro du navigateur (Brave compris).
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const nom = (e as { name?: string })?.name;
      if (nom === "NotAllowedError" || nom === "SecurityError") {
        setErreur("Micro refusé. Autorisez le microphone pour ce site, puis réessayez.");
      } else if (nom === "NotFoundError" || nom === "OverconstrainedError") {
        setErreur("Aucun micro détecté sur cet appareil.");
      } else {
        setErreur("Impossible d'accéder au micro. Réessayez.");
      }
      return;
    }

    streamRef.current = stream;
    const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      couperFlux();
      setErreur("Ce navigateur ne sait pas enregistrer l'audio. Tapez le texte.");
      return;
    }

    morceauxRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) morceauxRef.current.push(e.data);
    };
    rec.onstop = async () => {
      couperFlux();
      const type = rec.mimeType || mime || "audio/webm";
      const blob = new Blob(morceauxRef.current, { type });
      if (blob.size < 1000) {
        setEtat("idle");
        setErreur("Aucune parole détectée. Réessayez.");
        return;
      }
      setEtat("transcription");
      try {
        const fd = new FormData();
        fd.append("audio", blob, `dictee.${extensionPour(type)}`);
        const r = await fetch("/api/transcription", { method: "POST", body: fd });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErreur(d.message ?? d.error ?? "La transcription a échoué.");
        } else if (typeof d.texte === "string" && d.texte.trim()) {
          onTexteFinal(d.texte.trim());
        } else {
          setErreur("Rien n'a été compris. Réessayez, ou tapez le texte.");
        }
      } catch {
        setErreur("Envoi interrompu. Réessayez.");
      } finally {
        setEtat("idle");
      }
    };

    try {
      rec.start();
      recRef.current = rec;
      setEtat("enregistrement");
    } catch {
      couperFlux();
      setErreur("Impossible de démarrer l'enregistrement. Réessayez.");
    }
  };

  const arreter = () => {
    try {
      recRef.current?.stop();
    } catch {
      couperFlux();
      setEtat("idle");
    }
  };

  if (!supporte) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      {etat === "transcription" ? (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-ds-border text-gray-400">
          <Loader2 size={15} className="shrink-0 animate-spin" />
          Transcription…
        </span>
      ) : (
        <button
          type="button"
          onClick={etat === "enregistrement" ? arreter : demarrer}
          aria-pressed={etat === "enregistrement"}
          className={
            etat === "enregistrement"
              ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors"
              : "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-ds-border text-gray-300 hover:bg-ds-elevated transition-colors"
          }
        >
          {etat === "enregistrement" ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <Square size={13} className="shrink-0" />
              Arrêter et transcrire
            </>
          ) : (
            <>
              <Mic size={15} className="shrink-0" />
              {titre}
            </>
          )}
        </button>
      )}

      {etat === "enregistrement" && (
        <span className="text-xs text-gray-500 max-w-xs text-right">
          Parlez, puis cliquez pour transcrire.
        </span>
      )}
      {erreur && <span className="text-xs text-red-400 max-w-xs text-right">{erreur}</span>}
    </div>
  );
}
