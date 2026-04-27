import type {
  BusinessMilestone,
  BusinessSale,
  BusinessClient,
} from "@estoicismo/supabase";

/**
 * Calcula progreso de un milestone contra los datos del usuario.
 * Devuelve [0, 1] (0 = nada, 1 = completo). Si no aplica, devuelve null.
 *
 * sales_total → suma de business_sales.amount
 * sales_count → conteo de business_sales
 * clients_count → conteo de business_clients no archivados
 * product_launch / custom → null (manual achieve)
 */
export function computeMilestoneProgress(
  m: BusinessMilestone,
  sales: BusinessSale[],
  clients: BusinessClient[]
): { current: number; ratio: number | null } | null {
  switch (m.kind) {
    case "sales_total": {
      const target = Number(m.target_amount ?? 0);
      const current = sales.reduce((a, s) => a + Number(s.amount), 0);
      const ratio = target > 0 ? Math.min(1, current / target) : null;
      return { current, ratio };
    }
    case "sales_count": {
      const target = Number(m.target_amount ?? 0);
      const current = sales.length;
      const ratio = target > 0 ? Math.min(1, current / target) : null;
      return { current, ratio };
    }
    case "clients_count": {
      const target = Number(m.target_amount ?? 0);
      const current = clients.filter((c) => !c.is_archived).length;
      const ratio = target > 0 ? Math.min(1, current / target) : null;
      return { current, ratio };
    }
    case "product_launch":
    case "custom":
    default:
      return null;
  }
}

export function milestoneKindLabel(kind: BusinessMilestone["kind"]): string {
  switch (kind) {
    case "sales_total":
      return "Ventas totales";
    case "sales_count":
      return "Número de ventas";
    case "clients_count":
      return "Número de clientes";
    case "product_launch":
      return "Lanzar producto";
    case "custom":
      return "Personalizado";
  }
}

export function milestoneKindIcon(kind: BusinessMilestone["kind"]): string {
  switch (kind) {
    case "sales_total":
      return "💰";
    case "sales_count":
      return "🧾";
    case "clients_count":
      return "👥";
    case "product_launch":
      return "🚀";
    case "custom":
      return "✨";
  }
}
