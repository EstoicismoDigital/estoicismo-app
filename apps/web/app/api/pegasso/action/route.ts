import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "../../../../lib/supabase-server";
import {
  createTransaction,
  createHabit,
  createJournalEntry,
  createIdea,
  fetchFinanceCategories,
  type SuggestedAction,
} from "@estoicismo/supabase";

/**
 * POST /api/pegasso/action
 *
 * Body: {
 *   message_id: string,    // pegasso_messages.id que contiene la action
 *   action_id: string,     // ID dentro del array de suggested_actions
 *   decision: "confirm" | "cancel"
 * }
 *
 * Si decision=confirm: ejecuta la action (crea el registro real),
 * actualiza la metadata del mensaje con status=confirmed + result_id.
 * Si decision=cancel: solo marca status=cancelled.
 *
 * RLS: el user solo puede modificar sus propios mensajes.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    message_id?: string;
    action_id?: string;
    decision?: "confirm" | "cancel";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { message_id, action_id, decision } = body;
  if (!message_id || !action_id || !decision) {
    return NextResponse.json(
      { error: "message_id, action_id y decision requeridos" },
      { status: 400 }
    );
  }
  if (decision !== "confirm" && decision !== "cancel") {
    return NextResponse.json(
      { error: "decision debe ser 'confirm' o 'cancel'" },
      { status: 400 }
    );
  }

  const sb = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Cargar el mensaje (RLS garantiza que es del user)
  const { data: messageRow, error: msgErr } = await sb
    .from("pegasso_messages")
    .select("*")
    .eq("id", message_id)
    .single();
  if (msgErr || !messageRow) {
    return NextResponse.json(
      { error: "Mensaje no encontrado" },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (messageRow as any).metadata ?? {};
  const actions: SuggestedAction[] = metadata.suggested_actions ?? [];
  const idx = actions.findIndex((a) => a.id === action_id);
  if (idx < 0) {
    return NextResponse.json(
      { error: "Action no encontrada en el mensaje" },
      { status: 404 }
    );
  }
  const action = actions[idx];
  if (action.status !== "pending") {
    return NextResponse.json(
      { error: `Action ya está ${action.status}` },
      { status: 400 }
    );
  }

  let resultId: string | undefined;

  if (decision === "confirm") {
    try {
      resultId = await executeAction(sb, user.id, action);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "No se pudo ejecutar la acción",
        },
        { status: 500 }
      );
    }
  }

  // Update status en metadata
  const updated = [...actions];
  updated[idx] = {
    ...action,
    status: decision === "confirm" ? "confirmed" : "cancelled",
    result_id: resultId ?? null,
    result_at: new Date().toISOString(),
  };
  const newMetadata = { ...metadata, suggested_actions: updated };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updErr = await (sb.from("pegasso_messages") as any)
    .update({ metadata: newMetadata })
    .eq("id", message_id)
    .then((r: { error: { message: string } | null }) => r.error);
  if (updErr) {
    return NextResponse.json(
      { error: "No se pudo actualizar la metadata: " + updErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    decision,
    result_id: resultId,
    action: updated[idx],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  userId: string,
  action: SuggestedAction
): Promise<string> {
  if (action.kind === "create_transaction") {
    const p = action.payload;
    // Mapear category_name a category_id si existe
    let categoryId: string | null = null;
    if (p.category_name) {
      const cats = await fetchFinanceCategories(sb);
      const match = cats.find(
        (c) => c.name.toLowerCase() === String(p.category_name).toLowerCase()
      );
      categoryId = match?.id ?? null;
    }
    // Resolver "ayer"
    let occurredOn = p.occurred_on;
    if (!occurredOn || occurredOn === "hoy") {
      occurredOn = todayIso();
    } else if (occurredOn === "ayer") {
      occurredOn = yesterdayIso();
    }
    const { data: profile } = await sb
      .from("profiles")
      .select("default_currency")
      .eq("id", userId)
      .single();
    const currency =
      (profile as { default_currency?: string } | null)?.default_currency ??
      "MXN";
    const created = await createTransaction(sb, userId, {
      amount: p.amount,
      kind: p.kind,
      category_id: categoryId,
      note: p.note,
      occurred_on: occurredOn,
      currency,
    });
    return created.id;
  }

  if (action.kind === "create_habit") {
    const p = action.payload;
    const created = await createHabit(sb, userId, {
      name: p.name,
      frequency: p.frequency ?? "daily",
      icon: "✦",
      color: "#22774E",
      reminder_time: null,
    });
    return created.id;
  }

  if (action.kind === "create_journal_entry") {
    const p = action.payload;
    const created = await createJournalEntry(sb, userId, {
      content: p.content,
      title: p.title ?? null,
      tags: p.tags ?? [],
      mood: p.mood ?? null,
    });
    return created.id;
  }

  if (action.kind === "create_business_idea") {
    const p = action.payload;
    const created = await createIdea(sb, userId, {
      title: p.title,
      description: p.description ?? null,
    });
    return created.id;
  }

  throw new Error(`Action kind desconocido: ${(action as { kind: string }).kind}`);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
