// apps/mobile/types/habits.ts

export type Frequency =
  | 'daily'
  | { times: 3 | 4 | 5; period: 'week' };

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;          // emoji character
  color: string;         // hex from HABIT_COLORS
  frequency: Frequency;
  reminder_time: string | null;  // "HH:MM" or null
  is_archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;  // "YYYY-MM-DD"
  note: string | null;
}

export interface CreateHabitInput {
  name: string;
  icon: string;
  color: string;
  frequency: Frequency;
  reminder_time: string | null;
}

/** The 8 curated habit colors */
export const HABIT_COLORS = [
  '#4F8EF7', // Azul
  '#3DBF8A', // Esmeralda
  '#E8714A', // Coral
  '#A56CF0', // Violeta
  '#F0B429', // Ámbar
  '#E85D7A', // Rosa
  '#2BBDCE', // Turquesa
  '#8B6F47', // Tierra (system accent)
] as const;

/** The 20 curated habit emojis */
export const HABIT_EMOJIS = [
  '🎯', '🧘', '📚', '🏃', '💧',
  '✍️', '🌿', '💪', '🧠', '⭐',
  '🎨', '🎵', '🍎', '😴', '🧹',
  '💊', '🚴', '🧗', '📝', '🌅',
] as const;
