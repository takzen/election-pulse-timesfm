"use client";

import React from "react";
import { ShieldCheck, Scale } from "lucide-react";

interface MajorityBarProps {
  coalitionTotal: number;
  oppositionTotal: number;
}

export function MajorityBar({ coalitionTotal, oppositionTotal }: MajorityBarProps) {
  // Approximate Polish D'Hondt seat distribution calculation
  // Total Sejm seats = 460, majority = 231
  const totalVotes = coalitionTotal + oppositionTotal;
  const coalitionSeats = Math.round((coalitionTotal / totalVotes) * 460);
  const oppositionSeats = 460 - coalitionSeats;
  const hasMajority = coalitionSeats >= 231;

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#0a0f1d] to-slate-900/90 p-6 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Równowaga Sił w Sejmie RP (Szacunek AI D&apos;Hondt)
          </span>
          <h3 className="mt-0.5 text-xl font-black text-white sm:text-2xl flex items-center gap-2">
            Pojedynek Bloków Wyborczych
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                hasMajority
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {hasMajority ? `Większość Koalicji (${coalitionSeats} mandatów)` : `Przewaga Opozycji (${oppositionSeats} mandatów)`}
            </span>
          </h3>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
            <span>Koalicja: <strong>{coalitionTotal.toFixed(1)}%</strong> ({coalitionSeats} m.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-600 to-teal-500" />
            <span>Opozycja: <strong>{oppositionTotal.toFixed(1)}%</strong> ({oppositionSeats} m.)</span>
          </div>
        </div>
      </div>

      {/* Visual Parliament Bar with 231 Seats Center Marker */}
      <div className="mt-5 relative">
        <div className="flex h-7 w-full overflow-hidden rounded-xl bg-slate-800 shadow-inner">
          {/* Coalition side */}
          <div
            className="flex items-center justify-start pl-3 text-xs font-black text-white bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 transition-all duration-700"
            style={{ width: `${(coalitionSeats / 460) * 100}%` }}
          >
            {coalitionSeats >= 180 && <span>{coalitionSeats} mandatów</span>}
          </div>

          {/* Opposition side */}
          <div
            className="flex items-center justify-end pr-3 text-xs font-black text-white bg-gradient-to-r from-teal-500 via-blue-500 to-blue-700 transition-all duration-700"
            style={{ width: `${(oppositionSeats / 460) * 100}%` }}
          >
            {oppositionSeats >= 180 && <span>{oppositionSeats} mandatów</span>}
          </div>
        </div>

        {/* 231 Majority Target Marker (50.2% of 460) */}
        <div
          className="absolute top-[-8px] bottom-[-8px] w-0.5 bg-white shadow-[0_0_8px_white] z-10"
          style={{ left: "50.2%" }}
        >
          <div className="absolute -top-5 -left-12 rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-black uppercase shadow">
            Próg 231
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <span>🟠 KO + 🟡 Trzecia Droga + 🔴 Lewica</span>
        <span className="font-mono text-slate-300">Wymagana większość: 231 / 460 mandatów</span>
        <span>🔵 PiS + 🟢 Konfederacja</span>
      </div>
    </div>
  );
}
