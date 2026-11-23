"use client";

import { GuessRow } from "@/components/game/GuessRow";
import type { GameParameter, GuessEntry } from "@/types/game";

interface GuessBoardProps {
  columns: GameParameter[];
  guesses: GuessEntry[];
  latestGuessId: string | null;
  surfaceColor: string;
}

export function GuessBoard({
  columns,
  guesses,
  latestGuessId,
  surfaceColor,
}: GuessBoardProps) {
  if (guesses.length === 0) {
    return null;
  }

  const colCount = Math.max(columns.length, guesses[0]?.cells.length ?? 0, 1);
  const gridStyle = {
    gridTemplateColumns: `112px repeat(${colCount}, minmax(78px, 1fr))`,
  };
  const minWidthPx = 112 + colCount * 78 + colCount * 6;

  return (
    <div className="paladle-scroller w-full overflow-x-auto pb-3">
      <div
        className="mx-auto max-w-7xl space-y-2"
        style={{ minWidth: `${minWidthPx}px` }}
      >
        {/* Column headers */}
        <div className="grid gap-1.5" style={gridStyle}>
          <div
            className="sticky left-0 z-30 flex items-center justify-center rounded-[4px] border border-white/25 px-2 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-white shadow-[6px_0_12px_rgba(0,0,0,0.45)]"
            style={{ backgroundColor: surfaceColor }}
          >
            Amigo
          </div>
          {columns.map((col) => (
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
              gridStyle={gridStyle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
