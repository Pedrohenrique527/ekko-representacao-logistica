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

  // No Excel, "Atenção!" identifica o período entre o início do alerta
  // e a data de vencimento. Essa é a fonte oficial para o status "Vencendo".
  if (delivery.includes("atencao") || delivery.includes("vencendo")) return "Vencendo";

  if (deadline.includes("foradoprazo") || delivery.includes("foradoprazo")) return "Vencido";
  if (deadline.includes("dentrodoprazo") || delivery === "ok") return "No prazo";
  if (deadline.includes("vencendo")) return "Vencendo";
  if (deadline.includes("vencido") || deadline.includes("atras")) return "Vencido";
  return "Outros";
}
