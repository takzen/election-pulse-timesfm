"use client";

import React from "react";

interface MajorityBarProps {
  coalitionTotal: number;
  oppositionTotal: number;
  coalitionSeats?: number;
  oppositionSeats?: number;
}

export function MajorityBar({
  coalitionTotal,
  oppositionTotal,
  coalitionSeats: propCoalitionSeats,
  oppositionSeats: propOppositionSeats,
}: MajorityBarProps) {
  // Polish Sejm majority calculation: 460 total seats, 231 needed to govern
  const totalVotes = coalitionTotal + oppositionTotal;
  const coalitionSeats =
    propCoalitionSeats !== undefined
      ? propCoalitionSeats
      : totalVotes > 0
      ? Math.round((coalitionTotal / totalVotes) * 460)
      : 230;
  const oppositionSeats =
    propOppositionSeats !== undefined ? propOppositionSeats : 460 - coalitionSeats;
  const hasMajority = coalitionSeats >= 231;

  return (
    <div className="select-none cursor-default rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Układ sił w Sejmie RP (szacunek mandatów D&apos;Hondt – model ogólnokrajowy)
          </span>
          <h3 className="mt-1 text-lg sm:text-2xl font-black text-white flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Pojedynek bloków</span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-xs sm:text-sm font-bold ${
                hasMajority
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                  : "bg-rose-950/60 text-rose-400 border border-rose-800/50"
              }`}
            >
              {hasMajority ? `Większość koalicji (${coalitionSeats} m.)` : `Przewaga opozycji (${oppositionSeats} m.)`}
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#d97706] flex-shrink-0" />
            <span>Koalicja: <strong className="text-white">{coalitionTotal.toFixed(1)}%</strong> ({coalitionSeats} m.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#2563eb] flex-shrink-0" />
            <span>Opozycja: <strong className="text-white">{oppositionTotal.toFixed(1)}%</strong> ({oppositionSeats} m.)</span>
          </div>
        </div>
      </div>

      {/* Visual Parliament Bar with 231 Seats Center Line */}
      <div className="mt-5 relative">
        <div className="flex h-9 sm:h-10 w-full overflow-hidden rounded-xl bg-slate-800">
          {/* Coalition side */}
          <div
            className="flex items-center justify-start pl-3 sm:pl-4 text-xs sm:text-sm font-bold text-white bg-[#b45309] transition-all duration-500 overflow-hidden whitespace-nowrap"
            style={{ width: `${(coalitionSeats / 460) * 100}%` }}
          >
            {coalitionSeats >= 140 && <span>Koalicja: {coalitionSeats}</span>}
          </div>

          {/* Opposition side */}
          <div
            className="flex items-center justify-end pr-3 sm:pr-4 text-xs sm:text-sm font-bold text-white bg-[#1e40af] transition-all duration-500 overflow-hidden whitespace-nowrap"
            style={{ width: `${(oppositionSeats / 460) * 100}%` }}
          >
            {oppositionSeats >= 140 && <span>Opozycja: {oppositionSeats}</span>}
          </div>
        </div>

        {/* 231 Majority Target Marker (50.2% of 460) */}
        <div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-white shadow-sm z-10"
          style={{ left: "50.2%" }}
        >
          <div className="absolute -top-5 -left-8 rounded bg-slate-800 border border-slate-600 px-1.5 py-0.2 text-[10px] sm:text-xs font-bold text-white uppercase whitespace-nowrap">
            Próg 231
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm text-slate-400">
        <span>Koalicja: KO, PSL, Polska 2050, Nowa Lewica</span>
        <span className="font-mono text-slate-300 font-semibold">Większość bezwzględna: 231 / 460</span>
        <span>Opozycja: PiS, Konfederacja, Korona, Rozwój Plus, Razem</span>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/40 pt-2">
        * W Polsce mandaty dzieli się metodą D&apos;Hondta osobno w 41 okręgach wyborczych. Powyższy rozkład to model przybliżony na podstawie poparcia ogólnokrajowego (próg 5%).
      </div>
    </div>
  );
}
