"use client";

import React, { useState, useMemo } from "react";
import { Sliders, Zap, ShieldCheck, Scale } from "lucide-react";

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
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Symulator Portfela Wyborcy (Pocketbook Voting)</h2>
          <p className="text-xs text-slate-400">
            Zbadaj na żywo: jak decyzje RPP o stopach i skoki inflacji przesuwają głosy Polaków
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Sliders container */}
        <div className="space-y-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
          {/* CPI Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200">
                Zmiana inflacji CPI (r/r)
              </label>
              <span className="rounded-md bg-slate-800 px-2.5 py-0.5 font-mono text-xs font-bold text-orange-400">
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
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-orange-500"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>-1.50 pp (Dezinflacja)</span>
              <span>Bazowa (0.00)</span>
              <span>+1.50 pp (Wzrost cen)</span>
            </div>
          </div>

          {/* NBP Rate Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200">
                Zmiana stopy referencyjnej NBP
              </label>
              <span className="rounded-md bg-slate-800 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-400">
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
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>-1.00 pp (Cięcie stóp)</span>
              <span>Bazowa (0.00)</span>
              <span>+1.00 pp (Podwyżka)</span>
            </div>
          </div>

          {/* Scenario quick buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-slate-400 self-center">Gotowe scenariusze:</span>
            <button
              onClick={() => { setCpiDelta(-1.5); setRateDelta(-1.0); }}
              className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              🚀 Złoty wiek (stopy -100pb, CPI -1.5%)
            </button>
            <button
              onClick={() => { setCpiDelta(1.5); setRateDelta(1.0); }}
              className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              ⚠️ Szok drożyzny (CPI +1.5%)
            </button>
            <button
              onClick={() => { setCpiDelta(0.0); setRateDelta(0.0); }}
              className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              🔄 Reset (Status quo)
            </button>
          </div>
        </div>

        {/* Results column */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Równowaga bloków politycznych
            </span>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-orange-400" />
                  <span>Koalicja Rządowa</span>
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  {currentScenario.coalition_total.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">KO + Trzecia Droga + Lewica</div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Scale className="h-4 w-4 text-blue-400" />
                  <span>Opozycja</span>
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  {currentScenario.opposition_total.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">PiS + Konfederacja</div>
              </div>
            </div>

            {/* Individual party shifts */}
            <div className="mt-5 space-y-2">
              <div className="text-xs font-semibold text-slate-400">Wpływ na poparcie partii:</div>
              {Object.entries(currentScenario.final_support).map(([pCode, val]) => {
                const diff = currentScenario.delta_from_baseline[pCode] || 0.0;
                const pColor = partiesMeta[pCode]?.color || "#94a3b8";

                return (
                  <div key={pCode} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pColor }} />
                      <span className="font-medium text-slate-200">{pCode.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-100 font-bold">{val.toFixed(1)}%</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-slate-500"
                        }`}
                      >
                        ({diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} pp)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-orange-500/10 p-3 text-xs text-orange-300 border border-orange-500/20">
            <span className="font-semibold">💡 Wniosek modelu TimesFM 3.0: </span>
            {currentScenario.cpi_delta < 0
              ? "Spadek inflacji i obniżki stóp wzmacniają zaufanie do rządu (KO/TD), podczas gdy opozycja traci impet na braku kryzysu cenowego."
              : currentScenario.cpi_delta > 0
              ? "Wzrost cen żywności i rat kredytów napędza protest voterów w stronę Konfederacji i PiS kosztem partii koalicyjnych."
              : "Obecna równowaga gospodarcza utrzymuje stabilny układ sił z lekką przewagą koalicji."}
          </div>
        </div>
      </div>
    </div>
  );
}
