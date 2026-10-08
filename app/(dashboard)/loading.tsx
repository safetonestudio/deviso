/**
 * Squelette de chargement commun au dashboard.
 *
 * Next affiche ce composant pendant que la page de destination se prepare, a
 * la place d'un ecran vide. La barre laterale vit dans le layout et reste
 * affichee : seul le contenu principal est remplace par ce squelette, ce qui
 * reserve la place et evite le "blanc puis saut" au changement de page.
 *
 * Volontairement neutre (quelques blocs) : il sert a tenir la mise en page une
 * fraction de seconde, pas a imiter chaque ecran.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-8 w-52 rounded-lg bg-ds-elevated mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-ds-surface border border-ds-border"
          />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-ds-surface border border-ds-border"
          />
        ))}
      </div>
    </div>
  );
}
