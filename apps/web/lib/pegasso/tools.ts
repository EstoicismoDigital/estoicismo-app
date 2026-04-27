/**
 * Definiciones de tools para Pegasso (Claude Anthropic API).
 *
 * Cada tool tiene:
 *  - schema: descripción que se manda a Claude (input_schema en API)
 *  - executor: función server-side que ejecuta y devuelve el resultado
 *
 * Pegasso decide cuándo usar cada tool. Nuestro role es darle acceso
 * de lectura a los datos del user, y descripciones claras para que
 * sepa cuándo conviene usar cada una.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getFinancesSummary,
  getHabitsStatus,
  getMpd,
  getRecentJournals,
  getBooksStatus,
  getBusinessSummary,
} from "./context-readers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

export type ToolDefinition = {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input_schema: Record<string, any>;
  /** Lo que aparece en UI mientras se ejecuta. */
  statusLabel: string;
  /**
   * Tipo de tool:
   *   - "read"  → ejecuta y devuelve datos a Claude para que responda
   *   - "action" → genera una suggested action que el user confirma
   *     antes de ejecutarse
   */
  kind: "read" | "action";
  /**
   * Para tools "read": ejecutor server-side que devuelve datos.
   * Para tools "action": función que toma el input de Claude y devuelve
   * un SuggestedAction listo para guardarse en metadata. La acción NO
   * se ejecuta hasta que el user la confirme.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (sb: SB, userId: string, input: any) => Promise<unknown>;
};

/** Genera un ID temporal para una suggested action. */
function genActionId(): string {
  return `act_${Date.now()}_${Math.floor(Math.random() * 100_000)}`;
}

