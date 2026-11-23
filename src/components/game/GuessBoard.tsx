"use client";

import { PALADLE_COLUMNS } from "@/engine/columns";
import { GuessRow } from "@/components/game/GuessRow";
import type { GuessEntry } from "@/types/game";

interface GuessBoardProps {
  guesses: GuessEntry[];
  latestGuessId: string | null;
  surfaceColor: string;
}

export function GuessBoard({
  guesses,
  latestGuessId,
  surfaceColor,
}: GuessBoardProps) {
  if (guesses.length === 0) {
    return null;
  }

  return (
    <div className="paladle-scroller w-full overflow-x-auto pb-3">
      <div className="mx-auto min-w-[1040px] max-w-7xl space-y-2">
        {/* Column headers */}
        <div className="grid grid-cols-[106px_repeat(12,minmax(76px,1fr))] gap-1.5 sm:grid-cols-[116px_repeat(12,minmax(78px,1fr))]">
          <div
            className="sticky left-0 z-30 flex items-center justify-center rounded-[4px] border border-white/25 px-2 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white shadow-[6px_0_12px_rgba(0,0,0,0.45)]"
            style={{ backgroundColor: surfaceColor }}
          >
            Amigo
          </div>
          {PALADLE_COLUMNS.map((col) => (
            <div
              key={col.key}
              title={col.fullLabel}
              className="flex items-center justify-center rounded-[4px] border border-white/20 bg-black/45 px-1 py-1.5 text-center text-[11px] font-bold leading-tight text-white/95 backdrop-blur-sm"
            >
              {col.shortLabel}
            </div>
          ))}
        </div>

        {/* Rows (newest first) */}
        <div className="space-y-2">
          {guesses.map((guess) => (
            <GuessRow
              key={guess.guessId}
              guess={guess}
              animate={guess.guessId === latestGuessId}
              surfaceColor={surfaceColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
