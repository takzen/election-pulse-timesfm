"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, Sparkles } from "lucide-react";

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

  // Generate punchy text for X / Twitter
  const tweetText = `🗳️ Najnowsza prognoza wyborcza AI na ${metadata.target_date} wg modelu Google #TimesFM 3.0 (330M):

🟠 KO: ${partiesMeta["KO"]?.forecast.toFixed(1)}% [${partiesMeta["KO"]?.p10.toFixed(1)}% - ${partiesMeta["KO"]?.p90.toFixed(1)}%]
🔵 PiS: ${partiesMeta["PiS"]?.forecast.toFixed(1)}% [${partiesMeta["PiS"]?.p10.toFixed(1)}% - ${partiesMeta["PiS"]?.p90.toFixed(1)}%]
🟢 Konfederacja: ${partiesMeta["Konfederacja"]?.forecast.toFixed(1)}% [${partiesMeta["Konfederacja"]?.p10.toFixed(1)}% - ${partiesMeta["Konfederacja"]?.p90.toFixed(1)}%]
🟡 Trzecia Droga: ${partiesMeta["Trzecia_Droga"]?.forecast.toFixed(1)}% [${partiesMeta["Trzecia_Droga"]?.p10.toFixed(1)}% - ${partiesMeta["Trzecia_Droga"]?.p90.toFixed(1)}%]
🔴 Lewica: ${partiesMeta["Lewica"]?.forecast.toFixed(1)}% [${partiesMeta["Lewica"]?.p10.toFixed(1)}% - ${partiesMeta["Lewica"]?.p90.toFixed(1)}%]

Natywny transformer analizujący sondaże, Google Trends i stopy NBP w czasie rzeczywistym.

Sprawdź symulator portfela wyborcy:`;

  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent("https://election-pulse-timesfm.vercel.app")}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${tweetText}\nhttps://election-pulse-timesfm.vercel.app`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Generator Posta na X (Twitter)</h2>
            <p className="text-xs text-slate-400">
              Gotowy, zwięzły raport z liczbami i pasmami niepewności – do publikacji jednym kliknięciem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 shadow hover:bg-slate-700 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Skopiowano!" : "Kopiuj do schowka"}</span>
          </button>

          <a
            href={twitterIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:from-blue-500 hover:to-sky-400 transition"
          >
            <Share2 className="h-4 w-4" />
            <span>Opublikuj na X</span>
          </a>
        </div>
      </div>

      {/* Tweet Preview Box */}
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
        {tweetText}
        <span className="text-blue-400"> https://election-pulse-timesfm.vercel.app</span>
      </div>
    </div>
  );
}
