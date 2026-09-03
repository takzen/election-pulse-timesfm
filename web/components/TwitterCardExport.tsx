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

  const standardText = `🗳️ Najnowsza prognoza wyborcza AI na ${metadata.target_date} (ElectionPulse):

KO: ${partiesMeta["KO"]?.forecast.toFixed(1)}%
PiS: ${partiesMeta["PiS"]?.forecast.toFixed(1)}%
Konfederacja: ${partiesMeta["Konfederacja"]?.forecast.toFixed(1)}%
Korona: ${partiesMeta["KKP"]?.forecast.toFixed(1)}%
Lewica: ${partiesMeta["Lewica"]?.forecast.toFixed(1)}%
Rozwój Plus: ${partiesMeta["Rozwoj_Plus"]?.forecast.toFixed(1)}%
Razem: ${partiesMeta["Razem"]?.forecast.toFixed(1)}%
PSL: ${partiesMeta["PSL"]?.forecast.toFixed(1)}%
Polska 2050: ${partiesMeta["Polska_2050"]?.forecast.toFixed(1)}%
Niezdecydowani: ${partiesMeta["Niezdecydowani"]?.forecast.toFixed(1)}%

Symuluj wpływ stóp NBP i inflacji w aplikacji:`;

  const compactText = `📊 Sondaż AI (ElectionPulse):
KO: ${partiesMeta["KO"]?.forecast.toFixed(1)}% | PiS: ${partiesMeta["PiS"]?.forecast.toFixed(1)}% | Konf: ${partiesMeta["Konfederacja"]?.forecast.toFixed(1)}% | KKP: ${partiesMeta["KKP"]?.forecast.toFixed(1)}% | Lewica: ${partiesMeta["Lewica"]?.forecast.toFixed(1)}% | R+: ${partiesMeta["Rozwoj_Plus"]?.forecast.toFixed(1)}% | Razem: ${partiesMeta["Razem"]?.forecast.toFixed(1)}% | PSL: ${partiesMeta["PSL"]?.forecast.toFixed(1)}%

Sprawdź interaktywny symulator:`;

  const activeText = mode === "standard" ? standardText : compactText;
  const webUrl = "https://election-pulse.vercel.app";
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(activeText)}&url=${encodeURIComponent(webUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${activeText}\n${webUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2.5 text-white border border-slate-700">
            <XLogo className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Generator Posta na X</h2>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Udostępnij aktualną prognozę wyborczą jednym kliknięciem
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Format selector */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs sm:text-sm">
            <button
              onClick={() => setMode("standard")}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                mode === "standard" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Pełny
            </button>
            <button
              onClick={() => setMode("compact")}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                mode === "compact" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Krótki (1-liner)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 shadow hover:bg-slate-700 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Skopiowano!" : "Kopiuj"}</span>
          </button>

          <a
            href={twitterIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-100 hover:bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow transition"
          >
            <Share2 className="h-4 w-4" />
            <span>Opublikuj na X</span>
          </a>
        </div>
      </div>

      {/* Visual Post Preview Box */}
      <div className="mt-5 space-y-2.5">
        <div className="text-xs sm:text-sm font-semibold text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-slate-300" />
          <span>Podgląd treści do publikacji:</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#070b14] p-5 font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
          {activeText}
          {"\n"}
          <span className="text-slate-400 underline">{webUrl}</span>
        </div>
      </div>
    </div>
  );
}
