import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElectionPulse | AI Wyborcze Prognozy Google TimesFM 3.0",
  description: "Natywne wielowymiarowe prognozy wyborcze i symulator wpływu stóp NBP oraz inflacji na poparcie partii. Model Google TimesFM 3.0 (330M).",
  keywords: ["wybory", "sondaże", "prognoza wyborcza", "TimesFM 3.0", "sztuczna inteligencja", "symulator NBP"],
  openGraph: {
    title: "ElectionPulse | AI Prognozy Wyborcze z Google TimesFM 3.0",
    description: "Zobacz najnowsze prognozy wyborcze oparte o model Google TimesFM 3.0 i zbadaj wpływ stóp procentowych oraz inflacji.",
    url: "https://election-pulse-timesfm.vercel.app",
    siteName: "ElectionPulse-TimesFM",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElectionPulse | Wybory w Polsce prognozowane przez Google TimesFM 3.0",
    description: "Multivariate Foundation Model analizujący sondaże, Google Trends i stopy NBP w czasie rzeczywistym.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <body className="min-h-screen bg-[#070a12] text-slate-100 antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
