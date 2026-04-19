import React from "react";
import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, fontFamilies, fontSizes, lineHeights } from "../tokens";

type TextVariant = "display" | "heading" | "body" | "bodyMedium" | "label" | "quote" | "muted";

interface Props extends TextProps {
  variant?: TextVariant;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes["2xl"],
    lineHeight: fontSizes["2xl"] * lineHeights.tight,
    color: colors.ink,
  },
  heading: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.snug,
    color: colors.ink,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    color: colors.ink,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    color: colors.ink,
  },
  label: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  quote: {
    fontFamily: fontFamilies.quote,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.relaxed,
    color: colors.ink,
  },
  muted: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.muted,
  },
});

export function Text({ variant = "body", style, ...props }: Props) {
  return <RNText style={[styles[variant], style]} {...props} />;
}
