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

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:border-slate-700 hover:shadow-xl">
      {/* Colored top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: meta.color }}
      />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {meta.name}
          </span>
          <h3 className="mt-0.5 text-lg font-bold text-white">{partyKey.replace("_", " ")}</h3>
          <p className="text-xs text-slate-400">{meta.leader}</p>
        </div>

        {/* Momentum pill */}
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : isNegative
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
          }`}
        >
          {isPositive && <TrendingUp className="h-3 w-3" />}
          {isNegative && <TrendingDown className="h-3 w-3" />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
          <span>{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pp</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          {meta.forecast.toFixed(1)}%
        </span>
        <span className="text-xs text-slate-400">
          (dziś: {meta.current.toFixed(1)}%)
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <span>Pasmo p10–p90:</span>
        <span className="font-mono text-slate-200">
          {meta.p10.toFixed(1)}% – {meta.p90.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
