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
  /** Estrategia preferida para pagar deudas. */
  payoff_strategy: "avalanche" | "snowball" | "custom";
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
  FinanceDebtPayment,
  FinanceQuote,
  FinanceAccount,
  FinanceRecurring,
  FinanceSubscription,
} from "./finance";

// Tipos de Mentalidad — mismo patrón que finanzas.
import type {
  MindsetMPD,
  MindsetMPDLog,
  MindsetMeditation,
  MindsetFrequencyFavorite,
} from "./mindset";

// Tipos de Fitness, Lectura, Ahorro, Presupuestos.
import type {
  FitnessUserProfile,
  FitnessMetric,
  FitnessExercise,
  FitnessWorkout,
  FitnessWorkoutSet,
  FitnessBodyMetric,
} from "./fitness";

import type { ReadingBook, ReadingSession } from "./reading";
import type { SavingsGoal, SavingsContribution } from "./savings";
import type { Budget } from "./budgets";

import type {
  BusinessProfile,
  BusinessProduct,
  BusinessClient,
  BusinessTask,
  BusinessIdea,
  BusinessSale,
} from "./business";

import type {
  PegassoConversation,
  PegassoMessage,
} from "./pegasso";

import type { JournalEntry } from "./journal";

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Profile> };
      habits: { Row: Habit; Insert: Omit<Habit, "id" | "created_at">; Update: Partial<Habit> };
      habit_logs: { Row: HabitLog; Insert: Omit<HabitLog, "id">; Update: Partial<HabitLog> };
      habit_streak_freezes: {
        Row: import("./habits").HabitStreakFreeze;
        Insert: Omit<import("./habits").HabitStreakFreeze, "id" | "created_at">;
        Update: Partial<import("./habits").HabitStreakFreeze>;
      };
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
      finance_debt_payments: {
        Row: FinanceDebtPayment;
        Insert: Omit<FinanceDebtPayment, "id" | "created_at">;
        Update: Partial<FinanceDebtPayment>;
      };
      finance_quotes: {
        Row: FinanceQuote;
        Insert: Omit<FinanceQuote, "id">;
        Update: Partial<FinanceQuote>;
      };
      finance_accounts: {
        Row: FinanceAccount;
        Insert: Omit<FinanceAccount, "id" | "created_at" | "updated_at">;
        Update: Partial<FinanceAccount>;
      };
      finance_recurring: {
        Row: FinanceRecurring;
        Insert: Omit<FinanceRecurring, "id" | "created_at" | "updated_at">;
        Update: Partial<FinanceRecurring>;
      };
      finance_subscriptions: {
        Row: FinanceSubscription;
        Insert: Omit<FinanceSubscription, "id" | "created_at" | "updated_at">;
        Update: Partial<FinanceSubscription>;
      };
      mindset_mpd: {
        Row: MindsetMPD;
        Insert: Omit<MindsetMPD, "id" | "created_at" | "updated_at">;
        Update: Partial<MindsetMPD>;
      };
      mindset_mpd_logs: {
        Row: MindsetMPDLog;
        Insert: Omit<MindsetMPDLog, "id" | "created_at" | "updated_at">;
        Update: Partial<MindsetMPDLog>;
      };
      mindset_meditations: {
        Row: MindsetMeditation;
        Insert: Omit<MindsetMeditation, "id" | "created_at">;
        Update: Partial<MindsetMeditation>;
      };
      mindset_frequency_favorites: {
        Row: MindsetFrequencyFavorite;
        Insert: Omit<MindsetFrequencyFavorite, "id" | "created_at">;
        Update: Partial<MindsetFrequencyFavorite>;
      };
      mindset_vision_items: {
        Row: import("./mindset").MindsetVisionItem;
        Insert: Omit<import("./mindset").MindsetVisionItem, "id" | "created_at" | "updated_at">;
        Update: Partial<import("./mindset").MindsetVisionItem>;
      };
      mindset_mood_logs: {
        Row: import("./mindset").MindsetMoodLog;
        Insert: Omit<import("./mindset").MindsetMoodLog, "id" | "created_at" | "updated_at">;
        Update: Partial<import("./mindset").MindsetMoodLog>;
      };
      mindset_future_letters: {
        Row: import("./mindset").MindsetFutureLetter;
        Insert: Omit<import("./mindset").MindsetFutureLetter, "id" | "created_at" | "updated_at">;
        Update: Partial<import("./mindset").MindsetFutureLetter>;
      };
      fitness_user_profile: {
        Row: FitnessUserProfile;
        Insert: Omit<FitnessUserProfile, "created_at" | "updated_at">;
        Update: Partial<FitnessUserProfile>;
      };
      fitness_metrics: {
        Row: FitnessMetric;
        Insert: Omit<FitnessMetric, "id" | "created_at" | "updated_at">;
        Update: Partial<FitnessMetric>;
      };
      fitness_exercises: {
        Row: FitnessExercise;
        Insert: Omit<FitnessExercise, "id" | "created_at">;
        Update: Partial<FitnessExercise>;
      };
      fitness_workouts: {
        Row: FitnessWorkout;
        Insert: Omit<FitnessWorkout, "id" | "created_at" | "updated_at">;
        Update: Partial<FitnessWorkout>;
      };
      fitness_workout_sets: {
        Row: FitnessWorkoutSet;
        Insert: Omit<FitnessWorkoutSet, "id" | "created_at">;
        Update: Partial<FitnessWorkoutSet>;
      };
      fitness_body_metrics: {
        Row: FitnessBodyMetric;
        Insert: Omit<FitnessBodyMetric, "id" | "created_at" | "updated_at">;
        Update: Partial<FitnessBodyMetric>;
      };
      reading_books: {
        Row: ReadingBook;
        Insert: Omit<ReadingBook, "id" | "created_at" | "updated_at">;
        Update: Partial<ReadingBook>;
      };
      reading_sessions: {
        Row: ReadingSession;
        Insert: Omit<ReadingSession, "id" | "created_at">;
        Update: Partial<ReadingSession>;
      };
      savings_goals: {
        Row: SavingsGoal;
        Insert: Omit<SavingsGoal, "id" | "created_at" | "updated_at">;
        Update: Partial<SavingsGoal>;
      };
      savings_contributions: {
        Row: SavingsContribution;
        Insert: Omit<SavingsContribution, "id" | "created_at">;
        Update: Partial<SavingsContribution>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, "id" | "created_at" | "updated_at">;
        Update: Partial<Budget>;
      };
      business_profile: {
        Row: BusinessProfile;
        Insert: Omit<BusinessProfile, "created_at" | "updated_at">;
        Update: Partial<BusinessProfile>;
      };
      business_products: {
        Row: BusinessProduct;
        Insert: Omit<BusinessProduct, "id" | "created_at" | "updated_at">;
        Update: Partial<BusinessProduct>;
      };
      business_clients: {
        Row: BusinessClient;
        Insert: Omit<BusinessClient, "id" | "created_at" | "updated_at">;
        Update: Partial<BusinessClient>;
      };
      business_tasks: {
        Row: BusinessTask;
        Insert: Omit<BusinessTask, "id" | "created_at" | "updated_at">;
        Update: Partial<BusinessTask>;
      };
      business_ideas: {
        Row: BusinessIdea;
        Insert: Omit<BusinessIdea, "id" | "created_at" | "updated_at">;
        Update: Partial<BusinessIdea>;
      };
      business_sales: {
        Row: BusinessSale;
        Insert: Omit<BusinessSale, "id" | "created_at">;
        Update: Partial<BusinessSale>;
      };
      pegasso_conversations: {
        Row: PegassoConversation;
        Insert: Omit<PegassoConversation, "id" | "created_at" | "updated_at" | "last_message_at"> & {
          last_message_at?: string;
        };
        Update: Partial<PegassoConversation>;
      };
      pegasso_messages: {
        Row: PegassoMessage;
        Insert: Omit<PegassoMessage, "id" | "created_at">;
        Update: Partial<PegassoMessage>;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<JournalEntry, "id" | "created_at" | "updated_at">;
        Update: Partial<JournalEntry>;
      };
    };
  };
};
