import React from "react";
import { View, type ViewProps, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../tokens";

interface Props extends ViewProps {
  variant?: "default" | "elevated";
}

export function Card({ variant = "default", style, children, ...props }: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === "elevated" && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  elevated: {
    backgroundColor: colors.bg,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
