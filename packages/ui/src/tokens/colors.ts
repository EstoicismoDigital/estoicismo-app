export const colors = {
  // Light mode
  bg: "#FFFFFF",
  bgAlt: "#F5F1EA",    // crema — cards, secciones
  bgDeep: "#0A0A0A",   // secciones oscuras, modales premium
  ink: "#0A0A0A",
  muted: "#5E5E5E",
  line: "#E5E1DA",
  accent: "#8B6F47",   // CTA principal, tab activo, streaks
  accentSoft: "#C9A87A",
  success: "#2D7A4F",
  danger: "#B3261E",
  hair: "rgba(10,10,10,0.08)",

  // Dark mode
  dark: {
    bg: "#0F0D0B",
    bgAlt: "#1C1814",
    ink: "#F5F1EA",
    muted: "#9A8E82",
    accent: "#C9A87A",  // más claro para contraste 4.5:1
    line: "#2A2520",
  },
} as const;

export type Colors = typeof colors;
