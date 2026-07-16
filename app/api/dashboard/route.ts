import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { emptyDashboard, type DashboardData, type OrderStatus } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

type DbOrder = {
  id: string; externalOrder: string; client: string | null; supplier: string; representative: string | null;
  carrier: string | null; invoice: string | null; value: string | number; sentAt: string | null; expectedAt: string | null;
  dueAt: string | null; deliveredAt: string | null; deadlineStatus: string | null; deliveryStatus: string | null; sourceSheet: string;
};
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const asDate = (value: string | null) => value ? new Date(value) : null;
const brDate = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)) : "—";

function statusOf(row: DbOrder): OrderStatus {
  const source = normalize(row.sourceSheet), delivery = normalize(row.deliveryStatus), deadline = normalize(row.deadlineStatus);
  if (source.includes("entreg") || delivery.includes("entreg") || row.deliveredAt) return "Entregue";
  if (deadline.includes("vencendo")) return "Vencendo";
  if (deadline.includes("vencido") || deadline.includes("atras")) return "Vencido";
  if (deadline.includes("prazo")) return "No prazo";
  return "Outros";
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json(emptyDashboard, { headers: { "cache-control": "no-store" } });
    const sql = neon(process.env.DATABASE_URL);
    const imports = await sql`SELECT "id", "fileName", "createdAt", "integrityScore" FROM "ImportBatch" WHERE "status" = 'COMPLETED' ORDER BY "createdAt" DESC LIMIT 1`;
    if (!imports.length) return NextResponse.json(emptyDashboard, { headers: { "cache-control": "no-store" } });
    const latest = imports[0] as { id: string; fileName: string; createdAt: string; integrityScore: string | number };
    const rows = await sql`SELECT "id", "externalOrder", "client", "supplier", "representative", "carrier", "invoice", "value", "sentAt", "expectedAt", "dueAt", "deliveredAt", "deadlineStatus", "deliveryStatus", "sourceSheet" FROM "Order" WHERE "importBatchId" = ${latest.id} ORDER BY "sourceRow" ASC` as DbOrder[];
    const statuses = rows.map(statusOf);
    const totalValue = rows.reduce((sum, row) => sum + Number(row.value), 0);
    const deliveredValue = rows.reduce((sum, row, i) => sum + (statuses[i] === "Entregue" ? Number(row.value) : 0), 0);
    const count = (status: OrderStatus) => statuses.filter((item) => item === status).length;
    const supplierMap = new Map<string, { value: number; orders: number; late: number; delivered: number }>();
    const monthMap = new Map<string, { sort: number; pedidos: number; valor: number }>();
    rows.forEach((row, i) => {
      const supplier = supplierMap.get(row.supplier) ?? { value: 0, orders: 0, late: 0, delivered: 0 };
      supplier.value += Number(row.value); supplier.orders++; if (statuses[i] === "Vencido") supplier.late++; if (statuses[i] === "Entregue") supplier.delivered++;
      supplierMap.set(row.supplier, supplier);
      const date = asDate(row.sentAt ?? row.expectedAt ?? row.deliveredAt);
      if (date && !Number.isNaN(date.getTime())) { const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; const month = monthMap.get(key) ?? { sort: date.getUTCFullYear() * 12 + date.getUTCMonth(), pedidos: 0, valor: 0 }; month.pedidos++; month.valor += Number(row.value); monthMap.set(key, month); }
    });
    const delivered = count("Entregue"), overdue = count("Vencido"), expiring = count("Vencendo"), onTime = count("No prazo"), other = count("Outros");
    const result: DashboardData = {
      hasData: true,
      latestImport: { fileName: latest.fileName, createdAt: new Date(latest.createdAt).toISOString(), integrity: Number(latest.integrityScore) },
      metrics: { total: rows.length, active: rows.length - delivered, delivered, onTime, expiring, overdue, other, totalValue, deliveredValue, pendingValue: totalValue - deliveredValue, averageTicket: rows.length ? totalValue / rows.length : 0 },
      orders: rows.map((row, i) => ({ id: row.id, order: row.externalOrder, client: row.client ?? "—", supplier: row.supplier, representative: row.representative ?? "—", carrier: row.carrier ?? "—", invoice: row.invoice ?? "—", value: Number(row.value), status: statuses[i], sentAt: brDate(row.sentAt), dueAt: brDate(row.dueAt ?? row.expectedAt) })),
      monthlyOrders: [...monthMap.entries()].sort((a, b) => a[1].sort - b[1].sort).slice(-12).map(([month, item]) => ({ month, pedidos: item.pedidos, valor: item.valor })),
      statusData: [{ name: "Entregues", value: delivered, color: "#3b82f6" }, { name: "No prazo", value: onTime, color: "#22c55e" }, { name: "Vencendo", value: expiring, color: "#f59e0b" }, { name: "Vencidos", value: overdue, color: "#ef4444" }, { name: "Outros", value: other, color: "#71717a" }],
      suppliers: [...supplierMap.entries()].map(([name, item]) => ({ name, value: item.value, orders: item.orders, late: item.late, sla: item.orders ? Math.round((item.delivered / item.orders) * 1000) / 10 : 0 })).sort((a, b) => b.value - a.value),
    };
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Dashboard failed", error);
    return NextResponse.json({ message: "Não foi possível consultar o banco de dados." }, { status: 500 });
  }
}
