import type { ITheme } from "@xterm/xterm";

export const TERMINAL_THEMES: Record<"dark" | "light", ITheme & { background: string }> = {
  dark: {
    background: "#09090b",
    foreground: "#fafafa",
    cursor: "#fafafa",
    cursorAccent: "#09090b",
    selectionBackground: "rgba(255,255,255,0.25)",
    black: "#18181b", red: "#f87171", green: "#4ade80", yellow: "#facc15",
    blue: "#60a5fa", magenta: "#c084fc", cyan: "#22d3ee", white: "#e4e4e7",
    brightBlack: "#52525b", brightRed: "#fca5a5", brightGreen: "#86efac",
    brightYellow: "#fde047", brightBlue: "#93c5fd", brightMagenta: "#d8b4fe",
    brightCyan: "#67e8f9", brightWhite: "#fafafa",
  },
  light: {
    background: "#ffffff",
    foreground: "#18181b",
    cursor: "#18181b",
    cursorAccent: "#ffffff",
    selectionBackground: "rgba(0,0,0,0.15)",
    black: "#18181b", red: "#dc2626", green: "#16a34a", yellow: "#ca8a04",
    blue: "#2563eb", magenta: "#9333ea", cyan: "#0891b2", white: "#71717a",
    brightBlack: "#3f3f46", brightRed: "#ef4444", brightGreen: "#22c55e",
    brightYellow: "#eab308", brightBlue: "#3b82f6", brightMagenta: "#a855f7",
    brightCyan: "#06b6d4", brightWhite: "#a1a1aa",
  },
};