import React from "react";
import forecastsData from "../public/data/forecasts.json";
import { PartyCard } from "@/components/PartyCard";
import { FanChart } from "@/components/FanChart";
import { PocketbookSimulator } from "@/components/PocketbookSimulator";
import { TwitterCardExport } from "@/components/TwitterCardExport";
import { AdSidebar } from "@/components/AdSidebar";
import { Cpu, Activity, Calendar, Award } from "lucide-react";

export default function Home() {
  const { metadata, parties_meta, history, forecast_chart, scenarios_grid, baselines_comparison, inflections } = forecastsData;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <header className="border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                </span>
                Google TimesFM 3.0 (330M) • Multivariate Foundation Model
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                🗳️ ElectionPulse-TimesFM
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Sztuczna inteligencja prognozująca wybory w Polsce. Łączy nieregularne sondaże, Google Trends, odsłony Wikipedii, inflację CPI i stopy NBP w natywnym transformerze.
              </p>
            </div>

            {/* Quick specs pill */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <Calendar className="h-4 w-4 text-orange-400" />
                <span>Horyzont: <strong>{metadata.horizon_days} dni</strong> ({metadata.target_date})</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <Activity className="h-4 w-4 text-blue-400" />
                <span>Stan danych: <strong>{metadata.cutoff_date}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span>Architektura: <strong>Stacked Mixing</strong></span>
              </div>
            </div>
          </div>
        </header>

        {/* 2-Column Main Layout: Content (9 cols) + Right Ad Sidebar (3 cols) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left / Central Main Content Area */}
          <div className="lg:col-span-9 space-y-10">
            {/* Top 5 Parties Cards */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                Aktualna Prognoza Poparcia na {metadata.target_date}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(parties_meta).map(([key, meta]) => (
                  <PartyCard key={key} partyKey={key} meta={meta as any} />
                ))}
              </div>
            </section>

            {/* Main Interactive Fan Chart */}
            <section>
              <FanChart
                history={history}
                forecast={forecast_chart}
                partiesMeta={parties_meta as any}
                cutoffDate={metadata.cutoff_date}
              />
            </section>

            {/* Pocketbook Voting Simulator */}
            <section>
              <PocketbookSimulator
                scenarios={scenarios_grid as any}
                partiesMeta={parties_meta as any}
              />
            </section>

            {/* Model Arena comparison & Inflections side-by-side */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Model Arena */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Arena Modeli: AI vs Statystyka</h3>
                    <p className="text-xs text-slate-400">
                      TimesFM 3.0 w porównaniu z klasycznymi modelami
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
                          <td className="py-2.5 font-sans font-medium text-slate-200">{party.replace("_", " ")}</td>
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
                      Punkty przegięcia skorelowane z debatami i wydarzeniami
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {inflections.slice(0, 5).map((inf: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{inf.party.replace("_", " ")}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{inf.date}</span>
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

            {/* Twitter Card Generator Section */}
            <section>
              <TwitterCardExport
                metadata={metadata}
                partiesMeta={parties_meta as any}
              />
            </section>
          </div>

          {/* Right Sidebar: Dedicated Ad Rail (TAKZEN DEV + Sponsor slots) */}
          <div className="lg:col-span-3">
            <AdSidebar />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs text-slate-500 space-y-2">
          <p>
            Stworzone przez <strong className="text-orange-400">TAKZEN DEV</strong> | Silnik: <strong>Google Research TimesFM 3.0</strong> (PyTorch).
          </p>
          <p>
            Dane sondażowe: CBOS, IBRiS, United Surveys, Pollster, Opinia24 | Zainteresowanie: Google Trends & Wikimedia REST API | Makro: NBP & GUS
          </p>
          <p className="text-slate-600">
            Wagi modelu objęte licencją TimesFM Non-Commercial License v1.0. Prognozy mają charakter probabilistyczny.
          </p>
        </footer>
      </main>
    </div>
  );
}
