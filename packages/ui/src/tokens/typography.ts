export const fontFamilies = {
  display: "Lora_700Bold",
  heading: "Lora_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  mono: "JetBrainsMono_500Medium",
  quote: "Lora_400Regular_Italic",
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;
