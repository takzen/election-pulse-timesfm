import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pulswyborczy.pl"),
  title: {
    default: "Puls Wyborczy | Niezależne Prognozy i Sondaże",
    template: "%s | Puls Wyborczy",
  },
  description: "Niezależny agregator sondaży wyborczych w Polsce. Oddziela realne zmiany poparcia od błędu próby i odchyleń pracowni, z przedziałami niepewności i mandatami w Sejmie.",
  keywords: [
    "wybory",
    "sondaże",
    "prognoza wyborcza",
    "Puls Wyborczy",
    "pulswyborczy.pl",
    "agregator sondaży",
    "efekt pracowni",
    "Sejm RP",
    "mandaty Sejm",
    "przedział niepewności",
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
    title: "Puls Wyborczy | Niezależne Prognozy i Sondaże",
    description: "Sondaże 13 pracowni w jednym modelu: realne poparcie po odjęciu błędu próby i odchyleń pracowni, z uczciwym przedziałem niepewności.",
    url: "https://pulswyborczy.pl",
    siteName: "Puls Wyborczy",
    locale: "pl_PL",
    type: "website",
    images: [
      {
        url: "https://pulswyborczy.pl/og-image.png",
        width: 1200,
        height: 630,
        alt: "Puls Wyborczy | Niezależne Prognozy i Sondaże",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@takzendev",
    title: "Puls Wyborczy | Sondaże i Prognozy Wyborcze",
    description: "Agregator sondaży: realne poparcie partii z przedziałem niepewności i szacunkiem mandatów.",
    creator: "@takzendev",
    images: ["https://pulswyborczy.pl/og-image.png"],
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
      "description": "Niezależny agregator sondaży wyborczych: model przestrzeni stanów z estymowanymi efektami pracowni i skalibrowaną niepewnością.",
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
