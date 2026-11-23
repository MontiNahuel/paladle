"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BarChart3, Flame, HelpCircle, Users } from "lucide-react";
import { GuessBoard } from "@/components/game/GuessBoard";
import { GUESS_REVEAL_MS } from "@/components/game/GuessRow";
import {
  HowToPlayModal,
  StatsModal,
  VictoryBanner,
} from "@/components/game/Modals";
import { SearchInput } from "@/components/game/SearchInput";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { formatDisplayDate } from "@/engine/daily";
import { useGameState } from "@/hooks/useGameState";
import { RETRO_FONT_LABELS } from "@/lib/theme";
import type {
  DailyStatsSummary,
  GameBootstrapResponse,
  GuessResponse,
} from "@/types/game";

interface PaladleGameProps {
  initialData: GameBootstrapResponse;
  adminEnabled: boolean;
}

export function PaladleGame({ initialData, adminEnabled }: PaladleGameProps) {
  const { settings, candidates, yesterdayFriend, dateKey, poolEmpty } =
    initialData;

  const { guesses, stats, solved, hydrated, recordGuess } =
    useGameState(dateKey);

  const [dailyStats, setDailyStats] = useState<DailyStatsSummary>(
    initialData.dailyStats
  );
  const [latestGuessId, setLatestGuessId] = useState<string | null>(null);
  const [isRevealingWin, setIsRevealingWin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  const guessedIds = useMemo(
    () => new Set(guesses.map((g) => g.guessId)),
    [guesses]
  );

  const winningGuess = useMemo(
    () => guesses.find((g) => g.isCorrect) ?? null,
    [guesses]
  );

  const reachedMaxAttempts =
    settings.maxAttempts !== null && guesses.length >= settings.maxAttempts;
  const gameFinished = solved || reachedMaxAttempts;

  const handleSelectCandidate = async (guessId: string) => {
    if (gameFinished || isSubmitting || guessedIds.has(guessId)) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const attemptNumber = guesses.length + 1;
      const res = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guessId, attemptNumber }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setErrorMsg(payload.error ?? "No se pudo procesar tu intento.");
        return;
      }

      const data = payload as GuessResponse;
      const willReachMaxLoss =
        !data.guess.isCorrect &&
        settings.maxAttempts !== null &&
        attemptNumber >= settings.maxAttempts;

      setLatestGuessId(data.guess.guessId);
      setDailyStats(data.dailyStats);
      if (data.guess.isCorrect) {
        setIsRevealingWin(true);
        if (revealTimerRef.current) {
          clearTimeout(revealTimerRef.current);
        }
        revealTimerRef.current = setTimeout(() => {
          setIsRevealingWin(false);
        }, GUESS_REVEAL_MS);
      }
      recordGuess(data.guess, willReachMaxLoss);
    } catch {
      setErrorMsg("Error de conexión. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const retroFontMeta = RETRO_FONT_LABELS[settings.retroFont ?? "pixelify"];

  const themeVars = {
    "--paladle-primary": settings.primaryColor,
    "--paladle-bg": settings.backgroundColor,
    "--paladle-surface": settings.surfaceColor,
    "--paladle-accent": settings.accentColor,
    "--paladle-radius": "4px",
    ...(settings.themePreset === "retro"
      ? {
          "--paladle-body-font": retroFontMeta.fontCss,
          "--paladle-cell-size": retroFontMeta.cellSize,
          "--paladle-cell-weight": retroFontMeta.cellWeight,
          "--paladle-cell-tracking": retroFontMeta.cellTracking,
          "--paladle-cell-line-height": retroFontMeta.cellLineHeight,
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      data-theme={settings.themePreset}
      data-retro-font={settings.retroFont}
      style={themeVars}
      className="paladle-stage relative flex min-h-screen flex-col overflow-x-hidden text-white"
    >
      {settings.backgroundImageUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.backgroundImageUrl})` }}
        />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-slate-950/25"
      />

      {/* Top Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 pt-6 pb-2">
        <div className="flex w-full items-center justify-between">
          <div className="w-24">
            {adminEnabled && (
              <a
                href="/admin"
                className="paladle-btn inline-flex items-center rounded-[4px] border border-white/25 bg-black/40 px-2.5 py-1 text-xs font-bold text-white/95 backdrop-blur-sm transition hover:bg-black/60"
              >
                Panel Dev
              </a>
            )}
          </div>

          <div className="flex flex-col items-center">
            {settings.logoImageUrl ? (
              <DynamicImage
                src={settings.logoImageUrl}
                alt={settings.title}
                className="paladle-avatar max-h-16 object-contain drop-shadow-xl"
              />
            ) : (
              <h1
                className="paladle-title text-center text-4xl font-black tracking-tight sm:text-5xl"
                style={{ color: settings.primaryColor }}
              >
                {settings.title}
              </h1>
            )}
          </div>

          <div className="flex w-24 justify-end" />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowStats(true)}
            title="Estadísticas"
            aria-label="Estadísticas"
            className="paladle-btn flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/25 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <BarChart3 className="h-4 w-4" />
          </button>

          <div
            title="Racha actual"
            className="paladle-btn flex h-9 items-center gap-1.5 rounded-[4px] border border-white/25 bg-black/40 px-3 text-sm font-black backdrop-blur-sm"
          >
            <Flame className="h-4 w-4 text-orange-400" />
            <span>{hydrated ? stats.currentStreak : 0}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            title="Cómo jugar"
            aria-label="Cómo jugar"
            className="paladle-btn flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/25 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-5 px-3 py-4 sm:px-6">
        {/* Prompt Card */}
        <div
          className="paladle-card w-full max-w-lg px-5 py-4 text-center backdrop-blur-md"
          style={{
            backgroundColor: `${settings.surfaceColor}eb`,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/65">
            Edición diaria · {formatDisplayDate(dateKey)}
          </p>
          <p className="mt-1 text-lg font-extrabold sm:text-xl">
            {settings.subtitle}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-[4px] bg-black/30 px-3 py-1 text-xs text-white/85">
            <Users
              className="h-3.5 w-3.5"
              style={{ color: settings.accentColor }}
            />
            <span>
              {dailyStats.totalSolves}{" "}
              {dailyStats.totalSolves === 1
                ? "persona acertó"
                : "personas acertaron"}{" "}
              hoy
              {dailyStats.totalSolves > 0
                ? ` · Promedio ${dailyStats.avgAttempts} intentos`
                : ""}
            </span>
          </div>
          {settings.maxAttempts !== null && (
            <p className="mt-1.5 text-xs font-semibold text-white/75">
              Intentos: {guesses.length} / {settings.maxAttempts}
            </p>
          )}
        </div>

        {poolEmpty ? (
          <div
            className="paladle-card w-full max-w-md p-6 text-center"
            style={{
              backgroundColor: `${settings.surfaceColor}eb`,
            }}
          >
            <p className="text-base font-bold">
              Todavía no hay amigos cargados en la base de datos.
            </p>
            <p className="mt-1 text-sm text-white/75">
              {adminEnabled
                ? "Entrá al Panel Dev para cargar tus primeros amigos."
                : "Agregalos desde el panel de administración en la rama dev."}
            </p>
          </div>
        ) : (
          <>
            {winningGuess && !isRevealingWin ? (
              <VictoryBanner
                title={settings.title}
                dateKey={dateKey}
                guesses={guesses}
                winningGuess={winningGuess}
                dailyStats={dailyStats}
                surfaceColor={settings.surfaceColor}
              />
            ) : (
              <SearchInput
                candidates={candidates}
                guessedIds={guessedIds}
                disabled={gameFinished}
                isSubmitting={isSubmitting}
                primaryColor={settings.primaryColor}
                surfaceColor={settings.surfaceColor}
                onSelect={handleSelectCandidate}
              />
            )}

            {errorMsg && (
              <p className="rounded-[4px] border border-rose-300 bg-rose-600/95 px-4 py-2 text-sm font-semibold text-white shadow">
                {errorMsg}
              </p>
            )}

            <GuessBoard
              guesses={guesses}
              latestGuessId={latestGuessId}
              surfaceColor={settings.surfaceColor}
            />
          </>
        )}

        {/* Yesterday's Friend */}
        {yesterdayFriend && (
          <div className="mt-auto pt-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80 drop-shadow">
              El amigo de ayer fue
            </p>
            <div className="mt-1.5 inline-flex items-center gap-2 rounded-[4px] border border-white/25 bg-black/45 px-3.5 py-1.5 backdrop-blur-sm">
              <DynamicImage
                src={yesterdayFriend.avatarUrl}
                alt={yesterdayFriend.name}
                className="paladle-avatar h-6 w-6 rounded-[4px] object-cover"
              />
              <span className="text-sm font-extrabold text-emerald-300">
                {yesterdayFriend.name}
              </span>
            </div>
          </div>
        )}
      </main>

      <HowToPlayModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        primaryColor={settings.primaryColor}
        surfaceColor={settings.surfaceColor}
      />

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        dailyStats={dailyStats}
        primaryColor={settings.primaryColor}
        surfaceColor={settings.surfaceColor}
      />
    </div>
  );
}
