import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pulswyborczy.pl"),
  title: {
    default: "Puls Wyborczy | Niezależne Prognozy i Sondaże AI",
    template: "%s | Puls Wyborczy",
  },
  description: "Niezależna platforma prognozująca poparcie partii politycznych w Polsce oraz interaktywny symulator wpływu stóp NBP i inflacji. Model AI: Google TimesFM 3.0.",
  keywords: [
    "wybory",
    "sondaże",
    "prognoza wyborcza",
    "Puls Wyborczy",
    "pulswyborczy.pl",
    "sztuczna inteligencja",
    "symulator NBP",
    "stopy procentowe",
    "Sejm RP",
    "mandaty Sejm",
    "TimesFM",
    "TAKZEN DEV",
  ],
  authors: [{ name: "TAKZEN DEV", url: "https://takzendev.pl" }],
  creator: "TAKZEN DEV",
  publisher: "TAKZEN DEV",
  alternates: {
    canonical: "https://pulswyborczy.pl",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    creator: "@takzendev",
  },
};

// JSON-LD Structured Data for Google Rich Results
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://pulswyborczy.pl/#webapp",
      "name": "Puls Wyborczy",
      "url": "https://pulswyborczy.pl",
      "applicationCategory": "AnalyticsApplication",
      "operatingSystem": "All",
      "description": "Niezależna platforma prognozująca poparcie partii politycznych w Polsce oraz symulator gospodarczy oparty o model Google TimesFM 3.0.",
      "author": {
        "@type": "Organization",
        "name": "TAKZEN DEV",
        "url": "https://takzendev.pl",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://pulswyborczy.pl/#website",
      "url": "https://pulswyborczy.pl",
      "name": "Puls Wyborczy",
      "publisher": {
        "@type": "Organization",
        "name": "TAKZEN DEV",
        "url": "https://takzendev.pl",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-slate-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
