"use client";

import React from "react";
import { Sparkles, Megaphone, ExternalLink, Code2, ArrowUpRight } from "lucide-react";

export function AdSidebar() {
  return (
    <aside className="space-y-6 lg:sticky lg:top-8">
      {/* TAKZEN DEV Featured Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-950/30 via-slate-900/90 to-slate-950 p-5 shadow-xl transition-all duration-300 hover:border-orange-500/50 hover:shadow-orange-500/10">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition group-hover:bg-orange-500/20" />

        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-orange-400 uppercase">
          <span className="flex items-center gap-1">
            <Code2 className="h-3.5 w-3.5" /> Twórca Projektu
          </span>
          <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-300">
            PRO
          </span>
        </div>

        <div className="mt-3">
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            TAKZEN DEV
            <ArrowUpRight className="h-4 w-4 text-orange-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </h3>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            Dedykowane systemy AI, zaawansowana analityka danych, modele szeregów czasowych i nowoczesne aplikacje Next.js.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-400">
            AI & Foundation Models
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-400">
            Fullstack Web
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-400">
            Consulting
          </span>
        </div>

        <a
          href="https://github.com/takzen"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-orange-500"
        >
          <span>Współpraca / Kontakt</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Commercial Ad Slot */}
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg backdrop-blur transition hover:border-slate-700">
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
          href="mailto:contact@takzen.dev?subject=Reklama%20ElectionPulse"
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Zarezerwuj ten slot</span>
        </a>
      </div>
    </aside>
  );
}
