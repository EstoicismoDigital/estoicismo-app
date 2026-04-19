export type Plan = "free" | "premium";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
  plan: Plan;
  plan_expires_at: string | null;
  streak_freeze_count: number;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekly" | { days: number[] };
  reminder_time: string | null;
  is_archived: boolean;
  created_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string; // date YYYY-MM-DD
  note: string | null;
};

export type StoricQuote = {
  id: string;
  text: string;
  author: string;
  source: string | null;
  language: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Profile> };
      habits: { Row: Habit; Insert: Omit<Habit, "id" | "created_at">; Update: Partial<Habit> };
      habit_logs: { Row: HabitLog; Insert: Omit<HabitLog, "id">; Update: Partial<HabitLog> };
      stoic_quotes: { Row: StoricQuote; Insert: Omit<StoricQuote, "id">; Update: Partial<StoricQuote> };
    };
  };
};
