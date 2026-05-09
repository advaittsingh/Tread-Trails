import { ImageResponse } from "next/og";

export const alt = "Tread Trails — Premium Off-Road Lab";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #FAFAFA 0%, #FFFFFF 45%, #F3F6F4 100%)",
          color: "#1a1f1c",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#2d5a45",
            marginBottom: 24,
          }}
        >
          TREAD TRAILS
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            lineHeight: 1.05,
            fontWeight: 600,
            maxWidth: 900,
          }}
        >
          Terrain, recomposed.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: "#4b5563",
            maxWidth: 780,
            lineHeight: 1.45,
          }}
        >
          Premium expedition builds, curated accessories, and studio-grade fitting.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
