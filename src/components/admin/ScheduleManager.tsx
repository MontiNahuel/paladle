"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { formatDisplayDate } from "@/engine/daily";
import type { DailyStatsSummary, FriendRecord } from "@/types/game";

export interface ScheduleItem {
  id: number;
  dateKey: string;
  mode: string;
  friendId: string;
  friendName: string;
  friendAvatarUrl: string;
  stats: DailyStatsSummary;
}

interface ScheduleManagerProps {
  todayKey: string;
  schedule: ScheduleItem[];
  friends: FriendRecord[];
  onRefresh: () => Promise<void>;
}

export function ScheduleManager({
  todayKey,
  schedule,
  friends,
  onRefresh,
}: ScheduleManagerProps) {
  const [dateKey, setDateKey] = useState(todayKey);
  const [friendId, setFriendId] = useState(friends[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, friendId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Error al asignar fecha.");
        return;
      }
      setMsg(`Asignado correctamente para el ${formatDisplayDate(dateKey)}.`);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-white">Calendario diario</h2>
        <p className="text-xs text-slate-400">
          Si no asignás una fecha manualmente, el sistema sortea automáticamente
          evitando repetir los últimos 10 días.
        </p>
      </div>

      <form
        onSubmit={handleAssign}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-300">
            Fecha (ART)
          </label>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          />
        </div>

        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-bold text-slate-300">
            Amigo para ese día
          </label>
          <select
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          >
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving || friends.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
        >
          <Calendar className="h-4 w-4" />
          {saving ? "Guardando..." : "Asignar día"}
        </button>

        {msg && <p className="w-full text-xs text-emerald-400">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Amigo</th>
              <th className="px-4 py-3">Aciertos</th>
              <th className="px-4 py-3">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {schedule.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {formatDisplayDate(item.dateKey)}
                  {item.dateKey === todayKey && (
                    <span className="ml-2 rounded bg-amber-400/20 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-300">
                      HOY
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DynamicImage
                      src={item.friendAvatarUrl}
                      alt={item.friendName}
                      className="h-7 w-7 rounded-lg object-cover"
                    />
                    <span className="font-bold text-white">
                      {item.friendName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {item.stats.totalSolves}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {item.stats.totalSolves > 0
                    ? `${item.stats.avgAttempts} intentos`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
