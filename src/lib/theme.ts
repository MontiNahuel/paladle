import type { GameSettingsData, RetroFont, ThemePreset } from "@/types/game";

export const RETRO_FONT_LABELS: Record<
  RetroFont,
  {
    label: string;
    note: string;
    fontCss: string;
    cellSize: string;
    cellWeight: string;
    cellTracking: string;
    cellLineHeight: string;
  }
> = {
  pixelify: {
    label: "Pixelify Sans",
    note: "RPG / Minecraft (16px)",
    fontCss: "var(--font-pixel-body), monospace",
    cellSize: "1rem",
    cellWeight: "500",
    cellTracking: "0.01em",
    cellLineHeight: "1.15",
  },
  silkscreen: {
    label: "Silkscreen",
    note: "Pixel UI limpia (12.5px)",
    fontCss: "var(--font-pixel-silkscreen), monospace",
    cellSize: "0.78rem",
    cellWeight: "400",
    cellTracking: "-0.02em",
    cellLineHeight: "1.2",
  },
  "press-start": {
    label: "Press Start 2P",
    note: "8-bit NES compacta (10px)",
    fontCss: "var(--font-pixel-display), monospace",
    cellSize: "0.625rem",
    cellWeight: "400",
    cellTracking: "-0.03em",
    cellLineHeight: "1.35",
  },
};

export interface ThemePalette {
  label: string;
  tag: string;
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
    tag: "Clásico",
    description:
      "Cielo celeste con nubes, horizonte verde, bordes dorados y título con contorno gamer.",
    primaryColor: "#facc15",
    backgroundColor: "#0c4a6e",
    surfaceColor: "#172554",
    accentColor: "#38bdf8",
    gradientCss: "linear-gradient(180deg, #38bdf8 0%, #0284c7 58%, #15803d 100%)",
  },
  dark: {
    label: "Noche Moderna",
    tag: "Minimal",
    description:
      "Grilla oscura minimalista con tarjetas translúcidas, bordes finos y acentos neón suaves.",
    primaryColor: "#22d3ee",
    backgroundColor: "#090b10",
    surfaceColor: "#111827",
    accentColor: "#34d399",
    gradientCss: "radial-gradient(circle at top, #111827 0%, #090b10 75%)",
  },
  retro: {
    label: "Arcade Retro",
    tag: "8-Bit Pixel",
    description:
      "Estilo pixelado completo: tipografía 8-bit, scanlines CRT, sombras duras y avatares pixelados.",
    primaryColor: "#fbbf24",
    backgroundColor: "#140f2d",
    surfaceColor: "#261652",
    accentColor: "#f43f5e",
    gradientCss: "linear-gradient(160deg, #261652 0%, #140f2d 65%, #090614 100%)",
  },
};

export const DEFAULT_GAME_SETTINGS: GameSettingsData = {
  title: "Paladle",
  subtitle: "¡Adiviná el amigo del día!",
  themePreset: "pokedle",
  retroFont: "pixelify",
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
  return `radial-gradient(circle at top, ${settings.surfaceColor} 0%, ${settings.backgroundColor} 78%)`;
}
