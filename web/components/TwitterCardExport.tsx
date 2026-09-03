"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, Sparkles } from "lucide-react";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface TwitterCardExportProps {
  metadata: {
    model_name: string;
    cutoff_date: string;
    target_date: string;
  };
  partiesMeta: Record<string, { name: string; forecast: number; p10: number; p90: number; current: number }>;
}

export function TwitterCardExport({ metadata, partiesMeta }: TwitterCardExportProps) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"standard" | "compact">("standard");

  const standardText = `🗳️ Najnowsza prognoza wyborcza AI na ${metadata.target_date} wg modelu Google #TimesFM 3.0 (330M):

🟠 KO: ${partiesMeta["KO"]?.forecast.toFixed(1)}% [${partiesMeta["KO"]?.p10.toFixed(1)}% - ${partiesMeta["KO"]?.p90.toFixed(1)}%]
🔵 PiS: ${partiesMeta["PiS"]?.forecast.toFixed(1)}% [${partiesMeta["PiS"]?.p10.toFixed(1)}% - ${partiesMeta["PiS"]?.p90.toFixed(1)}%]
🟢 Konfederacja: ${partiesMeta["Konfederacja"]?.forecast.toFixed(1)}% [${partiesMeta["Konfederacja"]?.p10.toFixed(1)}% - ${partiesMeta["Konfederacja"]?.p90.toFixed(1)}%]
🟡 Trzecia Droga: ${partiesMeta["Trzecia_Droga"]?.forecast.toFixed(1)}% [${partiesMeta["Trzecia_Droga"]?.p10.toFixed(1)}% - ${partiesMeta["Trzecia_Droga"]?.p90.toFixed(1)}%]
🔴 Lewica: ${partiesMeta["Lewica"]?.forecast.toFixed(1)}% [${partiesMeta["Lewica"]?.p10.toFixed(1)}% - ${partiesMeta["Lewica"]?.p90.toFixed(1)}%]

Natywny transformer analizujący sondaże, Google Trends i stopy NBP w jednym przebiegu.

Sprawdź interaktywny symulator portfela:`;

  const compactText = `📊 Sondaż AI (Google TimesFM 3.0):
KO: ${partiesMeta["KO"]?.forecast.toFixed(1)}% | PiS: ${partiesMeta["PiS"]?.forecast.toFixed(1)}% | Konf: ${partiesMeta["Konfederacja"]?.forecast.toFixed(1)}% | TD: ${partiesMeta["Trzecia_Droga"]?.forecast.toFixed(1)}% | Lewica: ${partiesMeta["Lewica"]?.forecast.toFixed(1)}%

Symuluj wpływ inflacji i stóp NBP:`;

  const activeText = mode === "standard" ? standardText : compactText;
  const webUrl = "https://election-pulse-timesfm.vercel.app";
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(activeText)}&url=${encodeURIComponent(webUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${activeText}\n${webUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-2xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
            <XLogo className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Publiczny Generator Posta na X</h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Otwarty dla każdego
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Każdy odwiedzający może wygenerować i opublikować raport z prognozą jednym kliknięciem
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format selector */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 text-xs">
            <button
              onClick={() => setMode("standard")}
              className={`rounded-md px-2.5 py-1 transition ${
                mode === "standard" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Szczegółowy
            </button>
            <button
              onClick={() => setMode("compact")}
              className={`rounded-md px-2.5 py-1 transition ${
                mode === "compact" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Krótki (1-liner)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-200 shadow hover:bg-slate-700 transition active:scale-95"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Skopiowano!" : "Kopiuj do schowka"}</span>
          </button>

          <a
            href={twitterIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:from-blue-500 hover:to-sky-400 transition active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span>Opublikuj na X</span>
          </a>
        </div>
      </div>

      {/* Visual Post Preview Box */}
      <div className="mt-5 space-y-3">
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span>Podgląd treści tweeta:</span>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
          {activeText}
          {"\n"}
          <span className="text-sky-400 underline">{webUrl}</span>
        </div>
      </div>

      {/* Visual Shareable Card / Screenshot Canvas */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-slate-950 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 bg-orange-500/10 blur-3xl" />
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
          <span className="font-bold tracking-wide text-orange-400">ELECTIONPULSE • TIMESFM 3.0</span>
          <span className="text-slate-400">Prognoza na: {metadata.target_date}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
          {Object.entries(partiesMeta).map(([code, p]) => (
            <div key={code} className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400">{code.replace("_", " ")}</div>
              <div className="text-lg font-black text-white mt-0.5">{p.forecast.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-500 font-mono">[{p.p10.toFixed(0)}%-{p.p90.toFixed(0)}%]</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/60">
          <span>Engineered by <strong>TAKZEN DEV</strong></span>
          <span className="font-mono text-slate-400">election-pulse-timesfm.vercel.app</span>
        </div>
      </div>
    </div>
  );
}
