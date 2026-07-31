import type { OrderStatus } from "@/lib/dashboard-data";

type StatusSource = {
  sourceSheet: string;
  deadlineStatus?: string | null;
  deliveryStatus?: string | null;
};

const normalizeStatus = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9]/g, "")
  .toLowerCase();

export function classifyOrderStatus(row: StatusSource): OrderStatus {
  const source = normalizeStatus(row.sourceSheet);
  const deadline = normalizeStatus(row.deadlineStatus);
  const delivery = normalizeStatus(row.deliveryStatus);

  if (source.includes("entreg")) return "Entregue";

  // O status de vencimento é a fonte oficial. O status de entrega é usado
  // somente como fallback quando o campo de vencimento não resolve o caso.
  if (deadline.includes("foradoprazo") || deadline.includes("vencido") || deadline.includes("atras")) return "Vencido";
  if (deadline.includes("dentrodoprazo")) return "No prazo";
  if (deadline.includes("vencendo")) return "Vencendo";
  if (delivery.includes("foradoprazo")) return "Vencido";
  if (delivery.includes("atencao") || delivery.includes("vencendo")) return "Vencendo";
  if (delivery === "ok") return "No prazo";
  return "Outros";
}
