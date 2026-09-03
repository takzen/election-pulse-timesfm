"use client";

import React from "react";
import { Megaphone, ExternalLink, Code2, ArrowUpRight } from "lucide-react";

export function AdSidebar() {
  return (
    <aside className="w-full space-y-4 lg:sticky lg:top-8">
      {/* TAKZEN DEV Featured Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121f] p-4 transition hover:border-slate-700">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-slate-300" /> Twórca Projektu
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
            ENGINEERING
          </span>
        </div>

        <div className="mt-2.5">
          <a
            href="https://takzendev.pl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-base font-bold text-white hover:text-slate-300 transition"
          >
            TAKZEN DEV
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </a>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Dedykowane systemy AI, architektura modeli szeregów czasowych i nowoczesne aplikacje Next.js.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
            AI & TimesFM
          </span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
            Fullstack Web
          </span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
            Consulting
          </span>
        </div>

        <a
          href="https://takzendev.pl/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          <span>Odwiedź takzendev.pl</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Commercial Ad Slot */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0d121f] p-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Megaphone className="h-3.5 w-3.5 text-slate-400" /> Miejsce na Reklamę
          </span>
          <span className="text-[10px] text-slate-500">Slot #1</span>
        </div>

        <div className="mt-2">
          <h4 className="text-xs font-semibold text-slate-300">Twój Projekt lub Marka Tutaj</h4>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Dotrzyj bezpośrednio do analityków, dziennikarzy i entuzjastów AI śledzących polskie wybory.
          </p>
        </div>

        <a
          href="mailto:contact@takzendev.pl?subject=Reklama%20ElectionPulse"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
        >
          <span>Zarezerwuj ten slot</span>
        </a>
      </div>
    </aside>
  );
}
