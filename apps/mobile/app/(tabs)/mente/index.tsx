import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors, spacing } from "@estoicismo/ui";

export default function MenteScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text variant="label" style={{ color: colors.accent }}>MENTALIDAD</Text>
      <Text variant="display" style={styles.title}>Mente</Text>
      <Text variant="muted">Próximamente — Plan 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.xs, marginBottom: spacing.sm },
});
