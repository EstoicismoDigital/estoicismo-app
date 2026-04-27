import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Backup completo del usuario · todas las tablas que el RLS permite leer.
 *
 * Versión 2 (este archivo) cubre:
 *   habits + habit_logs + habit_streak_freezes
 *   finance_categories, _transactions, _credit_cards, _debts,
 *   _debt_payments, _accounts, _recurring, _subscriptions, _quotes
 *   savings_goals, _contributions
 *   budgets
 *   mindset_mpd, _mpd_logs, _meditations, _frequency_favorites,
 *   _vision_items, _mood_logs, _future_letters
 *   reading_books, _sessions, _goals
 *   fitness_user_profile, _metrics, _exercises, _workouts,
 *   _workout_sets, _body_metrics
 *   business_profile, _products, _clients, _tasks, _ideas, _sales,
 *   _milestones
 *   pegasso_conversations, _messages
 *   journal_entries
 *   profiles
 *
 * Importante: NO incluye datos a los que el RLS no daría permiso
 * (otros users) — la query con `.eq("user_id", uid)` lo garantiza.
 */

const TABLES_BY_USER_ID = [
  "profiles", // single row matched by id
  "habits",
  "habit_logs",
  "habit_streak_freezes",
  "finance_categories",
  "finance_transactions",
  "finance_credit_cards",
  "finance_debts",
  "finance_debt_payments",
  "finance_accounts",
  "finance_recurring",
  "finance_subscriptions",
  "finance_investments",
  "finance_quotes",
  "savings_goals",
  "savings_contributions",
  "budgets",
  "mindset_mpd",
  "mindset_mpd_logs",
  "mindset_meditations",
  "mindset_frequency_favorites",
  "mindset_vision_items",
  "mindset_mood_logs",
  "mindset_future_letters",
  "mindset_gratitude",
  "reading_books",
  "reading_sessions",
  "reading_goals",
  "reading_challenges",
  "fitness_user_profile",
  "fitness_metrics",
  "fitness_exercises",
  "fitness_workouts",
  "fitness_workout_sets",
  "fitness_body_metrics",
  "business_profile",
  "business_products",
  "business_clients",
  "business_tasks",
  "business_ideas",
  "business_sales",
  "business_milestones",
  "business_okrs",
  "pegasso_conversations",
  "pegasso_messages",
  "journal_entries",
] as const;

export type FullBackup = {
  version: 2;
  exportedAt: string;
  userId: string;
  /** count summary — quick read sin parsear todo. */
  counts: Record<string, number>;
  /** payload con cada tabla como array de filas. */
  data: Record<string, unknown[]>;
};

export async function gatherFullBackup(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
  userId: string
): Promise<FullBackup> {
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  // Profile uses id-not-user_id pattern.
  try {
    const { data: rows } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId);
    data["profiles"] = rows ?? [];
    counts["profiles"] = (rows ?? []).length;
  } catch {
    data["profiles"] = [];
    counts["profiles"] = 0;
  }

  // All other tables share user_id.
  await Promise.all(
    TABLES_BY_USER_ID.filter((t) => t !== "profiles").map(async (table) => {
      try {
        const { data: rows } = await sb
          .from(table)
          .select("*")
          .eq("user_id", userId);
        data[table] = rows ?? [];
        counts[table] = (rows ?? []).length;
      } catch {
        data[table] = [];
        counts[table] = 0;
      }
    })
  );

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    userId,
    counts,
    data,
  };
}

export function backupFilename(now: string): string {
  // estoicismo-backup-2026-04-27.json
  return `estoicismo-backup-${now.slice(0, 10)}.json`;
}

export function totalRows(b: FullBackup): number {
  return Object.values(b.counts).reduce((a, c) => a + c, 0);
}
