import React, { useId } from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
}

export function Logo({ size = "md", withLink = true }: LogoProps) {
  const gradientId = useId();

  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const textSizes = {
    sm: "text-lg sm:text-xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
  };

  const content = (
    <div className="inline-flex items-center gap-2.5 sm:gap-3 group select-none cursor-pointer shrink-0 whitespace-nowrap">
      {/* Animated Visual Emblem SVG - Frameless & Responsive-locked */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full shrink-0 animate-pulse-ecg transition-transform group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <rect x="9" y="6" width="14" height="2" rx="1" fill="#475569" opacity="0.8" />
          <path
            d="M 3 18 L 8.5 18 L 11.5 10 L 15.5 25 L 19 13 L 21.5 20 L 23.5 18 L 29 18"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="7" r="1.75" fill="#10b981" className="animate-live-dot" />
        </svg>
      </div>

      {/* Logotype */}
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className={`font-black tracking-tight text-white ${textSizes[size]}`}>
          Puls Wyborczy
        </span>
        <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-300">
          .pl
        </span>
      </div>
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-block shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
