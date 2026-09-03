import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
}

export function Logo({ size = "md", withLink = true }: LogoProps) {
  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
  };

  const content = (
    <div className="inline-flex items-center gap-3 group select-none cursor-pointer">
      {/* Visual Emblem SVG */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#12192d] to-[#0a0f1d] border border-slate-700/80 shadow-md ${iconSizes[size]} transition group-hover:border-slate-600`}>
        <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoPulse" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <rect x="9" y="6" width="14" height="2" rx="1" fill="#64748b" />
          <path
            d="M 4 18 L 9.5 18 L 12 11 L 15.5 24 L 18.5 14 L 21 20 L 23 18 L 28 18"
            stroke="url(#logoPulse)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="7" r="1.5" fill="#10b981" />
        </svg>
      </div>

      {/* Logotype */}
      <div className="flex items-baseline gap-1.5">
        <span className={`font-black tracking-tight text-white ${textSizes[size]}`}>
          Puls Wyborczy
        </span>
        <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-xs font-mono font-bold text-slate-300">
          .pl
        </span>
      </div>
    </div>
  );

  if (withLink) {
    return <Link href="/">{content}</Link>;
  }

  return content;
}
