import React from "react";
import Link from "next/link";
import forecastsData from "../public/data/forecasts.json";
import { Logo } from "@/components/Logo";
import { PartyCard } from "@/components/PartyCard";
import { MajorityBar } from "@/components/MajorityBar";
import { FanChart } from "@/components/FanChart";
import { TwitterCardExport } from "@/components/TwitterCardExport";
import { AdSidebar } from "@/components/AdSidebar";
import { Activity, Calendar, Award, ExternalLink } from "lucide-react";

export default function Home() {
  const { metadata, parties_meta, history, forecast_chart, baselines_comparison } = forecastsData;

  // Governing coalition: KO + PSL + Polska 2050 + Nowa Lewica
  const coalitionTotal = roundOne(
    (parties_meta["KO"]?.forecast || 0) +
    (parties_meta["PSL"]?.forecast || 0) +
    (parties_meta["Polska_2050"]?.forecast || 0) +
    (parties_meta["Lewica"]?.forecast || 0)
  );

  // Parliamentary opposition: PiS + Konfederacja + KKP + Rozwój Plus + Razem
  const oppositionTotal = roundOne(
    (parties_meta["PiS"]?.forecast || 0) +
    (parties_meta["Konfederacja"]?.forecast || 0) +
    (parties_meta["KKP"]?.forecast || 0) +
    (parties_meta["Rozwoj_Plus"]?.forecast || 0) +
    (parties_meta["Razem"]?.forecast || 0)
  );

  function roundOne(n: number) {
    return Math.round(n * 10) / 10;
  }

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 antialiased selection:bg-slate-700 selection:text-white">
      {/* Full width container spanning edge-to-edge with responsive margins */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 py-6 sm:py-8 space-y-8">
        {/* Top Header Bar - Editorial Style with Official Logo */}
        <header className="w-full border-b border-slate-800/80 pb-5 sm:pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              {/* Official Brand Logo */}
              <div className="shrink-0">
                <Logo size="lg" />
              </div>

              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
                Niezależny model probabilistyczny prognozujący poparcie 9 partii i grupy niezdecydowanych. Silnik <strong>Google TimesFM 3.0</strong> analizuje równolegle sondaże (IBRiS, United Surveys, CBOS), trendy wyszukiwań w sieci, inflację CPI i decyzje RPP o stopach referencyjnych NBP.
              </p>
            </div>

            {/* Quick specs pill */}
            <div className="flex flex-wrap gap-2.5 text-xs sm:text-sm shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0e1424] px-3.5 py-2 text-slate-200 shadow-sm">
                <Activity className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Ostatnie sondaże: <strong className="text-white">{metadata.cutoff_date}</strong></span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0e1424] px-3.5 py-2 text-slate-200 shadow-sm">
                <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Prognoza modelu: <strong className="text-white">+{metadata.horizon_days} dni</strong> (do {metadata.target_date})</span>
              </div>
            </div>
          </div>
        </header>

        {/* Parliamentary Majority Bar - Full Width */}
        <section className="w-full">
          <MajorityBar
            coalitionTotal={coalitionTotal}
            oppositionTotal={oppositionTotal}
          />
        </section>

        {/* 10 Entities Cards - Spacious Responsive Grid */}
        <section className="w-full space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-2.5 gap-1">
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase">
              Prognoza AI na 30 dni w przód (horyzont do {metadata.target_date})
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Punkt wyjściowy: sondaże z {metadata.cutoff_date} • 9 partii + niezdecydowani
            </p>
          </div>

          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
            {Object.entries(parties_meta).map(([key, meta]) => (
              <PartyCard key={key} partyKey={key} meta={meta as any} />
            ))}
          </div>
        </section>

        {/* Main Workspace Layout */}
        <div className="w-full grid grid-cols-1 gap-8 xl:grid-cols-12 items-start">
          {/* Main Analytics Content */}
          <div className="xl:col-span-10 space-y-8">
            {/* Interactive Fan Chart */}
            <section className="w-full">
              <FanChart
                history={history}
                forecast={forecast_chart}
                partiesMeta={parties_meta as any}
                cutoffDate={metadata.cutoff_date}
              />
            </section>

            {/* Model Arena */}
            <section className="w-full">
              <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-slate-800 p-2 text-slate-200 flex-shrink-0">
                      <Award className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">Arena modeli: TimesFM 3.0 vs metody klasyczne</h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        Porównanie prognozy końcowej na {metadata.target_date} (+30 dni) generowanej przez różne algorytmy
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm sm:text-base">
                    <thead className="border-b border-slate-800 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Partia / Opcja</th>
                        <th className="py-3 px-3 text-white">Google TimesFM 3.0 (AI)</th>
                        <th className="py-3 px-3 text-slate-300">LightGBM (ML)</th>
                        <th className="py-3 px-3 text-slate-300">ARIMA (1,1,1)</th>
                        <th className="py-3 px-3 text-slate-300">EWMA (Średnia ważona)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-sm sm:text-base">
                      {Object.entries(baselines_comparison).map(([party, comp]: [string, any]) => (
                        <tr key={party} className="hover:bg-slate-800/20 transition">
                          <td className="py-3 px-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: (parties_meta as any)[party]?.color || "#64748b" }}
                            />
                            <span>{party.replace("_", " ")}</span>
                          </td>
                          <td className="py-3 px-3 font-black text-white">{comp.TimesFM_3}%</td>
                          <td className="py-3 px-3 text-slate-300">{comp.LightGBM}%</td>
                          <td className="py-3 px-3 text-slate-400">{comp.ARIMA}%</td>
                          <td className="py-3 px-3 text-slate-400">{comp.EWMA}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Public Twitter / X Generator */}
            <section className="w-full">
              <TwitterCardExport
                metadata={metadata}
                partiesMeta={parties_meta as any}
              />
            </section>
          </div>

          {/* Right Rail: TAKZEN DEV + Sponsorship Slots */}
          <div className="xl:col-span-2 w-full">
            <AdSidebar />
          </div>
        </div>

        {/* Footer with Logo */}
        <footer className="w-full mt-12 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs sm:text-sm text-slate-400 space-y-3">
          <div className="flex justify-center">
            <Logo size="sm" />
          </div>
          <p>
            Projekt stworzony przez{" "}
            <a
              href="https://takzendev.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-200 hover:text-white underline underline-offset-4 inline-flex items-center gap-1"
            >
              TAKZEN DEV <ExternalLink className="h-3.5 w-3.5" />
            </a>{" "}
            • Silnik AI: <strong>Google TimesFM 3.0</strong> (PyTorch CUDA)
          </p>
          <p className="text-xs text-slate-400">
            Źródła: IBRiS, United Surveys, CBOS, Opinia24, Pollster | Wskaźniki: Google Trends, Wikimedia REST, NBP, GUS
          </p>
          <div className="pt-2">
            <Link
              href="/polityka-prywatnosci"
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition"
            >
              Polityka prywatności i nota prawna
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
