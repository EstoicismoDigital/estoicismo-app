import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServer } from "../../../../lib/supabase-server";
import {
  PEGASSO_MODELS,
  PEGASSO_DEFAULT_MODEL,
  type PegassoModelKey,
} from "../../../../lib/pegasso/system-prompt";
import {
  buildPersonaPrompt,
  PEGASSO_DEFAULT_PERSONA,
  type PegassoPersonaId,
} from "../../../../lib/pegasso/personas";
import { fetchMessages, createMessage } from "@estoicismo/supabase";
import {
  getAnthropicTools,
  findTool,
} from "../../../../lib/pegasso/tools";

/**
 * POST /api/pegasso/chat
 *
 * Body: { conversation_id: string, model?: PegassoModelKey }
 *
 * Lee TODOS los mensajes de la conversación, los pasa a Anthropic
 * con tools de lectura habilitados, y devuelve un stream SSE.
 *
 * Tool use loop:
 *  1. Mandamos el historial a Claude con tools.
 *  2. Si Claude pide tools, las ejecutamos server-side y enviamos
 *     status events al cliente ("consultando finanzas…").
 *  3. Mandamos los resultados de vuelta a Claude.
 *  4. Streameamos su respuesta final al cliente.
 *  5. Persistimos el mensaje completo cuando termina.
 *
 * Eventos SSE:
 *   { type: "status", value: string }   — actividad de tool
 *   { type: "text", value: string }     — chunk de respuesta final
 *   { type: "done", message_id, ... }
 *   { type: "error", message }
 */
export const runtime = "nodejs";

const MAX_TOOL_ITERATIONS = 5;

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

  let body: {
    conversation_id?: string;
    model?: PegassoModelKey;
    persona?: PegassoPersonaId;
  };
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
  const persona: PegassoPersonaId = body.persona ?? PEGASSO_DEFAULT_PERSONA;
  const systemPrompt = buildPersonaPrompt(persona);

  const sb = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

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

  // Mensajes en formato Anthropic. content puede ser string o blocks (cuando
  // hay tool_use/tool_result en el historial multi-turno de esta request).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic({ apiKey });
  const anthropicTools = getAnthropicTools();

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
        // Tool-use loop. Cada iteración:
        //  - Llama a Claude
        //  - Si pide tools: ejecuta y reagrupa en el siguiente mensaje
        //  - Si stop_reason="end_turn": streamea texto y termina
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          // Para iteraciones intermedias (con tool calls): no streameamos
          // texto al cliente, solo capturamos. La última iteración (sin
          // tool_use) sí streamea.
          //
          // Estrategia simple: siempre llamada non-streaming, y al final
          // emitimos el texto en chunks de ~30 chars para sensación de
          // streaming sin la complejidad de manejar tool_use mid-stream.
          const response = await client.messages.create({
            model: modelId,
            max_tokens: 1024,
            system: systemPrompt,
            tools: anthropicTools,
            messages,
          });

          inputTokens += response.usage.input_tokens;
          outputTokens += response.usage.output_tokens;

          // Si hay tool_use blocks, ejecutarlos
          const toolUseBlocks = response.content.filter(
            (b) => b.type === "tool_use"
          ) as Array<{
            type: "tool_use";
            id: string;
            name: string;
            input: unknown;
          }>;

          if (toolUseBlocks.length > 0 && response.stop_reason === "tool_use") {
            // Ejecutar todos los tools en paralelo
            const results = await Promise.all(
              toolUseBlocks.map(async (block) => {
                const tool = findTool(block.name);
                if (!tool) {
                  return {
                    tool_use_id: block.id,
                    is_error: true,
                    content: `Tool desconocida: ${block.name}`,
                  };
                }
                send({ type: "status", value: tool.statusLabel });
                try {
                  const result = await tool.execute(sb, user.id, block.input);
                  return {
                    tool_use_id: block.id,
                    content: JSON.stringify(result),
                  };
                } catch (err) {
                  return {
                    tool_use_id: block.id,
                    is_error: true,
                    content: err instanceof Error ? err.message : "Error",
                  };
                }
              })
            );

            // Append assistant message + tool results al historial
            messages.push({ role: "assistant", content: response.content });
            messages.push({
              role: "user",
              content: results.map((r) => ({
                type: "tool_result" as const,
                tool_use_id: r.tool_use_id,
                content: r.content,
                ...(r.is_error ? { is_error: true } : {}),
              })),
            });
            // Continúa el loop — Claude verá los resultados y responderá
            continue;
          }

          // No más tools. Extraer texto final y "streamearlo" al cliente
          // en chunks (efecto de typing) para mantener UX de stream.
          const textBlocks = response.content.filter(
            (b) => b.type === "text"
          ) as Array<{ type: "text"; text: string }>;
          const finalText = textBlocks.map((b) => b.text).join("\n\n");
          fullText = finalText;

          // Chunk a ~30 chars o por palabra
          await chunkAndSend(finalText, send);
          break;
        }
      } catch (err) {
        errored = true;
        const message = err instanceof Error ? err.message : String(err);
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
          /* swallow */
        }
        send({ type: "error", message });
      }

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

/**
 * Manda el texto al cliente en chunks pequeños con un pequeño delay
 * para dar sensación de streaming. Total ~ texto.length / 30 ms.
 */
async function chunkAndSend(
  text: string,
  send: (p: Record<string, unknown>) => void
) {
  if (!text) return;
  // Split por palabras manteniendo whitespace
  const tokens = text.split(/(\s+)/);
  let buffer = "";
  for (const tok of tokens) {
    buffer += tok;
    if (buffer.length >= 25) {
      send({ type: "text", value: buffer });
      buffer = "";
      // Pequeño breath para que el browser pueda renderizar entre chunks
      await new Promise((r) => setTimeout(r, 15));
    }
  }
  if (buffer) send({ type: "text", value: buffer });
}
