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

  // Combine historical slice (last 45 days) with forecast
  const histSlice = history.slice(-45);
  const chartData = [
    ...histSlice.map((h) => ({
      ...h,
      isForecast: false,
    })),
    ...forecast.map((f) => ({
      ...f,
      isForecast: true,
      KO: f.KO_p50,
      PiS: f.PiS_p50,
      Konfederacja: f.Konfederacja_p50,
      Trzecia_Droga: f.Trzecia_Droga_p50,
      Lewica: f.Lewica_p50,
    })),
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Trajektoria Poparcia i Prognoza AI</h2>
          <p className="text-xs text-slate-400">
            Historia (linie ciągłe) oraz prognoza Google TimesFM 3.0 (linie przerywane od {cutoffDate})
          </p>
        </div>

        {/* Party filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveParty(null)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              activeParty === null
                ? "bg-slate-700 text-white"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Wszystkie
          </button>
          {Object.entries(partiesMeta).map(([code, meta]) => (
            <button
              key={code}
              onClick={() => setActiveParty(activeParty === code ? null : code)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeParty === code
                  ? "bg-slate-700 text-white shadow"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"
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

      <div className="mt-6 h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v: string) => v.slice(5)} // MM-DD
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, 42]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#f8fafc",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(1)}%`,
                name.replace("_", " "),
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val.replace("_", " ")}</span>}
            />
            <ReferenceLine
              x={cutoffDate}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              label={{
                value: "Dziś (Start AI)",
                fill: "#94a3b8",
                fontSize: 11,
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
                  strokeWidth={activeParty === code ? 3.5 : 2.2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
