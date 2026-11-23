"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import {
  PARAMETER_TYPE_OPTIONS,
  type GameParameter,
  type ParameterType,
} from "@/types/game";

interface ParametersManagerProps {
  parameters: GameParameter[];
  onRefresh: () => Promise<void>;
}

const TYPE_LABELS: Record<ParameterType, string> = {
  number: "Número (con flechas ↑↓)",
  enum: "Selector (lista de opciones)",
  text: "Texto exacto",
  boolean: "Si / No",
};

interface ParamFormState {
  shortLabel: string;
  fullLabel: string;
  type: ParameterType;
  unit: string;
  options: string[];
  minValue: string;
  maxValue: string;
  isVisible: boolean;
}

const EMPTY_PARAM_FORM: ParamFormState = {
  shortLabel: "",
  fullLabel: "",
  type: "enum",
  unit: "",
  options: ["Si", "No"],
  minValue: "",
  maxValue: "",
  isVisible: true,
};

export function ParametersManager({
  parameters,
  onRefresh,
}: ParametersManagerProps) {
  const [editing, setEditing] = useState<GameParameter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ParamFormState>(EMPTY_PARAM_FORM);
  const [newOptionText, setNewOptionText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCount = parameters.filter((p) => p.isVisible).length;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PARAM_FORM);
    setNewOptionText("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (param: GameParameter) => {
    setEditing(param);
    setForm({
      shortLabel: param.shortLabel,
      fullLabel: param.fullLabel,
      type: param.type,
      unit: param.unit ?? "",
      options: param.options ? [...param.options] : [],
      minValue: param.minValue !== null ? String(param.minValue) : "",
      maxValue: param.maxValue !== null ? String(param.maxValue) : "",
      isVisible: param.isVisible,
    });
    setNewOptionText("");
    setError(null);
    setModalOpen(true);
  };

  const handleAddOption = () => {
    const clean = newOptionText.trim();
    if (!clean) return;
    if (
      form.options.some(
        (opt) => opt.toLocaleLowerCase("es") === clean.toLocaleLowerCase("es")
      )
    ) {
      setNewOptionText("");
      return;
    }
    setForm((prev) => ({ ...prev, options: [...prev.options, clean] }));
    setNewOptionText("");
  };

  const handleRemoveOption = (opt: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== opt),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        shortLabel: form.shortLabel,
        fullLabel: form.fullLabel,
        type: form.type,
        unit: form.type === "number" ? form.unit || null : null,
        options: form.type === "enum" ? form.options : null,
        minValue:
          form.type === "number" && form.minValue !== ""
            ? Number(form.minValue)
            : null,
        maxValue:
          form.type === "number" && form.maxValue !== ""
            ? Number(form.maxValue)
            : null,
        isVisible: form.isVisible,
      };

      const url = editing
        ? `/api/admin/parameters/${editing.id}`
        : "/api/admin/parameters";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el parámetro.");
        return;
      }
      setModalOpen(false);
      await onRefresh();
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisible = async (param: GameParameter) => {
    await fetch(`/api/admin/parameters/${param.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !param.isVisible }),
    });
    await onRefresh();
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= parameters.length) return;
    const next = [...parameters];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);

    await fetch("/api/admin/parameters/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((p) => p.id) }),
    });
    await onRefresh();
  };

  const handleDelete = async (param: GameParameter) => {
    if (!window.confirm(`¿Eliminar el parámetro "${param.fullLabel}"?`)) return;
    const res = await fetch(`/api/admin/parameters/${param.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error ?? "No se pudo eliminar.");
      return;
    }
    await onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-800 bg-[#111827] p-4">
        <div>
          <h2 className="text-lg font-black text-slate-50">
            ABM de Parámetros ({parameters.length})
          </h2>
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-emerald-400">
              {visibleCount} visibles
            </span>{" "}
            en el tablero ·{" "}
            <span className="font-semibold text-slate-300">
              {parameters.length - visibleCount} ocultos
            </span>{" "}
            (podés agregar opciones como &ldquo;Jubilado&rdquo; en cualquier
            selector).
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-[4px] bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" /> Nuevo parámetro
        </button>
      </div>

      <div className="space-y-2">
        {parameters.map((param, idx) => (
          <div
            key={param.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-[4px] border p-3.5 transition ${
              param.isVisible
                ? "border-slate-700/80 bg-[#111827]"
                : "border-slate-800/80 bg-[#0c1220] opacity-65"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  title="Subir columna"
                  className="rounded-[4px] border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === parameters.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  title="Bajar columna"
                  className="rounded-[4px] border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-50">
                    {param.fullLabel}
                  </span>
                  <span className="rounded-[4px] border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
                    Col: {param.shortLabel}
                  </span>
                  <span className="rounded-[4px] bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-300">
                    {param.type}
                    {param.unit ? ` (${param.unit})` : ""}
                  </span>
                  <span
                    className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      param.isVisible
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    {param.isVisible ? "Visible" : "Oculto"}
                  </span>
                </div>

                {param.type === "enum" && param.options && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {param.options.map((opt) => (
                      <span
                        key={opt}
                        className="rounded-[4px] border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-slate-200"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleVisible(param)}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                {param.isVisible ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Mostrar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => openEdit(param)}
                className="inline-flex items-center gap-1 rounded-[4px] border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
              >
                <Edit3 className="h-3.5 w-3.5" /> Editar
              </button>

              {!param.isSystem && (
                <button
                  type="button"
                  onClick={() => handleDelete(param)}
                  aria-label={`Eliminar ${param.fullLabel}`}
                  className="inline-flex items-center rounded-[4px] border border-rose-500/35 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar: ${editing.fullLabel}` : "Nuevo parámetro"}
        maxWidthClass="max-w-lg"
        className="border-slate-700 bg-[#111827]"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Nombre corto (columna)
              </label>
              <input
                required
                autoFocus
                type="text"
                value={form.shortLabel}
                onChange={(e) =>
                  setForm({ ...form, shortLabel: e.target.value })
                }
                placeholder="Ej. Laburo"
                className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Nombre completo
              </label>
              <input
                required
                type="text"
                value={form.fullLabel}
                onChange={(e) =>
                  setForm({ ...form, fullLabel: e.target.value })
                }
                placeholder="Ej. Situación Laboral"
                className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Tipo de variable
              </label>
              <select
                value={form.type}
                disabled={Boolean(editing?.isSystem)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as ParameterType,
                  })
                }
                className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400 disabled:opacity-60"
              >
                {PARAMETER_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(e) =>
                    setForm({ ...form, isVisible: e.target.checked })
                  }
                  className="h-4 w-4 rounded-[4px]"
                />
                <span>Visible en el juego</span>
              </label>
            </div>
          </div>

          {form.type === "number" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-300">
                  Unidad (opcional)
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, cm..."
                  className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-300">
                  Mínimo
                </label>
                <input
                  type="number"
                  value={form.minValue}
                  onChange={(e) =>
                    setForm({ ...form, minValue: e.target.value })
                  }
                  className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-300">
                  Máximo
                </label>
                <input
                  type="number"
                  value={form.maxValue}
                  onChange={(e) =>
                    setForm({ ...form, maxValue: e.target.value })
                  }
                  className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {form.type === "enum" && (
            <div className="space-y-2.5 rounded-[4px] border border-slate-800 bg-slate-950/70 p-3.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Opciones del selector
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Ej. Jubilado"
                  className="flex-1 rounded-[4px] border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="rounded-[4px] border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-xs font-extrabold text-amber-300 hover:bg-amber-400/25"
                >
                  Agregar
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {form.options.map((opt) => (
                  <span
                    key={opt}
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-100"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt)}
                      aria-label={`Quitar opción ${opt}`}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-[4px] border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-[4px] border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[4px] bg-amber-400 px-5 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar parámetro"}
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
