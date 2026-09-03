import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-2xl font-bold text-white">404 - Nie znaleziono strony</h2>
      <p className="mt-2 text-sm text-slate-400">Podany adres nie istnieje.</p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
      >
        Wróć do strony głównej
      </Link>
    </div>
  );
}
