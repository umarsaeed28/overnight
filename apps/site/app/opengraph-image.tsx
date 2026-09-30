import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Overnight QA. Ship at dusk. Wake up to answers.";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 92px",
          background: "linear-gradient(180deg, #E6DDF5 0%, #D6E6F5 55%, #FBEFC5 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* The enso moon, offset the way a brush leaves it. */}
        <div
          style={{
            position: "absolute",
            right: 84,
            top: 84,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "#FBEFC5",
            border: "9px solid #2E2B45",
            borderRightColor: "transparent",
            transform: "rotate(-28deg)",
          }}
        />

        <div
          style={{
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#5C5873",
          }}
        >
          QA that works the night shift
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 72,
            maxWidth: 720,
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#2E2B45",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Ship at dusk.</span>
          <span>Wake up to answers.</span>
        </div>

        <div style={{ marginTop: 32, fontSize: 30, color: "#5C5873", maxWidth: 660 }}>
          Your report is ready by 7am.
        </div>
      </div>
    ),
    size,
  );
}
