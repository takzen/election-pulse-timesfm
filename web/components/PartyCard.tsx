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

  // Progress relative to scale 0-35%
  const pctWidth = Math.min(100, Math.max(3, (meta.forecast / 35) * 100));

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#0d121f] p-4 transition-all duration-200 hover:border-slate-700 hover:bg-[#111728]">
      {/* Subtle top indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="text-sm font-bold text-slate-100 tracking-tight truncate">
            {displayName}
          </span>
        </div>

        {/* Muted momentum pill */}
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
            isPositive
              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
              : isNegative
              ? "bg-rose-950/40 text-rose-400 border border-rose-800/30"
              : "bg-slate-800/60 text-slate-400 border border-slate-700/40"
          }`}
        >
          {isPositive && <TrendingUp className="h-3 w-3" />}
          {isNegative && <TrendingDown className="h-3 w-3" />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
          <span>{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pp</span>
        </span>
      </div>

      {/* Leader & Full Name */}
      <div className="mt-1">
        <p className="text-[11px] text-slate-400 truncate" title={meta.name}>
          {meta.name}
        </p>
        <p className="text-[10px] text-slate-500 truncate" title={meta.leader}>
          {meta.leader}
        </p>
      </div>

      {/* Main Forecast Number */}
      <div className="mt-3.5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {meta.forecast.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400">
            dziś: <strong className="text-slate-300 font-medium">{meta.current.toFixed(1)}%</strong>
          </span>
        </div>

        {/* Minimalist matte bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pctWidth}%`,
              backgroundColor: meta.color,
            }}
          />
        </div>

        {/* Muted range info */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
          <span>Przedział 10%–90%:</span>
          <span className="font-mono font-medium text-slate-300">
            {meta.p10.toFixed(1)}% – {meta.p90.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
