"use client";
import { useProfile } from "./useProfile";

/**
 * Devuelve la moneda preferida del user. Default 'MXN' si no hay
 * profile cargado o no está configurada.
 *
 * Usado por componentes que crean nuevas entidades (cuentas,
 * transacciones, ventas, inversiones, productos) para que la
 * moneda default coincida con el setting del user.
 */
export function useDefaultCurrency(): string {
  const { data: profile } = useProfile();
  return profile?.default_currency ?? "MXN";
}
