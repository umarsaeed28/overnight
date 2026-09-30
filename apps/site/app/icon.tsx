import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** An enso moon in Ink on Washi. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF8F3",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "3px solid #2E2B45",
            borderRightColor: "transparent",
            transform: "rotate(-30deg)",
          }}
        />
      </div>
    ),
    size,
  );
}
