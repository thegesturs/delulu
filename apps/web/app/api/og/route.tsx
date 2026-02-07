import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "Delulu Social";
    const description =
      searchParams.get("description") ||
      "Manage all your social media in one place";
    const theme = searchParams.get("theme") || "light";

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme === "dark" ? "#0a0a0a" : "#ffffff",
          backgroundImage:
            theme === "dark"
              ? "radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)"
              : "radial-gradient(circle at 25px 25px, #e5e5e5 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e5e5e5 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                color: "white",
                fontWeight: "bold",
              }}
            >
              D
            </div>
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Delulu Social
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: theme === "dark" ? "#ffffff" : "#1a1a1a",
            textAlign: "center",
            lineHeight: "1.1",
            marginBottom: "24px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "32px",
            color: theme === "dark" ? "#a3a3a3" : "#666666",
            textAlign: "center",
            lineHeight: "1.3",
            maxWidth: "800px",
          }}
        >
          {description}
        </div>

        {/* Social Icons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "60px",
            gap: "20px",
          }}
        >
          {["📘", "📷", "🐦", "💼", "🎵", "📌", "🧵", "🏰"].map(
            (icon, index) => (
              <div
                key={index}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "15px",
                  backgroundColor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  border:
                    theme === "dark" ? "1px solid #333" : "1px solid #e5e5e5",
                }}
              >
                {icon}
              </div>
            )
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Failed to generate image", { status: 500 });
  }
}
