// apps/mobile/components/habits/HabitCard.tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radius, fontFamilies, fontSizes } from '@estoicismo/ui';
import { calculateStreak } from '../../hooks/useStreak';
import { getTodayStr, getCurrentWeekDays } from '../../lib/dateUtils';
import type { Habit, HabitLog } from '../../types/habits';

interface Props {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (habitId: string, isCompleted: boolean) => void;
  onLongPress: (habit: Habit) => void;
}

export function HabitCard({ habit, logs, onToggle, onLongPress }: Props) {
  const today = getTodayStr();
  const weekDays = getCurrentWeekDays();

  const isCompletedToday = logs.some(
    (l) => l.habit_id === habit.id && l.completed_at === today,
  );

  const streak = calculateStreak(logs, habit.id, today);

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(habit.id, isCompletedToday);
  }

  return (
    <Pressable
      onLongPress={() => onLongPress(habit)}
      accessibilityRole="none"
      style={[styles.card, { borderLeftColor: habit.color }]}
    >
      {/* Top row: emoji · name · streak · check */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{habit.icon}</Text>
        <Text
          style={styles.name}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {habit.name}
        </Text>
        {streak > 0 && (
          <Text style={styles.streak}>🔥 {streak}</Text>
        )}
        <Pressable
          onPress={handleToggle}
          accessibilityRole="checkbox"
          accessibilityLabel={`${habit.name} — ${isCompletedToday ? 'completado' : 'pendiente'}`}
          accessibilityState={{ checked: isCompletedToday }}
          hitSlop={8}
          style={[styles.check, isCompletedToday && styles.checkDone]}
        >
          {isCompletedToday && (
            <Text style={styles.checkMark}>✓</Text>
          )}
        </Pressable>
      </View>

      {/* Week dots row */}
      <View style={styles.weekRow}>
        {weekDays.map(({ date, label }) => {
          const done = logs.some(
            (l) => l.habit_id === habit.id && l.completed_at === date,
          );
          const isToday = date === today;

          return (
            <View key={date} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  done && isToday && { backgroundColor: habit.color },
                  done && !isToday && styles.dotDone,
                  !done && isToday && {
                    borderWidth: 1.5,
                    borderColor: habit.color,
                    backgroundColor: 'transparent',
                  },
                ]}
              />
              <Text
                style={[
                  styles.dayLabel,
                  isToday && { color: habit.color, fontFamily: fontFamilies.mono },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  streak: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.accent,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    color: colors.bg,
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dayLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 7,
    color: colors.muted,
  },
});
