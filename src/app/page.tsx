import { Suspense } from "react";
import { connection } from "next/server";
import { PaladleGame } from "@/components/game/PaladleGame";
import { getGameBootstrap } from "@/db/queries";
import { isAdminPanelEnabled } from "@/lib/admin-auth";

async function GameLoader() {
  await connection();
  const adminEnabled = isAdminPanelEnabled();

  if (!process.env.DATABASE_URL) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-2xl border border-amber-400/50 bg-slate-900 p-6 text-center shadow-2xl">
          <h1 className="text-2xl font-black text-amber-400">Paladle</h1>
          <p className="mt-2 text-sm text-slate-300">
            Falta configurar <code className="text-amber-300">DATABASE_URL</code>{" "}
            en <code className="text-amber-300">.env.local</code> (o en Vercel) y
            correr <code className="text-amber-300">npm run db:push</code>.
          </p>
        </div>
      </div>
    );
  }

  const initialData = await getGameBootstrap("classic");
  return <PaladleGame initialData={initialData} adminEnabled={adminEnabled} />;
}

function GameShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="text-sm font-bold text-slate-300">Cargando Paladle...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<GameShellFallback />}>
      <GameLoader />
    </Suspense>
  );
}
