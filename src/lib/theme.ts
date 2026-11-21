import type { GameSettingsData, ThemePreset } from "@/types/game";

export interface ThemePalette {
  label: string;
  description: string;
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  gradientCss: string;
}

export const THEME_PRESETS: Record<Exclude<ThemePreset, "custom">, ThemePalette> = {
  pokedle: {
    label: "Cielo Clásico",
    description: "Inspirado en Pokédle: cielo celeste, bordes dorados y tarjetas azul marino.",
    primaryColor: "#facc15",
    backgroundColor: "#0c4a6e",
    surfaceColor: "#172554",
    accentColor: "#38bdf8",
    gradientCss: "linear-gradient(180deg, #38bdf8 0%, #0284c7 48%, #0f172a 100%)",
  },
  dark: {
    label: "Noche Moderna",
    description: "Estética oscura minimalista de alto contraste.",
    primaryColor: "#22d3ee",
    backgroundColor: "#09090b",
    surfaceColor: "#18181b",
    accentColor: "#34d399",
    gradientCss: "radial-gradient(circle at top, #1e293b 0%, #09090b 70%)",
  },
  retro: {
    label: "Arcade Retro",
    description: "Tonos violeta neón con acentos magenta y ámbar.",
    primaryColor: "#fbbf24",
    backgroundColor: "#1e1b4b",
    surfaceColor: "#2e1065",
    accentColor: "#f43f5e",
    gradientCss: "linear-gradient(160deg, #312e81 0%, #1e1b4b 50%, #0f0720 100%)",
  },
};

export const DEFAULT_GAME_SETTINGS: GameSettingsData = {
  title: "Paladle",
  subtitle: "¡Adiviná el amigo del día!",
  themePreset: "pokedle",
  primaryColor: THEME_PRESETS.pokedle.primaryColor,
  backgroundColor: THEME_PRESETS.pokedle.backgroundColor,
  surfaceColor: THEME_PRESETS.pokedle.surfaceColor,
  accentColor: THEME_PRESETS.pokedle.accentColor,
  backgroundImageUrl: null,
  logoImageUrl: null,
  maxAttempts: null,
};

export function resolveBackgroundStyle(settings: GameSettingsData): string {
  if (settings.themePreset !== "custom") {
    return THEME_PRESETS[settings.themePreset].gradientCss;
  }
  return `radial-gradient(circle at top, ${settings.surfaceColor} 0%, ${settings.backgroundColor} 75%)`;
}
