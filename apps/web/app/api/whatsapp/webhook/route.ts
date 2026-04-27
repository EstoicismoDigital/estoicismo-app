import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  PEGASSO_MODELS,
  PEGASSO_DEFAULT_MODEL,
} from "../../../../lib/pegasso/system-prompt";
import { buildPersonaPrompt } from "../../../../lib/pegasso/personas";
import {
  getAnthropicTools,
  findTool,
} from "../../../../lib/pegasso/tools";
import {
  fetchMessages,
  createMessage,
  createConversation,
} from "@estoicismo/supabase";
import {
  getTwilioConfig,
  normalizeWhatsappNumber,
  sendWhatsappMessage,
} from "../../../../lib/whatsapp/twilio";

/**
 * POST /api/whatsapp/webhook
 *
 * Recibe mensajes entrantes de WhatsApp via Twilio. Twilio envía
 * application/x-www-form-urlencoded con campos como:
 *   From=whatsapp:+525512345678
 *   Body=hola
 *   ProfileName=Juan
 *
 * Flow:
 *   1. Validar que Twilio está configurado (env vars).
 *   2. Identificar al user por su phone_e164.
 *   3. Si no existe / no tiene whatsapp_enabled: ignorar con respuesta
 *      amable explicando cómo conectar.
 *   4. Buscar (o crear) la conversación con channel='whatsapp'.
 *   5. Persistir el mensaje del user.
 *   6. Llamar a Pegasso (mismo pipeline que el chat web, con tools).
 *   7. Mandar la respuesta de Pegasso por WhatsApp via Twilio.
 *   8. Persistir la respuesta de Pegasso.
 *
 * NOTA: Este endpoint NO autentica con session — autentica por phone.
 * Por eso usa el service-role client (bypass RLS) para ver todos los
 * profiles. Mantenerlo simple y auditado.
 */
export const runtime = "nodejs";

const MAX_TOOL_ITERATIONS = 5;

export async function POST(req: NextRequest) {
  // Validar config Twilio antes que nada
  const twilio = getTwilioConfig();
  if (!twilio) {
    // eslint-disable-next-line no-console
    console.error("Twilio no configurado — webhook no procesará mensajes.");
    return new NextResponse("Twilio not configured", { status: 503 });
  }

  // Validar Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new NextResponse("Anthropic not configured", { status: 503 });
  }

  // Validar Supabase service role (necesario para resolver user por phone)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return new NextResponse("Supabase service role not configured", {
      status: 503,
    });
  }

  // Twilio sends form-urlencoded
  const formData = await req.formData();
  const from = formData.get("From")?.toString() ?? "";
  const body = formData.get("Body")?.toString().trim() ?? "";

  if (!from || !body) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const phone = normalizeWhatsappNumber(from);
  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 1. Buscar user por phone
  const { data: profile } = await sb
    .from("profiles")
    .select("id, whatsapp_enabled")
    .eq("phone_e164", phone)
    .maybeSingle();

  if (!profile) {
    await sendWhatsappMessage(
      twilio,
      phone,
      "Hola 👋 Soy Pegasso de Estoicismo Digital. No reconozco tu número. Ve a tu app → /ajustes → WhatsApp y conecta este número para que pueda registrarte mensajes."
    );
    return twilioOk();
  }

  const userId = (profile as { id: string; whatsapp_enabled: boolean }).id;
  const enabled = (profile as { whatsapp_enabled: boolean }).whatsapp_enabled;

  if (!enabled) {
    await sendWhatsappMessage(
      twilio,
      phone,
      "Tu integración con WhatsApp está pausada. Actívala en /ajustes → WhatsApp."
    );
    return twilioOk();
  }

  // 2. Buscar conversación whatsapp activa, o crear
  const { data: convs } = await sb
    .from("pegasso_conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("channel", "whatsapp")
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false })
    .limit(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conversationId: string;
  const existing = (convs ?? []) as Array<{ id: string }>;
  if (existing.length > 0) {
    conversationId = existing[0].id;
  } else {
    const created = await createConversation(sb, userId, {
      title: "WhatsApp",
      channel: "whatsapp",
    });
    conversationId = created.id;
  }

  // 3. Persistir mensaje del user
  await createMessage(sb, userId, {
    conversation_id: conversationId,
    role: "user",
    content: body,
  });

  // 4. Cargar historial completo y procesar con Pegasso (con tools)
  let history;
  try {
    history = await fetchMessages(sb, conversationId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error cargando historial whatsapp:", err);
    await sendWhatsappMessage(
      twilio,
      phone,
      "No pude leer tu conversación. Inténtalo de nuevo."
    );
    return twilioOk();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic({ apiKey: anthropicKey });
  const tools = getAnthropicTools();
  const systemPrompt = buildPersonaPrompt("estoico");
  const modelId = PEGASSO_MODELS[PEGASSO_DEFAULT_MODEL];

  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestedActions: any[] = [];

  try {
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await client.messages.create({
        model: modelId,
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      });
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;

      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      ) as Array<{
        type: "tool_use";
        id: string;
        name: string;
        input: unknown;
      }>;

      if (toolUseBlocks.length > 0 && response.stop_reason === "tool_use") {
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
            try {
              const result = await tool.execute(sb, userId, block.input);
              if (
                result &&
                typeof result === "object" &&
                "__suggested_action" in result
              ) {
                const action = (result as { __suggested_action: unknown })
                  .__suggested_action;
                suggestedActions.push(action);
                return {
                  tool_use_id: block.id,
                  content: JSON.stringify({
                    ok: true,
                    message:
                      "Action card preparada. La verá el user en la app web.",
                  }),
                };
              }
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
        continue;
      }

      const textBlocks = response.content.filter(
        (b) => b.type === "text"
      ) as Array<{ type: "text"; text: string }>;
      fullText = textBlocks.map((b) => b.text).join("\n\n");
      break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error procesando con Pegasso (whatsapp):", err);
    fullText =
      "Tuve un problema procesando tu mensaje. Inténtalo de nuevo en un rato.";
  }

  // 5. Persistir respuesta de Pegasso (con metadata si hubo actions)
  let savedMessageId: string | null = null;
  try {
    const saved = await createMessage(sb, userId, {
      conversation_id: conversationId,
      role: "assistant",
      content: fullText,
      model: modelId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      metadata:
        suggestedActions.length > 0
          ? { suggested_actions: suggestedActions }
          : null,
    });
    savedMessageId = saved.id;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error guardando respuesta whatsapp:", err);
  }

  // 6. Mandar la respuesta por WhatsApp
  // Si hay suggested actions, agregamos un hint para abrir la app y confirmar.
  let outBody = fullText;
  if (suggestedActions.length > 0) {
    outBody +=
      "\n\n📲 Te dejé " +
      (suggestedActions.length === 1 ? "una acción" : `${suggestedActions.length} acciones`) +
      " pendiente" +
      (suggestedActions.length === 1 ? "" : "s") +
      " de confirmar en la app.";
  }

  try {
    await sendWhatsappMessage(twilio, phone, outBody);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error enviando respuesta whatsapp:", err);
    // No fallar el webhook — Pegasso ya guardó el mensaje
  }

  // Tracking simple (no es PII): conversationId, message saved
  // eslint-disable-next-line no-console
  console.log("whatsapp ok:", { conversationId, savedMessageId });

  return twilioOk();
}

/**
 * Twilio espera 200 con TwiML vacío (XML). Si devolvemos 200 sin
 * cuerpo el dashboard marca warning pero todo funciona.
 */
function twilioOk(): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    }
  );
}
