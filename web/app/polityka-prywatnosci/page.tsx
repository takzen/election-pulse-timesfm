import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Server, Cookie, Scale } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Polityka Prywatności i Nota Prawna | Puls Wyborczy",
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
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0e1424] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Wróć do strony głównej</span>
          </Link>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Polityka Prywatności i Nota Prawna
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Serwis Puls Wyborczy (<strong>pulswyborczy.pl</strong>) • Ostatnia aktualizacja: wrzesień 2026 r.
              </p>
            </div>
            <Logo size="sm" withLink={false} />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
          {/* Section 1: Administrator */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2>1. Administrator Danych Osobowych</h2>
            </div>
            <p>
              Właścicielem i administratorem platformy <strong>Puls Wyborczy</strong> (pulswyborczy.pl) jest <strong>TAKZEN DEV</strong> (https://takzendev.pl).
            </p>
            <p>
              W sprawach związanych z funkcjonowaniem platformy, ochroną prywatności lub współpracą można kontaktować się drogą elektroniczną pod dedykowanym adresem e-mail:
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 font-mono text-sm font-bold text-white">
              <Mail className="h-4 w-4 text-slate-400" />
              <a href="mailto:takzen.app@gmail.com" className="hover:underline">
                takzen.app@gmail.com
              </a>
            </div>
          </section>

          {/* Section 2: Cookies & Tracking */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <Cookie className="h-5 w-5 text-[#d97706]" />
              <h2>2. Pliki Cookies i Technologie Śledzące</h2>
            </div>
            <p>
              <strong>Puls Wyborczy szanuje prywatność użytkowników:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li>Serwis <strong>NIE stosuje</strong> plików cookies stron trzecich (third-party tracking cookies).</li>
              <li>Serwis <strong>NIE używa</strong> pikseli śledzących (takich jak Meta Pixel, TikTok Pixel) ani narzędzi nagrywających sesje (np. Hotjar).</li>
              <li>Serwis <strong>NIE prowadzi profilowania behawioralnego</strong> ani zautomatyzowanego targetowania reklamowego.</li>
              <li>Z uwagi na brak cookies śledzących i marketingowych, serwis nie wyświetla inwazyjnych banerów ze zgodami na pliki cookies.</li>
            </ul>
          </section>

          {/* Section 3: Server Logs */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <Server className="h-5 w-5 text-blue-400" />
              <h2>3. Logi Serwerowe i Bezpieczeństwo</h2>
            </div>
            <p>
              Aplikacja jest hostowana na globalnej infrastrukturze brzegowej (Vercel Inc.). Każde zapytanie skierowane do serwera generuje standardowe logi dostępu (zawierające m.in. adres IP, datę i czas zapytania, informacje o przeglądarce i systemie operacyjnym).
            </p>
            <p>
              Logi te służą wyłącznie do zapewnienia stabilności, bezpieczeństwa sieciowego, ochrony przed atakami typu DDoS oraz monitorowania wydajności technicznej. Dane te nie są kojarzone z konkretnymi osobami fizycznymi i podlegają automatycznej rotacji.
            </p>
          </section>

          {/* Section 4: Legal Disclaimer & AI Act */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <Scale className="h-5 w-5 text-purple-400" />
              <h2>4. Nota Prawna i Informacja o Modelu AI</h2>
            </div>
            <p>
              Wszystkie materiały, wykresy, rozkłady prawdopodobieństwa i symulacje dostępne w serwisie <strong>Puls Wyborczy</strong> mają charakter <strong>wyłącznie badawczy, informacyjny i edukacyjny</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li>
                <strong>Niezależność i źródła:</strong> Prognozy opierają się na agregacji publicznie dostępnych badań sondażowych (IBRiS, United Surveys, CBOS, Pollster, Opinia24), wskaźników makroekonomicznych NBP i GUS oraz dynamiki zapytań w Google Trends.
              </li>
              <li>
                <strong>Model AI (Google TimesFM 3.0):</strong> Prezentowane trajektorie i estymacje mandatów są wynikiem obliczeń statystycznych modelu sztucznej inteligencji <em>TimesFM 3.0</em> od Google Research. Nie stanowią one oficjalnych wyników wyborów, sondażu opinii publicznej w rozumieniu prawa prasowego ani obietnicy rezultatu wyborczego.
              </li>
              <li>
                <strong>Brak decyzji prawnych:</strong> Model nie podejmuje żadnych zautomatyzowanych decyzji wywołujących skutki prawne wobec użytkowników.
              </li>
              <li>
                <strong>Wyłączenie odpowiedzialności:</strong> Administrator nie ponosi odpowiedzialności za decyzje polityczne, finansowe lub społeczne podejmowane na podstawie prezentowanych estymacji.
              </li>
            </ul>
          </section>

          {/* Section 5: User Rights */}
          <section className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-sm space-y-3">
            <h2 className="text-white font-bold text-lg">5. Prawa Użytkownika (RODO)</h2>
            <p>
              W zakresie, w jakim dane użytkownika mogą być przetwarzane (np. w przypadku bezpośredniego kontaktu mailowego), przysługuje prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania oraz wniesienia sprzeciwu.
            </p>
            <p>
              Wszelkie żądania można zgłaszać pod adresem: <strong>takzen.app@gmail.com</strong>.
            </p>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-400">
          <span>PulsWyborczy.pl • TAKZEN DEV</span>
          <Link href="/" className="text-white hover:underline font-semibold">
            Wróć do platformy &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
