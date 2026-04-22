export type Plan = "free" | "premium";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
  plan: Plan;
  plan_expires_at: string | null;
  streak_freeze_count: number;
  stripe_customer_id: string | null;
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
  /**
   * Manual sort order. Lower = higher in the list. Ties broken by created_at.
   * Optional + nullable in the type so older fixtures/tests continue to work —
   * the live DB column is NOT NULL with a server default of 0, so fetched rows
   * always carry a number. New code that writes this field should supply one.
   */
  position?: number | null;
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

// Tipos de finanzas — el módulo vive en su propio archivo, pero el
// schema de la DB los referencia aquí para tiparlos en las queries.
import type {
  FinanceCategory,
  FinanceTransaction,
  FinanceCreditCard,
  FinanceDebt,
  FinanceQuote,
} from "./finance";

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Profile> };
      habits: { Row: Habit; Insert: Omit<Habit, "id" | "created_at">; Update: Partial<Habit> };
      habit_logs: { Row: HabitLog; Insert: Omit<HabitLog, "id">; Update: Partial<HabitLog> };
      stoic_quotes: { Row: StoricQuote; Insert: Omit<StoricQuote, "id">; Update: Partial<StoricQuote> };
      finance_categories: {
        Row: FinanceCategory;
        Insert: Omit<FinanceCategory, "id" | "created_at">;
        Update: Partial<FinanceCategory>;
      };
      finance_transactions: {
        Row: FinanceTransaction;
        Insert: Omit<FinanceTransaction, "id" | "created_at" | "updated_at">;
        Update: Partial<FinanceTransaction>;
      };
      finance_credit_cards: {
        Row: FinanceCreditCard;
        Insert: Omit<FinanceCreditCard, "id" | "created_at" | "updated_at">;
        Update: Partial<FinanceCreditCard>;
      };
      finance_debts: {
        Row: FinanceDebt;
        Insert: Omit<FinanceDebt, "id" | "created_at" | "updated_at">;
        Update: Partial<FinanceDebt>;
      };
      finance_quotes: {
        Row: FinanceQuote;
        Insert: Omit<FinanceQuote, "id">;
        Update: Partial<FinanceQuote>;
      };
    };
  };
};
