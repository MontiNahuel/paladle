import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareFriendGuess, type ComparableFriend } from "@/engine/compare";
import {
  getArgentinaDateKey,
  getPreviousDateKey,
  pickDailyFriendId,
} from "@/engine/daily";
import { buildShareText } from "@/engine/share";

const targetFriend: ComparableFriend = {
  id: "f-1",
  name: "Santi",
  avatarUrl: "/avatars/santi.svg",
  entryYear: 2018,
  activityStatus: "Activo",
  workStatus: "Con Laburo",
  weightKg: 78,
  heightCm: 179,
  neighborhood: "Palermo",
  debtorStatus: "No",
  badFriendStatus: "Parcial",
  lolPlayerStatus: "Retirado",
  isKuka: false,
  gameKnowledge: "Si",
  canDrive: true,
};

describe("compareFriendGuess", () => {
  it("marks all 12 cells correct and isCorrect=true for exact target", () => {
    const result = compareFriendGuess(targetFriend, targetFriend);
    assert.equal(result.isCorrect, true);
    assert.equal(result.cells.length, 12);
    assert.ok(result.cells.every((c) => c.status === "correct" && c.direction === "none"));
  });

  it("marks numeric differences as wrong with up/down direction and exact match for enums/text/boolean", () => {
    const guess: ComparableFriend = {
      id: "f-2",
      name: "Tincho",
      avatarUrl: "/avatars/tincho.svg",
      entryYear: 2020, // target 2018 -> down
      activityStatus: "Inactivo", // wrong (never yellow)
      workStatus: "Laburo Parcial", // wrong (never yellow)
      weightKg: 70, // target 78 -> up
      heightCm: 179, // exact -> correct
      neighborhood: "  palermo ", // case-insensitive exact -> correct
      debtorStatus: "Parcial", // wrong
      badFriendStatus: "Si", // wrong
      lolPlayerStatus: "Si", // wrong
      isKuka: true, // wrong
      gameKnowledge: "Si", // correct
      canDrive: false, // wrong
    };

    const result = compareFriendGuess(guess, targetFriend);
    assert.equal(result.isCorrect, false);

    const byKey = Object.fromEntries(result.cells.map((c) => [c.key, c]));
    assert.equal(byKey.entryYear.status, "wrong");
    assert.equal(byKey.entryYear.direction, "down");

    assert.equal(byKey.weightKg.status, "wrong");
    assert.equal(byKey.weightKg.direction, "up");
    assert.equal(byKey.weightKg.displayValue, "70kg");

    assert.equal(byKey.heightCm.status, "correct");
    assert.equal(byKey.heightCm.direction, "none");

    assert.equal(byKey.neighborhood.status, "correct");
    assert.equal(byKey.activityStatus.status, "wrong");
    assert.equal(byKey.workStatus.status, "wrong");
    assert.equal(byKey.debtorStatus.status, "wrong");
    assert.equal(byKey.badFriendStatus.status, "wrong");
    assert.equal(byKey.lolPlayerStatus.status, "wrong");
    assert.equal(byKey.isKuka.status, "wrong");
    assert.equal(byKey.gameKnowledge.status, "correct");
    assert.equal(byKey.canDrive.status, "wrong");
  });

  it("supports dynamic columns and custom enum options like Jubilado", () => {
    const customCols = [
      {
        key: "workStatus",
        shortLabel: "Laburo",
        fullLabel: "Situación Laboral",
        type: "enum" as const,
        options: ["Con Laburo", "Sin Laburo", "Laburo Parcial", "Jubilado"],
      },
      {
        key: "hinchaDe",
        shortLabel: "Hincha",
        fullLabel: "Hincha de",
        type: "text" as const,
      },
    ];

    const guess = {
      id: "f-3",
      name: "Pepe",
      avatarUrl: "/avatars/avatar-1.svg",
      attributes: {
        workStatus: "Jubilado",
        hinchaDe: "Racing",
      },
    };
    const target = {
      id: "f-4",
      name: "Tito",
      avatarUrl: "/avatars/avatar-2.svg",
      attributes: {
        workStatus: "Jubilado",
        hinchaDe: "Boca",
      },
    };

    const result = compareFriendGuess(guess, target, customCols);
    assert.equal(result.cells.length, 2);
    assert.equal(result.cells[0].displayValue, "Jubilado");
    assert.equal(result.cells[0].status, "correct");
    assert.equal(result.cells[1].displayValue, "Racing");
    assert.equal(result.cells[1].status, "wrong");
  });
});

describe("daily helpers", () => {
  it("computes Argentina UTC-3 date key properly across midnight UTC", () => {
    // 2026-11-22 02:30 UTC is 2026-11-21 23:30 in Argentina (UTC-3)
    const date = new Date("2026-11-22T02:30:00Z");
    assert.equal(getArgentinaDateKey(date), "2026-11-21");
    assert.equal(getPreviousDateKey("2026-11-21"), "2026-11-20");
    assert.equal(getPreviousDateKey("2026-01-01"), "2025-12-31");
  });

  it("avoids recent IDs and picks deterministically", () => {
    const pool = ["a", "b", "c", "d"];
    const picked1 = pickDailyFriendId(pool, ["a", "b"], "2026-11-21");
    const picked2 = pickDailyFriendId(pool, ["a", "b"], "2026-11-21");
    assert.equal(picked1, picked2);
    assert.ok(picked1 === "c" || picked1 === "d");
  });
});

describe("buildShareText", () => {
  it("formats chronological emoji grid for winning session", () => {
    const win = compareFriendGuess(targetFriend, targetFriend);
    const miss = compareFriendGuess(
      { ...targetFriend, id: "f-2", weightKg: 65 },
      targetFriend
    );
    // Stored newest-first in state: [win, miss]
    const text = buildShareText("Paladle", "2026-11-21", [win, miss]);
    assert.match(text, /Paladle \(21\/11\/2026\) — ¡Adiviné en 2 intentos!/);
    const lines = text.split("\n");
    // Chronological: miss row first, win row second
    assert.ok(lines[2].includes("⬆️"));
    assert.equal(lines[3], "🟩".repeat(12));
  });
});
