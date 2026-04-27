/**
 * Weekly review · gather user data and build a structured prompt
 * for Pegasso to respond with a stoic-themed weekly synthesis.
 *
 * No AI call here — solo arma el prompt. La conversación se crea
 * normalmente y el flujo de streaming hace el resto.
 *
 * Filosofía: nada de "lograste 20% más" — los datos son neutros, el
 * insight es del LLM. Gathereamos:
 *   - habits: completados últ. 7 días
 *   - mood: avg, mejor / peor día, tags más frecuentes
 *   - finanzas: ingresos / gastos, balance neto
 *   - lectura: páginas leídas (si la métrica existe)
 *   - business: ventas, tareas completadas
 *   - mindset: días con MPD log, ejercicio del día completado
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type WeeklyReviewSnapshot = {
  weekStart: string; // YYYY-MM-DD (lunes)
  weekEnd: string; // YYYY-MM-DD (domingo)
  habits: { name: string; completedDays: number }[];
  habitsTotal: number;
  mood: {
    days: number;
    avg: number | null;
    bestDay: { date: string; mood: number } | null;
    worstDay: { date: string; mood: number } | null;
    topTags: string[];
  };
  finance: {
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
    currency: string;
    txCount: number;
  };
  reading: {
    sessions: number;
    minutes: number;
    pages: number;
  };
  business: {
    salesCount: number;
    salesTotal: number;
    tasksCompleted: number;
  };
  mindset: {
    mpdLogDays: number;
    pinnedInsightsCreated: number;
  };
};

export function getWeekRange(today: Date = new Date()): {
  start: string;
  end: string;
} {
  // Monday of current week → Sunday
  const d = new Date(today);
  const day = d.getDay(); // 0 = Sun, 1 = Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday - 7); // last full week (mon-sun)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: toISODate(start),
    end: toISODate(end),
  };
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Construye el snapshot consultando todas las tablas relevantes.
 * Best-effort: si una tabla falla, sigue con las demás.
 */
