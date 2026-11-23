"use client";

import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, Check, Eye, Palette, Sparkles } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { RETRO_FONT_LABELS, THEME_PRESETS } from "@/lib/theme";
import {
  RETRO_FONT_OPTIONS,
  type GameSettingsData,
  type ThemePreset,
} from "@/types/game";

interface ThemeSettingsManagerProps {
  initialSettings: GameSettingsData;
  onSaved: (next: GameSettingsData) => void;
}

export function ThemeSettingsManager({
  initialSettings,
  onSaved,
}: ThemeSettingsManagerProps) {
  const [form, setForm] = useState<GameSettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: ThemePreset) => {
    if (preset === "custom") {
      setForm((prev) => ({ ...prev, themePreset: "custom" }));
      return;
    }
    const palette = THEME_PRESETS[preset];
    setForm((prev) => ({
      ...prev,
      themePreset: preset,
      primaryColor: palette.primaryColor,
      backgroundColor: palette.backgroundColor,
      surfaceColor: palette.surfaceColor,
      accentColor: palette.accentColor,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedOk(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar la estética.");
        return;
      }
      setForm(data.settings);
      onSaved(data.settings);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const retroFontMeta = RETRO_FONT_LABELS[form.retroFont ?? "pixelify"];

  const previewVars = {
    "--paladle-primary": form.primaryColor,
    "--paladle-bg": form.backgroundColor,
    "--paladle-surface": form.surfaceColor,
    "--paladle-accent": form.accentColor,
    "--paladle-radius": "4px",
    ...(form.themePreset === "retro"
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
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-[4px] border border-slate-800 bg-[#111827] p-5"
      >
        <div>
          <h2 className="text-lg font-black text-slate-50">
            Estética dinámica y reglas
          </h2>
          <p className="text-xs text-slate-400">
            Cada tema modifica tipografía, atmósfera, sombras y texturas (no solo
            colores). Se aplica en vivo sin redeployar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Título del juego
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Intentos máximos (vacío = infinitos)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.maxAttempts ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxAttempts:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="Infinitos"
              className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Subtítulo / Pregunta del día
          </label>
          <input
            required
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          />
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
            <Palette className="h-3.5 w-3.5 text-amber-400" /> Estilo visual
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(["pokedle", "dark", "retro", "custom"] as const).map((preset) => {
              const active = form.themePreset === preset;
              const info =
                preset === "custom"
                  ? {
                      label: "Personalizado",
                      tag: "Custom",
                      description:
                        "Usa exactamente tus 4 colores personalizados y fondo.",
                    }
                  : THEME_PRESETS[preset];
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-[4px] border p-3 text-left transition ${
                    active
                      ? "border-amber-400 bg-amber-400/12 ring-1 ring-amber-400/40"
                      : "border-slate-700/80 bg-slate-950/70 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-white">
                      {info.label}
                    </p>
                    <span
                      className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        active
                          ? "bg-amber-400 text-slate-950"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {info.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">
                    {info.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Retro pixel font selector */}
        {form.themePreset === "retro" && (
          <div className="space-y-2 rounded-[4px] border border-amber-400/30 bg-amber-400/5 p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Fuente pixelada (Arcade Retro)
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {RETRO_FONT_OPTIONS.map((fontKey) => {
                const selected = form.retroFont === fontKey;
                const meta = RETRO_FONT_LABELS[fontKey];
                return (
                  <button
                    key={fontKey}
                    type="button"
                    onClick={() => setForm({ ...form, retroFont: fontKey })}
                    className={`rounded-[4px] border px-3 py-2 text-left transition ${
                      selected
                        ? "border-amber-400 bg-amber-400/15 text-white"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <p className="text-xs font-extrabold">{meta.label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {meta.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color pickers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: "primaryColor", label: "Principal" },
              { key: "backgroundColor", label: "Fondo" },
              { key: "surfaceColor", label: "Tarjetas" },
              { key: "accentColor", label: "Acento" },
            ] as const
          ).map((field) => (
            <div
              key={field.key}
              className="rounded-[4px] border border-slate-700/80 bg-slate-950 p-2.5"
            >
              <label className="mb-1.5 block text-[11px] font-bold text-slate-300">
                {field.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [field.key]: e.target.value,
                    })
                  }
                  className="h-7 w-9 cursor-pointer rounded-[4px] border border-slate-700 bg-transparent"
                />
                <span className="font-mono text-xs text-slate-300">
                  {form[field.key]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic images */}
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <ImageUploadField
            label="Imagen de fondo (opcional)"
            value={form.backgroundImageUrl ?? ""}
            folder="themes"
            allowClear
            placeholder="Sin imagen de fondo (usa estilo del tema)"
            onChange={(url) =>
              setForm({ ...form, backgroundImageUrl: url || null })
            }
          />

          <ImageUploadField
            label="Logo personalizado (opcional)"
            value={form.logoImageUrl ?? ""}
            folder="logos"
            allowClear
            placeholder="Sin logo (muestra el título con estilo del tema)"
            onChange={(url) => setForm({ ...form, logoImageUrl: url || null })}
          />
        </div>

        {error && (
          <p className="rounded-[4px] border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[4px] bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar estética"}
          </button>
          {savedOk && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400">
              <Check className="h-4 w-4" /> ¡Cambios guardados!
            </span>
          )}
        </div>
      </form>

      {/* Live Preview Panel */}
      <div className="sticky top-6 space-y-2.5 rounded-[4px] border border-slate-800 bg-[#111827] p-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-sky-400" /> Vista previa en vivo
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-amber-300">
            <Sparkles className="h-3 w-3" /> {form.themePreset}
          </span>
        </div>

        <div
          data-theme={form.themePreset}
          data-retro-font={form.retroFont}
          style={previewVars}
          className="paladle-stage relative overflow-hidden rounded-[4px] border border-slate-700 p-5 text-white"
        >
          {form.backgroundImageUrl && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${form.backgroundImageUrl})` }}
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-slate-950/30"
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {form.logoImageUrl ? (
              <DynamicImage
                src={form.logoImageUrl}
                alt={form.title}
                className="max-h-12 object-contain"
              />
            ) : (
              <p
                className="paladle-title text-center text-2xl font-black"
                style={{ color: form.primaryColor }}
              >
                {form.title || "Paladle"}
              </p>
            )}

            <div
              className="paladle-card w-full px-4 py-3 text-center"
              style={{ backgroundColor: `${form.surfaceColor}eb` }}
            >
              <p className="text-[10px] uppercase tracking-wider text-white/70">
                Edición diaria
              </p>
              <p className="mt-0.5 text-sm font-extrabold">
                {form.subtitle || "¡Adiviná el amigo del día!"}
              </p>
            </div>

            <div className="flex w-full items-center gap-2">
              <div
                className="flex-1 rounded-[4px] border-2 bg-white px-3 py-1.5 text-xs text-slate-500"
                style={{ borderColor: form.primaryColor }}
              >
                Escribí un nombre...
              </div>
              <span className="paladle-primary-btn paladle-btn rounded-[4px] px-3 py-1.5 text-xs font-extrabold">
                Probar
              </span>
            </div>

            <div className="grid w-full grid-cols-4 gap-1.5">
              <div
                className="paladle-cell flex flex-col items-center justify-center border-2 border-white/25 p-1.5"
                style={{ backgroundColor: form.surfaceColor }}
              >
                <DynamicImage
                  src="/avatars/avatar-1.svg"
                  alt="Ejemplo"
                  className="paladle-avatar h-8 w-8 rounded-[4px] object-cover"
                />
                <span className="mt-1 text-[10px] font-bold">Santi</span>
              </div>

              <div className="paladle-cell flex items-center justify-center border-2 border-emerald-300 bg-emerald-600 p-2 text-center text-xs font-extrabold">
                Activo
              </div>

              <div className="paladle-cell relative flex flex-col items-center justify-center border-2 border-rose-300 bg-rose-600 p-2 text-center">
                <ArrowUp className="h-4 w-4 opacity-80" />
                <span className="paladle-cell-value text-[11px] font-extrabold">
                  2018
                </span>
              </div>

              <div className="paladle-cell relative flex flex-col items-center justify-center border-2 border-rose-300 bg-rose-600 p-2 text-center">
                <ArrowDown className="h-4 w-4 opacity-80" />
                <span className="paladle-cell-value text-[11px] font-extrabold">
                  Retirado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
