export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,   // cards
  xl: 20,   // modales
  full: 9999, // pills/tags
} as const;

export const touchTarget = {
  min: 44, // Apple HIG minimum
} as const;
