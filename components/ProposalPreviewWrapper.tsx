"use client";

/**
 * ProposalPreviewWrapper, Client Component
 *
 * Wrapper autour de ProposalDocument qui lit le thème courant depuis
 * localStorage et réagit aux changements via MutationObserver.
 * Permet au rendu de la preview de devis de basculer entre mode clair
 * et mode sombre en temps réel, sans toucher au Server Component parent.
 */

import { useState, useEffect } from "react";
import { ProposalDocument } from "@/components/ProposalDocument";
import type { Proposal, Profile } from "@/types";

interface Props {
  proposal: Proposal;
  profile: Profile | null;
  showBranding: boolean;
  cgvText?: string | null;
}

export function ProposalPreviewWrapper({ proposal, profile, showBranding, cgvText }: Props) {
  // Défaut : dark (cohérent avec le SSR, évite le flash)
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Lire le thème sauvegardé
    const saved = localStorage.getItem("deviso_theme");
    const initialDark = saved !== "light";
    setIsDark(initialDark);

    // Réagir aux basculements en temps réel (MutationObserver sur <html>)
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains("light"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ProposalDocument
      proposal={proposal}
      profile={profile}
      showBranding={showBranding}
      isDark={isDark}
      cgvText={cgvText}
    />
  );
}
