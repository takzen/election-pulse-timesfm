"use client";

import React, { useState, useMemo } from "react";
import { Sliders, ShieldCheck, Scale } from "lucide-react";

interface Scenario {
  name: string;
  cpi_delta: number;
  rate_delta: number;
  final_support: Record<string, number>;
  delta_from_baseline: Record<string, number>;
  coalition_total: number;
  opposition_total: number;
}

interface PocketbookSimulatorProps {
  scenarios: Scenario[];
  partiesMeta: Record<string, { name: string; color: string }>;
}

export function PocketbookSimulator({ scenarios, partiesMeta }: PocketbookSimulatorProps) {
  const [cpiDelta, setCpiDelta] = useState<number>(0.0);
  const [rateDelta, setRateDelta] = useState<number>(0.0);

  // Find matching scenario from precomputed grid
  const currentScenario = useMemo(() => {
    let closest = scenarios[0];
    let minDiff = Infinity;
    for (const sc of scenarios) {
      const diff = Math.abs(sc.cpi_delta - cpiDelta) + Math.abs(sc.rate_delta - rateDelta);
      if (diff < minDiff) {
        minDiff = diff;
        closest = sc;
      }
    }
    return closest;
  }, [scenarios, cpiDelta, rateDelta]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="rounded-lg bg-slate-800 p-2 text-slate-200 flex-shrink-0">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Symulator Portfela Wyborcy (Pocketbook Voting)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Wpływ decyzji RPP o stopach procentowych i skoków inflacji na poparcie bloków politycznych
          </p>
        </div>
      </div>

      {/* Responsive layout: stacks on mobile & tablet, 2-column on large screens */}
      <div className="mt-6 flex flex-col xl:grid xl:grid-cols-2 gap-6">
        {/* Sliders container */}
        <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          {/* CPI Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-white">
                Zmiana inflacji CPI (r/r)
              </label>
              <span className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 font-mono text-sm sm:text-base font-bold text-white">
                {cpiDelta > 0 ? `+${cpiDelta.toFixed(2)}` : cpiDelta.toFixed(2)} pp
              </span>
            </div>
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.75"
              value={cpiDelta}
              onChange={(e) => setCpiDelta(parseFloat(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-slate-200"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-400 font-semibold">
              <span>-1.50 pp (Dezinflacja)</span>
              <span>Bazowa (0.00)</span>
              <span>+1.50 pp (Drożyzna)</span>
            </div>
          </div>

          {/* NBP Rate Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-white">
                Zmiana stopy referencyjnej NBP
              </label>
              <span className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 font-mono text-sm sm:text-base font-bold text-white">
                {rateDelta > 0 ? `+${rateDelta.toFixed(2)}` : rateDelta.toFixed(2)} pp
              </span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.5"
              value={rateDelta}
              onChange={(e) => setRateDelta(parseFloat(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-slate-200"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-400 font-semibold">
              <span>-1.00 pp (Cięcie stóp)</span>
              <span>Bazowa (0.00)</span>
              <span>+1.00 pp (Podwyżka)</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
            <span className="text-xs sm:text-sm text-slate-300 font-semibold mr-1">Warianty:</span>
            <button
              onClick={() => { setCpiDelta(-1.5); setRateDelta(-1.0); }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Cięcie stóp & dezinflacja
            </button>
            <button
              onClick={() => { setCpiDelta(1.5); setRateDelta(1.0); }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Szok inflacyjny
            </button>
            <button
              onClick={() => { setCpiDelta(0.0); setRateDelta(0.0); }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Status quo
            </button>
          </div>
        </div>

        {/* Results column: NO internal scrollbar, natural full expansion */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Równowaga bloków w wybranym scenariuszu
            </span>

            {/* Coalition & Opposition Stat Boxes */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#0e1424] p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#d97706]" />
                  <span>Koalicja rządowa</span>
                </div>
                <div className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                  {currentScenario.coalition_total.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-0.5">KO + PSL + PL2050 + Lewica</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0e1424] p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                  <Scale className="h-4 w-4 text-[#2563eb]" />
                  <span>Opozycja</span>
                </div>
                <div className="mt-1.5 text-2xl sm:text-3xl font-black text-white">
                  {currentScenario.opposition_total.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-0.5">PiS + Konf + Korona + R+ + Razem</div>
              </div>
            </div>

            {/* Individual party shifts - 2-column grid, NO SCROLLBAR */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Wyniki partii w scenariuszu:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(currentScenario.final_support).map(([pCode, val]) => {
                  const diff = currentScenario.delta_from_baseline[pCode] || 0.0;
                  const pColor = partiesMeta[pCode]?.color || "#64748b";

                  return (
                    <div key={pCode} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-800/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColor }} />
                        <span className="text-slate-200 font-medium truncate">{pCode.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono flex-shrink-0">
                        <span className="text-white font-bold">{val.toFixed(1)}%</span>
                        <span
                          className={`text-xs font-semibold ${
                            diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-slate-500"
                          }`}
                        >
                          ({diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
