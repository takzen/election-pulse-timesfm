import React from "react";
import forecastsData from "../public/data/forecasts.json";
import { PartyCard } from "@/components/PartyCard";
import { MajorityBar } from "@/components/MajorityBar";
import { FanChart } from "@/components/FanChart";
import { PocketbookSimulator } from "@/components/PocketbookSimulator";
import { TwitterCardExport } from "@/components/TwitterCardExport";
import { AdSidebar } from "@/components/AdSidebar";
import { Activity, Calendar, Award, ExternalLink } from "lucide-react";

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
      {/* Full width container spanning edge-to-edge with generous margins */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-7 space-y-7">
        {/* Top Header Bar - Calm, Professional Editorial Style */}
        <header className="w-full border-b border-slate-800/80 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded border border-slate-700/80 bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                Google TimesFM 3.0 (330M) • Multivariate Foundation Model
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
                ElectionPulse-TimesFM
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Natywny model probabilistyczny od Google Research prognozujący poparcie 9 partii i niezdecydowanych. Analizuje równolegle sondaże (IBRiS, United Surveys, CBOS), trendy wyszukiwań, inflację CPI i stopy referencyjne NBP.
              </p>
            </div>

            {/* Quick specs pill */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d121f] px-3 py-1.5 text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Horyzont: <strong>{metadata.horizon_days} dni</strong> ({metadata.target_date})</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0d121f] px-3 py-1.5 text-slate-300">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <span>Baza danych: <strong>{metadata.cutoff_date}</strong></span>
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

        {/* 10 Entities Cards - Symmetrical 2x5 Grid */}
        <section className="w-full space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Prognoza Poparcia wg Modeli Sondażowych (Stan na {metadata.target_date})
            </h2>
            <span className="text-[11px] text-slate-400">
              Suma znormalizowana do 100%
            </span>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(parties_meta).map(([key, meta]) => (
              <PartyCard key={key} partyKey={key} meta={meta as any} />
            ))}
          </div>
        </section>

        {/* 2-Column Dashboard Body: Wide Main Workspace (10 cols) + Dedicated Right Sidebar (2 cols) */}
        <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Main Analytics Content */}
          <div className="lg:col-span-9 xl:col-span-10 space-y-7">
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

            {/* Model Arena & Inflections Side-by-Side */}
            <section className="w-full grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Model Arena */}
              <div className="rounded-xl border border-slate-800/90 bg-[#0d121f] p-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <div className="rounded bg-slate-800 p-1 text-slate-300">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Arena Modeli: TimesFM 3.0 vs Metody Klasyczne</h3>
                    <p className="text-[11px] text-slate-400">
                      Zestawienie predykcji końcowych (horyzont 30 dni)
                    </p>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2 font-medium">Partia</th>
                        <th className="py-2 font-semibold text-slate-200">TimesFM 3.0</th>
                        <th className="py-2 font-medium">LightGBM</th>
                        <th className="py-2 font-medium">ARIMA</th>
                        <th className="py-2 font-medium">EWMA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                      {Object.entries(baselines_comparison).map(([party, comp]: [string, any]) => (
                        <tr key={party} className="hover:bg-slate-800/20 transition">
                          <td className="py-2 font-sans font-medium text-slate-300">{party.replace("_", " ")}</td>
                          <td className="py-2 font-bold text-slate-100">{comp.TimesFM_3}%</td>
                          <td className="py-2 text-slate-400">{comp.LightGBM}%</td>
                          <td className="py-2 text-slate-400">{comp.ARIMA}%</td>
                          <td className="py-2 text-slate-400">{comp.EWMA}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Inflection Points */}
              <div className="rounded-xl border border-slate-800/90 bg-[#0d121f] p-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <div className="rounded bg-slate-800 p-1 text-slate-300">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Wykryte Szoki & Zmiany Dynamiki</h3>
                    <p className="text-[11px] text-slate-400">
                      Punkty przegięcia trendu skorelowane z wydarzeniami politycznymi
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {inflections.slice(0, 5).map((inf: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between rounded border border-slate-800/80 bg-slate-900/50 p-2.5 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{inf.party.replace("_", " ")}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{inf.date}</span>
                        </div>
                        {inf.event_label && (
                          <div className="mt-0.5 text-[11px] text-slate-400">{inf.event_label}</div>
                        )}
                      </div>
                      <span className={`font-mono text-xs font-semibold ${inf.shift_magnitude > 0 ? "text-emerald-400" : "text-rose-400"}`}>
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

          {/* Right Rail: TAKZEN DEV + Sponsorship Slots */}
          <div className="lg:col-span-3 xl:col-span-2 w-full">
            <AdSidebar />
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full mt-12 border-t border-slate-800/80 pt-6 pb-10 text-center text-xs text-slate-400 space-y-1.5">
          <p>
            Projekt stworzony przez{" "}
            <a
              href="https://takzendev.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-300 hover:text-white underline underline-offset-2 inline-flex items-center gap-1"
            >
              TAKZEN DEV <ExternalLink className="h-3 w-3" />
            </a>{" "}
            | Silnik badawczy: <strong>Google Research TimesFM 3.0</strong> (PyTorch).
          </p>
          <p className="text-slate-400">
            Źródła: IBRiS, United Surveys, CBOS, Opinia24, Pollster | Wskaźniki: Google Trends, Wikimedia REST, NBP, GUS
          </p>
        </footer>
      </main>
    </div>
  );
}
