// apps/mobile/app/(tabs)/habitos/index.tsx
import React, { useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActionSheetIOS,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, colors, spacing, fontFamilies, fontSizes } from '@estoicismo/ui';
import { HabitCard } from '../../../components/habits/HabitCard';
import { EmptyHabits } from '../../../components/habits/EmptyHabits';
import { HabitModal } from '../../../components/habits/HabitModal';
import {
  useHabits,
  useToggleHabit,
  useCreateHabit,
  useUpdateHabit,
  useArchiveHabit,
  useDailyQuote,
} from '../../../hooks/useHabits';
import { getHeaderDateStr, getTodayStr } from '../../../lib/dateUtils';
import type { Habit, CreateHabitInput } from '../../../types/habits';

const FREE_HABIT_LIMIT = 3;

export default function HabitosScreen() {
  const insets = useSafeAreaInsets();
  const { habits, logs, isLoading } = useHabits();
  const { data: quote } = useDailyQuote();
  const { mutate: toggle } = useToggleHabit();
  const { mutate: createHabit, isPending: creating } = useCreateHabit();
  const { mutate: updateHabit, isPending: updating } = useUpdateHabit();
  const { mutate: archiveHabit } = useArchiveHabit();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const today = getTodayStr();
  const completedToday = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.completed_at === today),
  ).length;

  function handleFABPress() {
    if (habits.length >= FREE_HABIT_LIMIT) {
      Alert.alert(
        'Límite alcanzado',
        'El plan gratuito permite hasta 3 hábitos activos. Próximamente podrás desbloquear más.',
        [{ text: 'Entendido' }],
      );
      return;
    }
    setEditingHabit(undefined);
    setModalVisible(true);
  }

  function handleLongPress(habit: Habit) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar', 'Archivar'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (idx) => {
          if (idx === 1) { setEditingHabit(habit); setModalVisible(true); }
          if (idx === 2) handleArchive(habit);
        },
      );
    } else {
      Alert.alert(habit.name, undefined, [
        { text: 'Editar', onPress: () => { setEditingHabit(habit); setModalVisible(true); } },
        { text: 'Archivar', style: 'destructive', onPress: () => handleArchive(habit) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  function handleArchive(habit: Habit) {
    Alert.alert(
      'Archivar hábito',
      `¿Archivar "${habit.name}"? Ya no aparecerá en tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Archivar', style: 'destructive', onPress: () => archiveHabit(habit.id) },
      ],
    );
  }

  function handleSave(input: CreateHabitInput) {
    if (editingHabit) {
      updateHabit(
        { id: editingHabit.id, input },
        { onSuccess: () => setModalVisible(false) },
      );
    } else {
      createHabit(input, { onSuccess: () => setModalVisible(false) });
    }
  }

  return (
    <View style={styles.root}>
      {/* Dark header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerLabel}>{getHeaderDateStr()}</Text>
        <Text style={styles.headerQuote} numberOfLines={2}>
          {quote ? `"${quote.text}"` : '"El obstáculo es el camino."'}
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressNum}>{completedToday}</Text>
          <Text style={styles.progressLabel}>
            {`DE ${habits.length} HÁBITO${habits.length !== 1 ? 'S' : ''} COMPLETADO${completedToday !== 1 ? 'S' : ''}`}
          </Text>
        </View>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={[
            styles.list,
            habits.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={<EmptyHabits onCreate={handleFABPress} />}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              logs={logs}
              onToggle={(habitId, isCompleted) => toggle({ habitId, isCompleted })}
              onLongPress={handleLongPress}
            />
          )}
        />
      )}

      {/* FAB */}
      {!isLoading && (
        <Pressable
          onPress={handleFABPress}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo hábito"
          style={[styles.fab, { bottom: insets.bottom + 72, right: spacing.lg }]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}

      {/* Modal */}
      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        loading={creating || updating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.bgDeep,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  headerQuote: {
    // fontFamilies.quote = "Lora_400Regular_Italic" — the italic variant
    fontFamily: fontFamilies.quote,
    fontSize: 22,
    color: '#F5F1EA',
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  progressNum: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    fontWeight: '700',
    color: colors.accent,
    lineHeight: 44,
  },
  progressLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.dark.muted,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  listEmpty: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: colors.bg,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: fontFamilies.body,
  },
});
