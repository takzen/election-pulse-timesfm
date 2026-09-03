import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElectionPulse | Sondaże i Prognozy Wyborcze AI",
  description: "Wielowymiarowe prognozy poparcia partii politycznych w Polsce oraz interaktywny symulator wpływu stóp procentowych i inflacji.",
  keywords: ["wybory", "sondaże", "prognoza wyborcza", "sztuczna inteligencja", "symulator NBP", "Sejm"],
  openGraph: {
    title: "ElectionPulse | Sondaże i Prognozy Wyborcze AI",
    description: "Zobacz najnowsze prognozy poparcia partii i zbadaj wpływ stóp procentowych oraz inflacji na wynik wyborów.",
    url: "https://election-pulse.vercel.app",
    siteName: "ElectionPulse",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElectionPulse | Sondaże i Prognozy Wyborcze AI",
    description: "Zaawansowany model analizujący sondaże, trendy społeczne i wskaźniki gospodarcze.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-slate-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
