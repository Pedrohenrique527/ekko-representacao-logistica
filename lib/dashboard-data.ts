export type OrderStatus = "No prazo" | "Vencendo" | "Vencido" | "Entregue" | "Outros";

export type Order = {
  id: string;
  order: string;
  client: string;
  supplier: string;
  representative: string;
  carrier: string;
  invoice: string;
  value: number;
  status: OrderStatus;
  sentAt: string;
  dueAt: string;
};

export type SupplierSummary = { name: string; value: number; orders: number; sla: number; late: number };
export type MonthlySummary = { month: string; pedidos: number; valor: number };
export type StatusSummary = { name: string; value: number; color: string };

export type DashboardData = {
  hasData: boolean;
  latestImport: { fileName: string; createdAt: string; integrity: number } | null;
  metrics: {
    total: number; active: number; delivered: number; onTime: number; expiring: number; overdue: number; other: number;
    totalValue: number; deliveredValue: number; pendingValue: number; averageTicket: number;
  };
  orders: Order[];
  monthlyOrders: MonthlySummary[];
  statusData: StatusSummary[];
  suppliers: SupplierSummary[];
};

export const emptyDashboard: DashboardData = {
  hasData: false,
  latestImport: null,
  metrics: { total: 0, active: 0, delivered: 0, onTime: 0, expiring: 0, overdue: 0, other: 0, totalValue: 0, deliveredValue: 0, pendingValue: 0, averageTicket: 0 },
  orders: [], monthlyOrders: [], suppliers: [],
  statusData: [
    { name: "Entregues", value: 0, color: "#3b82f6" },
    { name: "No prazo", value: 0, color: "#22c55e" },
    { name: "Vencendo", value: 0, color: "#f59e0b" },
    { name: "Vencidos", value: 0, color: "#ef4444" },
    { name: "Outros", value: 0, color: "#71717a" },
  ],
};
