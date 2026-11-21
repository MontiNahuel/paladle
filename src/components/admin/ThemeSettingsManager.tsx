"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { THEME_PRESETS } from "@/lib/theme";
import type { GameSettingsData, ThemePreset } from "@/types/game";

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

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-black text-white">
          Estética dinámica y reglas
        </h2>
        <p className="text-xs text-slate-400">
          Los cambios se aplican en vivo en producción sin necesidad de
          redeployar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
            Título del juego
          </label>
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
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
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
          Subtítulo / Pregunta del día
        </label>
        <input
          required
          type="text"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
        />
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Palette className="h-4 w-4 text-amber-400" /> Tema base
        </label>
        <div className="grid gap-2.5 sm:grid-cols-4">
          {(["pokedle", "dark", "retro", "custom"] as const).map((preset) => {
            const active = form.themePreset === preset;
            const info =
              preset === "custom"
                ? { label: "Personalizado", description: "Usá tus colores." }
                : THEME_PRESETS[preset];
            return (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-amber-400 bg-amber-400/15"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
              >
                <p className="text-sm font-extrabold text-white">
                  {info.label}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {info.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { key: "primaryColor", label: "Color principal" },
            { key: "backgroundColor", label: "Fondo" },
            { key: "surfaceColor", label: "Tarjetas" },
            { key: "accentColor", label: "Acento" },
          ] as const
        ).map((field) => (
          <div
            key={field.key}
            className="rounded-xl border border-slate-700 bg-slate-900 p-3"
          >
            <label className="mb-1.5 block text-xs font-bold text-slate-300">
              {field.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form[field.key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    themePreset: "custom",
                    [field.key]: e.target.value,
                  })
                }
                className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
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
          placeholder="Sin imagen de fondo (usa gradiente del tema)"
          onChange={(url) =>
            setForm({ ...form, backgroundImageUrl: url || null })
          }
        />

        <ImageUploadField
          label="Logo personalizado (opcional)"
          value={form.logoImageUrl ?? ""}
          folder="logos"
          allowClear
          placeholder="Sin logo (muestra el título en texto)"
          onChange={(url) => setForm({ ...form, logoImageUrl: url || null })}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
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
  );
}
