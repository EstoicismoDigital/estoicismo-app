/**
 * CSV import para transacciones (#17).
 *
 * Acepta formatos típicos de export bancario:
 *   - Header en línea 1 con columnas estándar.
 *   - Detección automática del delimitador (coma, punto y coma, tab).
 *   - Mapping flexible: el user puede revisar y corregir el mapping
 *     antes de importar.
 *
 * Formato esperado mínimo:
 *   - Una columna con la fecha
 *   - Una columna con el monto (positivo = ingreso, negativo = gasto,
 *     o dos columnas separadas income/expense)
 *   - Una columna con la descripción/concepto
 *
 * Sin lib externa — parser simple. Maneja quotes y commas dentro de
 * strings.
 */

export type CsvRow = Record<string, string>;

/**
 * Auto-detect el delimitador. Cuenta ocurrencias en la línea de
 * header y elige el más frecuente.
 */
function detectDelimiter(firstLine: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let max = 0;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > max) {
      max = count;
      best = c;
    }
  }
  return best;
}

/**
 * Parser CSV simple que maneja:
 *   - Quoted fields ("...")
 *   - Quoted fields con quotes escapados ("...""...")
 *   - Commas/delimitadores dentro de quotes
 *   - Newlines dentro de quotes (multiline)
 */
export function parseCsv(text: string): {
  headers: string[];
  rows: CsvRow[];
  delimiter: string;
} {
  // Normalizar line endings
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstNewline = cleaned.indexOf("\n");
  const firstLine = firstNewline >= 0 ? cleaned.slice(0, firstNewline) : cleaned;
  const delimiter = detectDelimiter(firstLine);

  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escape: "" → "
        if (cleaned[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    // No quotes
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === delimiter) {
      current.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      current.push(field);
      // Skip empty lines
      if (current.length > 1 || (current.length === 1 && current[0] !== "")) {
        lines.push(current);
      }
      current = [];
      field = "";
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // Last field
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.length > 1 || (current.length === 1 && current[0] !== "")) {
      lines.push(current);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [], delimiter };

  const headers = lines[0].map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const row: CsvRow = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = (lines[r][c] ?? "").trim();
    }
    rows.push(row);
  }

  return { headers, rows, delimiter };
}

/**
 * Adivina el mapping inicial de columnas → fields conocidos.
 * El user revisa y ajusta antes de importar.
 */
export type FieldKey =
  | "ignore"
  | "date"
  | "amount"
  | "amount_in"
  | "amount_out"
  | "kind"
  | "description"
  | "category";

export function guessMapping(headers: string[]): Record<string, FieldKey> {
  const mapping: Record<string, FieldKey> = {};
  for (const h of headers) {
    const norm = h.toLowerCase().trim();
    if (
      norm === "date" ||
      norm === "fecha" ||
      norm.includes("date") ||
      norm.includes("fecha")
    ) {
      mapping[h] = "date";
    } else if (
      norm === "amount" ||
      norm === "monto" ||
      norm === "importe" ||
      norm === "valor"
    ) {
      mapping[h] = "amount";
    } else if (
      norm.includes("ingreso") ||
      norm.includes("entrada") ||
      norm === "credit" ||
      norm === "haber"
    ) {
      mapping[h] = "amount_in";
    } else if (
      norm.includes("gasto") ||
      norm.includes("salida") ||
      norm === "debit" ||
      norm === "debe" ||
      norm.includes("retiro")
    ) {
      mapping[h] = "amount_out";
    } else if (
      norm === "type" ||
      norm === "tipo" ||
      norm.includes("kind")
    ) {
      mapping[h] = "kind";
    } else if (
      norm === "description" ||
      norm === "concepto" ||
      norm === "memo" ||
      norm.includes("desc")
    ) {
      mapping[h] = "description";
    } else if (norm === "category" || norm === "categoria" || norm === "categoría") {
      mapping[h] = "category";
    } else {
      mapping[h] = "ignore";
    }
  }
  return mapping;
}

