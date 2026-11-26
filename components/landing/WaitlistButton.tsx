"use client";

import Link from "next/link";
import { APPEL, BETA_OUVERTE } from "@/lib/beta";

interface WaitlistButtonProps {
  className?: string;
  label?: string;
  plan?: "free" | "solo" | "pro";
}

/**
 * Bouton d'appel des articles du blog. Pendant la bêta (lib/beta.ts), il mène
 * au formulaire de candidature, avec le libellé de la bêta, quel que soit le
 * libellé prévu par l'article (la flèche finale est gardée).
 */
export function WaitlistButton({
  className,
  label = "Commencer gratuitement",
  plan = "free",
}: WaitlistButtonProps) {
  const href = BETA_OUVERTE ? APPEL.lien : plan === "free" ? "/signup" : `/signup?plan=${plan}`;
  const texte = BETA_OUVERTE ? APPEL.libelle + (label.trim().endsWith("→") ? " →" : "") : label;
  return (
    <Link href={href} className={className}>
      {texte}
    </Link>
  );
}
