"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Power, Search, Trash2 } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { ModalDialog } from "@/components/ui/ModalDialog";
import type {
  DynamicAttributesMap,
  FriendRecord,
  GameParameter,
} from "@/types/game";

interface FriendsManagerProps {
  friends: FriendRecord[];
  parameters: GameParameter[];
  onRefresh: () => Promise<void>;
}

interface FriendFormState {
  name: string;
  avatarUrl: string;
  isActiveInPool: boolean;
  attributes: DynamicAttributesMap;
}

function getDefaultValueForParameter(
  param: GameParameter
): string | number | boolean {
  if (param.type === "number") return param.minValue ?? 0;
  if (param.type === "boolean") return false;
  if (param.type === "enum") return param.options?.[0] ?? "";
  return "";
}

function buildEmptyForm(parameters: GameParameter[]): FriendFormState {
  const attributes: DynamicAttributesMap = {};
  for (const param of parameters) {
    attributes[param.key] = getDefaultValueForParameter(param);
  }
  return {
    name: "",
    avatarUrl: "/avatars/avatar-1.svg",
    isActiveInPool: true,
    attributes,
  };
}

function recordToForm(
  record: FriendRecord,
  parameters: GameParameter[]
): FriendFormState {
  const attributes: DynamicAttributesMap = {};
  for (const param of parameters) {
    const existing = record.attributes?.[param.key];
    attributes[param.key] =
      existing !== undefined ? existing : getDefaultValueForParameter(param);
  }
  return {
    name: record.name,
    avatarUrl: record.avatarUrl,
    isActiveInPool: record.isActiveInPool,
    attributes,
  };
}

