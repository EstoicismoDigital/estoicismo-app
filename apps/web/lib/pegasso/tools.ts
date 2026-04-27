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
  /** Ejecutor server-side. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (sb: SB, userId: string, input: any) => Promise<unknown>;
};

export const PEGASSO_TOOLS: ToolDefinition[] = [
  {
    name: "get_finances_summary",
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
    description:
      "Estado de TODOS los hábitos del user: cuáles llevan racha activa, cuántos completó hoy, cuántos esta semana, total semanal posible. Úsalo para preguntas sobre disciplina, rachas, hábitos olvidados, mejor hábito, etc.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "consultando hábitos…",
    execute: (sb, userId) => getHabitsStatus(sb, userId),
  },
  {
    name: "get_mpd",
    description:
      "Trae el MPD (Meta/Propósito Mayor Definido) del user — su declaración de propósito según el método de Napoleón Hill. Incluye aim, lo que ofrece a cambio, deadline, plan, afirmación. Úsalo cuando el user mencione metas grandes, propósito, dirección, o quieras anclar tu respuesta en lo que él mismo escribió.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "leyendo tu MPD…",
    execute: (sb, userId) => getMpd(sb, userId),
  },
  {
    name: "get_recent_journals",
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
    description:
      "Estado de lectura: libro actual con páginas leídas, recientemente terminados, y count de en-progreso. Si el user tiene resumen del libro actual ('lo más importante que aprendí'), te lo paso. Úsalo para preguntas sobre lecturas, recomendaciones, qué viene leyendo, etc.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "consultando lecturas…",
    execute: (sb, userId) => getBooksStatus(sb, userId),
  },
  {
    name: "get_business_summary",
    description:
      "Si el user tiene negocio: clientes por status (lead/contactado/cliente/recurrente/perdido), productos activos, ventas de últimos 30 días, OKRs trimestrales activos. Si no tiene business_profile devuelve hasBusiness: false — no asumas que tiene negocio sin verificar.",
    input_schema: { type: "object", properties: {} },
    statusLabel: "consultando negocio…",
    execute: (sb, userId) => getBusinessSummary(sb, userId),
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
