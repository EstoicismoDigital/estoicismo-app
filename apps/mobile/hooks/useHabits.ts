// apps/mobile/hooks/useHabits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as habitsLib from '../lib/habits';
import {
  requestPermissions,
  scheduleHabitNotification,
  cancelHabitNotification,
} from '../lib/notifications';
import { getTodayStr, getCurrentWeekDays } from '../lib/dateUtils';
import type { Habit, HabitLog, CreateHabitInput } from '../types/habits';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

function getWeekRange(): { from: string; to: string } {
  const days = getCurrentWeekDays();
  return { from: days[0].date, to: days[6].date };
}

// ─── useHabits ───────────────────────────────────────────────────────────────

export function useHabits() {
  const { from, to } = getWeekRange();

  const habitsQuery = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: async () => habitsLib.fetchHabits(await getUserId()),
    staleTime: 1000 * 60 * 5,
  });

  const logsQuery = useQuery<HabitLog[]>({
    queryKey: ['habit-logs', from, to],
    queryFn: async () => habitsLib.fetchHabitLogs(await getUserId(), from, to),
    staleTime: 1000 * 60 * 5,
  });

  return {
    habits: habitsQuery.data ?? [],
    logs: logsQuery.data ?? [],
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    error: habitsQuery.error ?? logsQuery.error,
    refetch: () => {
      habitsQuery.refetch();
      logsQuery.refetch();
    },
  };
}

// ─── useToggleHabit ──────────────────────────────────────────────────────────

export function useToggleHabit() {
  const queryClient = useQueryClient();
  const { from, to } = getWeekRange();
  const logsKey = ['habit-logs', from, to];

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
    }: {
      habitId: string;
      isCompleted: boolean;
    }) => {
      const today = getTodayStr();
      if (isCompleted) {
        await habitsLib.deleteHabitLog(habitId, today);
      } else {
        const userId = await getUserId();
        await habitsLib.insertHabitLog(habitId, userId, today);
      }
    },

    onMutate: async ({ habitId, isCompleted }) => {
      const today = getTodayStr();
      await queryClient.cancelQueries({ queryKey: logsKey });
      const prevLogs = queryClient.getQueryData<HabitLog[]>(logsKey);

      queryClient.setQueryData<HabitLog[]>(logsKey, (old = []) => {
        if (isCompleted) {
          return old.filter(
            (l) => !(l.habit_id === habitId && l.completed_at === today),
          );
        } else {
          return [
            ...old,
            {
              id: `optimistic-${habitId}-${today}`,
              habit_id: habitId,
              user_id: '',
              completed_at: today,
              note: null,
            },
          ];
        }
      });

      return { prevLogs };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLogs !== undefined) {
        queryClient.setQueryData(logsKey, ctx.prevLogs);
      }
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: logsKey });
    },
  });
}

// ─── useCreateHabit ──────────────────────────────────────────────────────────

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const userId = await getUserId();
      const habit = await habitsLib.createHabit(userId, input);
      if (input.reminder_time) {
        const granted = await requestPermissions();
        if (granted) await scheduleHabitNotification(habit);
      }
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo crear el hábito. Intenta de nuevo.');
    },
  });
}

// ─── useUpdateHabit ──────────────────────────────────────────────────────────

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateHabitInput>;
    }) => {
      const habit = await habitsLib.updateHabit(id, input);
      await cancelHabitNotification(id);
      if (habit.reminder_time) {
        const granted = await requestPermissions();
        if (granted) await scheduleHabitNotification(habit);
      }
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo actualizar el hábito.');
    },
  });
}

// ─── useArchiveHabit ─────────────────────────────────────────────────────────

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      await habitsLib.archiveHabit(habitId);
      await cancelHabitNotification(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo archivar el hábito.');
    },
  });
}

// ─── useDailyQuote ───────────────────────────────────────────────────────────

interface Quote {
  text: string;
  author: string;
}

const FALLBACK_QUOTE: Quote = {
  text: 'El obstáculo es el camino.',
  author: 'Marco Aurelio',
};

export function useDailyQuote() {
  return useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const today = getTodayStr();
      const cacheKey = `stoic_quote_${today}`;

      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as Quote;

      const { data, error } = await supabase
        .from('stoic_quotes')
        .select('text, author')
        .eq('language', 'es');

      if (error || !data?.length) return FALLBACK_QUOTE;

      const idx = new Date().getDate() % data.length;
      const quote = data[idx] as Quote;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(quote));
      return quote;
    },
    staleTime: Infinity,
  });
}
