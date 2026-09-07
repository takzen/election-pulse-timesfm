import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Puls Wyborczy | Niezależne Prognozy i Sondaże";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070a14",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            {/* Pulsing Dot */}
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                boxShadow: "0 0 12px #10b981",
              }}
            />
            <span
              style={{
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: "#ffffff",
              }}
            >
              PULS WYBORCZY
            </span>
            <span
              style={{
                fontSize: "22px",
                color: "#64748b",
                fontWeight: 400,
              }}
            >
              • pulswyborczy.pl
            </span>
          </div>

          {/* Model Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "9999px",
              backgroundColor: "#0e182b",
              border: "1px solid #1e3a8a",
              color: "#60a5fa",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "0.03em",
            }}
          >
            Model: Google TimesFM 3.0
          </div>
        </div>

        {/* Center Content: Big Clean Headline & Subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Prognozy i Sondaże Parlamentarne
          </div>
          <div
            style={{
              fontSize: "23px",
              lineHeight: 1.45,
              color: "#94a3b8",
              maxWidth: "1000px",
            }}
          >
            Probabilistyczny model szeregów czasowych badający dynamikę poparcia
            partii politycznych z uwzględnieniem wskaźników makroekonomicznych NBP i GUS.
          </div>
        </div>

        {/* Features Row: 3 Spacious Cards */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "100%",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "18px 22px",
              backgroundColor: "#0e1424",
              border: "1px solid #1e293b",
              borderRadius: "16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#f59e0b",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Scena 2026
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
                marginTop: "6px",
              }}
            >
              10 Śledzonych Opcji
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              W tym Rozwój+, KKP i Razem
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "18px 22px",
              backgroundColor: "#0e1424",
              border: "1px solid #1e293b",
              borderRadius: "16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#10b981",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Gospodarka
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
                marginTop: "6px",
              }}
            >
              Kowarianty NBP & GUS
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Stopy procentowe i inflacja CPI
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "18px 22px",
              backgroundColor: "#0e1424",
              border: "1px solid #1e293b",
              borderRadius: "16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#3b82f6",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Parlament
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
                marginTop: "6px",
              }}
            >
              Większość Sejmowa
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Kalkulator progu 231 mandatów
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingTop: "18px",
            borderTop: "1px solid #1e293b",
            fontSize: "15px",
            color: "#64748b",
          }}
        >
          <span>Niezależna platforma analityczna • TAKZEN DEV</span>
          <span style={{ color: "#10b981", fontWeight: 600 }}>
            Kwantyle niepewności p10 – p90
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
