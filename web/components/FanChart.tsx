"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface FanChartProps {
  history: Array<{ date: string; [key: string]: any }>;
  forecast: Array<{ date: string; [key: string]: any }>;
  partiesMeta: Record<string, { name: string; color: string }>;
  cutoffDate: string;
}

export function FanChart({ history, forecast, partiesMeta, cutoffDate }: FanChartProps) {
  const [activeParty, setActiveParty] = useState<string | null>(null);

  // Combine historical slice (last 60 days) with forecast
  const histSlice = history.slice(-60);
  const chartData = [
    ...histSlice.map((h) => ({
      ...h,
      isForecast: false,
    })),
    ...forecast.map((f) => {
      const row: Record<string, any> = { date: f.date, isForecast: true };
      for (const pKey of Object.keys(partiesMeta)) {
        row[pKey] = f[`${pKey}_p50`];
      }
      return row;
    }),
  ];

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0d121f] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <h2 className="text-lg font-bold text-white">Trajektoria Poparcia i Prognoza AI</h2>
          <p className="text-xs text-slate-400">
            Historia sondażowa oraz projekcja modelu Google TimesFM 3.0 (od {cutoffDate})
          </p>
        </div>

        {/* Party filter pills */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveParty(null)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition ${
              activeParty === null
                ? "bg-slate-700 text-white"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            Wszystkie
          </button>
          {Object.entries(partiesMeta).map(([code, meta]) => (
            <button
              key={code}
              onClick={() => setActiveParty(activeParty === code ? null : code)}
              className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium transition ${
                activeParty === code
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {code.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.4} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v: string) => v.slice(5)} // MM-DD
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, 36]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.5rem",
                fontSize: "11px",
                color: "#f8fafc",
              }}
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(1)}%`,
                name.replace("_", " "),
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: 14 }}
              formatter={(val) => <span className="text-xs text-slate-300">{val.replace("_", " ")}</span>}
            />
            <ReferenceLine
              x={cutoffDate}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              label={{
                value: "Start AI",
                fill: "#94a3b8",
                fontSize: 10,
                position: "insideTopLeft",
              }}
            />

            {Object.entries(partiesMeta).map(([code, meta]) => {
              if (activeParty !== null && activeParty !== code) return null;
              return (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  name={code}
                  stroke={meta.color}
                  strokeWidth={activeParty === code ? 3 : 1.8}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
