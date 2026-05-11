import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          background: "#0b0b0b",
          color: "#c9960c",
          fontSize: 26,
          fontWeight: 700,
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        八
      </div>
    ),
    { ...size }
  );
}
