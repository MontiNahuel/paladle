"use client";

import { useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";
import type { FriendCandidate } from "@/types/game";

interface SearchInputProps {
  candidates: FriendCandidate[];
  guessedIds: Set<string>;
  disabled: boolean;
  isSubmitting: boolean;
  primaryColor: string;
  surfaceColor: string;
  onSelect: (candidateId: string) => void;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SearchInput({
  candidates,
  guessedIds,
  disabled,
  isSubmitting,
  primaryColor,
  surfaceColor,
  onSelect,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const remaining = candidates.filter((c) => !guessedIds.has(c.id));
    const q = normalizeSearch(query);
    if (!q) return remaining;
    return remaining.filter((c) => normalizeSearch(c.name).includes(q));
  }, [candidates, guessedIds, query]);

  const handleChoose = (candidate: FriendCandidate) => {
    if (disabled || isSubmitting) return;
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
    onSelect(candidate.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[activeIndex] ?? filtered[0];
      if (target) handleChoose(target);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="flex items-center overflow-hidden rounded-full border-2 bg-white shadow-xl transition-shadow focus-within:ring-2"
        style={{
          borderColor: primaryColor,
        }}
      >
        <div className="pl-4 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          disabled={disabled || isSubmitting}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 160);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Juego terminado por hoy"
              : "Escribí el nombre de un amigo..."
          }
          className="w-full bg-transparent px-3 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
        />
        <button
          type="button"
          disabled={disabled || isSubmitting || filtered.length === 0}
          onMouseDown={(e) => {
            e.preventDefault();
            const target = filtered[activeIndex] ?? filtered[0];
            if (target) handleChoose(target);
          }}
          aria-label="Enviar intento"
          className="mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-950 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {open && !disabled && filtered.length > 0 && (
        <ul
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border-2 p-1.5 shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: `${surfaceColor}f2`,
            borderColor: primaryColor,
          }}
        >
          {filtered.map((candidate, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleChoose(candidate);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white transition-colors ${
                    isActive ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <DynamicImage
                    src={candidate.avatarUrl}
                    alt={candidate.name}
                    className="h-9 w-9 shrink-0 rounded-lg border border-white/20 bg-slate-800 object-cover"
                  />
                  <span className="truncate">{candidate.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && !disabled && query.trim().length > 0 && filtered.length === 0 && (
        <div
          className="absolute z-30 mt-2 w-full rounded-2xl border px-4 py-3 text-center text-sm text-white/80 shadow-xl"
          style={{
            backgroundColor: `${surfaceColor}f2`,
            borderColor: primaryColor,
          }}
        >
          No hay amigos disponibles con ese nombre.
        </div>
      )}
    </div>
  );
}
