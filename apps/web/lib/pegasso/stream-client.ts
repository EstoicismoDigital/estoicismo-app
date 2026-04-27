/**
 * Cliente SSE para el endpoint /api/pegasso/chat. Lee la respuesta
 * en streaming, parsea cada `data: ...` como JSON y dispara
 * callbacks del consumidor.
 *
 * Patrón: el caller maneja el state (texto acumulado, "isStreaming")
 * en su componente; aquí sólo emitimos eventos.
 */

export type StreamEvent =
  | { type: "text"; value: string }
  | { type: "done"; message_id: string; input_tokens: number; output_tokens: number; model: string }
  | { type: "error"; message: string };

export type StreamHandlers = {
  onText?: (chunk: string, fullText: string) => void;
  onDone?: (data: { message_id: string; input_tokens: number; output_tokens: number; model: string }) => void;
  onError?: (error: string) => void;
};

export async function streamPegassoChat(
  conversationId: string,
  handlers: StreamHandlers,
  opts: { model?: string; persona?: string; signal?: AbortSignal } = {}
): Promise<void> {
  const res = await fetch("/api/pegasso/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      model: opts.model,
      persona: opts.persona,
    }),
    signal: opts.signal,
  });

  // Si el server respondió con JSON de error (no SSE), parsearlo.
  if (
    !res.ok &&
    res.headers.get("content-type")?.includes("application/json")
  ) {
    const body = await res.json().catch(() => null);
    handlers.onError?.(body?.error ?? `HTTP ${res.status}`);
    return;
  }
  if (!res.body) {
    handlers.onError?.("No body en respuesta");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Cada evento SSE termina con \n\n. Procesamos completos.
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? ""; // último incompleto vuelve al buffer

      for (const ev of events) {
        const line = ev.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        const json = line.slice(6); // strip "data: "
        let parsed: StreamEvent | null = null;
        try {
          parsed = JSON.parse(json);
        } catch {
          continue;
        }
        if (!parsed) continue;

        if (parsed.type === "text") {
          fullText += parsed.value;
          handlers.onText?.(parsed.value, fullText);
        } else if (parsed.type === "done") {
          handlers.onDone?.({
            message_id: parsed.message_id,
            input_tokens: parsed.input_tokens,
            output_tokens: parsed.output_tokens,
            model: parsed.model,
          });
        } else if (parsed.type === "error") {
          handlers.onError?.(parsed.message);
        }
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // cancelado a propósito — no es error
      return;
    }
    handlers.onError?.(err instanceof Error ? err.message : String(err));
  }
}
