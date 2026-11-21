"use client";

import { useMemo, useState } from "react";
import { BarChart3, Flame, HelpCircle, Users } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { GuessBoard } from "@/components/game/GuessBoard";
import {
  HowToPlayModal,
  StatsModal,
  VictoryBanner,
} from "@/components/game/Modals";
import { SearchInput } from "@/components/game/SearchInput";
import { formatDisplayDate } from "@/engine/daily";
import { useGameState } from "@/hooks/useGameState";
import { resolveBackgroundStyle } from "@/lib/theme";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);

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
      recordGuess(data.guess, willReachMaxLoss);
    } catch {
      setErrorMsg("Error de conexión. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgGradient = resolveBackgroundStyle(settings);

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden text-white"
      style={{ background: bgGradient }}
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
        className="pointer-events-none fixed inset-0 bg-slate-950/35"
      />

      {/* Top Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 pt-6 pb-2">
        <div className="flex w-full items-center justify-between">
          <div className="w-20">
            {adminEnabled && (
              <a
                href="/admin"
                className="inline-flex items-center rounded-lg border border-white/25 bg-black/35 px-2.5 py-1 text-xs font-bold text-white/90 backdrop-blur-sm hover:bg-black/55"
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
                className="max-h-16 object-contain drop-shadow-xl"
              />
            ) : (
              <h1
                className="text-4xl font-black tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,0.45)] sm:text-5xl"
                style={{ color: settings.primaryColor }}
              >
                {settings.title}
              </h1>
            )}
          </div>

          <div className="flex w-20 justify-end" />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowStats(true)}
            title="Estadísticas"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-black/55"
          >
            <BarChart3 className="h-5 w-5" />
          </button>

          <div
            title="Racha actual"
            className="flex h-10 items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-3 text-sm font-black backdrop-blur-sm"
          >
            <Flame className="h-4 w-4 text-orange-400" />
            <span>{hydrated ? stats.currentStreak : 0}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            title="Cómo jugar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition hover:scale-105 hover:bg-black/55"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-5 px-3 py-4 sm:px-6">
        {/* Prompt Card */}
        <div
          className="w-full max-w-lg rounded-2xl border-2 px-5 py-4 text-center shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: `${settings.surfaceColor}e6`,
            borderColor: settings.primaryColor,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">
            Edición diaria · {formatDisplayDate(dateKey)}
          </p>
          <p className="mt-1 text-lg font-extrabold sm:text-xl">
            {settings.subtitle}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs text-white/80">
            <Users className="h-3.5 w-3.5" style={{ color: settings.accentColor }} />
            <span>
              {dailyStats.totalSolves}{" "}
              {dailyStats.totalSolves === 1 ? "persona acertó" : "personas acertaron"}{" "}
              hoy
              {dailyStats.totalSolves > 0
                ? ` · Promedio ${dailyStats.avgAttempts} intentos`
                : ""}
            </span>
          </div>
          {settings.maxAttempts !== null && (
            <p className="mt-1.5 text-xs font-semibold text-white/70">
              Intentos: {guesses.length} / {settings.maxAttempts}
            </p>
          )}
        </div>

        {poolEmpty ? (
          <div
            className="w-full max-w-md rounded-2xl border-2 p-6 text-center shadow-xl"
            style={{
              backgroundColor: `${settings.surfaceColor}eb`,
              borderColor: settings.primaryColor,
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
            {winningGuess ? (
              <VictoryBanner
                title={settings.title}
                dateKey={dateKey}
                guesses={guesses}
                winningGuess={winningGuess}
                dailyStats={dailyStats}
                primaryColor={settings.primaryColor}
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
              <p className="rounded-xl bg-rose-600/90 px-4 py-2 text-sm font-semibold text-white shadow">
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
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75 drop-shadow">
              El amigo de ayer fue
            </p>
            <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 backdrop-blur-sm">
              <DynamicImage
                src={yesterdayFriend.avatarUrl}
                alt={yesterdayFriend.name}
                className="h-6 w-6 rounded-full object-cover"
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
