import type { GuessEntry } from "@/types/game";
import { formatDisplayDate } from "@/engine/daily";

export function buildShareText(
  title: string,
  dateKey: string,
  guesses: GuessEntry[],
  siteUrl?: string
): string {
  const won = guesses.some((g) => g.isCorrect);
  const header = won
    ? `${title} (${formatDisplayDate(dateKey)}) — ¡Adiviné en ${guesses.length} ${guesses.length === 1 ? "intento" : "intentos"}!`
    : `${title} (${formatDisplayDate(dateKey)}) — ${guesses.length} intentos`;

  // Render oldest-to-newest so the winning green row lands at the bottom.
  const chronological = [...guesses].reverse();
  const rows = chronological.map((guess) =>
    guess.cells
      .map((cell) => {
        if (cell.status === "correct") return "🟩";
        if (cell.direction === "up") return "⬆️";
        if (cell.direction === "down") return "⬇️";
        return "🟥";
      })
      .join("")
  );

  const lines = [header, "", ...rows];
  if (siteUrl) {
    lines.push("", siteUrl);
  }
  return lines.join("\n");
}
