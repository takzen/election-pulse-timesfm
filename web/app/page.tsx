import React from "react";
import Link from "next/link";
import forecastsData from "../public/data/forecasts.json";
import { Logo } from "@/components/Logo";
import { PartyCard } from "@/components/PartyCard";
import { MajorityBar } from "@/components/MajorityBar";
import { CoalitionSimulator } from "@/components/CoalitionSimulator";
import { FanChart } from "@/components/FanChart";
import { TwitterCardExport } from "@/components/TwitterCardExport";
import { AdSidebar } from "@/components/AdSidebar";
import { HouseEffects } from "@/components/HouseEffects";
import { PollSources } from "@/components/PollSources";
import { Activity, Calendar, ExternalLink, Info } from "lucide-react";
import { calculateDhondtSeats } from "@/lib/dhondt";

export default function Home() {
  const {
    metadata,
    parties_meta,
    history,
    forecast_chart,
    undecided,
    house_effects,
    recent_polls,
    validation,
  } = forecastsData;

  // Shares are already on the decided-voter base, so the 5% threshold applies directly.
  const parliament = calculateDhondtSeats(parties_meta as any);

  const coalitionTotal = roundOne(
    (parties_meta["KO"]?.forecast || 0) +
      (parties_meta["PSL"]?.forecast || 0) +
      (parties_meta["Polska_2050"]?.forecast || 0) +
      (parties_meta["Lewica"]?.forecast || 0)
  );

  const oppositionTotal = roundOne(
    (parties_meta["PiS"]?.forecast || 0) +
      (parties_meta["Konfederacja"]?.forecast || 0) +
      (parties_meta["KKP"]?.forecast || 0) +
      (parties_meta["Rozwoj_Plus"]?.forecast || 0) +
      (parties_meta["Razem"]?.forecast || 0)
  );

  function roundOne(n: number) {
    return Math.round(n * 10) / 10;
  }

  const partyList = Object.entries(parties_meta).map(([key, meta]) => ({
    key,
    name: (meta as any).name as string,
    color: (meta as any).color as string,
  }));

  const updated = metadata.generated_at?.slice(0, 10) ?? metadata.cutoff_date;

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 antialiased selection:bg-slate-700 selection:text-white">
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 py-6 sm:py-8 space-y-8">
        <header className="w-full border-b border-slate-800/80 pb-5 sm:pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="shrink-0">
                <Logo size="lg" />
              </div>

              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
                Niezależny agregator sondaży wyborczych. Model łączy{" "}
                <strong>{metadata.n_polls} opublikowanych sondaży</strong> z{" "}
                <strong>{metadata.n_pollsters} pracowni</strong>, oddziela realne zmiany
                poparcia od błędu próby i od systematycznych odchyleń poszczególnych
                pracowni, i podaje przedział niepewności zamiast jednej liczby.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 text-xs sm:text-sm shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-800/50 bg-[#0e1f1c] px-3.5 py-2 text-emerald-300 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>
                  Aktualizacja: <strong className="text-white">{updated}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0e1424] px-3.5 py-2 text-slate-200 shadow-sm">
                <Activity className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span>
                  Ostatni sondaż:{" "}
                  <strong className="text-white">{metadata.cutoff_date}</strong>
                  {metadata.cutoff_pollster ? ` (${metadata.cutoff_pollster})` : null}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0e1424] px-3.5 py-2 text-slate-200 shadow-sm">
                <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>
                  Prognoza: <strong className="text-white">+{metadata.horizon_days} dni</strong> (do{" "}
                  {metadata.target_date})
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* What the percentages mean, and the undecided group kept off the same axis. */}
        <section className="w-full rounded-2xl border border-slate-800 bg-[#0e1424]/70 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
              <span>
                Wszystkie wyniki podane jako{" "}
                <strong className="text-white">{metadata.basis_label}</strong> — tak samo
                jak w mediach, więc liczby są porównywalne z tym, co czytasz w prasie.
              </span>
            </p>
            <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm">
              <span className="text-slate-400">Niezdecydowani: </span>
              <strong className="text-white">{undecided.mean}%</strong>
              <span className="text-slate-400">
                {" "}
                ({undecided.p10}–{undecided.p90})
              </span>
            </div>
          </div>
        </section>

        <section className="w-full">
          <MajorityBar
            coalitionTotal={coalitionTotal}
            oppositionTotal={oppositionTotal}
            coalitionSeats={parliament.coalitionSeats}
            oppositionSeats={parliament.oppositionSeats}
          />
        </section>

        <section className="w-full space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-2.5 gap-1">
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase">
              Prognoza na {metadata.horizon_days} dni (do {metadata.target_date})
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Stan na {metadata.cutoff_date} • {metadata.basis_label} • mandaty metodą
              D&apos;Hondta, próg 5%, przybliżenie ogólnokrajowe
            </p>
          </div>

          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
            {Object.entries(parties_meta).map(([key, meta]) => (
              <PartyCard
                key={key}
                partyKey={key}
                meta={meta as any}
                seats={parliament.seatsByParty[key]}
                isAboveThreshold={parliament.isAboveThreshold[key]}
              />
            ))}
          </div>
        </section>

        <div className="w-full grid grid-cols-1 gap-8 xl:grid-cols-12 items-start">
          <div className="xl:col-span-10 space-y-8">
            <section className="w-full">
              <CoalitionSimulator
                partiesMeta={parties_meta as any}
                seatsByParty={parliament.seatsByParty}
                isAboveThreshold={parliament.isAboveThreshold}
              />
            </section>

            <section className="w-full">
              <FanChart
                history={history}
                forecast={forecast_chart}
                partiesMeta={parties_meta as any}
                cutoffDate={metadata.cutoff_date}
              />
            </section>

            <HouseEffects
              houseEffects={house_effects as any}
              parties={partyList}
            />

            <PollSources
              polls={recent_polls as any}
              attribution={metadata.attribution}
              parties={partyList}
            />

            <section className="w-full">
              <TwitterCardExport
                metadata={metadata}
                undecided={undecided as any}
                partiesMeta={parties_meta as any}
              />
            </section>
          </div>

          <div className="xl:col-span-2 w-full">
            <AdSidebar />
          </div>
        </div>

        <footer className="w-full mt-12 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs sm:text-sm text-slate-400 space-y-3">
          <div className="flex justify-center">
            <Logo size="sm" />
          </div>
          <p>
            Projekt stworzony przez{" "}
            <a
              href="https://takzendev.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-200 hover:text-white underline underline-offset-4 inline-flex items-center gap-1"
            >
              TAKZEN DEV <ExternalLink className="h-3.5 w-3.5" />
            </a>{" "}
            • Model: <strong>{metadata.model_short}</strong>
          </p>

          {/* Accuracy is stated only where it has been measured out of sample. */}
          {validation && (validation as any).coverage_80 ? (
            <p className="mx-auto max-w-3xl text-xs text-slate-400 leading-relaxed">
              Sprawdzone na {(validation as any).n_evaluations} sondażach, których model
              nie widział: przedział 80% objął rzeczywisty wynik w{" "}
              <strong className="text-slate-200">
                {((validation as any).coverage_80 * 100).toFixed(0)}%
              </strong>{" "}
              przypadków, średni błąd{" "}
              <strong className="text-slate-200">
                {(validation as any).mae_model.toFixed(2)} pp
              </strong>
              {(validation as any).advantage_is_significant
                ? " — istotnie mniej niż naiwna średnia z trzech ostatnich sondaży."
                : `. Różnica wobec naiwnej średniej z trzech ostatnich sondaży (${(validation as any).mae_random_walk.toFixed(
                    2
                  )} pp) nie jest istotna statystycznie — przewagą modelu jest skalibrowana niepewność i korekta efektów pracowni, nie sam punktowy wynik.`}
            </p>
          ) : null}

          <p className="text-xs text-slate-400">{metadata.attribution}</p>

          <div className="pt-2">
            <Link
              href="/polityka-prywatnosci"
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition"
            >
              Polityka prywatności i nota prawna
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