/**
 * Parsea una fila CSV en una propuesta de transacción usando el
 * mapping. Devuelve null si la fila es inválida (sin fecha o sin
 * monto).
 */
export type ParsedTransaction = {
  date: string;
  amount: number;
  kind: "income" | "expense";
  description: string | null;
  categoryHint: string | null;
};

export function parseRow(
  row: CsvRow,
  mapping: Record<string, FieldKey>
): ParsedTransaction | null {
  let date: string | null = null;
  let amount: number | null = null;
  let kind: "income" | "expense" | null = null;
  let description: string | null = null;
  let categoryHint: string | null = null;

  for (const [header, field] of Object.entries(mapping)) {
    const raw = row[header] ?? "";
    if (!raw) continue;
    if (field === "date") {
      date = parseDate(raw);
    } else if (field === "amount") {
      const n = parseAmount(raw);
      if (n !== null) {
        amount = Math.abs(n);
        if (kind === null) kind = n < 0 ? "expense" : "income";
      }
    } else if (field === "amount_in") {
      const n = parseAmount(raw);
      if (n !== null && n > 0) {
        amount = Math.abs(n);
        kind = "income";
      }
    } else if (field === "amount_out") {
      const n = parseAmount(raw);
      if (n !== null && n > 0) {
        amount = Math.abs(n);
        kind = "expense";
      }
    } else if (field === "kind") {
      const lower = raw.toLowerCase();
      if (
        lower === "income" ||
        lower === "ingreso" ||
        lower === "entrada" ||
        lower === "credit"
      ) {
        kind = "income";
      } else if (
        lower === "expense" ||
        lower === "gasto" ||
        lower === "salida" ||
        lower === "debit"
      ) {
        kind = "expense";
      }
    } else if (field === "description") {
      description = raw;
    } else if (field === "category") {
      categoryHint = raw;
    }
  }

  if (!date || amount == null || amount <= 0) return null;
  return {
    date,
    amount,
    kind: kind ?? "expense",
    description,
    categoryHint,
  };
}

/**
 * Parsea fecha en formatos comunes.
 *   - YYYY-MM-DD (ISO)
 *   - DD/MM/YYYY
 *   - MM/DD/YYYY
 *   - DD-MM-YYYY
 *
 * Heurística: si el primer número es > 12, es DD/MM. Si todas
 * las posibilidades son ambiguas, asume DD/MM (formato latino).
 */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  // ISO
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // DD/MM/YYYY o MM/DD/YYYY
  const slashMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slashMatch) {
    const a = parseInt(slashMatch[1], 10);
    const b = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    let day: number, month: number;
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      day = b;
      month = a;
    } else {
      // Ambiguo — asumir DD/MM (latino)
      day = a;
      month = b;
    }
    if (
      year >= 2000 &&
      year <= 2100 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // Última opción: dejar al Date constructor
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return dt.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Parsea monto. Soporta:
 *   - 1234.56
 *   - 1.234,56 (latino)
 *   - 1,234.56 (anglo)
 *   - $ y otros símbolos al inicio
 *   - Negativos con - o ()
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;

  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  // Remove currency symbols & spaces
  s = s.replace(/[$€£¥₹]/g, "").replace(/\s/g, "").trim();
  if (!s) return null;

  // Detectar formato: si tiene tanto . como , el último es decimal.
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // Latino: 1.234,56
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // Anglo: 1,234.56
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Solo coma — si hay 3 dígitos después podría ser miles
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length === 3 && !hasDot) {
      // Probablemente miles: 1,234
      s = s.replace(",", "");
    } else {
      // Decimal: 12,34
      s = s.replace(",", ".");
    }
  }
  // Solo dot, dejar como está

  const n = parseFloat(s);
  if (!isFinite(n)) return null;
  return negative ? -n : n;
}
