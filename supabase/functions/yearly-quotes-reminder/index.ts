// yearly-quotes-reminder — Supabase Edge Function
//
// Envía un correo a contacto@estoicismodigital.com recordando actualizar
// los tres catálogos de 365 frases (hábitos, finanzas, consciencia) antes
// del 31 de diciembre. Se dispara automáticamente cada 30 de diciembre
// vía pg_cron + pg_net (ver migración `yearly_quotes_reminder_cron.sql`).
//
// Provider de email: Resend (transaccional, simple, sin setup DNS más
// allá del dominio). Requiere secret `RESEND_API_KEY` configurado en el
// proyecto (Dashboard → Edge Functions → Secrets).
//
// Para probar manualmente:
//   curl -X POST \
//     https://<project-ref>.supabase.co/functions/v1/yearly-quotes-reminder \
//     -H "Authorization: Bearer $SUPABASE_ANON_KEY"
//
// La función NO requiere auth de usuario — la invoca pg_cron con la
// service-role key almacenada en vault. El header de Authorization lo
// validamos en la migración, no aquí, para evitar acoplar la función al
// JWT del caller.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API = "https://api.resend.com/emails";
const TO = "contacto@estoicismodigital.com";
// Usamos el dominio verificado de Resend por defecto. Cambiar a
// `reminders@estoicismodigital.com` (u otro del dominio) cuando el
// registro SPF/DKIM esté activo en Resend.
const FROM = "Estoicismo Digital <onboarding@resend.dev>";

Deno.serve(async () => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return jsonError(500, "Missing RESEND_API_KEY secret");
  }

  const now = new Date();
  const nextYear = now.getFullYear() + 1;

  const subject = `⚠️ Actualiza las 365 frases para ${nextYear}`;
  const html = buildEmailHtml(nextYear);
  const text = buildEmailText(nextYear);

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error", res.status, body);
    return jsonError(res.status, `Resend responded ${res.status}: ${body}`);
  }

  const data = await res.json();
  return new Response(
    JSON.stringify({ ok: true, sent_to: TO, resend_id: data?.id ?? null }),
    { headers: { "Content-Type": "application/json" } }
  );
});

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────
// Email body builders
// ─────────────────────────────────────────────────────────────

function buildEmailText(nextYear: number): string {
  return [
    `Hola,`,
    ``,
    `Este es un recordatorio automático: faltan pocos días para ${nextYear}.`,
    `Es momento de actualizar los tres catálogos de 365 frases para el`,
    `próximo año. Si no los actualizas, la app seguirá mostrando las`,
    `mismas frases del año actual (los arrays rotan por día-del-año,`,
    `así que técnicamente no se rompe, pero la experiencia se repite).`,
    ``,
    `Archivos a actualizar antes del 31 de diciembre:`,
    ``,
    `  apps/web/lib/quotes/habits.ts    — 365 frases de hábitos`,
    `  apps/web/lib/quotes/finance.ts   — 365 frases financieras`,
    `  apps/web/lib/quotes/mindset.ts   — 365 frases de consciencia`,
    ``,
    `Estructura: cada archivo exporta un array de 365 objetos`,
    `{ text, author: string | null }. Mantén ese shape — el`,
    `componente <DailyQuoteCarousel /> lo lee directo.`,
    ``,
    `Después del deploy, la rotación del 1 de enero arrancará por el`,
    `índice 0 automáticamente.`,
    ``,
    `— Estoicismo Digital (recordatorio automático de pg_cron)`,
  ].join("\n");
}

function buildEmailHtml(nextYear: number): string {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5EFE0; padding: 24px; color: #0A0A0A;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #FAF7F0; border: 1px solid #D0CAC0; border-radius: 12px; padding: 28px;">
      <tr>
        <td>
          <p style="font-family: 'Courier New', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #B48A28; margin: 0 0 6px 0;">Estoicismo Digital · Recordatorio</p>
          <h1 style="font-family: Georgia, serif; font-style: italic; font-size: 28px; line-height: 1.2; color: #0A0A0A; margin: 0 0 16px 0;">
            Actualiza las 365 frases para ${nextYear}
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #0A0A0A; margin: 0 0 14px 0;">
            Faltan pocos días para que arranque el año nuevo. Es momento de
            refrescar los tres catálogos diarios de frases antes del 31 de
            diciembre.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #5E5E5E; margin: 0 0 18px 0;">
            Si no los actualizas, la app seguirá mostrando las mismas frases
            del año actual — técnicamente no se rompe nada (rotan por
            día-del-año), pero la experiencia se vuelve familiar.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-top: 1px solid #D0CAC0; border-bottom: 1px solid #D0CAC0;">
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #EEE9E1;">
              <code style="font-family: 'SF Mono', monospace; font-size: 13px; color: #B48A28;">apps/web/lib/quotes/habits.ts</code>
              <span style="color: #5E5E5E; font-size: 13px;"> · 365 frases de hábitos</span>
            </td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #EEE9E1;">
              <code style="font-family: 'SF Mono', monospace; font-size: 13px; color: #22774E;">apps/web/lib/quotes/finance.ts</code>
              <span style="color: #5E5E5E; font-size: 13px;"> · 365 frases financieras</span>
            </td></tr>
            <tr><td style="padding: 12px 0;">
              <code style="font-family: 'SF Mono', monospace; font-size: 13px; color: #B2443A;">apps/web/lib/quotes/mindset.ts</code>
              <span style="color: #5E5E5E; font-size: 13px;"> · 365 frases de consciencia</span>
            </td></tr>
          </table>

          <p style="font-size: 14px; line-height: 1.6; color: #0A0A0A; margin: 0 0 12px 0;">
            Cada archivo exporta un array de 365 objetos con shape
            <code style="background: #EEE9E1; padding: 2px 6px; border-radius: 4px; font-size: 12px;">{ text, author }</code>.
            Mantén ese shape — el carrusel lee directo.
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #5E5E5E; margin: 20px 0 0 0;">
            Después del deploy, la rotación del 1 de enero arranca por el
            índice 0 automáticamente.
          </p>

          <p style="font-family: 'Courier New', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #5E5E5E; margin: 28px 0 0 0; padding-top: 16px; border-top: 1px solid #D0CAC0;">
            Recordatorio automático · pg_cron · Estoicismo Digital
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
