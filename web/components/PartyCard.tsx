"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PartyMeta {
  name: string;
  leader: string;
  color: string;
  current: number;
  forecast: number;
  p10: number;
  p90: number;
}

interface PartyCardProps {
  partyKey: string;
  meta: PartyMeta;
}

export function PartyCard({ partyKey, meta }: PartyCardProps) {
  const delta = Math.round((meta.forecast - meta.current) * 10) / 10;
  const isPositive = delta > 0.1;
  const isNegative = delta < -0.1;
  const displayName = partyKey.replace("_", " ");

  // Scale relative to 35% max benchmark
  const pctWidth = Math.min(100, Math.max(5, (meta.forecast / 35) * 100));

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-md transition hover:border-slate-700 hover:bg-[#121b30]">
      {/* Top row: Name, Leader, and Momentum Pill */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded-full shadow-sm"
              style={{ backgroundColor: meta.color }}
            />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                {displayName}
              </h3>
              <p className="text-sm text-slate-300 font-medium leading-normal mt-0.5">
                {meta.name}
              </p>
            </div>
          </div>

          <span
            className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs sm:text-sm font-bold ${
              isPositive
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                : isNegative
                ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            {isPositive && <TrendingUp className="h-4 w-4" />}
            {isNegative && <TrendingDown className="h-4 w-4" />}
            {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
            <span>{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pp</span>
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Lider: <strong className="text-slate-200 font-semibold">{meta.leader}</strong>
        </p>
      </div>

      {/* Main Numbers Row */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Prognoza AI
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-1">
              {meta.forecast.toFixed(1)}%
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sondaż dziś
            </span>
            <div className="text-xl font-bold text-slate-200 mt-1">
              {meta.current.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctWidth}%`,
              backgroundColor: meta.color,
            }}
          />
        </div>

        {/* Quantile Range */}
        <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
          <span>Przedział 10%–90%:</span>
          <span className="font-mono font-bold text-slate-200">
            {meta.p10.toFixed(1)}% – {meta.p90.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
