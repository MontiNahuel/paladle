"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";
import type { GuessEntry } from "@/types/game";

interface GuessRowProps {
  guess: GuessEntry;
  animate: boolean;
  surfaceColor: string;
}

export function GuessRow({ guess, animate, surfaceColor }: GuessRowProps) {
  return (
    <div className="grid grid-cols-[110px_repeat(12,minmax(78px,1fr))] gap-1.5 sm:grid-cols-[128px_repeat(12,minmax(84px,1fr))]">
      {/* Sticky friend column */}
      <div
        className="sticky left-0 z-10 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-white/30 p-1.5 shadow-md"
        style={{ backgroundColor: surfaceColor }}
      >
        <DynamicImage
          src={guess.avatarUrl}
          alt={guess.name}
          className="h-11 w-11 rounded-lg border border-white/25 bg-slate-900 object-cover sm:h-12 sm:w-12"
        />
        <span className="line-clamp-1 max-w-full text-center text-[11px] font-bold leading-tight text-white">
          {guess.name}
        </span>
      </div>

      {/* 12 variable cells */}
      {guess.cells.map((cell, index) => {
        const isCorrect = cell.status === "correct";
        const bgClass = isCorrect
          ? "bg-emerald-600/95 border-emerald-300 text-white"
          : "bg-rose-600/95 border-rose-300 text-white";

        return (
          <motion.div
            key={cell.key}
            initial={
              animate ? { rotateX: 90, opacity: 0, scale: 0.92 } : false
            }
            animate={{ rotateX: 0, opacity: 1, scale: 1 }}
            transition={
              animate
                ? {
                    delay: index * 0.075,
                    duration: 0.3,
                    ease: "easeOut",
                  }
                : { duration: 0 }
            }
            className={`relative flex min-h-[74px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 px-1.5 py-2 text-center shadow-md ${bgClass}`}
          >
            {cell.direction === "up" && (
              <ArrowUp
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-auto h-11 w-11 text-black/25"
                strokeWidth={3}
              />
            )}
            {cell.direction === "down" && (
              <ArrowDown
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-auto h-11 w-11 text-black/25"
                strokeWidth={3}
              />
            )}
            <span className="relative z-10 break-words text-xs font-extrabold leading-tight drop-shadow-sm sm:text-[13px]">
              {cell.displayValue}
            </span>
            {cell.direction !== "none" && (
              <span className="relative z-10 mt-0.5 inline-flex items-center gap-0.5 rounded bg-black/25 px-1 py-0.5 text-[10px] font-bold leading-none">
                {cell.direction === "up" ? "Más ↑" : "Menos ↓"}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
