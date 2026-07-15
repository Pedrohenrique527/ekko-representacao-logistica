export type OrderStatus = "No prazo" | "Vencendo" | "Vencido" | "Entregue";

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

export const orders: Order[] = [
  { id: "1", order: "04783.2025", client: "Jean Pierre", supplier: "KERAMIKA", representative: "Allan", carrier: "Tambaú + 23", invoice: "7564", value: 13969.46, status: "Vencido", sentAt: "24/07/2025", dueAt: "27/09/2025" },
  { id: "2", order: "09448.2025", client: "Anna Giovanna Teotônio", supplier: "DALLE PIAGGE", representative: "Allan", carrier: "23 de Maio", invoice: "6230", value: 3056.59, status: "Entregue", sentAt: "30/07/2025", dueAt: "28/09/2025" },
  { id: "3", order: "10552.2025", client: "Aline Agrelli Fernandes", supplier: "BRASMIX / COLORMIX", representative: "Allan", carrier: "23 de Maio", invoice: "176168", value: 10582, status: "Entregue", sentAt: "13/08/2025", dueAt: "13/10/2025" },
  { id: "4", order: "11578.2025", client: "Ana Vitória C. Mendonça", supplier: "LEPRI", representative: "Allan", carrier: "23 de Maio", invoice: "7498", value: 14000, status: "Vencido", sentAt: "08/09/2025", dueAt: "07/10/2025" },
  { id: "5", order: "12770.2025", client: "Guilherme Horta", supplier: "LEPRI", representative: "Allan", carrier: "23 de Maio", invoice: "7499", value: 2696.85, status: "Entregue", sentAt: "29/09/2025", dueAt: "15/09/2025" },
  { id: "6", order: "06741.2025", client: "Rio Othon Palace Hotel", supplier: "KOHLER", representative: "Allan", carrier: "A definir", invoice: "—", value: 154639.06, status: "Vencendo", sentAt: "28/05/2025", dueAt: "07/06/2025" },
];

export const monthlyOrders = [
  { month: "Out", pedidos: 91, valor: 620000 },
  { month: "Nov", pedidos: 106, valor: 790000 },
  { month: "Dez", pedidos: 84, valor: 680000 },
  { month: "Jan", pedidos: 113, valor: 910000 },
  { month: "Fev", pedidos: 126, valor: 1080000 },
  { month: "Mar", pedidos: 118, valor: 970000 },
  { month: "Abr", pedidos: 137, valor: 1210000 },
  { month: "Mai", pedidos: 145, valor: 1340000 },
  { month: "Jun", pedidos: 131, valor: 1180000 },
  { month: "Jul", pedidos: 154, valor: 1490000 },
  { month: "Ago", pedidos: 170, valor: 1640000 },
  { month: "Set", pedidos: 194, valor: 1810000 },
];

export const statusData = [
  { name: "Entregues", value: 938, color: "#3b82f6" },
  { name: "No prazo", value: 407, color: "#22c55e" },
  { name: "Vencendo", value: 96, color: "#f59e0b" },
  { name: "Vencidos", value: 128, color: "#ef4444" },
];

export const suppliers = [
  { name: "Palimanan", value: 2196648, orders: 183, sla: 94, late: 8 },
  { name: "Castelatto", value: 1875030, orders: 146, sla: 91, late: 11 },
  { name: "Recovering / Krono Tex", value: 1723647, orders: 129, sla: 96, late: 5 },
  { name: "Doka", value: 1341472, orders: 118, sla: 89, late: 14 },
  { name: "Lepri", value: 1072095, orders: 196, sla: 92, late: 12 },
];
