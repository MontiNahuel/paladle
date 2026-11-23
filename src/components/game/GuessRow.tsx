"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { PALADLE_COLUMNS } from "@/engine/columns";
import type { GameParameter, GuessEntry } from "@/types/game";

const CELL_STAGGER_S = 0.075;
const CELL_FLIP_DURATION_S = 0.3;

export const GUESS_REVEAL_MS = Math.round(
  ((PALADLE_COLUMNS.length - 1) * CELL_STAGGER_S + CELL_FLIP_DURATION_S) * 1000 +
    120
);

interface GuessRowProps {
  columns: GameParameter[];
  guess: GuessEntry;
  animate: boolean;
  surfaceColor: string;
  gridStyle?: React.CSSProperties;
}

export function GuessRow({
  columns,
  guess,
  animate,
  surfaceColor,
  gridStyle,
}: GuessRowProps) {
  const cellByKey = new Map(guess.cells.map((c) => [c.key, c]));
  const alignedCells = columns.map(
    (col) =>
      cellByKey.get(col.key) ?? {
        key: col.key,
        label: col.shortLabel,
        displayValue: "—",
        status: "wrong" as const,
        direction: "none" as const,
      }
  );

  const resolvedGridStyle = gridStyle ?? {
    gridTemplateColumns: `112px repeat(${Math.max(alignedCells.length, 1)}, minmax(78px, 1fr))`,
  };

  return (
    <div className="grid gap-1.5" style={resolvedGridStyle}>
      {/* Sticky friend column */}
      <div
        className="paladle-cell sticky left-0 z-30 flex flex-col items-center justify-center gap-1 rounded-[4px] border-2 border-white/30 p-1.5 shadow-[6px_0_12px_rgba(0,0,0,0.45)]"
        style={{ backgroundColor: surfaceColor }}
      >
        <DynamicImage
          src={guess.avatarUrl}
          alt={guess.name}
          className="paladle-avatar h-11 w-11 rounded-[4px] border border-white/25 bg-slate-900 object-cover sm:h-12 sm:w-12"
        />
        <span className="line-clamp-1 max-w-full text-center text-[11px] font-bold leading-tight text-white">
          {guess.name}
        </span>
      </div>

      {/* Variable cells */}
      {alignedCells.map((cell, index) => {
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
                    delay: index * CELL_STAGGER_S,
                    duration: CELL_FLIP_DURATION_S,
                    ease: "easeOut",
                  }
                : { duration: 0 }
            }
            className={`paladle-cell relative z-0 flex min-h-[74px] flex-col items-center justify-center overflow-hidden rounded-[4px] border-2 px-1.5 py-2 text-center ${bgClass}`}
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
            <span className="paladle-cell-value relative z-10 break-words text-xs font-extrabold leading-tight drop-shadow-sm sm:text-[13px]">
              {cell.displayValue}
            </span>
            {cell.direction !== "none" && (
              <span className="relative z-10 mt-0.5 inline-flex items-center gap-0.5 rounded-[4px] bg-black/25 px-1 py-0.5 text-[10px] font-bold leading-none">
                {cell.direction === "up" ? "Más ↑" : "Menos ↓"}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
