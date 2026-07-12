import { ImageResponse } from "next/og";

export const alt = "Deviso, Devis IA en 30 secondes, facture Factur-X en 1 clic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0B0F19",
        }}
      >
        {/* ── Colonne gauche ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 40px 60px 80px",
            flex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: "#4F46E5",
                color: "white",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              D
            </div>
            <div style={{ display: "flex", color: "white", fontSize: 26, fontWeight: 600 }}>
              Deviso
            </div>
          </div>

          {/* Big stat */}
          <div
            style={{
              display: "flex",
              fontSize: 160,
              fontWeight: 800,
              color: "#818CF8",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            30s
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              color: "white",
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            Ton devis professionnel,
          </div>
          <div
            style={{
              display: "flex",
              color: "#9CA3AF",
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            {"généré par l'IA."}
          </div>

          {/* Features */}
          <div
            style={{
              display: "flex",
              color: "#6B7280",
              fontSize: 19,
              marginBottom: 32,
            }}
          >
            Signature · Factur-X · Chorus Pro · Relances auto
          </div>

          {/* Badge 2026 */}
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              backgroundColor: "#1E1B4B",
              border: "1.5px solid #4338CA",
              borderRadius: 24,
              padding: "10px 22px",
            }}
          >
            <div style={{ display: "flex", color: "#818CF8", fontSize: 17, fontWeight: 500 }}>
              Conforme réforme 2026
            </div>
          </div>
        </div>

        {/* ── Colonne droite, Mockup ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            padding: "50px 50px 50px 10px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#111827",
              borderRadius: 14,
              border: "1px solid #1F2937",
              width: 320,
            }}
          >
            {/* Barre fenêtre */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "11px 14px",
                backgroundColor: "#1F2937",
                borderRadius: "14px 14px 0 0",
              }}
            >
              <div style={{ display: "flex", width: 11, height: 11, borderRadius: 6, backgroundColor: "#EF4444" }} />
              <div style={{ display: "flex", width: 11, height: 11, borderRadius: 6, backgroundColor: "#F59E0B" }} />
              <div style={{ display: "flex", width: 11, height: 11, borderRadius: 6, backgroundColor: "#10B981" }} />
            </div>

            {/* Contenu */}
            <div style={{ display: "flex", flexDirection: "column", padding: 16 }}>
              {/* Label */}
              <div
                style={{
                  display: "flex",
                  color: "#6B7280",
                  fontSize: 10,
                  fontWeight: 600,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Decris ton projet
              </div>

              {/* Input */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#1F2937",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                  border: "1px solid #374151",
                }}
              >
                <div style={{ display: "flex", color: "#9CA3AF", fontSize: 10 }}>
                  Refonte site vitrine cabinet d&apos;avocats, design, responsive, contact…
                </div>
              </div>

              {/* Bouton */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#4F46E5",
                  borderRadius: 8,
                  padding: "9px 14px",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", color: "white", fontSize: 12, fontWeight: 600 }}>
                  Generer le devis
                </div>
              </div>

              {/* Carte devis */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", color: "#111827", fontSize: 11, fontWeight: 700 }}>
                      Devis n°2026-047
                    </div>
                    <div style={{ display: "flex", color: "#9CA3AF", fontSize: 9 }}>
                      Cabinet Durand · Lyon
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#FEF3C7",
                      borderRadius: 10,
                      padding: "3px 8px",
                    }}
                  >
                    <div style={{ display: "flex", color: "#D97706", fontSize: 9, fontWeight: 600 }}>
                      Brouillon
                    </div>
                  </div>
                </div>

                {/* Lignes */}
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "5px 0" }}>
                  <div style={{ display: "flex", color: "#6B7280", fontSize: 9 }}>Maquettes UI (5 pages)</div>
                  <div style={{ display: "flex", color: "#111827", fontSize: 9, fontWeight: 600 }}>1 400€</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "5px 0" }}>
                  <div style={{ display: "flex", color: "#6B7280", fontSize: 9 }}>Integration responsive</div>
                  <div style={{ display: "flex", color: "#111827", fontSize: 9, fontWeight: 600 }}>1 800€</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "5px 0" }}>
                  <div style={{ display: "flex", color: "#6B7280", fontSize: 9 }}>Mise en ligne + formation</div>
                  <div style={{ display: "flex", color: "#111827", fontSize: 9, fontWeight: 600 }}>400€</div>
                </div>

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
                  <div style={{ display: "flex", color: "#111827", fontSize: 11, fontWeight: 700 }}>Total TTC</div>
                  <div style={{ display: "flex", color: "#4F46E5", fontSize: 12, fontWeight: 700 }}>5 400€</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
