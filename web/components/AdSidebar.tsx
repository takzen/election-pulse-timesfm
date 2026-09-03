"use client";

import React from "react";
import { Sparkles, Megaphone, ExternalLink, Code2, ArrowUpRight } from "lucide-react";

export function AdSidebar() {
  return (
    <aside className="w-full space-y-5 lg:sticky lg:top-8">
      {/* TAKZEN DEV Featured Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-950/40 via-slate-900/90 to-[#070b14] p-5 shadow-2xl transition-all duration-300 hover:border-orange-500/60 hover:shadow-orange-500/10">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/15 blur-2xl transition group-hover:bg-orange-500/25" />

        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-orange-400 uppercase">
          <span className="flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5" /> Twórca Projektu
          </span>
          <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-300">
            ENGINEERING
          </span>
        </div>

        <div className="mt-3">
          <a
            href="https://takzendev.pl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xl font-black text-white hover:text-orange-400 transition"
          >
            TAKZEN DEV
            <ArrowUpRight className="h-4 w-4 text-orange-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
            Dedykowane systemy AI, zaawansowana analityka danych, modele szeregów czasowych i nowoczesne aplikacje Next.js.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-300">
            AI & Foundation Models
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-300">
            Fullstack Next.js
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-300">
            Consulting
          </span>
        </div>

        <a
          href="https://takzendev.pl/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:from-orange-500 hover:to-amber-500 active:scale-95"
        >
          <span>Odwiedź takzendev.pl</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Commercial Ad Slot */}
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl backdrop-blur transition hover:border-slate-700">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Megaphone className="h-3.5 w-3.5 text-blue-400" /> Miejsce na Reklamę
          </span>
          <span className="text-[10px] text-slate-500">Slot #1</span>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-bold text-slate-200">Twój Projekt lub Marka Tutaj</h4>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Dotrzyj bezpośrednio do tysięcy analityków, polityków, inwestorów i pasjonatów AI śledzących wybory.
          </p>
        </div>

        <a
          href="mailto:contact@takzendev.pl?subject=Reklama%20ElectionPulse"
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Zarezerwuj ten slot</span>
        </a>
      </div>
    </aside>
  );
}
