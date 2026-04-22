import type {
  FinanceCategory,
  FinanceDebt,
  FinanceTransaction,
} from "@estoicismo/supabase";

/**
 * Utilidades puras para el módulo Finanzas.
 *
 * Todo lo que pueda vivir sin React vive aquí — así el código se puede
 * testear sin levantar providers ni mocks de Supabase.
 */

// ─────────────────────────────────────────────────────────────
// FORMATO DE MONEDA
// ─────────────────────────────────────────────────────────────

const CURRENCY_LOCALE: Record<string, string> = {
  MXN: "es-MX",
  USD: "en-US",
  EUR: "es-ES",
  COP: "es-CO",
  ARS: "es-AR",
  CLP: "es-CL",
  PEN: "es-PE",
  GTQ: "es-GT",
};

export function formatMoney(
  amount: number,
  currency = "MXN",
  opts: { signed?: boolean; compact?: boolean } = {}
) {
  const locale = CURRENCY_LOCALE[currency] ?? "es-MX";
  const value = opts.signed ? amount : Math.abs(amount);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: opts.compact ? 0 : 2,
    minimumFractionDigits: opts.compact ? 0 : 2,
    notation: opts.compact ? "compact" : "standard",
  });
  return formatter.format(value);
}

export function formatSignedMoney(
  amount: number,
  kind: "income" | "expense",
  currency = "MXN"
) {
  const sign = kind === "income" ? "+" : "−";
  return `${sign}${formatMoney(amount, currency)}`;
}

// ─────────────────────────────────────────────────────────────
// NORMALIZACIÓN DE TEXTO
// ─────────────────────────────────────────────────────────────

/**
 * Minúsculas + sin acentos. Usado para comparar palabras en voz y
 * notas con los keywords de las categorías (que ya se guardan
 * normalizados en la DB).
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// ─────────────────────────────────────────────────────────────
// PARSEO DE VOZ → { amount, note, categoryId }
// ─────────────────────────────────────────────────────────────

/**
 * Extrae el monto del texto dictado. Acepta formatos comunes en
 * español: "350", "350 pesos", "250 con 50", "1,500.00", "mil
 * quinientos" (básico — solo unidades y decenas simples para
 * números chicos; no reemplaza un parser completo).
 *
 * Devuelve undefined si no puede hallar un número plausible.
 */
const SPELLED_NUMBERS_ES: Record<string, number> = {
  cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14,
  quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100,
  doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
  mil: 1000,
};

export function parseAmountFromText(text: string): number | undefined {
  const cleaned = normalize(text)
    // "350.00" y "1,500.00" — asumimos puntuación latina: coma = miles
    // solo si tiene 3 dígitos detrás; si no, es decimal. Lo simplificamos:
    // quitar comas que funcionen como miles.
    .replace(/(\d),(\d{3}(\D|$))/g, "$1$2");

  // Busca "NUM con NUM" (p.ej. "250 con 50") — decimal explícito en voz.
  const conDecimal = cleaned.match(/(\d+)\s+con\s+(\d{1,2})\b/);
  if (conDecimal) {
    const whole = Number.parseInt(conDecimal[1], 10);
    const dec = Number.parseInt(conDecimal[2], 10);
    if (Number.isFinite(whole) && Number.isFinite(dec)) {
      return whole + dec / 100;
    }
  }

  // Busca un número plano con decimales opcionales — toma el más grande
  // para evitar capturar "28" en "28 de abril" cuando hay un monto real
  // más abajo (p.ej. "gasté 250 el 28 de abril").
  const nums = [...cleaned.matchAll(/\b\d+(?:\.\d{1,2})?\b/g)]
    .map((m) => Number.parseFloat(m[0]))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length > 0) {
    return Math.max(...nums);
  }

  // Fallback: número en palabras (muy limitado — solo suma de tokens
  // conocidos, sin gramática). Funciona razonable para dictados tipo
  // "trescientos cincuenta", "mil quinientos".
  const tokens = cleaned.split(/\s+/);
  let total = 0;
  let buffer = 0;
  let found = false;
  for (const t of tokens) {
    const n = SPELLED_NUMBERS_ES[t];
    if (n === undefined) {
      if (buffer > 0) {
        total += buffer;
        buffer = 0;
      }
      continue;
    }
    found = true;
    if (n === 1000) {
      // "dos mil" → buffer * 1000; "mil quinientos" → 1000 + ...
      buffer = (buffer === 0 ? 1 : buffer) * 1000;
      total += buffer;
      buffer = 0;
    } else if (n === 100 || n === 200 || n === 300 || n === 400 || n === 500 || n === 600 || n === 700 || n === 800 || n === 900) {
      buffer += n;
    } else {
      buffer += n;
    }
  }
  if (buffer > 0) total += buffer;
  return found ? total : undefined;
}

/** Clasifica el texto como ingreso si contiene palabras como "cobré",
 *  "me pagaron", "ingreso"; si no, asumimos gasto (el caso común). */
