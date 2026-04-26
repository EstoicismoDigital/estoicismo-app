import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServer } from "../../../../lib/supabase-server";
import {
  PEGASSO_SYSTEM_PROMPT,
  PEGASSO_MODELS,
  PEGASSO_DEFAULT_MODEL,
  type PegassoModelKey,
} from "../../../../lib/pegasso/system-prompt";
import { fetchMessages, createMessage } from "@estoicismo/supabase";

/**
 * POST /api/pegasso/chat
 *
 * Body: { conversation_id: string, model?: PegassoModelKey }
 *
 * Lee TODOS los mensajes de la conversación, los pasa a Anthropic,
 * y devuelve un stream SSE con el texto del assistant. Cuando termina,
 * persiste el mensaje completo en la DB con tokens.
 *
 * Convención del response: text/event-stream con 3 tipos de eventos:
 *   { type: "text", value: string } — chunk de texto
 *   { type: "done", message_id: string, output_tokens: number, input_tokens: number }
 *   { type: "error", message: string }
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY no configurada. Añádela en apps/web/.env.local y reinicia el dev server.",
      },
      { status: 503 }
    );
  }

  let body: { conversation_id?: string; model?: PegassoModelKey };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const conversationId = body.conversation_id;
  if (!conversationId || typeof conversationId !== "string") {
    return NextResponse.json(
      { error: "conversation_id requerido" },
      { status: 400 }
    );
  }

  const modelKey: PegassoModelKey = body.model ?? PEGASSO_DEFAULT_MODEL;
  const modelId = PEGASSO_MODELS[modelKey] ?? PEGASSO_MODELS[PEGASSO_DEFAULT_MODEL];

  // Auth: tomamos el user id del session de Supabase. Si falla, 401.
  const sb = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Cargamos los mensajes existentes de esta conversación. RLS ya
  // filtra por user; si la conv no es del user, viene vacío.
  let history;
  try {
    history = await fetchMessages(sb, conversationId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error cargando mensajes" },
      { status: 500 }
    );
  }
  if (history.length === 0) {
    return NextResponse.json(
      { error: "Conversación vacía. Envía primero un mensaje." },
      { status: 400 }
    );
  }

  const lastMessage = history[history.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json(
      {
        error:
          "El último mensaje debe ser del user (ya hay un assistant pendiente).",
      },
      { status: 400 }
    );
  }

  // Convertimos el historial al formato del SDK.
  const anthropicMessages = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic({ apiKey });

  // Stream SSE manual usando ReadableStream.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      let inputTokens = 0;
      let outputTokens = 0;
      let errored = false;

      function send(payload: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      }

      try {
        const messageStream = client.messages.stream({
          model: modelId,
          max_tokens: 1024,
          system: PEGASSO_SYSTEM_PROMPT,
          messages: anthropicMessages,
        });

        // Iterar text deltas
        for await (const event of messageStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            fullText += text;
            send({ type: "text", value: text });
          } else if (event.type === "message_delta" && event.usage) {
            outputTokens = event.usage.output_tokens ?? outputTokens;
          }
        }

        const final = await messageStream.finalMessage();
        inputTokens = final.usage.input_tokens;
        outputTokens = final.usage.output_tokens;
      } catch (err) {
        errored = true;
        const message = err instanceof Error ? err.message : String(err);
        // Persistimos el error como mensaje assistant para que el
        // historial quede consistente y el user lo vea.
        try {
          await createMessage(sb, user.id, {
            conversation_id: conversationId,
            role: "assistant",
            content: fullText || "(sin respuesta)",
            model: modelId,
            input_tokens: inputTokens || null,
            output_tokens: outputTokens || null,
            error: message,
          });
        } catch {
          /* ignoramos el error de persistencia para no enmascarar el original */
        }
        send({ type: "error", message });
      }

      // Persistimos el mensaje completo si no hubo error.
      if (!errored) {
        try {
          const saved = await createMessage(sb, user.id, {
            conversation_id: conversationId,
            role: "assistant",
            content: fullText,
            model: modelId,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            error: null,
          });
          send({
            type: "done",
            message_id: saved.id,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            model: modelId,
          });
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error
                ? err.message
                : "No se pudo guardar la respuesta",
          });
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
