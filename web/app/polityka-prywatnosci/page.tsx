import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Server, Cookie, Scale } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Polityka prywatności i nota prawna | Puls Wyborczy",
  description: "Zasady prywatności, ochrony danych oraz nota prawna serwisu Puls Wyborczy (pulswyborczy.pl).",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 antialiased selection:bg-slate-700 selection:text-white">
      {/* Full width container with generous responsive margins matching main dashboard */}
      <main className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-8 sm:py-12 space-y-10">
        {/* Top Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-xl border border-slate-700 bg-[#0e1424] px-5 py-3 text-base font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Wróć do strony głównej</span>
          </Link>

          <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800 pb-8">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Polityka prywatności i nota prawna
              </h1>
              <p className="mt-2 text-base sm:text-lg text-slate-300">
                Serwis Puls Wyborczy (<strong>pulswyborczy.pl</strong>) • Ostatnia aktualizacja: wrzesień 2026 r.
              </p>
            </div>
            <Logo size="md" withLink={false} />
          </div>
        </div>

        {/* Content Sections with Large, Legible Typography */}
        <div className="space-y-8 text-base sm:text-lg lg:text-xl leading-relaxed text-slate-200">
          {/* Section 1: Administrator */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 sm:p-10 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-white font-extrabold text-xl sm:text-2xl">
              <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <h2>1. Administrator danych osobowych</h2>
            </div>
            <p>
              Właścicielem i administratorem platformy analitycznej <strong>Puls Wyborczy</strong> (dostępnej pod adresem <strong className="text-white">pulswyborczy.pl</strong>) jest <strong className="text-white">TAKZEN DEV</strong> (<a href="https://takzendev.pl" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">https://takzendev.pl</a>).
            </p>
            <p>
              W sprawach dotyczących działania serwisu, ochrony prywatności lub pytań technicznych możesz kontaktować się bezpośrednio drogą elektroniczną:
            </p>
            <div className="pt-2">
              <a
                href="mailto:takzen.app@gmail.com"
                className="inline-flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-mono text-base sm:text-lg font-bold text-white hover:bg-slate-700 transition"
              >
                <Mail className="h-5 w-5 text-emerald-400" />
                <span>takzen.app@gmail.com</span>
              </a>
            </div>
          </section>

          {/* Section 2: Cookies & Tracking */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 sm:p-10 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-white font-extrabold text-xl sm:text-2xl">
              <Cookie className="h-6 w-6 text-[#d97706] flex-shrink-0" />
              <h2>2. Brak ciasteczek śledzących i narzędzi profilujących</h2>
            </div>
            <p>
              <strong>Puls Wyborczy stawia na pełną prywatność i czysty interfejs:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2.5 pl-2 text-slate-200">
              <li>Serwis <strong className="text-white">NIE stosuje</strong> żadnych zewnętrznych plików cookies śledzących (third-party cookies).</li>
              <li>Serwis <strong className="text-white">NIE instaluje</strong> pikseli marketingowych (Meta Pixel, TikTok Pixel, Google Ads).</li>
              <li>Serwis <strong className="text-white">NIE korzysta</strong> z narzędzi rejestrujących zachowanie czy ruch kursora (takich jak Hotjar czy Clarity).</li>
              <li>Serwis <strong className="text-white">NIE prowadzi profilowania</strong> behawioralnego ani zautomatyzowanego targetowania reklam.</li>
              <li>Z uwagi na całkowity brak cookies śledzących, nie wyświetlamy irytujących pop-upów i banerów ze zgodami.</li>
            </ul>
          </section>

          {/* Section 3: Server Logs */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 sm:p-10 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-white font-extrabold text-xl sm:text-2xl">
              <Server className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <h2>3. Bezpieczeństwo i logi serwera</h2>
            </div>
            <p>
              Strona jest hostowana na globalnej infrastrukturze brzegowej Vercel Inc. Każde żądanie sieciowe jest rejestrowane w standardowych technicznych logach serwera (adres IP, data, typ przeglądarki).
            </p>
            <p>
              Informacje te służą wyłącznie do zapewnienia bezpieczeństwa sieciowego, ochrony przed atakami DDoS oraz prawidłowego serwowania zasobów. Dane te nie są łączone z konkretnymi osobami ani przekazywane podmiotom trzecim w celach komercyjnych.
            </p>
          </section>

          {/* Section 4: Legal Disclaimer & AI Act */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 sm:p-10 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-white font-extrabold text-xl sm:text-2xl">
              <Scale className="h-6 w-6 text-purple-400 flex-shrink-0" />
              <h2>4. Nota prawna i status modelu AI</h2>
            </div>
            <p>
              Wszystkie wykresy, estymacje poparcia, wachlarze kwantyli (p10–p90) oraz symulacje gospodarcze prezentowane w serwisie <strong>Puls Wyborczy</strong> mają charakter <strong className="text-white">wyłącznie analityczno-badawczy i edukacyjny</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2.5 pl-2 text-slate-200">
              <li>
                <strong>Źródła danych:</strong> Analizy bazują na oficjalnych sondażach pracowni badawczych (IBRiS, United Surveys, CBOS, Pollster, Opinia24), wskaźnikach Narodowego Banku Polskiego (NBP), Głównego Urzędu Statystycznego (GUS) oraz trendach zapytań Google Trends.
              </li>
              <li>
                <strong>Model Google TimesFM 3.0:</strong> Trajektorie są generowane przez model transformerowy <em>TimesFM 3.0</em> od Google Research. Nie stanowią one oficjalnych wyników wyborów, badań socjologicznych w rozumieniu prawa prasowego ani gwarancji przyszłego wyniku.
              </li>
              <li>
                <strong>Brak skutków prawnych:</strong> Model nie podejmuje żadnych zautomatyzowanych decyzji wywołujących skutki prawne wobec osób fizycznych.
              </li>
              <li>
                <strong>Wyłączenie odpowiedzialności:</strong> Administrator nie odpowiada za jakiekolwiek decyzje polityczne, inwestycyjne czy społeczne podejmowane na podstawie prezentowanych wyliczeń.
              </li>
            </ul>
          </section>

          {/* Section 5: User Rights */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 sm:p-10 shadow-md space-y-4">
            <h2 className="text-white font-extrabold text-xl sm:text-2xl">5. Prawa użytkownika (RODO)</h2>
            <p>
              W przypadku bezpośredniego kontaktu e-mailowego przysługuje Ci pełne prawo dostępu do treści swoich danych, ich poprawienia, usunięcia lub ograniczenia przetwarzania. Wszelkie zapytania można kierować na adres: <strong className="text-white">takzen.app@gmail.com</strong>.
            </p>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-base text-slate-300">
          <span>PulsWyborczy.pl • Stworzone przez TAKZEN DEV</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 font-bold text-white hover:bg-slate-700 transition"
          >
            <span>Wróć do strony głównej</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  );
}
