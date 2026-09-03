import React from "react";
import forecastsData from "../public/data/forecasts.json";
import { PartyCard } from "@/components/PartyCard";
import { MajorityBar } from "@/components/MajorityBar";
import { FanChart } from "@/components/FanChart";
import { PocketbookSimulator } from "@/components/PocketbookSimulator";
import { TwitterCardExport } from "@/components/TwitterCardExport";
import { AdSidebar } from "@/components/AdSidebar";
import { Activity, Calendar, Award, ExternalLink, Cpu } from "lucide-react";

export default function Home() {
  const { metadata, parties_meta, history, forecast_chart, scenarios_grid, baselines_comparison, inflections } = forecastsData;

  // Koalicja rządowa: KO + PSL + Polska 2050 + Nowa Lewica
  const coalitionTotal = roundOne(
    (parties_meta["KO"]?.forecast || 0) +
    (parties_meta["PSL"]?.forecast || 0) +
    (parties_meta["Polska_2050"]?.forecast || 0) +
    (parties_meta["Lewica"]?.forecast || 0)
  );

  // Opozycja parlamentarna: PiS + Konfederacja + KKP + Rozwój Plus + Razem
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
        {/* Top Header Bar - Clean, Professional Editorial Style */}
        <header className="w-full border-b border-slate-800/80 pb-5 sm:pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* Prominent Model Info Badge at Top */}
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-200">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span>Model analityczny AI: <strong>Google TimesFM 3.0</strong> (Multivariate Foundation Model, 330M)</span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-baseline gap-3">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  Puls Wyborczy
                </h1>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs sm:text-sm font-mono font-semibold text-slate-300">
                  pulswyborczy.pl
                </span>
              </div>

              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
                Niezależny model probabilistyczny prognozujący poparcie 9 partii i grupy niezdecydowanych. Silnik <strong>Google TimesFM 3.0</strong> analizuje równolegle sondaże (IBRiS, United Surveys, CBOS), trendy wyszukiwań w sieci, inflację CPI i decyzje RPP o stopach referencyjnych NBP.
              </p>
            </div>

            {/* Quick specs pill */}
            <div className="flex flex-wrap gap-2.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0e1424] px-3.5 py-2 text-slate-200 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>Horyzont prognozy: <strong className="text-white">{metadata.horizon_days} dni</strong> ({metadata.target_date})</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0e1424] px-3.5 py-2 text-slate-200 shadow-sm">
                <Activity className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>Stan bazy: <strong className="text-white">{metadata.cutoff_date}</strong></span>
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

        {/* 10 Entities Cards - Spacious Responsive Grid (1 col mobile, 2 col tablet, 3-5 col desktop) */}
        <section className="w-full space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-2.5 gap-1">
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase">
              Prognoza Poparcia wg Modeli Sondażowych (Stan na {metadata.target_date})
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              9 partii politycznych + Niezdecydowani (suma 100%)
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
          {/* Main Analytics Content (Full width on tablet/mobile, 10 cols on wide desktop) */}
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

            {/* Pocketbook Voting Simulator */}
            <section className="w-full">
              <PocketbookSimulator
                scenarios={scenarios_grid as any}
                partiesMeta={parties_meta as any}
              />
            </section>

            {/* Model Arena & Inflections - NO INTERNAL SCROLLBARS */}
            <section className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Arena */}
              <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                    <div className="rounded-lg bg-slate-800 p-2 text-slate-200">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">Arena Modeli: TimesFM 3.0 vs Metody Klasyczne</h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        Zestawienie predykcji końcowych dla horyzontu 30 dni
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm sm:text-base">
                      <thead className="border-b border-slate-800 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-2">Partia</th>
                          <th className="py-2.5 px-2 text-white">TimesFM 3.0</th>
                          <th className="py-2.5 px-2">LightGBM</th>
                          <th className="py-2.5 px-2">ARIMA</th>
                          <th className="py-2.5 px-2">EWMA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-sm sm:text-base">
                        {Object.entries(baselines_comparison).map(([party, comp]: [string, any]) => (
                          <tr key={party} className="hover:bg-slate-800/20 transition">
                            <td className="py-2.5 px-2 font-sans font-medium text-slate-200">{party.replace("_", " ")}</td>
                            <td className="py-2.5 px-2 font-black text-white">{comp.TimesFM_3}%</td>
                            <td className="py-2.5 px-2 text-slate-300">{comp.LightGBM}%</td>
                            <td className="py-2.5 px-2 text-slate-400">{comp.ARIMA}%</td>
                            <td className="py-2.5 px-2 text-slate-400">{comp.EWMA}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Inflection Points */}
              <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                  <div className="rounded-lg bg-slate-800 p-2 text-slate-200">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Wykryte Szoki & Zmiany Dynamiki</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Punkty przegięcia trendu skorelowane z wydarzeniami politycznymi
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {inflections.slice(0, 5).map((inf: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-sm sm:text-base shadow-sm">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-white text-base">{inf.party.replace("_", " ")}</span>
                          <span className="text-xs text-slate-400 font-mono">{inf.date}</span>
                        </div>
                        {inf.event_label && (
                          <div className="mt-1 text-xs sm:text-sm text-slate-300">{inf.event_label}</div>
                        )}
                      </div>
                      <span className={`font-mono text-sm sm:text-base font-black flex-shrink-0 ml-2 ${inf.shift_magnitude > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {inf.shift_magnitude > 0 ? `+${inf.shift_magnitude.toFixed(1)}` : inf.shift_magnitude.toFixed(1)} pp
                      </span>
                    </div>
                  ))}
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

          {/* Right Rail: TAKZEN DEV + Sponsorship Slots (Clean stack on mobile/tablet) */}
          <div className="xl:col-span-2 w-full">
            <AdSidebar />
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full mt-12 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs sm:text-sm text-slate-400 space-y-2">
          <p>
            <strong>PulsWyborczy.pl</strong> • Projekt stworzony przez{" "}
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
        </footer>
      </main>
    </div>
  );
}
