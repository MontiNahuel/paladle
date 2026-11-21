"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getPreviousDateKey } from "@/engine/daily";
import type { GuessEntry } from "@/types/game";

const DAILY_STATE_KEY = "paladle_daily_v1";
const PLAYER_STATS_KEY = "paladle_stats_v1";

interface StoredDailyState {
  dateKey: string;
  guesses: GuessEntry[];
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastWonDateKey: string | null;
  distribution: Record<string, number>;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastWonDateKey: null,
  distribution: {},
};

const EMPTY_GUESSES: GuessEntry[] = [];

const listeners = new Set<() => void>();
let cachedDailyRaw: string | null = null;
let cachedDailyVal: StoredDailyState | null = null;
let cachedStatsRaw: string | null = null;
let cachedStatsVal: PlayerStats = DEFAULT_STATS;

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === DAILY_STATE_KEY || e.key === PLAYER_STATS_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function getDailySnapshot(): StoredDailyState | null {
  try {
    const raw = window.localStorage.getItem(DAILY_STATE_KEY);
    if (raw === cachedDailyRaw) return cachedDailyVal;
    cachedDailyRaw = raw;
    cachedDailyVal = raw ? (JSON.parse(raw) as StoredDailyState) : null;
    return cachedDailyVal;
  } catch {
    return null;
  }
}

function getStatsSnapshot(): PlayerStats {
  try {
    const raw = window.localStorage.getItem(PLAYER_STATS_KEY);
    if (raw === cachedStatsRaw) return cachedStatsVal;
    cachedStatsRaw = raw;
    cachedStatsVal = raw ? (JSON.parse(raw) as PlayerStats) : DEFAULT_STATS;
    return cachedStatsVal;
  } catch {
    return DEFAULT_STATS;
  }
}

const getServerDailySnapshot = () => null;
const getServerStatsSnapshot = () => DEFAULT_STATS;
const subscribeClientFlag = () => () => {};

export function useGameState(dateKey: string) {
  const hydrated = useSyncExternalStore(
    subscribeClientFlag,
    () => true,
    () => false
  );
  const dailyState = useSyncExternalStore(
    subscribe,
    getDailySnapshot,
    getServerDailySnapshot
  );
  const stats = useSyncExternalStore(
    subscribe,
    getStatsSnapshot,
    getServerStatsSnapshot
  );

  const guesses =
    dailyState && dailyState.dateKey === dateKey
      ? dailyState.guesses
      : EMPTY_GUESSES;

  const recordGuess = useCallback(
    (entry: GuessEntry, reachedMaxLoss = false) => {
      const currentDaily = getDailySnapshot();
      const prevGuesses =
        currentDaily && currentDaily.dateKey === dateKey
          ? currentDaily.guesses
          : [];

      if (prevGuesses.some((g) => g.guessId === entry.guessId)) {
        return;
      }

      const nextGuesses = [entry, ...prevGuesses];
      window.localStorage.setItem(
        DAILY_STATE_KEY,
        JSON.stringify({
          dateKey,
          guesses: nextGuesses,
        } satisfies StoredDailyState)
      );

      if (entry.isCorrect || reachedMaxLoss) {
        const prevStats = getStatsSnapshot();
        if (!(prevStats.lastWonDateKey === dateKey && entry.isCorrect)) {
          const yesterdayKey = getPreviousDateKey(dateKey);
          const nextStreak = entry.isCorrect
            ? prevStats.lastWonDateKey === yesterdayKey
              ? prevStats.currentStreak + 1
              : 1
            : 0;
          const attemptsKey = String(nextGuesses.length);
          const nextDist = entry.isCorrect
            ? {
                ...prevStats.distribution,
                [attemptsKey]: (prevStats.distribution[attemptsKey] ?? 0) + 1,
              }
            : prevStats.distribution;

          const updated: PlayerStats = {
            gamesPlayed: prevStats.gamesPlayed + 1,
            gamesWon: prevStats.gamesWon + (entry.isCorrect ? 1 : 0),
            currentStreak: nextStreak,
            maxStreak: Math.max(prevStats.maxStreak, nextStreak),
            lastWonDateKey: entry.isCorrect ? dateKey : prevStats.lastWonDateKey,
            distribution: nextDist,
          };
          window.localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(updated));
        }
      }

      notifyListeners();
    },
    [dateKey]
  );

  const solved = guesses.some((g) => g.isCorrect);

  return {
    guesses,
    stats,
    solved,
    hydrated,
    recordGuess,
  };
}
