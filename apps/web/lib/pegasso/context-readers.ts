/**
 * Server-side data readers que Pegasso usa via tool_use.
 *
 * Cada función toma el SB client + userId y devuelve un resumen
 * compacto que Claude puede consumir como JSON. NO devolvemos
 * datasets enormes — Pegasso tiene contexto limitado, así que
 * agregamos / recortamos a lo más relevante.
 *
 * Diseño: cada función es pura (input → output JSON), independiente,
 * y barata. Sin caching aquí — la API route llama bajo demanda.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

// ─────────────────────────────────────────────────────────────
// 1. Finanzas — net worth, gasto e ingresos del mes
// ─────────────────────────────────────────────────────────────

export type FinancesSummary = {
  period: string;
  currency: string;
  income: number;
  expense: number;
  net: number;
  topExpenseCategories: { name: string; amount: number }[];
  budgets: { name: string; spent: number; limit: number; pct: number }[];
  netWorth: number | null;
  emergencyFundMonths: number | null;
};

export async function getFinancesSummary(
  sb: SB,
  userId: string,
  opts: { period?: "this_month" | "last_30d" | "last_7d" } = {}
): Promise<FinancesSummary> {
  const period = opts.period ?? "this_month";
  let from: string, to: string;
  const now = new Date();
  if (period === "this_month") {
    from = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    to = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  } else if (period === "last_7d") {
    from = daysAgoIso(7);
    to = isoDate(now);
  } else {
    from = daysAgoIso(30);
    to = isoDate(now);
  }

  const [txs, cats, profile, accounts, budgets] = await Promise.all([
    sb
      .from("finance_transactions")
      .select("amount, kind, category_id, currency, occurred_on")
      .eq("user_id", userId)
      .gte("occurred_on", from)
      .lte("occurred_on", to),
    sb
      .from("finance_categories")
      .select("id, name")
      .eq("user_id", userId),
    sb
      .from("profiles")
      .select("default_currency")
      .eq("id", userId)
      .single(),
    sb
      .from("finance_accounts")
      .select("current_balance, include_in_net_worth, is_archived")
      .eq("user_id", userId),
    sb
      .from("budgets")
      .select("name, amount, category_id")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  const txsArr = (txs.data ?? []) as Array<{
    amount: number;
    kind: "income" | "expense";
    category_id: string | null;
    currency: string;
  }>;
  const catsArr = (cats.data ?? []) as Array<{ id: string; name: string }>;
  const accountsArr = (accounts.data ?? []) as Array<{
    current_balance: number;
    include_in_net_worth: boolean;
    is_archived: boolean;
  }>;
  const budgetsArr = (budgets.data ?? []) as Array<{
    name: string;
    amount: number;
    category_id: string;
  }>;

  const currency =
    txsArr[0]?.currency ??
    (profile.data as { default_currency?: string } | null)?.default_currency ??
    "MXN";

  let income = 0;
  let expense = 0;
  const byCat = new Map<string, number>();
  for (const t of txsArr) {
    const amt = Number(t.amount);
    if (t.kind === "income") income += amt;
    else {
      expense += amt;
      const key = t.category_id ?? "sin-categoria";
      byCat.set(key, (byCat.get(key) ?? 0) + amt);
    }
  }

  const catNameById = new Map(catsArr.map((c) => [c.id, c.name]));
  const topExpenseCategories = Array.from(byCat.entries())
    .map(([id, amount]) => ({
      name: id === "sin-categoria" ? "Sin categoría" : (catNameById.get(id) ?? "—"),
      amount: Math.round(amount),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Budgets con porcentaje de gasto
  const budgetStatus = budgetsArr.map((b) => {
    const spent = byCat.get(b.category_id) ?? 0;
    const limit = Number(b.amount);
    return {
      name: b.name,
      spent: Math.round(spent),
      limit: Math.round(limit),
      pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    };
  });

  // Net worth simple — solo cuentas no archivadas
  const netWorth = accountsArr
    .filter((a) => !a.is_archived && a.include_in_net_worth)
    .reduce((acc, a) => acc + Number(a.current_balance), 0);

  // Emergency fund: meses cubiertos por gasto promedio mensual
  let emergencyFundMonths: number | null = null;
  if (expense > 0 && netWorth > 0) {
    // Aproximamos: si period = this_month, el expense del mes
    const monthlyExpense = period === "last_7d" ? expense * (30 / 7) : expense;
    if (monthlyExpense > 0) {
      emergencyFundMonths = Math.round((netWorth / monthlyExpense) * 10) / 10;
    }
  }

  return {
    period,
    currency,
    income: Math.round(income),
    expense: Math.round(expense),
    net: Math.round(income - expense),
    topExpenseCategories,
    budgets: budgetStatus,
    netWorth: Math.round(netWorth),
    emergencyFundMonths,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. Hábitos — todos con racha + completados esta semana
// ─────────────────────────────────────────────────────────────

export type HabitsSummary = {
  total: number;
  completedToday: number;
  completedThisWeek: number;
  totalThisWeekPossible: number;
  habits: {
    name: string;
    icon: string | null;
    streak: number;
    completedToday: boolean;
    completedThisWeek: number; // de 7
  }[];
};

export async function getHabitsStatus(
  sb: SB,
  userId: string
): Promise<HabitsSummary> {
  const today = isoDate(new Date());
  const weekAgo = daysAgoIso(6); // hoy + 6 días atrás

  const [habits, logs] = await Promise.all([
    sb
      .from("habits")
      .select("id, name, icon")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("position", { ascending: true }),
    sb
      .from("habit_logs")
      .select("habit_id, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", daysAgoIso(60)) // 60 días para calcular racha
      .order("completed_at", { ascending: false }),
  ]);

  const habitsArr = (habits.data ?? []) as Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
  const logsArr = (logs.data ?? []) as Array<{
    habit_id: string;
    completed_at: string;
  }>;

  // Index logs por habit
  const logsByHabit = new Map<string, Set<string>>();
  for (const l of logsArr) {
    const set = logsByHabit.get(l.habit_id) ?? new Set();
    set.add(l.completed_at);
    logsByHabit.set(l.habit_id, set);
  }

  function calcStreak(habitId: string): number {
    const dates = logsByHabit.get(habitId);
    if (!dates) return 0;
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const iso = isoDate(cursor);
      if (dates.has(iso)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (streak === 0 && iso === today) {
        // hoy no hecho — checar ayer
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  let completedToday = 0;
  let completedThisWeek = 0;
  const habitDetails = habitsArr.map((h) => {
    const dates = logsByHabit.get(h.id) ?? new Set();
    const tDone = dates.has(today);
    if (tDone) completedToday++;
    let weekCount = 0;
    for (let d = new Date(weekAgo); d <= new Date(today); d.setDate(d.getDate() + 1)) {
      if (dates.has(isoDate(d))) weekCount++;
    }
    completedThisWeek += weekCount;
    return {
      name: h.name,
      icon: h.icon,
      streak: calcStreak(h.id),
      completedToday: tDone,
      completedThisWeek: weekCount,
    };
  });

  return {
    total: habitsArr.length,
    completedToday,
    completedThisWeek,
    totalThisWeekPossible: habitsArr.length * 7,
    habits: habitDetails,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. MPD — el propósito mayor del user
// ─────────────────────────────────────────────────────────────

export type MpdSummary = {
  exists: boolean;
  aim?: string;
  offered_value?: string | null;
  deadline?: string | null;
  plan?: string | null;
  affirmation?: string | null;
};

export async function getMpd(sb: SB, userId: string): Promise<MpdSummary> {
  const { data } = await sb
    .from("mindset_mpd")
    .select("aim, offered_value, deadline, plan, affirmation")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { exists: false };
  const row = data as {
    aim: string;
    offered_value: string | null;
    deadline: string | null;
    plan: string | null;
    affirmation: string | null;
  };
  return {
    exists: true,
    aim: row.aim,
    offered_value: row.offered_value,
    deadline: row.deadline,
    plan: row.plan,
    affirmation: row.affirmation,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. Diario reciente — entradas con tag opcional
// ─────────────────────────────────────────────────────────────

export type JournalSummary = {
  entries: {
    occurred_on: string;
    title: string | null;
    content: string;
    mood: number | null;
    tags: string[];
  }[];
};

export async function getRecentJournals(
  sb: SB,
  userId: string,
  opts: { limit?: number; tag?: string; days?: number } = {}
): Promise<JournalSummary> {
  const limit = opts.limit ?? 10;
  const days = opts.days ?? 30;
  const from = daysAgoIso(days);

  let q = sb
    .from("journal_entries")
    .select("occurred_on, title, content, mood, tags")
    .eq("user_id", userId)
    .gte("occurred_on", from)
    .order("occurred_on", { ascending: false })
    .limit(limit);
  if (opts.tag) q = q.contains("tags", [opts.tag]);
  const { data } = await q;
  const entries = (data ?? []) as Array<{
    occurred_on: string;
    title: string | null;
    content: string;
    mood: number | null;
    tags: string[];
  }>;

  // Recortamos content a 400 chars cada uno para no llenar el contexto
  return {
    entries: entries.map((e) => ({
      ...e,
      content:
        e.content.length > 400 ? e.content.slice(0, 400) + "…" : e.content,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Libros en progreso
// ─────────────────────────────────────────────────────────────

export type BooksSummary = {
  current: {
    title: string;
    author: string | null;
    current_page: number;
    total_pages: number | null;
    pct: number;
    my_summary: string | null;
  } | null;
  recentlyFinished: { title: string; author: string | null; finished_at: string }[];
  inProgressCount: number;
};

export async function getBooksStatus(
  sb: SB,
  userId: string
): Promise<BooksSummary> {
  const [current, recent, inProgress] = await Promise.all([
    sb
      .from("reading_books")
      .select("title, author, current_page, total_pages, my_summary")
      .eq("user_id", userId)
      .eq("is_current", true)
      .maybeSingle(),
    sb
      .from("reading_books")
      .select("title, author, finished_at")
      .eq("user_id", userId)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(5),
    sb
      .from("reading_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("finished_at", null),
  ]);

  let cur: BooksSummary["current"] = null;
  if (current.data) {
    const c = current.data as {
      title: string;
      author: string | null;
      current_page: number;
      total_pages: number | null;
      my_summary: string | null;
    };
    cur = {
      title: c.title,
      author: c.author,
      current_page: c.current_page,
      total_pages: c.total_pages,
      pct:
        c.total_pages && c.total_pages > 0
          ? Math.round((c.current_page / c.total_pages) * 100)
          : 0,
      my_summary: c.my_summary,
    };
  }

  const recentlyFinished = ((recent.data ?? []) as Array<{
    title: string;
    author: string | null;
    finished_at: string;
  }>).map((b) => ({ ...b }));

  return {
    current: cur,
    recentlyFinished,
    inProgressCount: inProgress.count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────
// 6. Negocio — clientes, productos, ventas, OKRs activos
// ─────────────────────────────────────────────────────────────

export type BusinessSummary = {
  hasBusiness: boolean;
  businessName: string | null;
  clients: { total: number; byStatus: Record<string, number> };
  products: { total: number; active: number };
  recentSales: { count: number; total: number; currency: string };
  activeOkrs: { quarter: string; objective: string; progress: number }[];
};

export async function getBusinessSummary(
  sb: SB,
  userId: string
): Promise<BusinessSummary> {
  const [profile, clients, products, sales, okrs] = await Promise.all([
    sb
      .from("business_profile")
      .select("name")
      .eq("user_id", userId)
      .maybeSingle(),
    sb
      .from("business_clients")
      .select("status")
      .eq("user_id", userId)
      .eq("is_archived", false),
    sb
      .from("business_products")
      .select("is_active")
      .eq("user_id", userId),
    sb
      .from("business_sales")
      .select("amount, currency")
      .eq("user_id", userId)
      .gte("occurred_on", daysAgoIso(30)),
    sb
      .from("business_okrs")
      .select("quarter, objective, progress, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(5),
  ]);

  const profileRow = profile.data as { name: string } | null;
  const clientsArr = (clients.data ?? []) as Array<{ status: string }>;
  const productsArr = (products.data ?? []) as Array<{ is_active: boolean }>;
  const salesArr = (sales.data ?? []) as Array<{
    amount: number;
    currency: string;
  }>;
  const okrsArr = (okrs.data ?? []) as Array<{
    quarter: string;
    objective: string;
    progress: number;
  }>;

  const byStatus: Record<string, number> = {};
  for (const c of clientsArr) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }

  const salesTotal = salesArr.reduce((acc, s) => acc + Number(s.amount), 0);

  return {
    hasBusiness: !!profileRow,
    businessName: profileRow?.name ?? null,
    clients: { total: clientsArr.length, byStatus },
    products: {
      total: productsArr.length,
      active: productsArr.filter((p) => p.is_active).length,
    },
    recentSales: {
      count: salesArr.length,
      total: Math.round(salesTotal),
      currency: salesArr[0]?.currency ?? "MXN",
    },
    activeOkrs: okrsArr,
  };
}
