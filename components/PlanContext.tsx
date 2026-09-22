"use client";

import { createContext, useContext } from "react";

/** Les cinq actes réglables par le gérant (mêmes clés que lib/droits.ts). */
export type Droits = {
  envoyer_devis: boolean;
  envoyer_facture: boolean;
  transmettre_pa: boolean;
  deposer_chorus: boolean;
  refuser_facture_recue: boolean;
};

const DROITS_TITULAIRE: Droits = {
  envoyer_devis: true,
  envoyer_facture: true,
  transmettre_pa: true,
  deposer_chorus: true,
  refuser_facture_recue: true,
};

interface PlanContextValue {
  plan: string;
  isMember: boolean;
  droits: Droits;
}

/** Plan + rôle + droits courants de l'espace de travail. */
const PlanContext = createContext<PlanContextValue>({
  plan: "free",
  isMember: false,
  droits: DROITS_TITULAIRE,
});

export function PlanProvider({
  plan,
  isMember,
  droits,
  children,
}: {
  plan: string;
  isMember: boolean;
  droits?: Droits;
  children: React.ReactNode;
}) {
  return (
    <PlanContext.Provider value={{ plan, isMember, droits: droits ?? DROITS_TITULAIRE }}>
      {children}
    </PlanContext.Provider>
  );
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

/** Les cinq droits de l'utilisateur courant. Le titulaire les a tous. */
export function useDroits(): Droits {
  return useContext(PlanContext).droits;
}

/**
 * Vrai si l'utilisateur courant a le droit d'accomplir cet acte.
 *
 * Sert à AFFICHER ou MASQUER une fonction sur l'interface : par défaut un
 * collaborateur n'a rien, et son écran reste épuré ; une fonction n'apparaît
 * que si le gérant l'a cochée. Le serveur reste seul juge à l'exécution — cette
 * vérité côté client ne fait que décider de ce qu'on montre.
 */
export function usePermission(acte: keyof Droits): boolean {
  return useContext(PlanContext).droits[acte] === true;
}
