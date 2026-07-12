import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

type Params = { params: Promise<{ size: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { size: sizeStr } = await params;
  const size = parseInt(sizeStr) || 192;
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.55);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#4f46e5",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: fontSize,
          fontWeight: 800,
          fontFamily: "Arial, sans-serif",
        }}
      >
        D
      </div>
    ),
    { width: size, height: size }
  );
}