export async function gatherWeeklySnapshot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
  userId: string,
  range: { start: string; end: string } = getWeekRange()
): Promise<WeeklyReviewSnapshot> {
  const result: WeeklyReviewSnapshot = {
    weekStart: range.start,
    weekEnd: range.end,
    habits: [],
    habitsTotal: 0,
    mood: { days: 0, avg: null, bestDay: null, worstDay: null, topTags: [] },
    finance: {
      incomeTotal: 0,
      expenseTotal: 0,
      balance: 0,
      currency: "MXN",
      txCount: 0,
    },
    reading: { sessions: 0, minutes: 0, pages: 0 },
    business: { salesCount: 0, salesTotal: 0, tasksCompleted: 0 },
    mindset: { mpdLogDays: 0, pinnedInsightsCreated: 0 },
  };

  // Habits — count completions per habit in range
  try {
    const { data: logs } = await sb
      .from("habit_logs")
      .select("habit_id, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", range.start)
      .lte("completed_at", range.end);
    if (logs) {
      const byHabit = new Map<string, number>();
      for (const l of logs as { habit_id: string; completed_at: string }[]) {
        byHabit.set(l.habit_id, (byHabit.get(l.habit_id) ?? 0) + 1);
      }
      result.habitsTotal = logs.length;
      const ids = Array.from(byHabit.keys());
      if (ids.length > 0) {
        const { data: habits } = await sb
          .from("habits")
          .select("id, name")
          .in("id", ids);
        if (habits) {
          result.habits = (habits as { id: string; name: string }[])
            .map((h) => ({
              name: h.name,
              completedDays: byHabit.get(h.id) ?? 0,
            }))
            .sort((a, b) => b.completedDays - a.completedDays);
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Mood
  try {
    const { data: moodLogs } = await sb
      .from("mindset_mood_logs")
      .select("mood, occurred_on, tags")
      .eq("user_id", userId)
      .gte("occurred_on", range.start)
      .lte("occurred_on", range.end);
    if (moodLogs && moodLogs.length > 0) {
      const rows = moodLogs as {
        mood: number;
        occurred_on: string;
        tags: string[];
      }[];
      const sum = rows.reduce((a, r) => a + r.mood, 0);
      result.mood.days = rows.length;
      result.mood.avg = +(sum / rows.length).toFixed(1);
      const sorted = [...rows].sort((a, b) => b.mood - a.mood);
      result.mood.bestDay = {
        date: sorted[0].occurred_on,
        mood: sorted[0].mood,
      };
      result.mood.worstDay = {
        date: sorted[sorted.length - 1].occurred_on,
        mood: sorted[sorted.length - 1].mood,
      };
      const tagFreq = new Map<string, number>();
      for (const r of rows) {
        for (const t of r.tags ?? []) {
          tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1);
        }
      }
      result.mood.topTags = Array.from(tagFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);
    }
  } catch {
    /* ignore */
  }

  // Finance
  try {
    const { data: txs } = await sb
      .from("finance_transactions")
      .select("amount, kind, currency")
      .eq("user_id", userId)
      .gte("occurred_on", range.start)
      .lte("occurred_on", range.end);
    if (txs) {
      const rows = txs as {
        amount: number;
        kind: "income" | "expense";
        currency: string;
      }[];
      result.finance.txCount = rows.length;
      for (const r of rows) {
        if (r.kind === "income") result.finance.incomeTotal += Number(r.amount);
        else result.finance.expenseTotal += Number(r.amount);
        if (rows.length > 0) result.finance.currency = r.currency;
      }
      result.finance.balance =
        result.finance.incomeTotal - result.finance.expenseTotal;
    }
  } catch {
    /* ignore */
  }

  // Reading
  try {
    const { data: rs } = await sb
      .from("reading_sessions")
      .select("minutes, pages_read, occurred_on")
      .eq("user_id", userId)
      .gte("occurred_on", range.start)
      .lte("occurred_on", range.end);
    if (rs) {
      const rows = rs as {
        minutes: number | null;
        pages_read: number | null;
      }[];
      result.reading.sessions = rows.length;
      for (const r of rows) {
        result.reading.minutes += r.minutes ?? 0;
        result.reading.pages += r.pages_read ?? 0;
      }
    }
  } catch {
    /* ignore */
  }

  // Business sales
  try {
    const { data: sales } = await sb
      .from("business_sales")
      .select("amount, occurred_on")
      .eq("user_id", userId)
      .gte("occurred_on", range.start)
      .lte("occurred_on", range.end);
    if (sales) {
      const rows = sales as { amount: number }[];
      result.business.salesCount = rows.length;
      result.business.salesTotal = rows.reduce(
        (a, r) => a + Number(r.amount),
        0
      );
    }
    // Business tasks completed
    const startTs = new Date(range.start + "T00:00:00").toISOString();
    const endTs = new Date(range.end + "T23:59:59").toISOString();
    const { data: tasks } = await sb
      .from("business_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("is_completed", true)
      .gte("completed_at", startTs)
      .lte("completed_at", endTs);
    result.business.tasksCompleted = (tasks ?? []).length;
  } catch {
    /* ignore */
  }

  // Mindset MPD logs + pinned insights created this week
  try {
    const { data: mpdLogs } = await sb
      .from("mindset_mpd_logs")
      .select("date")
      .eq("user_id", userId)
      .gte("date", range.start)
      .lte("date", range.end);
    result.mindset.mpdLogDays = (mpdLogs ?? []).length;
    const startTs = new Date(range.start + "T00:00:00").toISOString();
    const endTs = new Date(range.end + "T23:59:59").toISOString();
    const { data: pins } = await sb
      .from("pegasso_messages")
      .select("id")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .gte("pinned_at", startTs)
      .lte("pinned_at", endTs);
    result.mindset.pinnedInsightsCreated = (pins ?? []).length;
  } catch {
    /* ignore */
  }

  return result;
}

/**
 * Convierte un snapshot en un prompt textual estructurado que el user
 * "envía" a Pegasso al iniciar una nueva conversación de tipo
 * weekly_review.
 */
export function buildWeeklyReviewPrompt(s: WeeklyReviewSnapshot): string {
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", {
      maximumFractionDigits: 0,
    });

  const lines: string[] = [];
  lines.push(
    `Hola Pegasso. Quiero hacer una revisión estoica de mi semana (${formatRange(
      s.weekStart,
      s.weekEnd
    )}).`
  );
  lines.push("");
  lines.push("Estos son los datos:");
  lines.push("");

  // Habits
  if (s.habitsTotal > 0) {
    lines.push("**Hábitos:**");
    for (const h of s.habits.slice(0, 8)) {
      lines.push(`- ${h.name}: ${h.completedDays}/7 días`);
    }
    lines.push("");
  } else {
    lines.push("**Hábitos:** sin registros esta semana.");
    lines.push("");
  }

  // Mood
  if (s.mood.days > 0) {
    lines.push("**Estado emocional:**");
    lines.push(
      `- ${s.mood.days}/7 días registrados, mood promedio ${s.mood.avg}/5`
    );
    if (s.mood.bestDay)
      lines.push(
        `- Mejor día: ${s.mood.bestDay.date} (${s.mood.bestDay.mood}/5)`
      );
    if (s.mood.worstDay)
      lines.push(
        `- Peor día: ${s.mood.worstDay.date} (${s.mood.worstDay.mood}/5)`
      );
    if (s.mood.topTags.length > 0) {
      lines.push(`- Emociones más frecuentes: ${s.mood.topTags.join(", ")}`);
    }
    lines.push("");
  } else {
    lines.push("**Estado emocional:** sin registros esta semana.");
    lines.push("");
  }

  // Finance
  lines.push("**Finanzas:**");
  lines.push(`- Ingresos: ${fmt(s.finance.incomeTotal)} ${s.finance.currency}`);
  lines.push(`- Gastos: ${fmt(s.finance.expenseTotal)} ${s.finance.currency}`);
  lines.push(
    `- Balance: ${fmt(s.finance.balance)} ${s.finance.currency} (${s.finance.txCount} transacciones)`
  );
  lines.push("");

  // Reading
  if (s.reading.sessions > 0) {
    lines.push("**Lectura:**");
    lines.push(
      `- ${s.reading.sessions} sesiones, ${s.reading.minutes} min, ${s.reading.pages} páginas`
    );
    lines.push("");
  }

  // Business
  if (s.business.salesCount > 0 || s.business.tasksCompleted > 0) {
    lines.push("**Negocio:**");
    if (s.business.salesCount > 0) {
      lines.push(
        `- ${s.business.salesCount} ventas, ${fmt(s.business.salesTotal)} ${s.finance.currency}`
      );
    }
    if (s.business.tasksCompleted > 0) {
      lines.push(`- ${s.business.tasksCompleted} tareas completadas`);
    }
    lines.push("");
  }

  // Mindset
  lines.push("**Mentalidad:**");
  lines.push(`- ${s.mindset.mpdLogDays}/7 días con check-in de MPD`);
  if (s.mindset.pinnedInsightsCreated > 0) {
    lines.push(
      `- ${s.mindset.pinnedInsightsCreated} insights guardados de nuestras conversaciones`
    );
  }
  lines.push("");

  // Closer — instrucciones a Pegasso
  lines.push("---");
  lines.push("");
  lines.push("Por favor:");
  lines.push("1. Felicítame por lo que hice bien (sin ser melindroso).");
  lines.push("2. Señala honestamente lo que no rendí.");
  lines.push("3. Recomiéndame UNA cosa concreta a mejorar la próxima semana.");
  lines.push(
    "4. Cierra con una cita estoica corta que aplique a mi situación esta semana."
  );

  return lines.join("\n");
}

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${fmt(s)} – ${fmt(e)}`;
}
