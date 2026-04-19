import React from "react";
import {
  Pressable,
  type PressableProps,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { colors, fontFamilies, fontSizes, spacing, radius, touchTarget } from "../tokens";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends PressableProps {
  variant?: ButtonVariant;
  label: string;
  loading?: boolean;
}

const baseStyle = {
  minHeight: touchTarget.min,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm + 2,
  borderRadius: radius.md,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexDirection: "row" as const,
  gap: spacing.sm,
};

const variantStyles: Record<ButtonVariant, object> = {
  primary: {
    ...baseStyle,
    backgroundColor: colors.accent,
  },
  secondary: {
    ...baseStyle,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghost: {
    ...baseStyle,
    backgroundColor: "transparent",
  },
  danger: {
    ...baseStyle,
    backgroundColor: colors.danger,
  },
};

const textColors: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: colors.ink,
  ghost: colors.accent,
  danger: "#FFFFFF",
};

export function Button({ variant = "primary", label, loading = false, disabled, style, ...props }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        variantStyles[variant],
        pressed && { opacity: 0.82 },
        disabled && { opacity: 0.4 },
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={textColors[variant]} />}
      <Text
        style={{
          fontFamily: fontFamilies.bodyMedium,
          fontSize: fontSizes.base,
          color: textColors[variant],
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
