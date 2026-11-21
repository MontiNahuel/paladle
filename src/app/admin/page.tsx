import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isAdminAuthenticated, isAdminPanelEnabled } from "@/lib/admin-auth";

async function AdminGate() {
  await connection();
  if (!isAdminPanelEnabled()) {
    notFound();
  }
  const authenticated = await isAdminAuthenticated();
  return <AdminDashboard initialAuthenticated={authenticated} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
          Cargando panel...
        </div>
      }
    >
      <AdminGate />
    </Suspense>
  );
}
