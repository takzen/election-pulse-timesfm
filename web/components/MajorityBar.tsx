"use client";

import React from "react";

interface MajorityBarProps {
  coalitionTotal: number;
  oppositionTotal: number;
}

export function MajorityBar({ coalitionTotal, oppositionTotal }: MajorityBarProps) {
  // Polish Sejm majority calculation: 460 total seats, 231 to govern
  const totalVotes = coalitionTotal + oppositionTotal;
  const coalitionSeats = totalVotes > 0 ? Math.round((coalitionTotal / totalVotes) * 460) : 230;
  const oppositionSeats = 460 - coalitionSeats;
  const hasMajority = coalitionSeats >= 231;

  return (
    <div className="select-none cursor-default rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Układ Sił w Sejmie RP (Szacunek Mandatów D&apos;Hondt)
          </span>
          <h3 className="mt-1 text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            Pojedynek Bloków Wyborczych
            <span
              className={`rounded-md px-3 py-1 text-xs sm:text-sm font-bold ${
                hasMajority
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                  : "bg-rose-950/60 text-rose-400 border border-rose-800/50"
              }`}
            >
              {hasMajority ? `Większość Koalicji (${coalitionSeats} mandatów)` : `Przewaga Opozycji (${oppositionSeats} mandatów)`}
            </span>
          </h3>
        </div>

        <div className="text-sm text-slate-300 flex items-center gap-6 font-medium">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#d97706]" />
            <span>Koalicja rządowa: <strong className="text-white text-base">{coalitionTotal.toFixed(1)}%</strong> ({coalitionSeats} m.)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
            <span>Opozycja: <strong className="text-white text-base">{oppositionTotal.toFixed(1)}%</strong> ({oppositionSeats} m.)</span>
          </div>
        </div>
      </div>

      {/* Visual Parliament Bar with 231 Seats Center Line */}
      <div className="mt-5 relative">
        <div className="flex h-10 w-full overflow-hidden rounded-xl bg-slate-800">
          {/* Coalition side */}
          <div
            className="flex items-center justify-start pl-4 text-sm font-bold text-white bg-[#b45309] transition-all duration-500"
            style={{ width: `${(coalitionSeats / 460) * 100}%` }}
          >
            {coalitionSeats >= 120 && <span>Koalicja: {coalitionSeats} mandatów</span>}
          </div>

          {/* Opposition side */}
          <div
            className="flex items-center justify-end pr-4 text-sm font-bold text-white bg-[#1e40af] transition-all duration-500"
            style={{ width: `${(oppositionSeats / 460) * 100}%` }}
          >
            {oppositionSeats >= 120 && <span>Opozycja: {oppositionSeats} mandatów</span>}
          </div>
        </div>

        {/* 231 Majority Target Marker (50.2% of 460) */}
        <div
          className="absolute top-[-6px] bottom-[-6px] w-0.5 bg-white shadow-sm z-10"
          style={{ left: "50.2%" }}
        >
          <div className="absolute -top-6 -left-10 rounded bg-slate-800 border border-slate-600 px-2 py-0.5 text-xs font-bold text-white uppercase">
            Próg 231
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-400">
        <span>Koalicja: KO, PSL, Polska 2050, Nowa Lewica</span>
        <span className="font-mono text-slate-300 font-semibold">Większość bezwzględna: 231 / 460</span>
        <span>Opozycja: PiS, Konfederacja, Korona, Rozwój Plus, Razem</span>
      </div>
    </div>
  );
}
