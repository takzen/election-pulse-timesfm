"use client";

import React, { useState, useMemo } from "react";
import {
  Landmark,
  Check,
  AlertCircle,
  ShieldCheck,
  Scroll,
  RotateCcw,
  Sparkles,
  Share2,
} from "lucide-react";

interface PartyMeta {
  name: string;
  leader?: string;
  color?: string;
  forecast: number;
  current: number;
}

interface CoalitionSimulatorProps {
  partiesMeta: Record<string, PartyMeta>;
  seatsByParty: Record<string, number>;
  isAboveThreshold: Record<string, boolean>;
}

interface PresetScenario {
  id: string;
  label: string;
  parties: string[];
  emoji: string;
  description: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "current",
    label: "Koalicja 15 Października",
    emoji: "🏛️",
    parties: ["KO", "PSL", "Polska_2050", "Lewica"],
    description: "Obecna koalicja rządowa (KO + Trzecia Droga + Nowa Lewica)",
  },
  {
    id: "right",
    label: "Blok Prawicowy",
    emoji: "🦅",
    parties: ["PiS", "Konfederacja", "KKP"],
    description: "Sojusz prawicy: Prawo i Sprawiedliwość + Konfederacja + Korona",
  },
  {
    id: "grand",
    label: "Wielka Koalicja (KO + PiS)",
    emoji: "🤝",
    parties: ["KO", "PiS"],
    description: "Wariant ponad podziałami dwóch największych ugrupowań",
  },
  {
    id: "ko_konf",
    label: "KO + Konfederacja",
    emoji: "⚡",
    parties: ["KO", "Konfederacja"],
    description: "Pragmatyczny sojusz liberalno-wolnorynkowy",
  },
  {
    id: "left_center",
    label: "Lewica i Centrum",
    emoji: "🌹",
    parties: ["KO", "Lewica", "Razem", "Polska_2050"],
    description: "Koalicja progresywno-socjalliberalna",
  },
];