export function FriendsManager({
  friends,
  parameters,
  onRefresh,
}: FriendsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FriendFormState>(() =>
    buildEmptyForm(parameters)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [poolFilter, setPoolFilter] = useState<"all" | "active" | "paused">(
    "all"
  );

  const activeCount = useMemo(
    () => friends.filter((f) => f.isActiveInPool).length,
    [friends]
  );

  const visibleFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    return friends.filter((f) => {
      if (poolFilter === "active" && !f.isActiveInPool) return false;
      if (poolFilter === "paused" && f.isActiveInPool) return false;
      if (!q) return true;
      const barrio = String(f.attributes?.neighborhood ?? f.neighborhood ?? "");
      return (
        f.name.toLowerCase().includes(q) || barrio.toLowerCase().includes(q)
      );
    });
  }, [friends, poolFilter, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(buildEmptyForm(parameters));
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (friend: FriendRecord) => {
    setEditingId(friend.id);
    setForm(recordToForm(friend, parameters));
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/friends/${editingId}`
        : "/api/admin/friends";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setIsModalOpen(false);
      await onRefresh();
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (friend: FriendRecord) => {
    await fetch(`/api/admin/friends/${friend.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActiveInPool: !friend.isActiveInPool }),
    });
    await onRefresh();
  };

  const handleDelete = async (friend: FriendRecord) => {
    if (!window.confirm(`¿Eliminar a ${friend.name}?`)) return;
    setError(null);
    const res = await fetch(`/api/admin/friends/${friend.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error ?? "No se pudo eliminar.");
      return;
    }
    await onRefresh();
  };

  const updateAttr = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-800 bg-[#111827] p-4">
        <div>
          <h2 className="text-lg font-black text-slate-50">
            Catálogo de amigos ({friends.length})
          </h2>
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-emerald-400">
              {activeCount} activos
            </span>{" "}
            en el sorteo diario ·{" "}
            <span className="font-semibold text-slate-300">
              {friends.length - activeCount} pausados
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-[4px] bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" /> Nuevo amigo
        </button>
      </div>

      {/* Filter & search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o barrio..."
            className="w-full rounded-[4px] border border-slate-700/80 bg-[#111827] py-2 pr-3 pl-9 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="inline-flex rounded-[4px] border border-slate-800 bg-[#111827] p-1">
          {(
            [
              { id: "all", label: "Todos" },
              { id: "active", label: "Activos" },
              { id: "paused", label: "Pausados" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPoolFilter(item.id)}
              className={`rounded-[4px] px-3 py-1 text-xs font-bold transition ${
                poolFilter === item.id
                  ? "bg-slate-700 text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visibleFriends.length === 0 ? (
        <div className="rounded-[4px] border border-dashed border-slate-800 bg-[#111827]/60 p-8 text-center text-sm text-slate-400">
          No se encontraron amigos con ese filtro.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFriends.map((friend) => {
            const attrs = friend.attributes ?? {};
            const barrio = String(attrs.neighborhood ?? friend.neighborhood);
            const ingreso = String(attrs.entryYear ?? friend.entryYear);
            const estado = String(attrs.activityStatus ?? friend.activityStatus);
            const laburo = String(attrs.workStatus ?? friend.workStatus);
            const peso = String(attrs.weightKg ?? friend.weightKg);
            const altura = String(attrs.heightCm ?? friend.heightCm);
            const lol = String(attrs.lolPlayerStatus ?? friend.lolPlayerStatus);

            return (
              <div
                key={friend.id}
                className={`flex flex-col justify-between rounded-[4px] border p-4 transition ${
                  friend.isActiveInPool
                    ? "border-slate-700/80 bg-[#111827] hover:border-slate-600"
                    : "border-slate-800/80 bg-[#0c1220] opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <DynamicImage
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="h-14 w-14 shrink-0 rounded-[4px] border border-slate-700 bg-slate-950 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-base font-extrabold text-slate-50">
                        {friend.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          friend.isActiveInPool
                            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border border-slate-700 bg-slate-800 text-slate-400"
                        }`}
                      >
                        {friend.isActiveInPool ? "Activo" : "Pausado"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-sky-300">
                      {barrio} · Ingreso {ingreso}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-300">
                      <span className="rounded-[4px] bg-slate-800/90 px-1.5 py-0.5">
                        {estado}
                      </span>
                      <span className="rounded-[4px] bg-slate-800/90 px-1.5 py-0.5">
                        {laburo}
                      </span>
                      <span className="rounded-[4px] bg-slate-800/90 px-1.5 py-0.5">
                        {peso}kg · {altura}cm
                      </span>
                      <span className="rounded-[4px] bg-slate-800/90 px-1.5 py-0.5">
                        Lol: {lol}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(friend)}
                    title={
                      friend.isActiveInPool
                        ? "Pausar del sorteo"
                        : "Activar en sorteo"
                    }
                    className="inline-flex items-center gap-1 rounded-[4px] border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {friend.isActiveInPool ? "Pausar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(friend)}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(friend)}
                    aria-label={`Eliminar a ${friend.name}`}
                    className="inline-flex items-center rounded-[4px] border border-rose-500/35 bg-rose-500/10 p-1.5 text-rose-300 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar amigo" : "Agregar amigo"}
        maxWidthClass="max-w-2xl"
        className="border-slate-700 bg-[#111827]"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Nombre / Apodo
              </label>
              <input
                required
                autoFocus
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isActiveInPool}
                  onChange={(e) =>
                    setForm({ ...form, isActiveInPool: e.target.checked })
                  }
                  className="h-4 w-4 rounded-[4px]"
                />
                <span>Activo en el sorteo diario</span>
              </label>
            </div>
          </div>

          <ImageUploadField
            label="Avatar (subir o pegar URL)"
            value={form.avatarUrl}
            folder="avatars"
            onChange={(url) => setForm({ ...form, avatarUrl: url })}
          />

          <div className="grid gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {parameters.map((param) => {
              const val = form.attributes[param.key];
              const options = param.options ?? [];
              const currentStr = String(val ?? "");
              const selectOptions =
                param.type === "enum" &&
                currentStr &&
                !options.includes(currentStr)
                  ? [currentStr, ...options]
                  : options;

              return (
                <div key={param.id}>
                  <label className="mb-1 flex items-center justify-between gap-1 text-xs font-bold text-slate-300">
                    <span>{param.fullLabel}</span>
                    {!param.isVisible && (
                      <span className="rounded-[4px] bg-slate-800 px-1 text-[10px] text-slate-400">
                        Oculto
                      </span>
                    )}
                  </label>

                  {param.type === "number" && (
                    <input
                      required
                      type="number"
                      min={param.minValue ?? undefined}
                      max={param.maxValue ?? undefined}
                      value={Number(val ?? 0)}
                      onChange={(e) =>
                        updateAttr(param.key, Number(e.target.value))
                      }
                      className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    />
                  )}

                  {param.type === "text" && (
                    <input
                      required
                      type="text"
                      value={currentStr}
                      onChange={(e) => updateAttr(param.key, e.target.value)}
                      className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    />
                  )}

                  {param.type === "enum" && (
                    <select
                      value={currentStr}
                      onChange={(e) => updateAttr(param.key, e.target.value)}
                      className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    >
                      {selectOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {param.type === "boolean" && (
                    <select
                      value={Boolean(val) ? "true" : "false"}
                      onChange={(e) =>
                        updateAttr(param.key, e.target.value === "true")
                      }
                      className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    >
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="rounded-[4px] border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-[4px] border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[4px] bg-amber-400 px-5 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