const INCOME_HINTS = [
  "ingreso", "cobre", "cobré", "me pagaron", "pagaron", "deposito",
  "depósito", "sueldo", "quincena", "nomina", "nómina", "recibi",
  "recibí", "vendi", "vendí", "venta", "salario", "aguinaldo", "bono",
];

export function inferTransactionKind(
  text: string
): "income" | "expense" {
  const n = normalize(text);
  return INCOME_HINTS.some((h) => n.includes(normalize(h)))
    ? "income"
    : "expense";
}

/**
 * Encuentra la mejor categoría para un texto dado. Primero filtra por
 * `kind` (ingreso/gasto) y luego busca matches de keywords. Si hay
 * empate, gana la categoría con más keywords matcheados; en último
 * empate, la que tiene menor `position` (prioridad manual).
 *
 * Retorna `null` si ninguna hace match — el caller decide qué default
 * usar.
 */
export function detectCategoryFromText(
  text: string,
  kind: "income" | "expense",
  categories: FinanceCategory[]
): FinanceCategory | null {
  const n = " " + normalize(text) + " ";
  let best: FinanceCategory | null = null;
  let bestHits = 0;
  for (const c of categories) {
    if (c.kind !== kind) continue;
    let hits = 0;
    for (const kw of c.keywords) {
      const nk = normalize(kw);
      if (nk.length < 3) continue;
      if (n.includes(" " + nk + " ") || n.includes(" " + nk)) hits += 1;
    }
    if (hits > bestHits || (hits === bestHits && hits > 0 && best && c.position < best.position)) {
      if (hits > 0) {
        best = c;
        bestHits = hits;
      }
    }
  }
  return best;
}

export type VoiceParseResult = {
  amount: number | undefined;
  kind: "income" | "expense";
  category: FinanceCategory | null;
  note: string;
};

/** Parseo completo de texto dictado. Devuelve todo lo que podamos
 *  extraer — el caller se encarga de decidir si abre el modal o pide
 *  confirmación. */
export function parseVoiceTransaction(
  text: string,
  categories: FinanceCategory[]
): VoiceParseResult {
  const kind = inferTransactionKind(text);
  const amount = parseAmountFromText(text);
  const category = detectCategoryFromText(text, kind, categories);
  return { amount, kind, category, note: text.trim() };
}

// ─────────────────────────────────────────────────────────────
// ESTADÍSTICAS DEL MES
// ─────────────────────────────────────────────────────────────

export type MonthStats = {
  income: number;
  expense: number;
  net: number;
  /** Monto por categoría para pie/bar charts (solo gastos). */
  expenseByCategory: { categoryId: string | null; amount: number }[];
  /** Cantidad de movimientos registrados. */
  count: number;
  /** Suma por día (YYYY-MM-DD → { income, expense }). */
  byDay: Record<string, { income: number; expense: number }>;
};

export function computeMonthStats(
  transactions: FinanceTransaction[]
): MonthStats {
  let income = 0;
  let expense = 0;
  const byCat = new Map<string | null, number>();
  const byDay: Record<string, { income: number; expense: number }> = {};
  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    if (tx.kind === "income") income += amt;
    else expense += amt;

    if (tx.kind === "expense") {
      byCat.set(tx.category_id, (byCat.get(tx.category_id) ?? 0) + amt);
    }

    const day = tx.occurred_on;
    if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };
    if (tx.kind === "income") byDay[day].income += amt;
    else byDay[day].expense += amt;
  }
  const expenseByCategory = [...byCat.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
  return {
    income,
    expense,
    net: income - expense,
    expenseByCategory,
    count: transactions.length,
    byDay,
  };
}

// ─────────────────────────────────────────────────────────────
// ESTRATEGIA DE PAGO DE DEUDAS
// ─────────────────────────────────────────────────────────────

export type DebtStrategy = "avalanche" | "snowball";

export type DebtPlanStep = {
  month: number; // 1-based
  paid: number;  // pago total ese mes
  balances: Record<string, number>; // balance al final del mes por deuda
  /** IDs de deudas liquidadas exactamente ese mes. */
  cleared: string[];
};

export type DebtPlan = {
  strategy: DebtStrategy;
  monthlyBudget: number;
  months: DebtPlanStep[];
  totalInterest: number;
  totalPaid: number;
  payoffMonths: number;
  /** Orden en que las deudas se van liquidando (ids). */
  order: string[];
  /** Si budget < suma de mínimos. */
  feasible: boolean;
  minimumTotal: number;
};

/**
 * Simula mes a mes la amortización. Aplica mínimos a todas las deudas
 * activas y destina el remanente a la "deuda objetivo" según la
 * estrategia:
 *   - avalanche: mayor APR primero (óptimo matemático)
 *   - snowball : menor balance primero (óptimo psicológico)
 *
 * Supuestos:
 *   - APR ya expresado como 18.5 para 18.5% anual → mensual = /1200.
 *   - No hay nuevos cargos (la deuda es una foto estática).
 *   - Corta a 600 meses (50 años) como guardia.
 */
