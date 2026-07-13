"use client";

/**
 * Règles de robustesse du mot de passe + checklist visuelle temps réel.
 * Utilisé sur /signup et /reset-password. La validation côté client bloque
 * la soumission tant que toutes les règles ne sont pas satisfaites.
 */

export const PASSWORD_RULES: { label: string; test: (pwd: string) => boolean }[] = [
  { label: "12 caractères minimum", test: (pwd) => pwd.length >= 12 },
  { label: "1 majuscule minimum", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "1 chiffre minimum", test: (pwd) => /[0-9]/.test(pwd) },
  { label: "1 caractère spécial minimum", test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
];

export function isPasswordValid(pwd: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pwd));
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2.5 space-y-1.5" aria-label="Exigences du mot de passe">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-2 text-xs">
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-colors ${
                ok ? "bg-emerald-500 text-white" : "bg-ds-elevated text-gray-600 border border-ds-border"
              }`}
              aria-hidden="true"
            >
              {ok ? (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
            <span className={ok ? "text-emerald-400" : "text-gray-500"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
