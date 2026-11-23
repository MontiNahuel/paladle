import {
  PALADLE_COLUMNS,
  formatAttributeValue,
  type ColumnDefinition,
} from "@/engine/columns";
import type {
  CellComparison,
  DynamicAttributesMap,
  GuessEntry,
} from "@/types/game";

export interface ComparableFriend {
  id: string;
  name: string;
  avatarUrl: string;
  attributes?: DynamicAttributesMap;
  [key: string]: unknown;
}

export function normalizeExactText(value: string): string {
  return value.trim().toLocaleLowerCase("es-AR");
}

function readAttrValue(
  friend: ComparableFriend,
  key: string
): string | number | boolean | undefined {
  if (friend.attributes && key in friend.attributes) {
    return friend.attributes[key];
  }
  const direct = friend[key];
  if (
    typeof direct === "string" ||
    typeof direct === "number" ||
    typeof direct === "boolean"
  ) {
    return direct;
  }
  return undefined;
}

export function compareFriendGuess(
  guess: ComparableFriend,
  target: ComparableFriend,
  columns: readonly ColumnDefinition[] = PALADLE_COLUMNS
): GuessEntry {
  const cells: CellComparison[] = columns.map((col) => {
    const guessVal = readAttrValue(guess, col.key);
    const targetVal = readAttrValue(target, col.key);
    const displayValue = formatAttributeValue(col, {
      [col.key]: guessVal,
    });

    if (col.type === "number") {
      const gNum = Number(guessVal);
      const tNum = Number(targetVal);
      if (Number.isNaN(gNum) || Number.isNaN(tNum)) {
        const isMatch = guessVal === targetVal;
        return {
          key: col.key,
          label: col.shortLabel,
          displayValue,
          status: isMatch ? "correct" : "wrong",
          direction: "none",
        };
      }
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

    if (col.type === "text" || col.type === "enum") {
      const isMatch =
        normalizeExactText(String(guessVal ?? "")) ===
        normalizeExactText(String(targetVal ?? ""));
      return {
        key: col.key,
        label: col.shortLabel,
        displayValue,
        status: isMatch ? "correct" : "wrong",
        direction: "none",
      };
    }

    const isMatch = Boolean(guessVal) === Boolean(targetVal);
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
