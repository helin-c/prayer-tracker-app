import { ThemeMode } from "../context/SettingsContext";

export const palettes = {
  dark: {
    background: "#050816",
    card: "#111827",
    header: "#050816",
    textPrimary: "#ffffff",
    textSecondary: "#9ca3af",
    textMuted: "#9ca3af",
    accent: "#22c55e",
    accentSoft: "#22c55e33",
    progress: "#a5b4fc",
    nextPrayer: "#6ee7b7",
    border: "#111827",
    chipBorder: "#4b5563",
    completedCardBackground: "#064e3b",
  },
  light: {
    background: "#f9fafb",
    card: "#ffffff",
    header: "#f9fafb",
    textPrimary: "#0f172a",
    textSecondary: "#4b5563",
    textMuted: "#6b7280",
    accent: "#16a34a",
    accentSoft: "#bbf7d0",
    progress: "#4f46e5",
    nextPrayer: "#059669",
    border: "#e5e7eb",
    chipBorder: "#d1d5db",
    completedCardBackground: "#dcfce7",
  },
} as const;

export type Palette = (typeof palettes)[keyof typeof palettes];

export function getPalette(mode: ThemeMode): Palette {
  return mode === "light" ? palettes.light : palettes.dark;
}
