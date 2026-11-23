import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

/**
 * Miniatures de partage (Open Graph, 1200 x 630), aux couleurs du site public
 * refait en novembre 2026 : nuit verte, encre claire, un seul accent vert, la
 * feuille de papier comme seul élément clair. Une seule source pour les trois
 * modèles (accueil, experts-comptables, article du blog).
 */
export const TAILLE = { width: 1200, height: 630 };

const FOND = "#0E1512";
const ENCRE = "#E7EDE8";
const GRIS = "#9AA6A0";
const VERT = "#0F7A55";
const VERT_CLAIR = "#5FC79A";
const PAPIER = "#F6F7F5";
const ENCRE_PAPIER = "#16211C";
const GRIS_PAPIER = "#5A6460";
const FILET = "#E3E5DF";

/**
 * Hanken Grotesk, la police du site. Lue en TTF depuis Google Fonts au moment
 * de la génération (au build) ; si l'appel échoue, la police par défaut prend
 * le relais plutôt que de casser l'image.
 */
const polices = new Map<number, Promise<ArrayBuffer | null>>();
function police(poids: number): Promise<ArrayBuffer | null> {
  let p = polices.get(poids);
  if (!p) {
    p = (async () => {
      try {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@${poids}`)).text();
        const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
        if (!url) return null;
        const r = await fetch(url);
        return r.ok ? await r.arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
    polices.set(poids, p);
  }
  return p;
}

async function rendre(contenu: ReactNode) {
  const [moyen, gras] = await Promise.all([police(500), police(600)]);
  const fonts = [
    ...(moyen ? [{ name: "Hanken", data: moyen, weight: 500 as const, style: "normal" as const }] : []),
    ...(gras ? [{ name: "Hanken", data: gras, weight: 600 as const, style: "normal" as const }] : []),
  ];
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: FOND,
          backgroundImage: "radial-gradient(70% 90% at 0% 0%, rgba(31,165,113,0.16), rgba(14,21,18,0) 70%)",
          fontFamily: fonts.length ? "Hanken" : undefined,
          color: ENCRE,
        }}
      >
        {contenu}
      </div>
    ),
    { ...TAILLE, fonts: fonts.length ? fonts : undefined }
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 10, backgroundColor: VERT, color: "#FFFFFF", fontSize: 24, fontWeight: 600 }}>D</div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: -0.6 }}>Deviso</div>
    </div>
  );
}

function Etiquette({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, backgroundColor: "rgba(95,199,154,0.12)", color: VERT_CLAIR, fontSize: 22, fontWeight: 500 }}>
      {children}
    </div>
  );
}

/** La feuille de devis du site, rognée par le bas de l'image. */
function Feuille() {
  const lignes: [string, string][] = [
    ["Audit et arborescence", "500,00 €"],
    ["Maquettes des cinq pages", "1 400,00 €"],
    ["Intégration et adaptation mobile", "1 800,00 €"],
    ["Formulaire de contact et RGPD", "800,00 €"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", position: "absolute", top: 92, left: 688, width: 440, height: 600, padding: 34, borderRadius: 12, backgroundColor: PAPIER, color: ENCRE_PAPIER }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 7, backgroundColor: ENCRE_PAPIER, color: PAPIER, fontSize: 14, fontWeight: 600 }}>SD</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 17, fontWeight: 600 }}>Studio Durand</div>
            <div style={{ display: "flex", fontSize: 13, color: GRIS_PAPIER }}>Design et développement web</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 600, letterSpacing: 1 }}>DEVIS</div>
          <div style={{ display: "flex", padding: "3px 10px", borderRadius: 999, backgroundColor: "#E1F0E7", color: "#0C6B4C", fontSize: 13, fontWeight: 600 }}>Signé</div>
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 34, fontSize: 18, fontWeight: 600 }}>Refonte du site vitrine, cinq pages</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
        {lignes.map(([l, m]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${FILET}`, fontSize: 15 }}>
            <div style={{ display: "flex" }}>{l}</div>
            <div style={{ display: "flex", fontWeight: 600 }}>{m}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 12, borderTop: `2px solid ${ENCRE_PAPIER}`, fontSize: 20, fontWeight: 600 }}>
        <div style={{ display: "flex" }}>Total TTC</div>
        <div style={{ display: "flex" }}>5 400,00 €</div>
      </div>
    </div>
  );
}

/** Colonne de texte à gauche, commune aux trois modèles. */
function Colonne({ largeur, children }: { largeur: number; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: largeur, height: "100%", padding: "64px 0 60px 72px" }}>
      {children}
    </div>
  );
}

export function miniatureAccueil() {
  return rendre(
    <>
      <Colonne largeur={664}>
        <Logo />
        <div style={{ display: "flex", flexDirection: "column", fontSize: 50, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1.6 }}>
          <div style={{ display: "flex" }}>Vos devis rédigés,</div>
          <div style={{ display: "flex" }}>vos factures conformes,</div>
          <div style={{ display: "flex" }}>vos relances envoyées.</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: GRIS, lineHeight: 1.4 }}>Plateforme agréée comprise, essai de 14 jours.</div>
      </Colonne>
      <Feuille />
    </>
  );
}

export function miniatureCabinet() {
  const dossiers: [string, string, string][] = [
    ["Atelier Lumière", "À jour", VERT_CLAIR],
    ["Studio Durand", "TVA à déclarer le 24", "#E8B562"],
    ["Martin Paysage", "À jour", VERT_CLAIR],
    ["Cabinet Rivière", "2 factures à vérifier", "#E8B562"],
  ];
  return rendre(
    <>
      <Colonne largeur={680}>
        <Logo />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Etiquette>Pour les experts-comptables</Etiquette>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1.6 }}>
            Vos clients micro et TPE, conformes à la réforme, suivis depuis un seul cockpit.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: GRIS }}>Gratuit pour votre cabinet. Exports FEC et Quadra.</div>
      </Colonne>
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", top: 150, left: 748, width: 380, padding: 26, borderRadius: 12, backgroundColor: "#16201B" }}>
        <div style={{ display: "flex", fontSize: 16, color: GRIS, marginBottom: 10 }}>Vos dossiers</div>
        {dossiers.map(([nom, etat, couleur]) => (
          <div key={nom} style={{ display: "flex", flexDirection: "column", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 600 }}>{nom}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 16, color: GRIS }}>
              <div style={{ display: "flex", width: 9, height: 9, borderRadius: 9, backgroundColor: couleur }} />
              {etat}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function miniatureArticle(titre: string, rubrique: string) {
  // Le titre occupe toute la largeur ; sa taille suit sa longueur pour tenir en trois ou quatre lignes.
  const taille = titre.length > 90 ? 50 : titre.length > 60 ? 58 : 66;
  return rendre(
    <Colonne largeur={1100}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ display: "flex", fontSize: 22, color: GRIS }}>Le blog</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Etiquette>{rubrique}</Etiquette>
        <div style={{ display: "flex", fontSize: taille, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1.8 }}>{titre}</div>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: GRIS }}>getdeviso.fr</div>
    </Colonne>
  );
}
