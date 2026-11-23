import {
  ACTIVITY_STATUS_OPTIONS,
  LOL_PLAYER_OPTIONS,
  TRI_STATE_OPTIONS,
  WORK_STATUS_OPTIONS,
  type DynamicAttributesMap,
  type ParameterType,
} from "@/types/game";

export type ColumnInputType = ParameterType;

export interface ColumnDefinition {
  key: string;
  shortLabel: string;
  fullLabel: string;
  type: ColumnInputType;
  unit?: string | null;
  options?: readonly string[] | null;
  min?: number | null;
  max?: number | null;
}

export const PALADLE_COLUMNS: readonly ColumnDefinition[] = [
  {
    key: "entryYear",
    shortLabel: "Ingreso",
    fullLabel: "Año de Ingreso",
    type: "number",
    min: 1990,
    max: 2100,
  },
  {
    key: "activityStatus",
    shortLabel: "Estado",
    fullLabel: "Estado",
    type: "enum",
    options: ACTIVITY_STATUS_OPTIONS,
  },
  {
    key: "workStatus",
    shortLabel: "Laburo",
    fullLabel: "Situación Laboral",
    type: "enum",
    options: WORK_STATUS_OPTIONS,
  },
  {
    key: "weightKg",
    shortLabel: "Peso",
    fullLabel: "Peso",
    type: "number",
    unit: "kg",
    min: 30,
    max: 300,
  },
  {
    key: "heightCm",
    shortLabel: "Altura",
    fullLabel: "Altura",
    type: "number",
    unit: "cm",
    min: 100,
    max: 250,
  },
  {
    key: "neighborhood",
    shortLabel: "Barrio",
    fullLabel: "Región (Barrio)",
    type: "text",
  },
  {
    key: "debtorStatus",
    shortLabel: "Deudor",
    fullLabel: "Deudor",
    type: "enum",
    options: TRI_STATE_OPTIONS,
  },
  {
    key: "badFriendStatus",
    shortLabel: "Mal Amigo",
    fullLabel: "Mal Amigo",
    type: "enum",
    options: TRI_STATE_OPTIONS,
  },
  {
    key: "lolPlayerStatus",
    shortLabel: "Lolero",
    fullLabel: "Lolero",
    type: "enum",
    options: LOL_PLAYER_OPTIONS,
  },
  {
    key: "isKuka",
    shortLabel: "Kuka",
    fullLabel: "Kuka",
    type: "boolean",
  },
  {
    key: "gameKnowledge",
    shortLabel: "Juegos",
    fullLabel: "Sabe de Juegos",
    type: "enum",
    options: TRI_STATE_OPTIONS,
  },
  {
    key: "canDrive",
    shortLabel: "Maneja",
    fullLabel: "Maneja",
    type: "boolean",
  },
] as const;

export function formatAttributeValue(
  col: ColumnDefinition,
  attrs: DynamicAttributesMap | Record<string, unknown>
): string {
  const value = attrs[col.key];
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  if (col.type === "boolean") {
    return Boolean(value) ? "Si" : "No";
  }
  if (col.type === "number" && col.unit) {
    return `${value}${col.unit}`;
  }
  return String(value);
}
