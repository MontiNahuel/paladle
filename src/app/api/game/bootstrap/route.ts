import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getGameBootstrap } from "@/db/queries";

export async function GET() {
  await connection();
  try {
    const data = await getGameBootstrap("classic");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/game/bootstrap:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el juego del día." },
      { status: 500 }
    );
  }
}
