import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "null design — independent computational studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// IBM Plex Sans Medium, SIL Open Font License 1.1 (src/app/fonts/OFL.txt).
// next/font/google cannot be used inside ImageResponse, so the face is bundled.
const PLEX_SANS_MEDIUM = join(process.cwd(), "src/app/fonts/IBMPlexSans-Medium.ttf");

export default async function OpenGraphImage() {
  const plex = await readFile(PLEX_SANS_MEDIUM);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fbfbf9",
          color: "#101010",
          fontFamily: "IBM Plex Sans",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, letterSpacing: 2, color: "#4a4a46" }}>NULL.DESIGN</div>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="1.5">
            <rect x="0.75" y="0.75" width="22.5" height="22.5" />
            <path d="M3.5 10V3.5L8 10V3.5" />
            <path d="M9.5 8v5.25a2.25 2.25 0 0 0 4.5 0V8" />
            <path d="M16 13.5V20.5H20.5" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 500, letterSpacing: -6, lineHeight: 0.95 }}>
            null design
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#4a4a46" }}>
            independent computational studio
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #101010",
            paddingTop: 18,
            fontSize: 20,
            color: "#4a4a46",
          }}
        >
          <div>Null Design explores how computation can expand human agency.</div>
          <div>0x00</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "IBM Plex Sans", data: plex, weight: 500, style: "normal" }],
    },
  );
}
