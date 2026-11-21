"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Lock,
  LogOut,
  Palette,
  Users,
} from "lucide-react";
import { FriendsManager } from "@/components/admin/FriendsManager";
import {
  ScheduleManager,
  type ScheduleItem,
} from "@/components/admin/ScheduleManager";
import { ThemeSettingsManager } from "@/components/admin/ThemeSettingsManager";
import type { FriendRecord, GameSettingsData } from "@/types/game";

type TabId = "friends" | "theme" | "schedule";

interface AdminDashboardProps {
  initialAuthenticated: boolean;
}

export function AdminDashboard({ initialAuthenticated }: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<TabId>("friends");
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [settings, setSettings] = useState<GameSettingsData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [todayKey, setTodayKey] = useState("");
  const [loading, setLoading] = useState(initialAuthenticated);

  const fetchAdminBundle = useCallback(async () => {
    const [friendsRes, settingsRes, scheduleRes] = await Promise.all([
      fetch("/api/admin/friends"),
      fetch("/api/admin/settings"),
      fetch("/api/admin/schedule"),
    ]);

    if (
      friendsRes.status === 401 ||
      settingsRes.status === 401 ||
      scheduleRes.status === 401
    ) {
      return { unauthorized: true as const };
    }

    const [friendsJson, settingsJson, scheduleJson] = await Promise.all([
      friendsRes.json(),
      settingsRes.json(),
      scheduleRes.json(),
    ]);

    return {
      unauthorized: false as const,
      friends: (friendsJson.friends ?? []) as FriendRecord[],
      settings: (settingsJson.settings ?? null) as GameSettingsData | null,
      schedule: (scheduleJson.schedule ?? []) as ScheduleItem[],
      todayKey: (scheduleJson.todayKey ?? "") as string,
    };
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminBundle();
      if (result.unauthorized) {
        setAuthenticated(false);
        return;
      }
      setFriends(result.friends);
      setSettings(result.settings);
      setSchedule(result.schedule);
      setTodayKey(result.todayKey);
    } finally {
      setLoading(false);
    }
  }, [fetchAdminBundle]);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    fetchAdminBundle().then((result) => {
      if (cancelled) return;
      if (result.unauthorized) {
        setAuthenticated(false);
      } else {
        setFriends(result.friends);
        setSettings(result.settings);
        setSchedule(result.schedule);
        setTodayKey(result.todayKey);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authenticated, fetchAdminBundle]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      setPassword("");
      setAuthenticated(true);
    } catch {
      setAuthError("Error de conexión.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black">Panel Dev — Paladle</h1>
              <p className="text-xs text-slate-400">
                Ingresá la contraseña de administración
              </p>
            </div>
          </div>

          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
          />

          {authError && <p className="text-xs text-rose-400">{authError}</p>}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
          >
            {loggingIn ? "Verificando..." : "Entrar"}
          </button>

          <div className="pt-1 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Volver al juego
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Ver juego
            </Link>
            <h1 className="text-xl font-black tracking-tight text-amber-400">
              Paladle · Panel Dev
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>

        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          {[
            { id: "friends" as const, label: "Amigos", icon: Users },
            { id: "theme" as const, label: "Estética y Reglas", icon: Palette },
            { id: "schedule" as const, label: "Calendario Diario", icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && friends.length === 0 ? (
          <p className="text-sm text-slate-400">Cargando panel...</p>
        ) : (
          <>
            {tab === "friends" && (
              <FriendsManager friends={friends} onRefresh={loadAllData} />
            )}
            {tab === "theme" && settings && (
              <ThemeSettingsManager
                initialSettings={settings}
                onSaved={setSettings}
              />
            )}
            {tab === "schedule" && (
              <ScheduleManager
                todayKey={todayKey}
                schedule={schedule}
                friends={friends}
                onRefresh={loadAllData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
