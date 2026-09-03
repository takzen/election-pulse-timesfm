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
    <div className="rounded-xl border border-slate-800/90 bg-[#0d121f] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3.5">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Układ Sił w Sejmie RP (Szacunek Mandatów D&apos;Hondt)
          </span>
          <h3 className="mt-0.5 text-lg font-bold text-white flex items-center gap-2.5">
            Pojedynek Bloków Wyborczych
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                hasMajority
                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                  : "bg-rose-950/40 text-rose-400 border border-rose-800/30"
              }`}
            >
              {hasMajority ? `Większość Koalicji (${coalitionSeats} mandatów)` : `Przewaga Opozycji (${oppositionSeats} mandatów)`}
            </span>
          </h3>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-5 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />
            <span>Koalicja rządowa: <strong className="text-slate-200">{coalitionTotal.toFixed(1)}%</strong> ({coalitionSeats} m.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
            <span>Opozycja: <strong className="text-slate-200">{oppositionTotal.toFixed(1)}%</strong> ({oppositionSeats} m.)</span>
          </div>
        </div>
      </div>

      {/* Visual Parliament Bar with 231 Seats Center Line */}
      <div className="mt-4 relative">
        <div className="flex h-6 w-full overflow-hidden rounded-lg bg-slate-800/80">
          {/* Coalition side - calm warm tone */}
          <div
            className="flex items-center justify-start pl-3 text-[11px] font-bold text-slate-100 bg-[#b45309] transition-all duration-500"
            style={{ width: `${(coalitionSeats / 460) * 100}%` }}
          >
            {coalitionSeats >= 150 && <span>{coalitionSeats}</span>}
          </div>

          {/* Opposition side - calm slate blue */}
          <div
            className="flex items-center justify-end pr-3 text-[11px] font-bold text-slate-100 bg-[#1e40af] transition-all duration-500"
            style={{ width: `${(oppositionSeats / 460) * 100}%` }}
          >
            {oppositionSeats >= 150 && <span>{oppositionSeats}</span>}
          </div>
        </div>

        {/* 231 Majority Target Marker (50.2% of 460) */}
        <div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-slate-300 z-10"
          style={{ left: "50.2%" }}
        >
          <div className="absolute -top-5 -left-8 rounded bg-slate-800 border border-slate-700 px-1 py-0.2 text-[9px] font-bold text-slate-300 uppercase">
            Próg 231
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <span>Koalicja: KO, PSL, Polska 2050, Nowa Lewica</span>
        <span className="font-mono text-slate-400">Większość bezwzględna: 231 / 460</span>
        <span>Opozycja: PiS, Konfederacja, Korona, Rozwój Plus, Razem</span>
      </div>
    </div>
  );
}
