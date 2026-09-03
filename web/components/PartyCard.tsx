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

  // Progress relative to scale 0-45%
  const pctWidth = Math.min(100, Math.max(5, (meta.forecast / 42) * 100));

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-[#0c1220] to-[#070b14] p-5 shadow-xl backdrop-blur transition-all duration-300 hover:border-slate-700 hover:shadow-2xl">
      {/* Top accent glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
        style={{ backgroundColor: meta.color }}
      />

      {/* Top row: Badge and Momentum */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded-full shadow"
              style={{ backgroundColor: meta.color }}
            />
            <span className="text-base font-black text-white tracking-tight truncate">
              {displayName}
            </span>
          </div>

          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isPositive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : isNegative
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
            {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5" />}
            <span>{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pp</span>
          </span>
        </div>

        {/* Subtitle with party & leader */}
        <div className="mt-1 flex items-baseline justify-between gap-2 text-xs text-slate-400">
          <span className="truncate font-medium" title={meta.name}>
            {meta.name}
          </span>
        </div>
      </div>

      {/* Center: Big Forecast Number */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {meta.forecast.toFixed(1)}%
          </span>
          <span className="text-xs font-medium text-slate-400">
            dziś: <strong className="text-slate-300">{meta.current.toFixed(1)}%</strong>
          </span>
        </div>

        {/* Visual Forecast Meter */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctWidth}%`,
              backgroundColor: meta.color,
            }}
          />
        </div>

        {/* Bottom row: Quantile Uncertainty Band */}
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
          <span className="text-slate-400">Pasmo 10%–90%:</span>
          <span className="font-mono font-bold text-slate-200">
            {meta.p10.toFixed(1)}% – {meta.p90.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
