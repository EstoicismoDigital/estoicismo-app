"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  ListChecks,
  Wallet,
  Brain,
  Briefcase,
  Sparkles,
  BookOpen,
  Pencil,
  Plus,
  Calendar,
  CreditCard,
  Repeat,
  PiggyBank,
  Target,
  Trophy,
  Mail,
  Pin,
  HeartPulse,
  Compass,
  Dumbbell,
  Library,
  Receipt,
  Wind,
  X,
} from "lucide-react";
import { clsx } from "clsx";

/**
 * Cmd+K command palette · paleta global de navegación + acciones
 * rápidas.
 *
 * Atajo: Cmd+K (mac) / Ctrl+K (win/linux). También se cierra con ESC.
 *
 * Sin librería externa — keyboard nav nativa, fuzzy match simple
 * (substring case-insensitive sobre title + keywords).
 */

type CommandKind = "nav" | "action";

type Command = {
  id: string;
  title: string;
  description?: string;
  group: string;
  kind: CommandKind;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Para navegación */
  href?: string;
  /** Para acciones */
  perform?: () => void;
  /** Términos extra para matching */
  keywords?: string[];
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Comandos · navegación + acciones rápidas globales.
  const commands = useMemo<Command[]>(
    () => [
      // ── Navegación: pilares
      {
        id: "nav-hoy",
        title: "Hoy · Ritual matutino",
        description: "Tu pantalla diaria de inicio",
        group: "Pilares",
        kind: "nav",
        icon: Sparkles,
        href: "/",
        keywords: ["today", "ritual", "home"],
      },
      {
        id: "nav-habitos",
        title: "Hábitos",
        group: "Pilares",
        kind: "nav",
        icon: ListChecks,
        href: "/habitos",
        keywords: ["habits", "rutina", "diario"],
      },
      {
        id: "nav-finanzas",
        title: "Finanzas",
        group: "Pilares",
        kind: "nav",
        icon: Wallet,
        href: "/finanzas",
      },
      {
        id: "nav-reflexiones",
        title: "Mentalidad",
        group: "Pilares",
        kind: "nav",
        icon: Brain,
        href: "/reflexiones",
        keywords: ["reflexiones", "mpd", "stoic"],
      },
      {
        id: "nav-emprendimiento",
        title: "Emprendimiento",
        group: "Pilares",
        kind: "nav",
        icon: Briefcase,
        href: "/emprendimiento",
        keywords: ["negocio", "business", "ventas"],
      },
      {
        id: "nav-pegasso",
        title: "Pegasso",
        group: "Pilares",
        kind: "nav",
        icon: Sparkles,
        href: "/pegasso",
        keywords: ["chat", "ia", "consejero"],
      },

      // ── Navegación: secciones específicas
      {
        id: "nav-fitness",
        title: "Fitness",
        group: "Hábitos",
        kind: "nav",
        icon: Dumbbell,
        href: "/habitos/fitness",
      },
      {
        id: "nav-lectura",
        title: "Lectura",
        group: "Hábitos",
        kind: "nav",
        icon: BookOpen,
        href: "/habitos/lectura",
      },
      {
        id: "nav-tarjetas",
        title: "Tarjetas",
        group: "Finanzas",
        kind: "nav",
        icon: CreditCard,
        href: "/finanzas/tarjetas",
      },
      {
        id: "nav-recurrentes",
        title: "Recurrentes y suscripciones",
        group: "Finanzas",
        kind: "nav",
        icon: Repeat,
        href: "/finanzas/recurrentes",
        keywords: ["subs", "recurring"],
      },
      {
        id: "nav-cuentas",
        title: "Cuentas y patrimonio",
        group: "Finanzas",
        kind: "nav",
        icon: Wallet,
        href: "/finanzas/cuentas",
        keywords: ["net worth", "patrimonio"],
      },
      {
        id: "nav-ahorro",
        title: "Metas de ahorro",
        group: "Finanzas",
        kind: "nav",
        icon: PiggyBank,
        href: "/finanzas/ahorro",
      },
      {
        id: "nav-presupuestos",
        title: "Presupuestos",
        group: "Finanzas",
        kind: "nav",
        icon: Target,
        href: "/finanzas/presupuestos",
      },
      {
        id: "nav-deudas",
        title: "Deudas",
        group: "Finanzas",
        kind: "nav",
        icon: Receipt,
        href: "/finanzas/deudas",
      },
      {
        id: "nav-meditacion",
        title: "Meditación",
        group: "Mentalidad",
        kind: "nav",
        icon: Brain,
        href: "/reflexiones/meditacion",
      },
      {
        id: "nav-respira",
        title: "Respira · breathwork",
        description: "4·7·8, caja, coherente, Wim Hof",
        group: "Mentalidad",
        kind: "nav",
        icon: Wind,
        href: "/reflexiones/respira",
        keywords: ["breath", "respiracion", "calma"],
      },
      {
        id: "nav-aura",
        title: "Aura · frecuencias",
        group: "Mentalidad",
        kind: "nav",
        icon: Brain,
        href: "/reflexiones/aura",
      },
      {
        id: "nav-insights",
        title: "Mis insights de Pegasso",
        group: "Pegasso",
        kind: "nav",
        icon: Pin,
        href: "/pegasso/insights",
      },
      {
        id: "nav-anuario",
        title: "Anuario · Year in review",
        description: "Tu año en una página",
        group: "Pilares",
        kind: "nav",
        icon: Calendar,
        href: "/anuario",
        keywords: ["wrapped", "resumen", "año", "report"],
      },

      // ── Acciones: jumps a flujos contextuales
      {
        id: "act-new-tx",
        title: "Nueva transacción",
        description: "Registra un ingreso o gasto",
        group: "Acciones",
        kind: "action",
        icon: Plus,
        perform: () => {
          router.push("/finanzas?new=transaction");
        },
        keywords: ["gasto", "ingreso", "movimiento"],
      },
      {
        id: "act-mood",
        title: "Registrar estado emocional",
        description: "Mood + energía + tags de hoy",
        group: "Acciones",
        kind: "action",
        icon: HeartPulse,
        perform: () => router.push("/reflexiones#mood"),
        keywords: ["mood", "estado", "emocion"],
      },
      {
        id: "act-gratitude",
        title: "Gratitud · 3 cosas",
        description: "Anota tres cosas por las que estás agradecido",
        group: "Acciones",
        kind: "action",
        icon: Sparkles,
        perform: () => router.push("/reflexiones"),
        keywords: ["thanks", "agradecido"],
      },
      {
        id: "act-respira",
        title: "Respira (breathwork)",
        description: "4·7·8, caja, coherente, Wim Hof",
        group: "Acciones",
        kind: "action",
        icon: HeartPulse,
        perform: () => router.push("/reflexiones/respira"),
        keywords: ["breath"],
      },
      {
        id: "act-stoic-today",
        title: "Ejercicio estoico de hoy",
        group: "Acciones",
        kind: "action",
        icon: Compass,
        perform: () => router.push("/reflexiones"),
      },
      {
        id: "act-vision",
        title: "Vision board",
        group: "Acciones",
        kind: "action",
        icon: Sparkles,
        perform: () => router.push("/reflexiones"),
      },
      {
        id: "act-future-letter",
        title: "Carta a tu yo del futuro",
        group: "Acciones",
        kind: "action",
        icon: Mail,
        perform: () => router.push("/reflexiones"),
      },
      {
        id: "act-weekly-review",
        title: "Review semanal con Pegasso",
        description: "Sintetiza tu semana",
        group: "Acciones",
        kind: "action",
        icon: Calendar,
        perform: () => router.push("/pegasso?action=weekly-review"),
      },
      {
        id: "act-milestone",
        title: "Nuevo hito de negocio",
        group: "Acciones",
        kind: "action",
        icon: Trophy,
        perform: () => router.push("/emprendimiento"),
      },
      {
        id: "act-reading-goal",
        title: "Meta anual de lectura",
        group: "Acciones",
        kind: "action",
        icon: Library,
        perform: () => router.push("/habitos/lectura"),
      },
      {
        id: "act-journal",
        title: "Nueva entrada de diario",
        group: "Acciones",
        kind: "action",
        icon: Pencil,
        perform: () => router.push("/diario"),
      },
    ],
    [router]
  );

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const haystack = [
        c.title,
        c.description ?? "",
        c.group,
        ...(c.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      // Permite búsqueda por palabras separadas
      return q.split(/\s+/).every((token) => haystack.includes(token));
    });
  }, [query, commands]);

  // Group filtered for display
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of filtered) {
      const list = map.get(c.group) ?? [];
      list.push(c);
      map.set(c.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      // microtask to ensure modal mounted
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const execute = useCallback(
    (c: Command) => {
      onClose();
      if (c.kind === "nav" && c.href) {
        router.push(c.href);
      } else if (c.kind === "action" && c.perform) {
        c.perform();
      }
    },
    [router, onClose]
  );

  // Keyboard nav
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) execute(filtered[highlight]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  // Scroll highlight into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-cmd-index="${highlight}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  if (!open) return null;

  return (
    <div
      data-print-hide
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 print:hidden"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg rounded-2xl border border-line shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Search size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Busca módulos, acciones, palabras…"
            className="flex-1 bg-transparent border-0 font-body text-base text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <ul
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto py-1"
        >
          {grouped.length === 0 && (
            <li className="px-4 py-10 text-center font-body text-sm text-muted">
              Sin resultados para “{query}”.
            </li>
          )}
          {grouped.map(([group, items]) => (
            <li key={group}>
              <p className="px-4 pt-3 pb-1 font-mono text-[9px] uppercase tracking-widest text-muted/70">
                {group}
              </p>
              {items.map((c) => {
                const idx = filtered.indexOf(c);
                const active = idx === highlight;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-cmd-index={idx}
                    onClick={() => execute(c)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={clsx(
                      "w-full px-4 py-2.5 flex items-center gap-3 text-left",
                      active ? "bg-accent/10" : "hover:bg-bg-alt"
                    )}
                  >
                    <span
                      className={clsx(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        active
                          ? "bg-accent text-bg"
                          : "bg-bg-alt text-muted"
                      )}
                    >
                      <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          "font-body text-sm truncate",
                          active ? "text-ink font-medium" : "text-ink"
                        )}
                      >
                        {c.title}
                      </p>
                      {c.description && (
                        <p className="font-body text-xs text-muted truncate">
                          {c.description}
                        </p>
                      )}
                    </div>
                    {active && (
                      <CornerDownLeft size={12} className="text-accent" />
                    )}
                  </button>
                );
              })}
            </li>
          ))}
        </ul>

        <div className="px-4 py-2 border-t border-line flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-muted">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-alt border border-line text-[9px]">
              <ArrowUp size={9} className="inline" />
              <ArrowDown size={9} className="inline" />
            </kbd>
            navegar
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-alt border border-line text-[9px]">
              ↵
            </kbd>
            ejecutar
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-alt border border-line text-[9px]">
              esc
            </kbd>
            cerrar
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook que escucha Cmd+K / Ctrl+K globalmente y devuelve el estado
 * + setter para abrir/cerrar la paleta. Úsalo en AppShell.
 */
export function useCommandPaletteShortcut() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
