import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors, spacing } from "@estoicismo/ui";

export default function HabitosScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text variant="label" style={{ color: colors.accent }}>HOY</Text>
      <Text variant="display" style={styles.title}>Hábitos</Text>
      <Text variant="muted">Próximamente — Plan 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.xs, marginBottom: spacing.sm },
});
