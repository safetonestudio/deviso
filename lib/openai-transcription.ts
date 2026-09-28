import OpenAI, { toFile } from "openai";
import { lazyClient } from "@/lib/lazy-client";

/**
 * Transcription d'un court enregistrement audio (dictée) en texte.
 *
 * Voie serveur, choisie parce que la reconnaissance vocale native du navigateur
 * (Web Speech API) ne marche pas partout : Brave la désactive, Firefox ne la
 * gère pas. Ici on enregistre le micro dans le navigateur (mécanisme standard,
 * supporté partout et qui demande l'autorisation normalement) et on envoie
 * l'audio à Whisper. Coût de l'ordre de 0,006 $/min, négligeable.
 */

const openai = lazyClient(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

/** Types audio acceptés (les navigateurs varient : webm/opus, mp4, ogg...). */
export const TYPES_AUDIO = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
];

/** Transcrit un blob audio en français. Renvoie le texte, jamais null. */
export async function transcrireAudio(blob: Blob, nom = "dictee.webm"): Promise<string> {
  const file = await toFile(Buffer.from(await blob.arrayBuffer()), nom, {
    type: blob.type || "audio/webm",
  });
  const r = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "fr",
  });
  return (r.text ?? "").trim();
}
