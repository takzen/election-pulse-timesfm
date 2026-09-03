import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puls Wyborczy | Niezależne Prognozy i Sondaże AI",
  description: "Niezależna platforma prognozująca poparcie partii politycznych w Polsce oraz interaktywny symulator wpływu stóp NBP i inflacji. Model AI: Google TimesFM 3.0.",
  keywords: ["wybory", "sondaże", "prognoza wyborcza", "Puls Wyborczy", "sztuczna inteligencja", "symulator NBP", "Sejm", "TimesFM", "pulswyborczy.pl"],
  openGraph: {
    title: "Puls Wyborczy | Niezależne Prognozy i Sondaże AI",
    description: "Zobacz najnowsze prognozy poparcia partii i zbadaj wpływ stóp procentowych oraz inflacji na wynik wyborów.",
    url: "https://pulswyborczy.pl",
    siteName: "Puls Wyborczy",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puls Wyborczy | Sondaże i Prognozy Wyborcze AI",
    description: "Zaawansowany model analityczny oparty o Google TimesFM 3.0 badający sondaże, trendy i gospodarkę.",
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
