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
    <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Trajektoria poparcia i prognoza AI</h2>
          <p className="text-sm sm:text-base text-slate-300 mt-1">
            Historia sondażowa oraz projekcja modelu (od {cutoffDate})
          </p>
        </div>

        {/* Party filter pills with large, readable fonts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveParty(null)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition ${
              activeParty === null
                ? "bg-slate-700 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Wszystkie
          </button>
          {Object.entries(partiesMeta).map(([code, meta]) => (
            <button
              key={code}
              onClick={() => setActiveParty(activeParty === code ? null : code)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                activeParty === code
                  ? "bg-slate-700 text-white shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span>{code.replace("_", " ")}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={14}
              tickFormatter={(v: string) => v.slice(5)} // MM-DD
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={14}
              domain={[0, 36]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "14px",
                color: "#f8fafc",
                padding: "12px 16px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(1)}%`,
                name.replace("_", " "),
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(val) => <span className="text-sm font-semibold text-slate-200">{val.replace("_", " ")}</span>}
            />
            <ReferenceLine
              x={cutoffDate}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              label={{
                value: "Start prognozy",
                fill: "#cbd5e1",
                fontSize: 13,
                fontWeight: "bold",
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
                  strokeWidth={activeParty === code ? 4 : 2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
