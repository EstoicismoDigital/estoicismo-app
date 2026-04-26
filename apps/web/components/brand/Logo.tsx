"use client";
import Image from "next/image";
import { clsx } from "clsx";

/**
 * Logo oficial Estoicismo Digital.
 *
 * Variantes:
 *   - "icon": sólo el círculo con Marco Aurelio (favicon-style).
 *   - "full": icon + tipografía "ESTOICISMO DIGITAL".
 *
 * Auto-invierte en dark mode usando filter:invert para que el logo
 * negro se vea blanco sobre fondos oscuros sin tener que mantener
 * dos archivos.
 */
export function Logo(props: {
  variant?: "icon" | "full";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Si true, fuerza color blanco (sin importar tema). Útil sobre hero oscuro. */
  invert?: boolean;
  className?: string;
}) {
  const { variant = "icon", size = "md", invert, className } = props;

  const sizeMap = {
    icon: {
      xs: { w: 20, h: 20 },
      sm: { w: 28, h: 28 },
      md: { w: 36, h: 36 },
      lg: { w: 48, h: 48 },
      xl: { w: 64, h: 64 },
    },
    full: {
      xs: { w: 84, h: 28 },
      sm: { w: 112, h: 36 },
      md: { w: 140, h: 46 },
      lg: { w: 180, h: 60 },
      xl: { w: 240, h: 80 },
    },
  };
  const dims = sizeMap[variant][size];
  const src = variant === "icon" ? "/logo-icon.jpg" : "/logo-full.png";

  return (
    <Image
      src={src}
      alt="Estoicismo Digital"
      width={dims.w}
      height={dims.h}
      className={clsx(
        "object-contain",
        invert ? "invert" : "dark:invert",
        className
      )}
      priority={size === "lg" || size === "xl"}
    />
  );
}
