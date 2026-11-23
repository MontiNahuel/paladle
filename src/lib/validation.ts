import { z } from "zod";
import {
  ACTIVITY_STATUS_OPTIONS,
  LOL_PLAYER_OPTIONS,
  RETRO_FONT_OPTIONS,
  THEME_PRESET_OPTIONS,
  TRI_STATE_OPTIONS,
  WORK_STATUS_OPTIONS,
} from "@/types/game";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal inválido (ej. #0f172a)");

const urlOrPathSchema = z
  .string()
  .trim()
  .min(1, "La URL de imagen es obligatoria")
  .refine(
    (val) => val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"),
    "Debe ser una ruta local (/...) o una URL válida (https://...)"
  );

export const friendInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  avatarUrl: urlOrPathSchema,
  isActiveInPool: z.boolean().default(true),
  entryYear: z.coerce.number().int().min(1990).max(2100),
  activityStatus: z.enum(ACTIVITY_STATUS_OPTIONS),
  workStatus: z.enum(WORK_STATUS_OPTIONS),
  weightKg: z.coerce.number().int().min(30).max(300),
  heightCm: z.coerce.number().int().min(100).max(250),
  neighborhood: z.string().trim().min(1, "El barrio es obligatorio").max(80),
  debtorStatus: z.enum(TRI_STATE_OPTIONS),
  badFriendStatus: z.enum(TRI_STATE_OPTIONS),
  lolPlayerStatus: z.enum(LOL_PLAYER_OPTIONS),
  isKuka: z.boolean(),
  gameKnowledge: z.enum(TRI_STATE_OPTIONS),
  canDrive: z.boolean(),
});

export type FriendInput = z.infer<typeof friendInputSchema>;

export const settingsInputSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(50),
  subtitle: z.string().trim().min(1, "El subtítulo es obligatorio").max(120),
  themePreset: z.enum(THEME_PRESET_OPTIONS),
  retroFont: z.enum(RETRO_FONT_OPTIONS).default("pixelify"),
  primaryColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  surfaceColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundImageUrl: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  logoImageUrl: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  maxAttempts: z
    .union([z.coerce.number().int().min(1).max(30), z.null(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

export const guessPayloadSchema = z.object({
  guessId: z.string().uuid("ID de amigo inválido"),
  attemptNumber: z.coerce.number().int().min(1).max(200).default(1),
});

export const scheduleOverrideSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  friendId: z.string().uuid("ID de amigo inválido"),
});