export function buildDebtPlan(
  debts: FinanceDebt[],
  monthlyBudget: number,
  strategy: DebtStrategy
): DebtPlan {
  const active = debts
    .filter((d) => !d.is_paid && Number(d.balance) > 0)
    .map((d) => ({
      id: d.id,
      balance: Number(d.balance),
      min: Number(d.minimum_payment) || 0,
      apr: Math.max(0, Number(d.apr) || 0),
    }));
  const minimumTotal = active.reduce((s, d) => s + d.min, 0);
  const plan: DebtPlanStep[] = [];
  let month = 0;
  const order: string[] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  if (active.length === 0) {
    return {
      strategy,
      monthlyBudget,
      months: [],
      totalInterest: 0,
      totalPaid: 0,
      payoffMonths: 0,
      order: [],
      feasible: true,
      minimumTotal: 0,
    };
  }

  // Si el budget no cubre los mínimos, el plan no es realista — aun así
  // devolvemos una simulación "amortizando lo que se pueda" para que
  // la UI muestre algo, pero marcamos feasible=false.
  const effectiveBudget = Math.max(monthlyBudget, minimumTotal);
  const feasible = monthlyBudget >= minimumTotal;

  while (active.some((d) => d.balance > 0.01) && month < 600) {
    month += 1;

    // 1. Aplica interés mensual a cada deuda activa.
    for (const d of active) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.balance += interest;
      totalInterest += interest;
    }

    // 2. Paga mínimos a todas las activas.
    let remaining = effectiveBudget;
    for (const d of active) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.min, d.balance, remaining);
      d.balance -= pay;
      remaining -= pay;
      totalPaid += pay;
      if (remaining <= 0) break;
    }

    // 3. Dirige el extra a la deuda "objetivo".
    if (remaining > 0.01) {
      const pool = active.filter((d) => d.balance > 0.01);
      if (pool.length > 0) {
        const target =
          strategy === "avalanche"
            ? [...pool].sort((a, b) => b.apr - a.apr || a.balance - b.balance)[0]
            : [...pool].sort((a, b) => a.balance - b.balance || b.apr - a.apr)[0];
        const pay = Math.min(target.balance, remaining);
        target.balance -= pay;
        totalPaid += pay;
        remaining -= pay;
      }
    }

    const cleared: string[] = [];
    for (const d of active) {
      if (d.balance > 0 && d.balance <= 0.01) d.balance = 0;
      if (d.balance === 0 && !order.includes(d.id)) {
        order.push(d.id);
        cleared.push(d.id);
      }
    }

    plan.push({
      month,
      paid: effectiveBudget - remaining,
      balances: Object.fromEntries(active.map((d) => [d.id, Math.max(0, d.balance)])),
      cleared,
    });
  }

  return {
    strategy,
    monthlyBudget,
    months: plan,
    totalInterest,
    totalPaid,
    payoffMonths: month,
    order,
    feasible,
    minimumTotal,
  };
}

// ─────────────────────────────────────────────────────────────
// UTILIDAD DE TARJETA
// ─────────────────────────────────────────────────────────────

export function cardUtilization(currentBalance: number, creditLimit: number): number {
  if (!creditLimit || creditLimit <= 0) return 0;
  return Math.max(0, Math.min(1, currentBalance / creditLimit));
}

/** Color semántico para la utilization:
 *  - verde  <30%  (sano)
 *  - amarillo <60% (medio)
 *  - rojo    >=60% (alto, daña score)
 */
export function utilizationLevel(u: number): "healthy" | "warning" | "danger" {
  if (u < 0.3) return "healthy";
  if (u < 0.6) return "warning";
  return "danger";
}

// ─────────────────────────────────────────────────────────────
// FECHAS / RANGOS
// ─────────────────────────────────────────────────────────────

/** Devuelve el primer y último día del mes de `ref` en YYYY-MM-DD (zona local). */
export function monthBounds(ref: Date = new Date()): { from: string; to: string } {
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Devuelve el próximo día `due` (1-31) desde `from` (sin alterar from).
 *  Si el mes no tiene ese día (ej. 31 en febrero), cae al último día del mes. */
export function nextDueDate(dueDay: number, from: Date = new Date()): Date {
  const y = from.getFullYear();
  const m = from.getMonth();
  const lastDayThisMonth = new Date(y, m + 1, 0).getDate();
  const thisMonthDay = Math.min(dueDay, lastDayThisMonth);
  const candidate = new Date(y, m, thisMonthDay);
  if (candidate >= new Date(y, m, from.getDate())) return candidate;
  const lastDayNextMonth = new Date(y, m + 2, 0).getDate();
  return new Date(y, m + 1, Math.min(dueDay, lastDayNextMonth));
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
