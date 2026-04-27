/**
 * Lista curada de monedas. ISO 4217 codes.
 *
 * Más usadas en LATAM/USA primero. El user puede seleccionar de aquí
 * o tipear cualquier código de 3 letras (ej. "BTC" si quiere).
 */

export type CurrencyOption = {
  code: string;
  label: string;
  symbol: string;
};

export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: "MXN", label: "Peso mexicano", symbol: "$" },
  { code: "USD", label: "Dólar EE.UU.", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "ARS", label: "Peso argentino", symbol: "$" },
  { code: "COP", label: "Peso colombiano", symbol: "$" },
  { code: "CLP", label: "Peso chileno", symbol: "$" },
  { code: "PEN", label: "Sol peruano", symbol: "S/" },
  { code: "UYU", label: "Peso uruguayo", symbol: "$" },
  { code: "BRL", label: "Real brasileño", symbol: "R$" },
  { code: "GBP", label: "Libra esterlina", symbol: "£" },
  { code: "CAD", label: "Dólar canadiense", symbol: "$" },
  { code: "JPY", label: "Yen japonés", symbol: "¥" },
  { code: "CHF", label: "Franco suizo", symbol: "Fr" },
  { code: "AUD", label: "Dólar australiano", symbol: "$" },
];

export function getCurrencyMeta(code: string): CurrencyOption {
  return (
    COMMON_CURRENCIES.find((c) => c.code === code.toUpperCase()) ?? {
      code: code.toUpperCase(),
      label: code.toUpperCase(),
      symbol: code.toUpperCase(),
    }
  );
}
