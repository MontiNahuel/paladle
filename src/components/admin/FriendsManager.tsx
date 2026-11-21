"use client";

import { useState } from "react";
import { Edit3, Plus, Power, Trash2, X } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { PALADLE_COLUMNS } from "@/engine/columns";
import type { FriendInput } from "@/lib/validation";
import type { FriendRecord } from "@/types/game";

interface FriendsManagerProps {
  friends: FriendRecord[];
  onRefresh: () => Promise<void>;
}

const EMPTY_FORM: FriendInput = {
  name: "",
  avatarUrl: "/avatars/avatar-1.svg",
  isActiveInPool: true,
  entryYear: 2020,
  activityStatus: "Activo",
  workStatus: "Con Laburo",
  weightKg: 75,
  heightCm: 175,
  neighborhood: "",
  debtorStatus: "No",
  badFriendStatus: "No",
  lolPlayerStatus: "No",
  isKuka: false,
  gameKnowledge: "Si",
  canDrive: true,
};

function recordToForm(record: FriendRecord): FriendInput {
  return {
    name: record.name,
    avatarUrl: record.avatarUrl,
    isActiveInPool: record.isActiveInPool,
    entryYear: record.entryYear,
    activityStatus: record.activityStatus,
    workStatus: record.workStatus,
    weightKg: record.weightKg,
    heightCm: record.heightCm,
    neighborhood: record.neighborhood,
    debtorStatus: record.debtorStatus,
    badFriendStatus: record.badFriendStatus,
    lolPlayerStatus: record.lolPlayerStatus,
    isKuka: record.isKuka,
    gameKnowledge: record.gameKnowledge,
    canDrive: record.canDrive,
  };
}

export function FriendsManager({ friends, onRefresh }: FriendsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FriendInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (friend: FriendRecord) => {
    setEditingId(friend.id);
    setForm(recordToForm(friend));
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">
            Amigos cargados ({friends.length})
          </h2>
          <p className="text-xs text-slate-400">
            Solo los amigos activos participan del sorteo diario y el buscador.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" /> Nuevo amigo
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
              friend.isActiveInPool
                ? "border-slate-700 bg-slate-900/90"
                : "border-slate-800 bg-slate-950/60 opacity-65"
            }`}
          >
            <div className="flex items-start gap-3">
              <DynamicImage
                src={friend.avatarUrl}
                alt={friend.name}
                className="h-14 w-14 shrink-0 rounded-xl border border-slate-700 bg-slate-800 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-extrabold text-white">
                    {friend.name}
                  </h3>
                  {!friend.isActiveInPool && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {friend.neighborhood} · Ingreso {friend.entryYear}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {friend.activityStatus} · {friend.workStatus} ·{" "}
                  {friend.weightKg}kg / {friend.heightCm}cm
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => handleToggleActive(friend)}
                title={
                  friend.isActiveInPool ? "Quitar del pool" : "Activar en pool"
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <Power className="h-3.5 w-3.5" />
                {friend.isActiveInPool ? "Activo" : "Pausado"}
              </button>
              <button
                type="button"
                onClick={() => openEdit(friend)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-slate-800"
              >
                <Edit3 className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(friend)}
                className="inline-flex items-center rounded-lg border border-rose-500/30 p-1.5 text-rose-400 hover:bg-rose-500/15"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black">
                {editingId ? "Editar amigo" : "Agregar amigo"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Nombre / Apodo
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.isActiveInPool}
                      onChange={(e) =>
                        setForm({ ...form, isActiveInPool: e.target.checked })
                      }
                      className="h-4 w-4 accent-amber-400"
                    />
                    Activo en el sorteo diario
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
                {PALADLE_COLUMNS.map((col) => {
                  const val = form[col.key];
                  return (
                    <div key={col.key}>
                      <label className="mb-1 block text-xs font-bold text-slate-300">
                        {col.fullLabel}
                      </label>

                      {col.type === "number" && (
                        <input
                          required
                          type="number"
                          min={col.min}
                          max={col.max}
                          value={Number(val)}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [col.key]: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      )}

                      {col.type === "text" && (
                        <input
                          required
                          type="text"
                          value={String(val)}
                          onChange={(e) =>
                            setForm({ ...form, [col.key]: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      )}

                      {col.type === "enum" && col.options && (
                        <select
                          value={String(val)}
                          onChange={(e) =>
                            setForm({ ...form, [col.key]: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        >
                          {col.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {col.type === "boolean" && (
                        <select
                          value={val ? "true" : "false"}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [col.key]: e.target.value === "true",
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
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
                <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-300">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