export function CoalitionSimulator({
  partiesMeta,
  seatsByParty,
  isAboveThreshold,
}: CoalitionSimulatorProps) {
  // Currently selected parties in the government coalition
  const [selectedParties, setSelectedParties] = useState<Set<string>>(
    () => new Set(["KO", "PSL", "Polska_2050", "Lewica"])
  );

  // List of parties eligible for the Sejm (excluding non-partisan options and parties below 5%)
  const parliamentParties = useMemo(() => {
    return Object.entries(partiesMeta)
      .filter(([key]) => key !== "Niezdecydowani")
      .map(([key, meta]) => ({
        key,
        name: meta.name,
        leader: meta.leader || "",
        color: meta.color || "#3b82f6",
        forecast: meta.forecast,
        seats: seatsByParty[key] || 0,
        inSejm: (seatsByParty[key] || 0) > 0,
      }))
      .sort((a, b) => b.seats - a.seats);
  }, [partiesMeta, seatsByParty]);

  // Toggle single party in/out of government
  const toggleParty = (partyKey: string) => {
    setSelectedParties((prev) => {
      const next = new Set(prev);
      if (next.has(partyKey)) {
        next.delete(partyKey);
      } else {
        next.add(partyKey);
      }
      return next;
    });
  };

  // Apply a predefined scenario
  const applyPreset = (preset: PresetScenario) => {
    setSelectedParties(new Set(preset.parties));
  };

  // Clear all
  const clearSelection = () => {
    setSelectedParties(new Set());
  };

  // Calculations
  const coalitionPartiesList = parliamentParties.filter((p) => selectedParties.has(p.key));
  const oppositionPartiesList = parliamentParties.filter((p) => !selectedParties.has(p.key));

  const coalitionSeats = coalitionPartiesList.reduce((acc, p) => acc + p.seats, 0);
  const oppositionSeats = 460 - coalitionSeats;

  const coalitionVote = coalitionPartiesList.reduce((acc, p) => acc + p.forecast, 0);
  const oppositionVote = oppositionPartiesList.reduce((acc, p) => acc + p.forecast, 0);

  // Thresholds in Polish Sejm (460 seats total)
  const majorityThreshold = 231; // Absolute majority
  const vetoThreshold = 276; // 3/5 majority (override presidential veto)
  const constitutionThreshold = 307; // 2/3 majority (constitutional amendment)

  const hasMajority = coalitionSeats >= majorityThreshold;
  const hasVetoPower = coalitionSeats >= vetoThreshold;
  const hasConstitutionPower = coalitionSeats >= constitutionThreshold;

  const seatsDelta = coalitionSeats - majorityThreshold;

  // Share text for Twitter / X
  const shareText = useMemo(() => {
    const names = coalitionPartiesList.map((p) => p.key.replace("_", " ")).join(" + ");
    const status = hasMajority
      ? `✅ Większość rządowa (${coalitionSeats} / 460 mandatów)`
      : `⚠️ Rząd mniejszościowy (${coalitionSeats} / 460 mandatów, brakuje ${Math.abs(seatsDelta)} m.)`;

    return `🏛️ Symulator koalicji rządowej (PulsWyborczy.pl):
Rząd: ${names || "Brak partii"}
${status}

Sprawdź układ Sejmu i przetestuj własną koalicję:
https://pulswyborczy.pl`;
  }, [coalitionPartiesList, hasMajority, coalitionSeats, seatsDelta]);

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent("https://pulswyborczy.pl")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-950/70 border border-blue-800/60 p-2 text-blue-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Sejm RP • 460 mandatów
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Interaktywny Symulator Rządu i Koalicji
              </h2>
            </div>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-3xl">
            Klikaj na partie poniżej lub wybierz gotowy scenariusz, aby sprawdzić, czy dany układ sił
            posiada wymaganą większość bezwzględną (231), siłę do odrzucenia weta Prezydenta (276)
            lub większość konstytucyjną (307).
          </p>
        </div>

        {/* Quick Share button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-200 shadow transition"
          >
            <Share2 className="h-4 w-4" />
            <span>Udostępnij na X</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            Szybkie scenariusze koalicyjne:
          </span>
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Resetuj wybór</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map((scenario) => {
            const isMatch =
              scenario.parties.length === selectedParties.size &&
              scenario.parties.every((p) => selectedParties.has(p));

            return (
              <button
                key={scenario.id}
                onClick={() => applyPreset(scenario)}
                title={scenario.description}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition border ${
                  isMatch
                    ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/40"
                    : "bg-[#070b14] text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <span>{scenario.emoji}</span>
                <span>{scenario.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Party Toggles */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
          Kliknij partię, aby dołączyć ją do rządu lub przenieść do opozycji:
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {parliamentParties.map((party) => {
            const isSelected = selectedParties.has(party.key);
            const canGovern = party.inSejm;

            return (
              <button
                key={party.key}
                onClick={() => toggleParty(party.key)}
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition select-none cursor-pointer ${
                  isSelected
                    ? canGovern
                      ? "border-emerald-500/80 bg-[#0c1e28] shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40"
                      : "border-amber-600/60 bg-[#1a1508] shadow-md ring-1 ring-amber-600/30"
                    : "border-slate-800 bg-[#070b14] hover:border-slate-700 hover:bg-slate-900/80"
                }${!canGovern ? " opacity-70" : ""}`}
              >
                {/* Top: Status Pill + Indicator */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: party.color }}
                  />
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      !canGovern
                        ? isSelected
                          ? "bg-amber-900/60 text-amber-300 border-amber-700/60"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                        : isSelected
                        ? "bg-emerald-900/60 text-emerald-300 border-emerald-700/60"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {!canGovern
                      ? isSelected
                        ? "Poniżej progu 5%"
                        : "Poza Sejmem"
                      : isSelected
                      ? "W rządzie"
                      : "W opozycji"}
                  </span>
                </div>

                {/* Center: Party Key & Name */}
                <div className="mt-2.5">
                  <div className="font-extrabold text-sm sm:text-base text-white truncate">
                    {party.key.replace("_", " ")}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{party.name}</div>
                </div>

                {/* Bottom: Seats & Votes */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    {party.forecast.toFixed(1)}%
                  </span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${
                    !canGovern ? "text-slate-500" : "text-white"
                  }`}>
                    {party.inSejm ? `${party.seats} m.` : "0 m."}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Government Scoreboard Banner */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all ${
          hasMajority
            ? "border-emerald-600/70 bg-gradient-to-r from-emerald-950/40 via-[#071918] to-[#0a1526]"
            : "border-rose-700/70 bg-gradient-to-r from-rose-950/40 via-[#1e0d16] to-[#0a1526]"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main Seats Number & Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  hasMajority ? "bg-emerald-900/80 text-emerald-400" : "bg-rose-900/80 text-rose-400"
                }`}
              >
                {hasMajority ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Stan Twojej Koalicji Rządowej
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
              <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {coalitionSeats}{" "}
                <span className="text-base sm:text-xl font-normal text-slate-400">/ 460</span>
              </div>

              <div
                className={`rounded-lg px-3 py-1 text-xs sm:text-sm font-bold border ${
                  hasMajority
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                    : "bg-rose-950 text-rose-300 border-rose-700"
                }`}
              >
                {hasMajority
                  ? `Większość bezwzględna (+${seatsDelta} m. zapasu)`
                  : `Brak większości (brakuje ${Math.abs(seatsDelta)} m. do 231)`}
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-300">
              Łączne poparcie społeczne koalicji:{" "}
              <strong className="text-white font-mono">{coalitionVote.toFixed(1)}%</strong> •
              Opozycja:{" "}
              <strong className="text-slate-300 font-mono">
                {oppositionSeats} m. ({oppositionVote.toFixed(1)}%)
              </strong>
            </div>
          </div>

          {/* Composition pills */}
          <div className="lg:max-w-md space-y-2 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 font-medium">Skład rządu: </span>
              {coalitionPartiesList.length > 0 ? (
                <span className="font-bold text-white">
                  {coalitionPartiesList.map((p) => `${p.key} (${p.seats})`).join(", ")}
                </span>
              ) : (
                <span className="text-rose-400 italic">Nie wybrano żadnej partii</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 font-medium">W opozycji: </span>
              <span className="text-slate-300">
                {oppositionPartiesList
                  .filter((p) => p.inSejm)
                  .map((p) => `${p.key} (${p.seats})`)
                  .join(", ") || "Brak partii"}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Plenary Bar Divided by Coalition Parties */}
        <div className="mt-6 space-y-2">
          <div className="relative h-11 w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex shadow-inner">
            {/* Coalition Segments */}
            {coalitionPartiesList.map((p) => {
              const widthPct = (p.seats / 460) * 100;
              if (widthPct <= 0) return null;

              return (
                <div
                  key={p.key}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: p.color,
                  }}
                  title={`${p.name}: ${p.seats} mandatów (${widthPct.toFixed(1)}%)`}
                  className="h-full flex items-center justify-center text-xs font-black text-white overflow-hidden px-1 transition-all duration-300 hover:brightness-110"
                >
                  {widthPct >= 5 && (
                    <span className="truncate drop-shadow-md">
                      {p.key} ({p.seats})
                    </span>
                  )}
                </div>
              );
            })}

            {/* Opposition Remaining Bar */}
            {oppositionSeats > 0 && (
              <div
                style={{ width: `${(oppositionSeats / 460) * 100}%` }}
                className="h-full bg-slate-800 flex items-center justify-end pr-3 text-xs font-bold text-slate-400 overflow-hidden transition-all duration-300"
              >
                {(oppositionSeats / 460) * 100 >= 12 && (
                  <span>Opozycja ({oppositionSeats})</span>
                )}
              </div>
            )}

            {/* 231 Majority Target Marker Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 pointer-events-none"
              style={{ left: `${(231 / 460) * 100}%` }}
            >
              <div className="absolute -top-6 -left-7 rounded bg-slate-900 border border-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase whitespace-nowrap shadow-sm">
                231
              </div>
            </div>

            {/* 276 Veto Line Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-300/80 border-dashed z-10 pointer-events-none"
              style={{ left: `${(276 / 460) * 100}%` }}
            >
              <div className="absolute -bottom-5 -left-6 rounded bg-blue-950 border border-blue-700 px-1 py-0.2 text-[9px] font-bold text-blue-300 uppercase whitespace-nowrap">
                276 weto
              </div>
            </div>

            {/* 307 Constitution Line Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-400/80 border-dashed z-10 pointer-events-none"
              style={{ left: `${(307 / 460) * 100}%` }}
            >
              <div className="absolute -bottom-5 -left-6 rounded bg-purple-950 border border-purple-700 px-1 py-0.2 text-[9px] font-bold text-purple-300 uppercase whitespace-nowrap">
                307 konst.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Key Constitutional Thresholds Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. Majority: 231 */}
        <div
          className={`rounded-xl border p-4 transition ${
            hasMajority
              ? "border-emerald-800/80 bg-emerald-950/20"
              : "border-slate-800 bg-[#070b14]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Wotum zaufania (Rząd)
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400">231 m.</span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-lg font-black text-white">
              {coalitionSeats >= 231 ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Uzyskane (+{coalitionSeats - 231})
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Brakuje {231 - coalitionSeats} m.
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                hasMajority ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, (coalitionSeats / 231) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-tight">
            Większość bezwzględna konieczna do powołania Rady Ministrów i uchwalania zwykłych ustaw.
          </p>
        </div>

        {/* 2. Veto Override: 276 */}
        <div
          className={`rounded-xl border p-4 transition ${
            hasVetoPower
              ? "border-blue-700/80 bg-blue-950/20"
              : "border-slate-800 bg-[#070b14]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Weto Prezydenta (3/5)
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400">276 m.</span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-lg font-black text-white">
              {coalitionSeats >= 276 ? (
                <span className="text-blue-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Odrzuca weto (+{coalitionSeats - 276})
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  Brakuje {276 - coalitionSeats} m.
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (coalitionSeats / 276) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-tight">
            Większość 3/5 głosów w obecności co najmniej połowy posłów pozwala odrzucić weto Prezydenta.
          </p>
        </div>

        {/* 3. Constitution: 307 */}
        <div
          className={`rounded-xl border p-4 transition ${
            hasConstitutionPower
              ? "border-purple-700/80 bg-purple-950/20"
              : "border-slate-800 bg-[#070b14]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scroll className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Konstytucja RP (2/3)
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400">307 m.</span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-lg font-black text-white">
              {coalitionSeats >= 307 ? (
                <span className="text-purple-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Większość 2/3 (+{coalitionSeats - 307})
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  Brakuje {307 - coalitionSeats} m.
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (coalitionSeats / 307) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-tight">
            Większość 2/3 głosów pozwala na samodzielną zmianę ustawy zasadniczej (Konstytucji RP).
          </p>
        </div>
      </div>
    </div>
  );
}
