"use client";

import React from "react";
import { Megaphone, ExternalLink, Code2, ArrowUpRight } from "lucide-react";

export function AdSidebar() {
  return (
    <aside className="w-full space-y-5 lg:sticky lg:top-8">
      {/* TAKZEN DEV Featured Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 shadow-sm transition hover:border-slate-700">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Code2 className="h-4 w-4 text-slate-300" /> Twórca Projektu
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-semibold">
            ENGINEERING
          </span>
        </div>

        <div className="mt-3">
          <a
            href="https://takzendev.pl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-lg font-bold text-white hover:text-slate-300 transition"
          >
            TAKZEN DEV
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </a>
          <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
            Dedykowane systemy AI, architektura modeli predykcyjnych i nowoczesne aplikacje Next.js.
          </p>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
            Systemy AI
          </span>
          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
            Fullstack Web
          </span>
          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
            Data Engineering
          </span>
        </div>

        <a
          href="https://takzendev.pl/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-100 shadow transition hover:bg-slate-700"
        >
          <span>Odwiedź takzendev.pl</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Commercial Ad Slot */}
      <div className="rounded-2xl border border-slate-800 bg-[#0e1424] p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Megaphone className="h-4 w-4 text-slate-400" /> Miejsce na Reklamę
          </span>
          <span className="text-xs text-slate-500 font-semibold">Slot #1</span>
        </div>

        <div className="mt-2.5">
          <h4 className="text-sm font-bold text-slate-200">Twój Projekt lub Marka</h4>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Dotrzyj bezpośrednio do analityków, dziennikarzy i entuzjastów AI śledzących polskie wybory.
          </p>
        </div>

        <a
          href="mailto:takzen.app@gmail.com?subject=Reklama%20PulsWyborczy.pl"
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <span>Zarezerwuj ten slot</span>
        </a>
      </div>
    </aside>
  );
}
