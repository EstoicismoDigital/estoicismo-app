// apps/mobile/components/habits/EmptyHabits.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, colors, spacing } from '@estoicismo/ui';

interface Props {
  onCreate: () => void;
}

export function EmptyHabits({ onCreate }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="display" style={styles.title}>
        Sin hábitos todavía.
      </Text>
      <Text variant="muted" style={styles.subtitle}>
        Los estoicos construían sistemas,{'\n'}no esperaban motivación.
      </Text>
      <Button
        variant="primary"
        label="Crear primer hábito"
        onPress={onCreate}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
});
