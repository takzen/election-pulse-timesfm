"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

interface Poll {
  date: string;
  pollster: string | null;
  commissioned_by: string | null;
  sample_size: number | null;
  source_url: string | null;
  is_election: boolean;
  [key: string]: unknown;
}

interface PollSourcesProps {
  polls: Poll[];
  attribution: string;
  parties: Array<{ key: string; name: string }>;
}

/**
 * The list of polls the model was fed, each linking to where it was published.
 *
 * This exists because the site used to name real polling firms beside figures that
 * were not theirs. Showing every source turns that exposure into the opposite: a
 * reader can check any number against its publication.
 */
export function PollSources({ polls, attribution, parties }: PollSourcesProps) {
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? polls : polls.slice(-6);
  const columns = parties.slice(0, 5);

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-[#0e1424] p-5 sm:p-6 shadow-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase">
            Sondaże w modelu
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Każda liczba pochodzi z opublikowanego sondażu. Kliknij datę, żeby otworzyć źródło.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="shrink-0 self-start rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          {expanded ? "Pokaż mniej" : `Pokaż wszystkie (${polls.length})`}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-400">
              <th className="pb-2 pr-3 font-semibold">Data</th>
              <th className="pb-2 pr-3 font-semibold">Pracownia</th>
              <th className="pb-2 pr-3 font-semibold text-right">Próba</th>
              {columns.map((party) => (
                <th key={party.key} className="pb-2 pr-3 font-semibold text-right">
                  {party.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {shown
              .slice()
              .reverse()
              .map((poll, index) => (
                <tr
                  key={`${poll.date}-${poll.pollster}-${index}`}
                  className="border-t border-slate-800/70"
                >
                  <td className="py-2 pr-3 whitespace-nowrap font-mono text-xs">
                    {poll.source_url ? (
                      <a
                        href={poll.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-200 underline underline-offset-2 hover:text-white"
                      >
                        {poll.date}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      poll.date
                    )}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className="font-semibold">{poll.pollster ?? "—"}</span>
                    {poll.commissioned_by ? (
                      <span className="text-slate-400"> / {poll.commissioned_by}</span>
                    ) : null}
                    {poll.is_election ? (
                      <span className="ml-2 rounded bg-emerald-950/60 px-1.5 py-0.5 text-xs font-bold text-emerald-300">
                        wynik wyborów
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-xs text-slate-300">
                    {poll.sample_size ?? "—"}
                  </td>
                  {columns.map((party) => {
                    const value = poll[party.key];
                    return (
                      <td
                        key={party.key}
                        className="py-2 pr-3 text-right font-mono text-xs"
                      >
                        {typeof value === "number" ? value.toFixed(1) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">
        Puste pole oznacza, że pracownia nie podała tej partii osobno — model traktuje to
        jako brak pomiaru, a nie jako zero. {attribution}
      </p>
    </section>
  );
}
