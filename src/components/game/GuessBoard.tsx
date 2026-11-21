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
    <div className="w-full overflow-x-auto pb-3">
      <div className="mx-auto min-w-[1060px] max-w-6xl space-y-2 px-1">
        {/* Column headers */}
        <div className="grid grid-cols-[110px_repeat(12,minmax(78px,1fr))] gap-1.5 sm:grid-cols-[128px_repeat(12,minmax(84px,1fr))]">
          <div
            className="sticky left-0 z-10 flex items-center justify-center rounded-lg px-2 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white shadow"
            style={{ backgroundColor: `${surfaceColor}e6` }}
          >
            Amigo
          </div>
          {PALADLE_COLUMNS.map((col) => (
            <div
              key={col.key}
              title={col.fullLabel}
              className="flex items-center justify-center rounded-lg border border-white/15 bg-black/45 px-1 py-1.5 text-center text-[11px] font-bold leading-tight text-white/95 backdrop-blur-sm"
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
