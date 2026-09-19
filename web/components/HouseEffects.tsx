"use client";

import React from "react";
import { Scale } from "lucide-react";

interface HouseEffect {
  pollster: string;
  n_polls: number;
  effects: Record<string, number>;
}

interface HouseEffectsProps {
  houseEffects: HouseEffect[];
  parties: Array<{ key: string; name: string; color: string }>;
}

/**
 * Per-pollster bias, estimated from the data.
 *
 * This is the one number here that no other Polish tracker publishes, and it is what
 * lets a reader tell a real shift from a pollster's habit: if a firm reads PiS three
 * points high every time, a "jump" in its next poll is mostly that habit.
 */
export function HouseEffects({ houseEffects, parties }: HouseEffectsProps) {
  const [selected, setSelected] = React.useState(parties[0]?.key ?? "KO");

  if (!houseEffects.length) return null;

  const rows = houseEffects
    .map((row) => ({ ...row, value: row.effects[selected] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.value)), 1);

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-wide text-white uppercase">
          <Scale className="h-4 w-4 flex-shrink-0 text-emerald-400" />
          Efekt pracowni
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          O ile dana pracownia systematycznie zawyża lub zaniża poparcie względem
          pozostałych. Wyliczone z danych, nie założone.{" "}
          <span className="text-slate-400">
            Dlatego kolejny sondaż tej samej pracowni rzadko oznacza realną zmianę
            nastrojów.
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {parties.map((party) => (
          <button
            key={party.key}
            type="button"
            onClick={() => setSelected(party.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              selected === party.key
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {party.key}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row) => {
          const width = (Math.abs(row.value) / maxAbs) * 50;
          const positive = row.value >= 0;
          return (
            <div key={row.pollster} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate text-slate-200" title={row.pollster}>
                {row.pollster}
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-500">
                {row.n_polls}
              </span>
              <div className="relative h-5 flex-1 rounded bg-slate-800/60">
                <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
                <div
                  className={`absolute top-0.5 h-4 rounded ${
                    positive ? "bg-emerald-500/70" : "bg-rose-500/70"
                  }`}
                  style={{
                    width: `${width}%`,
                    left: positive ? "50%" : `${50 - width}%`,
                  }}
                />
              </div>
              <span
                className={`w-16 shrink-0 text-right font-mono text-xs font-bold ${
                  positive ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {row.value >= 0 ? "+" : ""}
                {row.value.toFixed(2)} pp
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">
        Liczba w drugiej kolumnie to liczba sondaży danej pracowni w modelu. Pracownie
        z mniej niż pięcioma sondażami są pomijane, bo ich efekt byłby nieodróżnialny od
        szumu. Efekty sumują się do zera — model mierzy odchylenia względem średniej,
        nie „prawdę absolutną”.
      </p>
    </section>
  );
}
