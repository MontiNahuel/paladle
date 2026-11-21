import { PALADLE_COLUMNS, formatAttributeValue } from "@/engine/columns";
import type {
  CellComparison,
  FriendAttributes,
  GuessEntry,
} from "@/types/game";

export interface ComparableFriend extends FriendAttributes {
  id: string;
  name: string;
  avatarUrl: string;
}

export function normalizeExactText(value: string): string {
  return value.trim().toLocaleLowerCase("es-AR");
}

export function compareFriendGuess(
  guess: ComparableFriend,
  target: ComparableFriend
): GuessEntry {
  const cells: CellComparison[] = PALADLE_COLUMNS.map((col) => {
    const guessVal = guess[col.key];
    const targetVal = target[col.key];
    const displayValue = formatAttributeValue(col, guess);

    if (col.type === "number") {
      const gNum = Number(guessVal);
      const tNum = Number(targetVal);
      if (gNum === tNum) {
        return {
          key: col.key,
          label: col.shortLabel,
          displayValue,
          status: "correct",
          direction: "none",
        };
      }
      return {
        key: col.key,
        label: col.shortLabel,
        displayValue,
        status: "wrong",
        direction: gNum < tNum ? "up" : "down",
      };
    }

    if (col.type === "text") {
      const isMatch =
        normalizeExactText(String(guessVal)) ===
        normalizeExactText(String(targetVal));
      return {
        key: col.key,
        label: col.shortLabel,
        displayValue,
        status: isMatch ? "correct" : "wrong",
        direction: "none",
      };
    }

    const isMatch = guessVal === targetVal;
    return {
      key: col.key,
      label: col.shortLabel,
      displayValue,
      status: isMatch ? "correct" : "wrong",
      direction: "none",
    };
  });

  return {
    guessId: guess.id,
    name: guess.name,
    avatarUrl: guess.avatarUrl,
    isCorrect: guess.id === target.id,
    cells,
  };
}
