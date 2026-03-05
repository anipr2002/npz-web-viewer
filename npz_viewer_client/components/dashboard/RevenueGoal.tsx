"use client";

import { useState, useEffect, useRef } from "react";
import { Coffee, Crown, ExternalLink } from "lucide-react";
import Link from "next/link";
import RateLimitedCheckoutButton from "@/components/RateLimitedCheckoutButton";
import { useAuth } from "@clerk/nextjs";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *    0ms   radial ring visible — shows progress arc + "€0"
 *  ~200ms  fetch returns → ring arc animates 0 → progress %
 *  hover   card expands below with fade + slide-up
 *  leave   card fades out + slides down
 * ───────────────────────────────────────────────────────── */

const GOAL_AMOUNT = 11904; // EUR

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const RING_SIZE = 32;
const STROKE_WIDTH = 3;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ percent }: { percent: number }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(
      () => setAnimatedPercent(Math.min(percent, 100)),
      100,
    );
    return () => clearTimeout(timeout);
  }, [percent]);

  const offset = CIRCUMFERENCE - (animatedPercent / 100) * CIRCUMFERENCE;

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      className="shrink-0 -rotate-90"
    >
      {/* Track */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        className="text-gray-200 dark:text-gray-700"
        strokeWidth={STROKE_WIDTH}
      />
      {/* Progress arc */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="url(#goalGradient)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function RevenueGoal() {
  const [open, setOpen] = useState(false);
  const [revenue, setRevenue] = useState({ polar: 0, bmac: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    fetch("/api/revenue")
      .then((r) => r.json())
      .then((d) => setRevenue({ polar: d.polar ?? 0, bmac: d.bmac ?? 0 }))
      .catch(() => {});
  }, []);

  const { isSignedIn } = useAuth();
  const collected = revenue.polar + revenue.bmac;
  const percent = Math.min((collected / GOAL_AMOUNT) * 100, 100);

  return (
    <div
      className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 pb-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Pill trigger with radial ring */}
      <button
        className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700
                   bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
                   pl-1 pr-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400
                   shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600
                   transition-colors duration-200 cursor-default"
        aria-label="Revenue goal"
      >
        <ProgressRing percent={percent} />
        <span>{formatter.format(collected)}</span>
      </button>

      {/* Hover card */}
      <div
        className={`absolute top-full left-0 mt-2 w-72 rounded-lg border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900 shadow-lg p-3.5
                    transition-all duration-200 origin-top-left
                    ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header with progress */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            Blocked Account Goal
          </p>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
            {formatter.format(collected)} / {formatter.format(GOAL_AMOUNT)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Breakdown */}
        {(revenue.polar > 0 || revenue.bmac > 0) && (
          <div className="flex gap-3 mb-2.5 text-[10px] text-gray-400 dark:text-gray-500">
            {revenue.polar > 0 && (
              <span>Polar: {formatter.format(revenue.polar)}</span>
            )}
            {revenue.bmac > 0 && (
              <span>BMaC: {formatter.format(revenue.bmac)}</span>
            )}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 mb-2.5">
          This is the amount needed for a{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            blocked account (Sperrkonto)
          </span>{" "}
          in Germany — a mandatory escrow account international students must set
          up to prove they can cover living expenses for one year. The funds are
          released monthly after arrival.
        </p>

        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Crown className="h-3 w-3 text-indigo-500 shrink-0" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {isSignedIn ? (
                <RateLimitedCheckoutButton className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]">
                  Get Pro — $3.49
                </RateLimitedCheckoutButton>
              ) : (
                <Link href="/sign-in" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Get Pro — $3.49
                </Link>
              )}
              <span className="text-gray-400 dark:text-gray-500"> · removes ads, unlocks features</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              <Link
                href={process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Buy me a coffee
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              <span className="text-gray-400 dark:text-gray-500"> · one-time tip</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