export const PEGASSO_TOOLS: ToolDefinition[] = [
  // ─── READ TOOLS ────────────────────────────────────────────
  {
    name: "get_finances_summary",
    kind: "read",
    description:
      "Resumen financiero del user para un periodo: ingresos, gastos, top 5 categorías de gasto, estado de presupuestos, patrimonio neto, y meses cubiertos por el fondo de emergencia. Úsalo cuando pregunten por su dinero, gastos, ahorros, presupuestos, o patrimonio.",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["this_month", "last_30d", "last_7d"],
          description: "Periodo a analizar. Default 'this_month'.",
        },
      },
    },
    statusLabel: "consultando finanzas…",
    execute: (sb, userId, input) =>
      getFinancesSummary(sb, userId, input ?? {}),
  },
  {
    name: "get_habits_status",
    kind: "read",
    description:
      "Estado de TODOS los hábitos del user: cuáles llevan racha activa, cuántos completó hoy, cuántos esta semana, total semanal posible. Úsalo para preguntas sobre disciplina, rachas, hábitos olvidados, mejor hábito, etc.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "consultando hábitos…",
    execute: (sb, userId) => getHabitsStatus(sb, userId),
  },
  {
    name: "get_mpd",
    kind: "read",
    description:
      "Trae el MPD (Meta/Propósito Mayor Definido) del user — su declaración de propósito según el método de Napoleón Hill. Incluye aim, lo que ofrece a cambio, deadline, plan, afirmación. Úsalo cuando el user mencione metas grandes, propósito, dirección, o quieras anclar tu respuesta en lo que él mismo escribió.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "leyendo tu MPD…",
    execute: (sb, userId) => getMpd(sb, userId),
  },
  {
    name: "get_recent_journals",
    kind: "read",
    description:
      "Trae las últimas entradas del diario del user (titulo, contenido recortado a 400 chars, mood, tags). Útil para preguntas como 'cómo me sentí esta semana', 'qué escribí sobre X', revisión vespertina, etc. Tag opcional para filtrar — por ejemplo 'evening-review' trae solo las revisiones nocturnas.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Default 10, máximo 30." },
        days: {
          type: "number",
          description: "Días hacia atrás para buscar. Default 30.",
        },
        tag: {
          type: "string",
          description: "Tag específico (ej. 'evening-review', 'gratitud').",
        },
      },
    },
    statusLabel: "leyendo tu diario…",
    execute: (sb, userId, input) => getRecentJournals(sb, userId, input ?? {}),
  },
  {
    name: "get_books_status",
    kind: "read",
    description:
      "Estado de lectura: libro actual con páginas leídas, recientemente terminados, y count de en-progreso. Si el user tiene resumen del libro actual ('lo más importante que aprendí'), te lo paso. Úsalo para preguntas sobre lecturas, recomendaciones, qué viene leyendo, etc.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "consultando lecturas…",
    execute: (sb, userId) => getBooksStatus(sb, userId),
  },
  {
    name: "get_business_summary",
    kind: "read",
    description:
      "Si el user tiene negocio: clientes por status (lead/contactado/cliente/recurrente/perdido), productos activos, ventas de últimos 30 días, OKRs trimestrales activos. Si no tiene business_profile devuelve hasBusiness: false — no asumas que tiene negocio sin verificar.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "consultando negocio…",
    execute: (sb, userId) => getBusinessSummary(sb, userId),
  },

  // ─── ACTION TOOLS (suggested, requires user confirmation) ───
  {
    name: "create_transaction",
    kind: "action",
    description:
      "Sugiere crear una transacción financiera (ingreso o gasto). NO se ejecuta automáticamente — el user verá una card con [Confirmar] / [Cancelar]. Úsalo cuando el user mencione un gasto o ingreso concreto, ej. 'pagué $500 a María', 'cobré 2000 del cliente X'. Sé conservador con la categoría — si no es obvia, déjala en blanco y deja que el user la asigne.",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Monto positivo." },
        kind: {
          type: "string",
          enum: ["income", "expense"],
          description: "Tipo: income (ingreso) o expense (gasto).",
        },
        note: {
          type: "string",
          description:
            "Descripción corta. Ej: 'Café con Sofía', 'Pago a María - sesión'.",
        },
        category_name: {
          type: "string",
          description:
            "Nombre de categoría sugerida (ej. 'Comida', 'Cliente'). El user podrá confirmar o cambiar.",
        },
        occurred_on: {
          type: "string",
          description:
            "Fecha YYYY-MM-DD. Default hoy si no se especifica. Soporta 'ayer'.",
        },
      },
      required: ["amount", "kind"],
    },
    statusLabel: "preparando transacción…",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async (_sb, _userId, input: any) => {
      const action = {
        id: genActionId(),
        kind: "create_transaction" as const,
        summary: `${input.kind === "income" ? "Ingreso" : "Gasto"} · ${
          input.note ?? input.category_name ?? "Sin nota"
        } · ${input.kind === "income" ? "+" : "-"}$${Number(input.amount).toFixed(2)}`,
        payload: {
          amount: Number(input.amount),
          kind: input.kind,
          note: input.note ?? null,
          category_name: input.category_name ?? null,
          occurred_on: input.occurred_on ?? null,
        },
        status: "pending" as const,
      };
      // Devolvemos el action a Claude (lo verá como tool_result) Y al
      // route handler para guardarlo en metadata del próximo mensaje.
      return { __suggested_action: action };
    },
  },
  {
    name: "create_habit",
    kind: "action",
    description:
      "Sugiere crear un nuevo hábito. NO se crea hasta que el user confirma. Úsalo cuando el user diga 'quiero empezar a meditar todos los días', 'agrega ejercicio a mis hábitos', etc. Si la frecuencia no es obvia, asume daily.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre corto del hábito." },
        frequency: {
          type: "string",
          enum: ["daily", "weekly", "weekly-by-days"],
          description: "Default 'daily'.",
        },
        why: {
          type: "string",
          description:
            "Razón breve por la que lo hace (motivación). Opcional pero ayuda.",
        },
      },
      required: ["name"],
    },
    statusLabel: "preparando hábito…",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async (_sb, _userId, input: any) => {
      const action = {
        id: genActionId(),
        kind: "create_habit" as const,
        summary: `Hábito · ${input.name}${input.frequency && input.frequency !== "daily" ? ` (${input.frequency})` : ""}`,
        payload: {
          name: input.name,
          frequency: input.frequency ?? "daily",
          why: input.why ?? null,
        },
        status: "pending" as const,
      };
      return { __suggested_action: action };
    },
  },
  {
    name: "create_journal_entry",
    kind: "action",
    description:
      "Sugiere guardar una entrada en el diario del user. Úsalo cuando el user comparta una reflexión, lección, o quiera dejar registro de algo importante. NO uses esto para conversación regular — solo cuando dice algo digno de archivar (ej. 'hoy aprendí que…', 'voy a recordar esto', 'guarda esto').",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Contenido completo de la entrada (mínimo 1 frase).",
        },
        title: {
          type: "string",
          description: "Título corto opcional.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "Tags relevantes (ej. ['gratitud', 'lección', 'meditación']).",
        },
        mood: {
          type: "number",
          description: "Estado de ánimo 1-5 si el user lo expresó.",
        },
      },
      required: ["content"],
    },
    statusLabel: "preparando nota…",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async (_sb, _userId, input: any) => {
      const action = {
        id: genActionId(),
        kind: "create_journal_entry" as const,
        summary: `Nota · ${input.title ?? input.content.slice(0, 50) + "…"}`,
        payload: {
          content: input.content,
          title: input.title ?? null,
          tags: input.tags ?? [],
          mood: input.mood ?? null,
        },
        status: "pending" as const,
      };
      return { __suggested_action: action };
    },
  },
  {
    name: "create_business_idea",
    kind: "action",
    description:
      "Sugiere capturar una idea de negocio. Úsalo cuando el user comparta una idea de proyecto, servicio o producto que quiera explorar después. NO uses esto para preguntas casuales sobre negocio — solo cuando es algo que el user quiere capturar.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título corto de la idea.",
        },
        description: {
          type: "string",
          description: "Descripción breve de la idea (1-3 frases).",
        },
      },
      required: ["title"],
    },
    statusLabel: "preparando idea…",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async (_sb, _userId, input: any) => {
      const action = {
        id: genActionId(),
        kind: "create_business_idea" as const,
        summary: `Idea · ${input.title}`,
        payload: {
          title: input.title,
          description: input.description ?? null,
        },
        status: "pending" as const,
      };
      return { __suggested_action: action };
    },
  },
];

/** Convierte tools al formato que espera la API de Anthropic. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAnthropicTools(): any[] {
  return PEGASSO_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}

/** Encuentra una tool por nombre. */
export function findTool(name: string): ToolDefinition | undefined {
  return PEGASSO_TOOLS.find((t) => t.name === name);
}
