import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });
dotenv.config();
import { getDb } from "./index";
import { friends, gameSettings } from "./schema";
import { DEFAULT_GAME_SETTINGS } from "@/lib/theme";
import type { FriendInput } from "@/lib/validation";

const SAMPLE_FRIENDS: Array<FriendInput & { slug: string }> = [
  {
    slug: "santi",
    name: "Santi (Ejemplo)",
    avatarUrl: "/avatars/avatar-1.svg",
    isActiveInPool: true,
    entryYear: 2018,
    activityStatus: "Activo",
    workStatus: "Con Laburo",
    weightKg: 78,
    heightCm: 179,
    neighborhood: "Palermo",
    debtorStatus: "No",
    badFriendStatus: "No",
    lolPlayerStatus: "Retirado",
    isKuka: false,
    gameKnowledge: "Si",
    canDrive: true,
  },
  {
    slug: "tincho",
    name: "Tincho (Ejemplo)",
    avatarUrl: "/avatars/avatar-2.svg",
    isActiveInPool: true,
    entryYear: 2019,
    activityStatus: "Activo",
    workStatus: "Laburo Parcial",
    weightKg: 84,
    heightCm: 183,
    neighborhood: "Caballito",
    debtorStatus: "Parcial",
    badFriendStatus: "Parcial",
    lolPlayerStatus: "Si",
    isKuka: true,
    gameKnowledge: "Si",
    canDrive: false,
  },
  {
    slug: "fede",
    name: "Fede (Ejemplo)",
    avatarUrl: "/avatars/avatar-3.svg",
    isActiveInPool: true,
    entryYear: 2017,
    activityStatus: "Inactivo",
    workStatus: "Con Laburo",
    weightKg: 72,
    heightCm: 174,
    neighborhood: "Belgrano",
    debtorStatus: "Si",
    badFriendStatus: "Si",
    lolPlayerStatus: "No",
    isKuka: false,
    gameKnowledge: "Parcial",
    canDrive: true,
  },
  {
    slug: "lucho",
    name: "Lucho (Ejemplo)",
    avatarUrl: "/avatars/avatar-4.svg",
    isActiveInPool: true,
    entryYear: 2021,
    activityStatus: "Activo",
    workStatus: "Sin Laburo",
    weightKg: 69,
    heightCm: 171,
    neighborhood: "Almagro",
    debtorStatus: "No",
    badFriendStatus: "No",
    lolPlayerStatus: "Si",
    isKuka: true,
    gameKnowledge: "No",
    canDrive: false,
  },
];

async function seed() {
  const db = getDb();

  await db
    .insert(gameSettings)
    .values({
      id: 1,
      title: DEFAULT_GAME_SETTINGS.title,
      subtitle: DEFAULT_GAME_SETTINGS.subtitle,
      themePreset: DEFAULT_GAME_SETTINGS.themePreset,
      primaryColor: DEFAULT_GAME_SETTINGS.primaryColor,
      backgroundColor: DEFAULT_GAME_SETTINGS.backgroundColor,
      surfaceColor: DEFAULT_GAME_SETTINGS.surfaceColor,
      accentColor: DEFAULT_GAME_SETTINGS.accentColor,
      backgroundImageUrl: null,
      logoImageUrl: null,
      maxAttempts: null,
    })
    .onConflictDoNothing();

  for (const friend of SAMPLE_FRIENDS) {
    const existing = await db
      .select({ id: friends.id })
      .from(friends)
      .where(eq(friends.slug, friend.slug))
      .limit(1);

    if (!existing[0]) {
      await db.insert(friends).values(friend);
    }
  }

  console.log("Seed completado: configuración inicial y amigos de ejemplo cargados.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error en seed:", err);
    process.exit(1);
  });
