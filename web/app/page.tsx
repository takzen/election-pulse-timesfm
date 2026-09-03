import React from "react";
import forecastsData from "../public/data/forecasts.json";
import { PartyCard } from "@/components/PartyCard";
import { MajorityBar } from "@/components/MajorityBar";
import { FanChart } from "@/components/FanChart";
import { PocketbookSimulator } from "@/components/PocketbookSimulator";
import { TwitterCardExport } from "@/components/TwitterCardExport";
import { AdSidebar } from "@/components/AdSidebar";
import { Cpu, Activity, Calendar, Award, ExternalLink } from "lucide-react";

export default function Home() {
  const { metadata, parties_meta, history, forecast_chart, scenarios_grid, baselines_comparison, inflections } = forecastsData;

  const coalitionTotal = roundOne(
    (parties_meta["KO"]?.forecast || 0) +
    (parties_meta["Trzecia_Droga"]?.forecast || 0) +
    (parties_meta["Lewica"]?.forecast || 0)
  );

  const oppositionTotal = roundOne(
    (parties_meta["PiS"]?.forecast || 0) +
    (parties_meta["Konfederacja"]?.forecast || 0)
  );

  function roundOne(n: number) {
    return Math.round(n * 10) / 10;
  }

  return (
    <div className="min-h-screen w-full bg-[#070a12] text-slate-100 antialiased">
      {/* Full width container spanning edge-to-edge with generous margins */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8 space-y-8">
        {/* Top Header Bar */}
        <header className="w-full border-b border-slate-800/80 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                </span>
                Google TimesFM 3.0 (330M) • Multivariate Foundation Model
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                🗳️ ElectionPulse-TimesFM
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-4xl leading-relaxed">
                Natywny model szeregów czasowych od Google Research prognozujący poparcie wyborcze w Polsce. Analizuje jednocześnie nieregularne sondaże, trendy Google, zainteresowanie na Wikipedii, inflację CPI i stopy NBP w architekturze Stacked Mixing Transformer.
              </p>
            </div>

            {/* Quick specs pill */}
            <div className="flex flex-wrap gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-slate-300 shadow">
                <Calendar className="h-4 w-4 text-orange-400" />
                <span>Horyzont: <strong>{metadata.horizon_days} dni</strong> ({metadata.target_date})</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-slate-300 shadow">
                <Activity className="h-4 w-4 text-blue-400" />
                <span>Stan danych: <strong>{metadata.cutoff_date}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-slate-300 shadow">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span>Akceleracja: <strong>RTX 4060 CUDA</strong></span>
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

        {/* Top 5 Parties Cards - Full Width with generous breathing room */}
        <section className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Prognoza Poparcia na Dzień Wyborów ({metadata.target_date})
            </h2>
            <span className="text-xs text-slate-400">
              Wszystkie wartości znormalizowane do 100%
            </span>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {Object.entries(parties_meta).map(([key, meta]) => (
              <PartyCard key={key} partyKey={key} meta={meta as any} />
            ))}
          </div>
        </section>

        {/* 2-Column Dashboard Body: Wide Main Workspace (10 cols) + Dedicated Right Sidebar (2 cols) */}
        <div className="w-full grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Main Analytics Content */}
          <div className="lg:col-span-9 xl:col-span-10 2xl:col-span-10 space-y-10">
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
            <section className="w-full grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Model Arena */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Arena Modeli: AI vs Statystyka</h3>
                    <p className="text-xs text-slate-400">
                      Porównanie TimesFM 3.0 z klasycznymi modelami szeregów czasowych
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2.5 font-semibold">Partia</th>
                        <th className="py-2.5 font-semibold text-orange-400">TimesFM 3.0</th>
                        <th className="py-2.5 font-semibold">LightGBM</th>
                        <th className="py-2.5 font-semibold">ARIMA</th>
                        <th className="py-2.5 font-semibold">EWMA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {Object.entries(baselines_comparison).map(([party, comp]: [string, any]) => (
                        <tr key={party} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 font-sans font-semibold text-slate-200">{party.replace("_", " ")}</td>
                          <td className="py-2.5 font-bold text-orange-400">{comp.TimesFM_3}%</td>
                          <td className="py-2.5 text-slate-300">{comp.LightGBM}%</td>
                          <td className="py-2.5 text-slate-400">{comp.ARIMA}%</td>
                          <td className="py-2.5 text-slate-400">{comp.EWMA}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Inflection Points */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Wykryte Szoki Poparcia</h3>
                    <p className="text-xs text-slate-400">
                      Punkty przegięcia trendu skorelowane z debatami i wydarzeniami
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {inflections.slice(0, 5).map((inf: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{inf.party.replace("_", " ")}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{inf.date}</span>
                        </div>
                        {inf.event_label && (
                          <div className="mt-1 text-slate-300 font-medium">{inf.event_label}</div>
                        )}
                      </div>
                      <span className={`font-mono font-bold ${inf.shift_magnitude > 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
          <div className="lg:col-span-3 xl:col-span-2 2xl:col-span-2 w-full">
            <AdSidebar />
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full mt-16 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs text-slate-400 space-y-2">
          <p>
            Projekt stworzony przez{" "}
            <a
              href="https://takzendev.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-orange-400 hover:text-orange-300 underline underline-offset-4 inline-flex items-center gap-1"
            >
              TAKZEN DEV <ExternalLink className="h-3 w-3" />
            </a>{" "}
            | Silnik AI: <strong>Google Research TimesFM 3.0</strong> (PyTorch).
          </p>
          <p>
            Dane sondażowe: CBOS, IBRiS, United Surveys, Pollster, Opinia24 | Zainteresowanie: Google Trends & Wikimedia REST API | Makro: NBP & GUS
          </p>
          <p className="text-slate-500">
            Wagi modelu objęte licencją TimesFM Non-Commercial License v1.0. Prognozy mają charakter probabilistyczny.
          </p>
        </footer>
      </main>
    </div>
  );
}
