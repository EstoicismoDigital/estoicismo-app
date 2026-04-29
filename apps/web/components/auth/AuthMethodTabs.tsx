"use client";
import { useState, type ReactNode } from "react";

export type AuthMethod = "email" | "phone";

export function AuthMethodTabs({
  email,
  phone,
}: {
  email: ReactNode;
  phone: ReactNode;
}) {
  const [method, setMethod] = useState<AuthMethod>("email");

  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-bg-alt border border-line">
        <button
          type="button"
          role="tab"
          aria-selected={method === "email"}
          onClick={() => setMethod("email")}
          className={`h-9 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${
            method === "email"
              ? "bg-bg text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          EMAIL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === "phone"}
          onClick={() => setMethod("phone")}
          className={`h-9 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${
            method === "phone"
              ? "bg-bg text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          TELÉFONO
        </button>
      </div>

      <div role="tabpanel" hidden={method !== "email"}>
        {email}
      </div>
      <div role="tabpanel" hidden={method !== "phone"}>
        {phone}
      </div>
    </div>
  );
}

export function AuthDivider({ label = "O continúa con email" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
