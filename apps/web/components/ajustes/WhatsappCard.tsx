"use client";
import { useEffect, useState } from "react";
import { MessageCircle, Check, X, Loader2, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useProfile } from "../../hooks/useProfile";
import { useUpdateProfile } from "../../hooks/useUpdateProfile";

/**
 * WhatsappCard · conecta el número de WhatsApp del user con Pegasso.
 *
 * Flow:
 *  1. User pega su número en formato internacional (ej. +525512345678)
 *  2. Lo guardamos en profiles.phone_e164 + ponemos whatsapp_enabled=true
 *  3. Le mostramos las instrucciones para mensajear el sandbox de Twilio
 *     (o el número en producción)
 *
 * NO verificamos por OTP por ahora — confiamos en que el user pone
 * su propio número, y Twilio ya valida que recibe del número correcto.
 */

function isValidE164(input: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(input.trim());
}

export function WhatsappCard() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) setDraft(profile.phone_e164 ?? "");
  }, [profile]);

  if (!profile) return null;

  const phone = profile.phone_e164;
  const enabled = profile.whatsapp_enabled;

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      // Borrar
      try {
        await update.mutateAsync({
          phone_e164: null,
          whatsapp_enabled: false,
        });
        setEditing(false);
      } catch {
        /* hook muestra error */
      }
      return;
    }
    if (!isValidE164(trimmed)) {
      toast.error("Formato inválido", {
        description:
          "Debe estar en E.164: empieza con + y código de país. Ej: +525512345678.",
      });
      return;
    }
    try {
      await update.mutateAsync({
        phone_e164: trimmed,
        whatsapp_enabled: true,
      });
      setEditing(false);
      toast.success("Número conectado", {
        description: "Ya puedes mandarle mensajes a Pegasso por WhatsApp.",
      });
    } catch {
      /* error toast */
    }
  }

  async function handleToggle() {
    try {
      await update.mutateAsync({ whatsapp_enabled: !enabled });
      toast.success(enabled ? "WhatsApp pausado" : "WhatsApp activado");
    } catch {
      /* error */
    }
  }

  return (
    <div className="rounded-card border border-line bg-bg p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={14} className="text-success" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-success">
          WhatsApp · Pegasso por chat
        </p>
        <span className="h-px flex-1 bg-line" />
        {phone && (
          <span
            className={clsx(
              "font-mono text-[10px] uppercase tracking-widest",
              enabled ? "text-success" : "text-muted"
            )}
          >
            {enabled ? "● Activo" : "○ Pausado"}
          </span>
        )}
      </div>

      <p className="font-body text-sm text-ink/85 leading-relaxed mb-1">
        Conecta tu número y manda mensajes a Pegasso por WhatsApp. Te
        registra transacciones, hábitos y notas — y conoce tus datos
        igual que en la web.
      </p>
      <p className="font-body text-xs text-muted leading-relaxed mb-4 italic">
        Ej: «pagué 250 en gasolina» → te llega card de confirmación en
        la app.
      </p>

      {/* Phone input / display */}
      {editing || !phone ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="tel"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="+525512345678"
            autoFocus
            className="flex-1 h-10 px-3 rounded-lg border border-line bg-bg-alt font-mono text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={update.isPending}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-bg disabled:opacity-40"
            aria-label="Guardar"
          >
            {update.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
          </button>
          {phone && (
            <button
              type="button"
              onClick={() => {
                setDraft(phone ?? "");
                setEditing(false);
              }}
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-line text-muted hover:bg-bg-alt"
              aria-label="Cancelar"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-bg-alt border border-line">
          <span className="font-mono text-sm text-ink flex-1">{phone}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={update.isPending}
            className={clsx(
              "font-mono text-[10px] uppercase tracking-widest disabled:opacity-40",
              enabled ? "text-danger hover:opacity-80" : "text-success hover:opacity-80"
            )}
          >
            {enabled ? "Pausar" : "Activar"}
          </button>
        </div>
      )}

      {/* Setup instructions */}
      {phone && enabled && (
        <details className="rounded-lg bg-bg-alt/40 border border-line/60 px-3 py-2">
          <summary className="font-mono text-[10px] uppercase tracking-widest text-muted cursor-pointer hover:text-ink">
            ¿Cómo lo uso?
          </summary>
          <div className="mt-3 space-y-2 font-body text-xs text-ink/80 leading-relaxed">
            <p>
              <strong>1.</strong> Si estás en sandbox de Twilio, primero
              úne tu número mandando el código que Twilio te dio (ej.{" "}
              <code className="font-mono text-[11px] bg-bg/40 px-1 rounded">
                join cosmos-orange
              </code>
              ) al número{" "}
              <code className="font-mono text-[11px] bg-bg/40 px-1 rounded">
                +1 415 523 8886
              </code>
              .
            </p>
            <p>
              <strong>2.</strong> Después manda lo que quieras registrar
              en lenguaje natural:
            </p>
            <ul className="ml-4 space-y-1 text-muted">
              <li>· «pagué 350 en sushi»</li>
              <li>· «cobré 5000 del cliente»</li>
              <li>· «agrega meditación a mis hábitos»</li>
              <li>· «¿cómo voy con el budget?»</li>
              <li>· «guarda esto: hoy aprendí que…»</li>
            </ul>
            <p>
              <strong>3.</strong> Pegasso te responde y, si propone
              crear algo, vienes a la app y lo confirmas con un click.
            </p>
            <a
              href="https://www.twilio.com/console/sms/whatsapp/sandbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline mt-2"
            >
              Twilio Sandbox <ExternalLink size={10} />
            </a>
          </div>
        </details>
      )}
    </div>
  );
}
