"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { clsx } from "clsx";
import { useTheme, type Theme } from "../../hooks/useTheme";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className="inline-flex p-1 rounded-lg border border-line bg-bg-alt"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        // While hydrating, no option is "active" yet — this avoids a
        // server/client mismatch on first paint. Boot script already
        // applied the right class to <html>, so the UI doesn't jump.
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={clsx(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-md font-body text-sm transition-colors min-w-[44px] justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              active
                ? "bg-bg text-ink shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            <Icon size={14} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
