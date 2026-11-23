"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Trophy } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { PALADLE_COLUMNS } from "@/engine/columns";
import { buildShareText } from "@/engine/share";
import type { PlayerStats } from "@/hooks/useGameState";
import type { DailyStatsSummary, GuessEntry } from "@/types/game";

function getCountdownToArgentinaMidnight(): string {
  const now = new Date();
  const utcMs = now.getTime();
  const arOffsetMs = -3 * 60 * 60 * 1000;
  const arNow = new Date(utcMs + arOffsetMs);
  const nextMidnightAr = Date.UTC(
    arNow.getUTCFullYear(),
    arNow.getUTCMonth(),
    arNow.getUTCDate() + 1,
    0,
    0,
    0
  );
  const diffSec = Math.max(0, Math.floor((nextMidnightAr - arNow.getTime()) / 1000));
  const h = String(Math.floor(diffSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
  const s = String(diffSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function VictoryBanner({
  title,
  dateKey,
  guesses,
  winningGuess,
  dailyStats,
  surfaceColor,
}: {
  title: string;
  dateKey: string;
  guesses: GuessEntry[];
  winningGuess: GuessEntry;
  dailyStats: DailyStatsSummary;
  surfaceColor: string;
}) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(() =>
    getCountdownToArgentinaMidnight()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownToArgentinaMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : undefined;
    const text = buildShareText(title, dateKey, guesses, url);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="paladle-card mx-auto w-full max-w-lg p-5 text-center text-white backdrop-blur-md"
      style={{
        backgroundColor: `${surfaceColor}eb`,
      }}
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-[4px] bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
        <Trophy className="h-4 w-4" />
        ¡Adivinaste en {guesses.length}{" "}
        {guesses.length === 1 ? "intento" : "intentos"}!
      </div>

      <div className="flex items-center justify-center gap-4">
        <DynamicImage
          src={winningGuess.avatarUrl}
          alt={winningGuess.name}
          className="paladle-avatar h-16 w-16 rounded-[4px] border-2 border-emerald-400 bg-slate-900 object-cover shadow-lg"
        />
        <div className="text-left">
          <p className="text-xs uppercase tracking-wide text-white/70">
            El amigo de hoy era
          </p>
          <p className="text-2xl font-black tracking-tight">{winningGuess.name}</p>
          <p className="text-xs text-white/75">
            {dailyStats.totalSolves}{" "}
            {dailyStats.totalSolves === 1 ? "persona acertó" : "personas acertaron"}{" "}
            hoy · Promedio: {dailyStats.avgAttempts || guesses.length} intentos
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-4 sm:flex-row">
        <div className="text-left">
          <p className="text-[11px] uppercase tracking-wider text-white/60">
            Próximo amigo en (ART)
          </p>
          <p
            className="font-mono text-lg font-bold"
            style={{ color: "var(--paladle-primary)" }}
          >
            {countdown}
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="paladle-primary-btn paladle-btn inline-flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-sm font-extrabold shadow-lg transition hover:opacity-90"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> ¡Resultado copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Compartir resultado
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function HowToPlayModal({
  open,
  onClose,
  primaryColor,
  surfaceColor,
}: {
  open: boolean;
  onClose: () => void;
  primaryColor: string;
  surfaceColor: string;
}) {
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="¿Cómo se juega?"
      maxWidthClass="max-w-lg"
      style={{ backgroundColor: surfaceColor, borderColor: primaryColor }}
    >
      <div className="space-y-4 text-sm leading-relaxed text-white/90">
        <p>
          Cada día a las <strong>00:00 (hora Argentina)</strong> se sortea un
          amigo del grupo. Escribí nombres en el buscador para descubrir quién
          es comparando sus 12 variables.
        </p>

        <div className="space-y-2 rounded-[4px] bg-black/25 p-3.5">
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 shrink-0 rounded-[4px] bg-emerald-500" />
            <span>
              <strong>Verde:</strong> Coincidencia exacta con el amigo del día.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 shrink-0 rounded-[4px] bg-rose-600" />
            <span>
              <strong>Rojo:</strong> No coincide.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-rose-600 text-xs font-black">
              ↑↓
            </span>
            <span>
              <strong>Flechas (Ingreso, Peso, Altura):</strong> Indican si el
              valor real del amigo del día es más alto (↑) o más bajo (↓).
            </span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 font-bold text-white">Variables evaluadas:</p>
          <div className="flex flex-wrap gap-1.5">
            {PALADLE_COLUMNS.map((col) => (
              <span
                key={col.key}
                className="rounded-[4px] border border-white/15 bg-white/10 px-2 py-0.5 text-xs"
              >
                {col.fullLabel}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}

export function StatsModal({
  open,
  onClose,
  stats,
  dailyStats,
  primaryColor,
  surfaceColor,
}: {
  open: boolean;
  onClose: () => void;
  stats: PlayerStats;
  dailyStats: DailyStatsSummary;
  primaryColor: string;
  surfaceColor: string;
}) {
  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Estadísticas"
      maxWidthClass="max-w-md"
      style={{ backgroundColor: surfaceColor, borderColor: primaryColor }}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Jugadas", value: stats.gamesPlayed },
            { label: "% Victorias", value: `${winRate}%` },
            { label: "Racha", value: stats.currentStreak },
            { label: "Mejor Racha", value: stats.maxStreak },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[4px] border border-white/10 bg-black/25 p-2.5"
            >
              <p className="text-xl font-black" style={{ color: primaryColor }}>
                {item.value}
              </p>
              <p className="text-[11px] text-white/70">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[4px] border border-white/10 bg-black/25 p-4 text-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-white/60">
            Estadísticas globales de hoy
          </p>
          <p>
            <strong>{dailyStats.totalSolves}</strong>{" "}
            {dailyStats.totalSolves === 1 ? "jugador acertó" : "jugadores acertaron"}{" "}
            hoy
            {dailyStats.totalSolves > 0
              ? ` · Promedio: ${dailyStats.avgAttempts} intentos`
              : ""}
            .
          </p>
        </div>
      </div>
    </ModalDialog>
  );
}
