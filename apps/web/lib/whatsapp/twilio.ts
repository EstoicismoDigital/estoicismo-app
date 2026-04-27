/**
 * Cliente Twilio mínimo para WhatsApp.
 *
 * No usamos el SDK oficial — un POST a su REST API basta. Reduce
 * el bundle (~1MB del SDK no entra) y nos mantiene flexibles si
 * cambiamos a Meta Cloud API o Whapi después.
 *
 * Variables de entorno requeridas:
 *   - TWILIO_ACCOUNT_SID
 *   - TWILIO_AUTH_TOKEN
 *   - TWILIO_WHATSAPP_FROM   (ej. "whatsapp:+14155238886" — sandbox)
 */

const BASE_URL = "https://api.twilio.com/2010-04-01";

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  /** Número de origen en formato whatsapp:+NNN... */
  from: string;
};

export function getTwilioConfig(): TwilioConfig | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return null;
  return { accountSid: sid, authToken: token, from };
}

/**
 * Manda un mensaje WhatsApp via Twilio. `to` debe estar en E.164
 * (ej. "+525512345678") — la función agrega el prefijo "whatsapp:".
 */
export async function sendWhatsappMessage(
  config: TwilioConfig,
  to: string,
  body: string
): Promise<{ sid: string }> {
  const url = `${BASE_URL}/Accounts/${config.accountSid}/Messages.json`;
  const credentials = btoa(`${config.accountSid}:${config.authToken}`);
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const params = new URLSearchParams({
    From: config.from,
    To: formattedTo,
    Body: body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Twilio API error ${res.status}: ${errText.slice(0, 200)}`
    );
  }
  const data = (await res.json()) as { sid: string };
  return { sid: data.sid };
}

/**
 * Normaliza un número de WhatsApp recibido por Twilio webhook al
 * formato E.164 que guardamos en profiles.phone_e164.
 *
 *   "whatsapp:+525512345678" → "+525512345678"
 */
export function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/^whatsapp:/, "").trim();
}
