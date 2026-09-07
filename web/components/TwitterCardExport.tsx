"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Share2,
  Copy,
  Check,
  Sparkles,
  Download,
  Image as ImageIcon,
  Calendar,
  BarChart3,
  Landmark,
} from "lucide-react";
import { calculateDhondtSeats } from "@/lib/dhondt";

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
    generated_at?: string;
  };
  partiesMeta: Record<
    string,
    {
      name: string;
      leader?: string;
      color?: string;
      forecast: number;
      p10: number;
      p90: number;
      current: number;
    }
  >;
}

export function TwitterCardExport({ metadata, partiesMeta }: TwitterCardExportProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "weekend" | "sejm">("daily");
  const [viewMode, setViewMode] = useState<"text" | "graphic">("text");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Formatted dates in Polish
  const formattedDate = useMemo(() => {
    const d = metadata.generated_at ? new Date(metadata.generated_at) : new Date();
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }, [metadata.generated_at]);

  const formattedDateShort = useMemo(() => {
    const d = metadata.generated_at ? new Date(metadata.generated_at) : new Date();
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }, [metadata.generated_at]);

  // Parliamentary seat distribution (D'Hondt method)
  const parliament = useMemo(() => calculateDhondtSeats(partiesMeta as any), [partiesMeta]);
  const seats = parliament.seatsByParty;

  const p = (key: string) => (partiesMeta[key]?.forecast ?? 0).toFixed(1);

  // Totals
  const coalitionTotal = (
    (partiesMeta["KO"]?.forecast || 0) +
    (partiesMeta["PSL"]?.forecast || 0) +
    (partiesMeta["Polska_2050"]?.forecast || 0) +
    (partiesMeta["Lewica"]?.forecast || 0)
  ).toFixed(1);

  const oppositionTotal = (
    (partiesMeta["PiS"]?.forecast || 0) +
    (partiesMeta["Konfederacja"]?.forecast || 0) +
    (partiesMeta["KKP"]?.forecast || 0) +
    (partiesMeta["Rozwoj_Plus"]?.forecast || 0) +
    (partiesMeta["Razem"]?.forecast || 0)
  ).toFixed(1);

  // Party display config for text presets (emoji + short label)
  const partyDisplay: Record<string, { emoji: string; label: string }> = {
    KO: { emoji: "🟠", label: "KO" },
    PiS: { emoji: "🔵", label: "PiS" },
    Konfederacja: { emoji: "⚫", label: "Konfederacja" },
    KKP: { emoji: "🟤", label: "KKP" },
    Lewica: { emoji: "🔴", label: "Lewica" },
    Rozwoj_Plus: { emoji: "🟪", label: "Rozwoj Plus" },
    PSL: { emoji: "🟢", label: "PSL" },
    Razem: { emoji: "🟣", label: "Razem" },
    Polska_2050: { emoji: "🟡", label: "Polska 2050" },
  };

  // All parties (excluding Niezdecydowani which is shown separately)
  const allPartyKeys = Object.keys(partyDisplay);

  const dailyLines = allPartyKeys
    .map((k) => `${partyDisplay[k].emoji} ${partyDisplay[k].label}: ${p(k)}% (${seats[k] || 0} m.)`)
    .join("\n");

  const dailyText = `🗳️ Prognoza wyborcza na dzień ${formattedDate}:

${dailyLines}
⚪ Niezdecydowani: ${p("Niezdecydowani")}%

🏛️ Mandaty Sejmu i symulacja rządu:`;

  const weekendLines = allPartyKeys
    .map((k) => `${partyDisplay[k].label} (${p(k)}%)`)
    .join(" | ");

  const weekendText = `📊 Prognoza wyborcza na koniec tygodnia (${formattedDateShort}):

${weekendLines}

🏛️ Układ Sejmu (D'Hondt):
Koalicja: ${parliament.coalitionSeats} m. (${coalitionTotal}%)
Opozycja: ${parliament.oppositionSeats} m. (${oppositionTotal}%)
(Próg większości do rządu: 231)

Interaktywne wykresy i mandaty:`;

  const sejmLines = allPartyKeys
    .map((k) => `${partyDisplay[k].label}: ${seats[k] || 0}`)
    .join(" | ");

  const sejmText = `🏛️ Kto ma większość w Sejmie? (Stan na ${formattedDate}):

Do utworzenia rządu potrzeba 231 mandatów.
${
  parliament.coalitionSeats >= 231
    ? `✅ Koalicja zachowuje większość (${parliament.coalitionSeats} mandatów)`
    : `⚠️ Koalicja traci większość (${parliament.coalitionSeats} / 231 mandatów)`
}

${sejmLines}

Symulator koalicji na żywo:`;

  const activeText =
    activeTab === "daily" ? dailyText : activeTab === "weekend" ? weekendText : sejmText;

  const webUrl = "https://pulswyborczy.pl";
  const estimatedTweetLength = activeText.length + 1 + 23;
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    activeText
  )}&url=${encodeURIComponent(webUrl)}`;

  // Generate 1200x675 Infographic on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200;
    const H = 675;
    canvas.width = W;
    canvas.height = H;

    // 1. Dark Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#080d1a");
    bgGrad.addColorStop(0.5, "#0b1224");
    bgGrad.addColorStop(1, "#050811");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid Glow
    const glow = ctx.createRadialGradient(W / 2, 200, 50, W / 2, 200, 600);
    glow.addColorStop(0, "rgba(30, 58, 138, 0.25)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Frame Border
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(30, 30, W - 60, H - 60, 20);
      ctx.stroke();
    } else {
      ctx.strokeRect(30, 30, W - 60, H - 60);
    }

    // 2. Header: Logo & Branding (Left)
    // ECG Emblem
    ctx.save();
    ctx.translate(65, 55);
    ctx.fillStyle = "#475569";
    ctx.fillRect(18, 12, 28, 4); // slot
    // pulse path
    ctx.beginPath();
    ctx.moveTo(6, 36);
    ctx.lineTo(17, 36);
    ctx.lineTo(23, 20);
    ctx.lineTo(31, 50);
    ctx.lineTo(38, 26);
    ctx.lineTo(43, 40);
    ctx.lineTo(47, 36);
    ctx.lineTo(58, 36);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    // dot
    ctx.beginPath();
    ctx.arc(46, 14, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.restore();

    // Logotype Text
    ctx.font = "900 32px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Puls Wyborczy", 140, 88);

    // .pl badge
    ctx.fillStyle = "#1e293b";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(365, 66, 42, 28, 6);
      ctx.fill();
    } else {
      ctx.fillRect(365, 66, 42, 28);
    }
    ctx.font = "700 15px monospace";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(".pl", 376, 85);

    // Header Right: Model & Date
    ctx.font = "700 16px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "right";
    ctx.fillText(`STAN NA: ${formattedDate.toUpperCase()}`, W - 65, 78);

    ctx.font = "600 14px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Model statystyczny: Google TimesFM 3.0", W - 65, 100);
    ctx.textAlign = "left";

    // 3. Section Title Bar
    ctx.fillStyle = "#0f172a";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(65, 125, W - 130, 42, 10);
      ctx.fill();
    } else {
      ctx.fillRect(65, 125, W - 130, 42);
    }
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(65, 125, W - 130, 42, 10);
      ctx.stroke();
    }

    ctx.font = "800 16px sans-serif";
    ctx.fillStyle = "#60a5fa";
    ctx.fillText("PROGNOZA WYBORCZA I PODZIAŁ MANDATÓW SEJMU RP (D'HONDT)", 85, 151);

    ctx.font = "700 14px sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.textAlign = "right";
    ctx.fillText("PROGNOZA NA ŻYWO", W - 85, 151);
    ctx.textAlign = "left";

    // 4. Party Cards (Top 5 Parliamentary Parties)
    const partyKeys = [
      "KO",
      "PiS",
      "Konfederacja",
      "KKP",
      "Lewica",
      "Rozwoj_Plus",
      "PSL",
      "Razem",
      "Polska_2050",
      "Niezdecydowani",
    ];

    // Sorted by forecast desc (excluding Niezdecydowani)
    const sortedParties = partyKeys
      .filter((k) => k !== "Niezdecydowani")
      .sort((a, b) => (partiesMeta[b]?.forecast || 0) - (partiesMeta[a]?.forecast || 0));

    // Top 5 Row
    const top5 = sortedParties.slice(0, 5);
    const cardW = 200;
    const cardH = 155;
    const gap = 17;
    const startX = 65;
    const topY = 185;

    top5.forEach((key, idx) => {
      const pm = partiesMeta[key];
      if (!pm) return;
      const x = startX + idx * (cardW + gap);
      const color = pm.color || "#3b82f6";
      const seatCount = seats[key] || 0;

      // Card Box
      ctx.fillStyle = "#0c1427";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, topY, cardW, cardH, 12);
        ctx.fill();
      } else {
        ctx.fillRect(x, topY, cardW, cardH);
      }

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.5;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, topY, cardW, cardH, 12);
        ctx.stroke();
      }

      // Top colored stripe
      ctx.fillStyle = color;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, topY, cardW, 6, [12, 12, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(x, topY, cardW, 6);
      }

      // Party Name
      ctx.font = "800 20px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(key.replace("_", " "), x + 16, topY + 36);

      // Percentage
      ctx.font = "900 36px sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(`${pm.forecast.toFixed(1)}%`, x + 16, topY + 80);

      // Mandate Pill
      ctx.fillStyle = "#1e293b";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + 16, topY + 104, cardW - 32, 32, 6);
        ctx.fill();
      } else {
        ctx.fillRect(x + 16, topY + 104, cardW - 32, 32);
      }

      ctx.font = "700 14px sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`Mandaty: ${seatCount}`, x + 26, topY + 125);
    });

    // Bottom Row: Next 4 parties + Niezdecydowani
    const bottomParties = [...sortedParties.slice(5), "Niezdecydowani"];
    const bottomCardH = 95;
    const bottomY = 355;

    bottomParties.forEach((key, idx) => {
      const pm = partiesMeta[key];
      if (!pm) return;
      const x = startX + idx * (cardW + gap);
      const color = pm.color || "#64748b";
      const seatCount = seats[key] || 0;

      ctx.fillStyle = "#0a1120";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, bottomY, cardW, bottomCardH, 10);
        ctx.fill();
      } else {
        ctx.fillRect(x, bottomY, cardW, bottomCardH);
      }

      ctx.strokeStyle = "#1a2436";
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, bottomY, cardW, bottomCardH, 10);
        ctx.stroke();
      }

      // Color dot
      ctx.beginPath();
      ctx.arc(x + 20, bottomY + 24, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Name
      ctx.font = "700 15px sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(key.replace("_", " "), x + 34, bottomY + 29);

      // Percentage
      ctx.font = "800 24px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${pm.forecast.toFixed(1)}%`, x + 20, bottomY + 62);

      // Seats / status
      ctx.font = "600 12px sans-serif";
      ctx.fillStyle = key === "Niezdecydowani" ? "#64748b" : seatCount > 0 ? "#10b981" : "#e11d48";
      ctx.fillText(
        key === "Niezdecydowani"
          ? "brak partii"
          : seatCount > 0
          ? `${seatCount} mandatów`
          : "poza Sejmem",
        x + 20,
        bottomY + 82
      );
    });

    // 5. Majority Bar (y = 470, height 50)
    const barY = 470;
    const barH = 46;
    const totalBarW = W - 130;
    const coalitionRatio = parliament.coalitionSeats / 460;
    const coalitionW = Math.round(totalBarW * coalitionRatio);

    // Bar Background (Opposition)
    ctx.fillStyle = "#1e3a8a";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(65, barY, totalBarW, barH, 8);
      ctx.fill();
    } else {
      ctx.fillRect(65, barY, totalBarW, barH);
    }

    // Coalition Fill
    ctx.fillStyle = "#ea580c";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(65, barY, coalitionW, barH, [8, 0, 0, 8]);
      ctx.fill();
    } else {
      ctx.fillRect(65, barY, coalitionW, barH);
    }

    // Texts inside Majority Bar
    ctx.font = "800 16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`KOALICJA: ${parliament.coalitionSeats} MANDATÓW`, 80, barY + 29);

    ctx.textAlign = "right";
    ctx.fillText(`OPOZYCJA: ${parliament.oppositionSeats} MANDATÓW`, W - 80, barY + 29);
    ctx.textAlign = "left";

    // Majority 231 Marker Line
    const markerX = 65 + Math.round(totalBarW * (231 / 460));
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(markerX, barY - 6);
    ctx.lineTo(markerX, barY + barH + 6);
    ctx.stroke();

    // 231 Badge
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(markerX - 60, barY + barH + 10, 120, 22);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(markerX - 60, barY + barH + 10, 120, 22);

    ctx.font = "700 12px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.fillText("WIĘKSZOŚĆ: 231", markerX, barY + barH + 26);
    ctx.textAlign = "left";

    // 6. Footer (y = 590 to 625)
    ctx.font = "500 13px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      "Źródła sondaży: IBRiS, United Surveys, CBOS, Opinia24, Pollster | Makro: NBP, GUS",
      65,
      610
    );

    ctx.font = "800 16px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "right";
    ctx.fillText("PULSWYBORCZY.PL", W - 65, 610);
    ctx.textAlign = "left";

    // Export blob for clipboard & download
    canvas.toBlob((blob) => {
      setImageBlob(blob);
    }, "image/png");
  }, [partiesMeta, seats, parliament, formattedDate]);

  // Copy text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(`${activeText}\n${webUrl}`);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Copy rendered image directly to OS clipboard as PNG
  const handleCopyImage = async () => {
    if (!imageBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": imageBlob,
        }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 3000);
    } catch {
      // Fallback: download if clipboard.write image is restricted
      handleDownloadImage();
    }
  };

  // Download image PNG to file
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `prognoza-pulswyborczy-${formattedDateShort.replace(/\./g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-xl">
      {/* Hidden Canvas for High-Res 1200x675 Infographic Generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2.5 text-white border border-slate-700">
            <XLogo className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Kreator wpisu na X</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Wygeneruj gotowy wpis z aktualną datą i załącz grafikę infografiki jednym kliknięciem
            </p>
          </div>
        </div>

        {/* Action Buttons: Publish, Copy Graphic, Copy Text */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyImage}
            className="flex items-center gap-2 rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-3.5 py-2 text-sm font-semibold text-emerald-300 shadow hover:bg-emerald-900/80 transition"
            title="Kopiuje grafikę do schowka. Następnie wklej (Ctrl+V) w oknie posta na X!"
          >
            {copiedImage ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <ImageIcon className="h-4 w-4 text-emerald-400" />
            )}
            <span>{copiedImage ? "Grafika w schowku (Ctrl+V)!" : "Kopiuj grafikę (PNG)"}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition"
            title="Pobierz obrazek na dysk"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Pobierz</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-200 shadow hover:bg-slate-700 transition"
          >
            {copiedText ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copiedText ? "Skopiowano tekst!" : "Kopiuj tekst"}</span>
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

      {/* Style & View Selectors */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Presets: Daily / Weekend / Sejm */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-[#080d1a] p-1 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "daily"
                ? "bg-slate-700 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-orange-400" />
            <span>Na dzień dzisiejszy</span>
          </button>

          <button
            onClick={() => setActiveTab("weekend")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "weekend"
                ? "bg-slate-700 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
            <span>Pod koniec tygodnia</span>
          </button>

          <button
            onClick={() => setActiveTab("sejm")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "sejm"
                ? "bg-slate-700 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Landmark className="h-3.5 w-3.5 text-emerald-400" />
            <span>Kto stworzy rząd?</span>
          </button>
        </div>

        {/* View mode toggle: Text vs Graphic Preview */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs sm:text-sm">
          <button
            onClick={() => setViewMode("text")}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              viewMode === "text" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Treść posta
          </button>
          <button
            onClick={() => setViewMode("graphic")}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              viewMode === "graphic"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Podgląd grafiki (1200x675)
          </button>
        </div>
      </div>

      {/* Main Content Preview */}
      <div className="mt-4 space-y-3">
        {viewMode === "text" ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-slate-300" />
                <span>Tekst do publikacji (z aktualną datą i mandatami):</span>
              </div>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded border ${
                  estimatedTweetLength <= 280
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                    : "bg-rose-950/60 text-rose-400 border-rose-800/60"
                }`}
              >
                {estimatedTweetLength} / 280 znaków
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 sm:p-5 font-mono text-sm text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {activeText}
              {"\n"}
              <span className="text-slate-400 underline">{webUrl}</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Automatycznie wygenerowana infografika w jakości HD (1200×675 px):</span>
              <span className="text-emerald-400 font-semibold">Gotowa do wklejenia (Ctrl+V)</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
              {imageBlob ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(imageBlob)}
                  alt="Podgląd grafiki prognozy wyborczej"
                  className="w-full h-auto rounded-lg shadow-2xl object-cover"
                />
              ) : (
                <div className="py-16 text-center text-sm text-slate-500">
                  Generowanie grafiki...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actionable Pro-Tip */}
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-[#070b14]/70 p-3 text-xs text-slate-300">
          <span className="text-base leading-none">💡</span>
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">
              Jak błyskawicznie dodać grafikę do posta na X:
            </p>
            <p className="text-slate-400 leading-relaxed">
              Kliknij zielony przycisk <strong>„Kopiuj grafikę (PNG)”</strong>, a następnie w oknie
              tworzenia wpisu na X wciśnij skrót <strong>Ctrl + V</strong>. Grafika od razu
              załączy się do Twojego wpisu jako duże zdjęcie o wysokiej rozdzielczości!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
