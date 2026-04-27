/**
 * Extrae mensaje legible de cualquier shape de error.
 *
 * Supabase tira PostgrestError — un plain object con shape:
 *   { message, details, hint, code }
 * que NO es instancia de Error. Nuestro código antiguo hacía
 * `err instanceof Error ? err.message : undefined` y se quedaba
 * sin description (toast vacío) o mostraba "[object Object]" cuando
 * lo casteaba con String(err).
 *
 * Esta función cubre: Error real, string, PostgrestError,
 * objetos con .message, y caso último JSON.stringify.
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const obj = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [obj.message, obj.details, obj.hint].filter(
      (p): p is string => Boolean(p)
    );
    const code = obj.code ? ` (${obj.code})` : "";
    if (parts.length > 0) return parts.join(" — ") + code;
    try {
      return JSON.stringify(err);
    } catch {
      return "Error desconocido";
    }
  }
  return String(err);
}
