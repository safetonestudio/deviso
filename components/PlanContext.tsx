"use client";

import { createContext, useContext } from "react";

interface PlanContextValue {
  plan: string;
  isMember: boolean;
}

/** Plan + rôle courant de l'espace de travail */
const PlanContext = createContext<PlanContextValue>({ plan: "free", isMember: false });

export function PlanProvider({
  plan,
  isMember,
  children,
}: {
  plan: string;
  isMember: boolean;
  children: React.ReactNode;
}) {
  return <PlanContext.Provider value={{ plan, isMember }}>{children}</PlanContext.Provider>;
}

/**
 * Retourne le plan actif de l'espace de travail.
 * Pour les membres d'équipe, il s'agit du plan de l'owner.
 */
export function usePlan(): string {
  return useContext(PlanContext).plan;
}

/**
 * Retourne true si l'utilisateur courant est un membre invité (pas l'owner).
 * Les membres ne voient jamais de CTA d'upgrade — ils utilisent les features de l'owner.
 */
export function useIsMember(): boolean {
  return useContext(PlanContext).isMember;
}
