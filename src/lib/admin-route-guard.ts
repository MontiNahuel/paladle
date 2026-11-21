import { NextResponse } from "next/server";
import {
  isAdminAuthenticated,
  isAdminPanelEnabled,
} from "@/lib/admin-auth";

export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!isAdminPanelEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { error: "No autorizado. Iniciá sesión en el panel." },
      { status: 401 }
    );
  }

  return null;
}
