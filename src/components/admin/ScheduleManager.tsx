"use client";

import { useMemo, useState } from "react";
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

  const summary = useMemo(() => {
    const totalSolves = schedule.reduce((acc, s) => acc + s.stats.totalSolves, 0);
    const activeDays = schedule.filter((s) => s.stats.totalSolves > 0);
    const avg =
      activeDays.length > 0
        ? (
            activeDays.reduce((acc, s) => acc + s.stats.avgAttempts, 0) /
            activeDays.length
          ).toFixed(1)
        : "—";
    return { totalDays: schedule.length, totalSolves, avg };
  }, [schedule]);

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
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Días registrados", value: summary.totalDays },
          { label: "Aciertos acumulados", value: summary.totalSolves },
          { label: "Promedio histórico", value: `${summary.avg} int.` },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[4px] border border-slate-800 bg-[#111827] px-4 py-3"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-black text-amber-400">{kpi.value}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleAssign}
        className="flex flex-wrap items-end gap-3 rounded-[4px] border border-slate-800 bg-[#111827] p-4"
      >
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Fecha (ART)
          </label>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          />
        </div>

        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Amigo para ese día
          </label>
          <select
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            className="w-full rounded-[4px] border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
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
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-amber-400 px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
        >
          <Calendar className="h-4 w-4" />
          {saving ? "Guardando..." : "Asignar día"}
        </button>

        {msg && <p className="w-full text-xs text-emerald-400">{msg}</p>}
      </form>

      <div className="overflow-hidden rounded-[4px] border border-slate-800 bg-[#111827]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Amigo</th>
              <th className="px-4 py-3">Aciertos</th>
              <th className="px-4 py-3">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {schedule.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/35">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {formatDisplayDate(item.dateKey)}
                  {item.dateKey === todayKey && (
                    <span className="ml-2 rounded-[4px] border border-amber-400/35 bg-amber-400/15 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-300">
                      HOY
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <DynamicImage
                      src={item.friendAvatarUrl}
                      alt={item.friendName}
                      className="h-7 w-7 rounded-[4px] border border-slate-700 object-cover"
                    />
                    <span className="font-bold text-slate-100">
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
