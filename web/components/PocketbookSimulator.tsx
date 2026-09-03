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
    <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-md">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
        <div className="rounded-md bg-slate-800 p-2 text-slate-300">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Symulator Portfela Wyborcy (Pocketbook Voting)</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Wpływ decyzji RPP o stopach i skoków inflacji na poparcie bloków politycznych
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sliders container */}
        <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          {/* CPI Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">
                Zmiana inflacji CPI (r/r)
              </label>
              <span className="rounded-md bg-slate-800 px-3 py-1 font-mono text-sm font-bold text-slate-100">
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
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded bg-slate-700 accent-slate-200"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-400 font-medium">
              <span>-1.50 pp (Dezinflacja)</span>
              <span>Bazowa (0.00)</span>
              <span>+1.50 pp (Wzrost cen)</span>
            </div>
          </div>

          {/* NBP Rate Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200">
                Zmiana stopy referencyjnej NBP
              </label>
              <span className="rounded-md bg-slate-800 px-3 py-1 font-mono text-sm font-bold text-slate-100">
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
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded bg-slate-700 accent-slate-200"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-400 font-medium">
              <span>-1.00 pp (Cięcie stóp)</span>
              <span>Bazowa (0.00)</span>
              <span>+1.00 pp (Podwyżka)</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs sm:text-sm text-slate-400 self-center font-medium">Gotowe warianty:</span>
            <button
              onClick={() => { setCpiDelta(-1.5); setRateDelta(-1.0); }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              Cięcie stóp & dezinflacja
            </button>
            <button
              onClick={() => { setCpiDelta(1.5); setRateDelta(1.0); }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              Szok inflacyjny
            </button>
            <button
              onClick={() => { setCpiDelta(0.0); setRateDelta(0.0); }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              Status quo
            </button>
          </div>
        </div>

        {/* Results column */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Równowaga bloków politycznych
            </span>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#0e1424] p-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                  <ShieldCheck className="h-4 w-4 text-[#d97706]" />
                  <span>Koalicja rządowa</span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  {currentScenario.coalition_total.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-0.5">KO + PSL + PL2050 + Lewica</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0e1424] p-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                  <Scale className="h-4 w-4 text-[#2563eb]" />
                  <span>Opozycja</span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  {currentScenario.opposition_total.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-0.5">PiS + Konf + Korona + R+ + Razem</div>
              </div>
            </div>

            {/* Individual party shifts */}
            <div className="mt-4 space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {Object.entries(currentScenario.final_support).map(([pCode, val]) => {
                const diff = currentScenario.delta_from_baseline[pCode] || 0.0;
                const pColor = partiesMeta[pCode]?.color || "#64748b";

                return (
                  <div key={pCode} className="flex items-center justify-between text-sm py-1 border-b border-slate-800/40">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                      <span className="text-slate-200 font-medium">{pCode.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
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
  );
}
