import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { emptyDashboard, type DashboardData, type DeliveryTiming, type OrderStatus } from "@/lib/dashboard-data";
import { classifyOrderStatus } from "@/lib/order-status";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type DbOrder = {
  id: string; externalOrder: string; client: string | null; supplier: string; representative: string | null;
  carrier: string | null; invoice: string | null; value: string | number; sentAt: string | null; expectedAt: string | null;
  dueAt: string | null; deliveredAt: string | null; deadlineStatus: string | null; deliveryStatus: string | null; sourceSheet: string;
};
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const asDate = (value: string | null) => value ? new Date(value) : null;
const brDate = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)) : "—";
const deliveryTiming = (row: Pick<DbOrder, "deadlineStatus" | "deliveryStatus">): DeliveryTiming => {
  const officialStatus = `${normalize(row.deadlineStatus)} ${normalize(row.deliveryStatus)}`.replace(/[^a-z0-9]/g, "");
  if (officialStatus.includes("foradoprazo") || officialStatus.includes("atras") || officialStatus.includes("vencid") || officialStatus.includes("expirad")) return "Fora do prazo";
  if (officialStatus.includes("dentrodoprazo") || officialStatus.includes("noprazo") || normalize(row.deliveryStatus).trim() === "ok") return "Dentro do prazo";
  return "Não informado";
};

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ message: "Faça login para consultar o painel." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json(emptyDashboard, { headers: { "cache-control": "no-store" } });
    const sql = neon(process.env.DATABASE_URL);
    const imports = await sql`SELECT b."id", b."fileName", b."fileHash", b."createdAt", b."integrityScore", b."rowsFound", b."rowsInserted", b."totalExcel", b."totalDatabase", b."durationMs", b."status", u."email" AS "userEmail" FROM "ImportBatch" b INNER JOIN "User" u ON u."id" = b."userId" ORDER BY b."createdAt" DESC`;
    if (!imports.length) return NextResponse.json(emptyDashboard, { headers: { "cache-control": "no-store" } });
    const latest = imports.find((item) => item.status === "COMPLETED") as { id: string; fileName: string; fileHash: string; createdAt: string; integrityScore: string | number; rowsFound: number; rowsInserted: number; totalExcel: string | number; totalDatabase: string | number; durationMs: number; status: string; userEmail: string } | undefined;
    if (!latest) return NextResponse.json(emptyDashboard, { headers: { "cache-control": "no-store" } });
    const storedRows = await sql`SELECT "id", "externalOrder", "client", "supplier", "representative", "carrier", "invoice", "value", "sentAt", "expectedAt", "dueAt", "deliveredAt", "deadlineStatus", "deliveryStatus", "sourceSheet" FROM "Order" WHERE "importBatchId" = ${latest.id} ORDER BY "sourceRow" ASC` as DbOrder[];
    const rows = storedRows.filter((row) => Boolean(row.externalOrder.trim() && row.supplier.trim()));
    const issueRows = await sql`SELECT COUNT(*)::int AS "count" FROM "ValidationIssue" v LEFT JOIN "Order" o ON o."importBatchId"=v."importBatchId" AND o."sourceSheet"=v."sourceSheet" AND o."sourceRow"=v."sourceRow" WHERE v."importBatchId" = ${latest.id} AND (v."type" <> 'missing' OR COALESCE(o."externalOrder", '') <> '' OR COALESCE(o."supplier", '') <> '')` as { count: number }[];
    const statuses = rows.map(classifyOrderStatus);
    const totalValue = rows.reduce((sum, row) => sum + Number(row.value), 0);
    const deliveredValue = rows.reduce((sum, row, i) => sum + (statuses[i] === "Entregue" ? Number(row.value) : 0), 0);
    const count = (status: OrderStatus) => statuses.filter((item) => item === status).length;
    const supplierMap = new Map<string, { value: number; orders: number; late: number; delivered: number; deliveredOnTime: number }>();
    const monthMap = new Map<string, { sort: number; pedidos: number; valor: number }>();
    rows.forEach((row, i) => {
      const supplier = supplierMap.get(row.supplier) ?? { value: 0, orders: 0, late: 0, delivered: 0, deliveredOnTime: 0 };
      supplier.value += Number(row.value); supplier.orders++; if (statuses[i] === "Vencido") supplier.late++;
      if (statuses[i] === "Entregue") { supplier.delivered++; if (normalize(row.deadlineStatus).includes("dentro do prazo")) supplier.deliveredOnTime++; }
      supplierMap.set(row.supplier, supplier);
      const date = asDate(row.sentAt ?? row.expectedAt ?? row.deliveredAt);
      if (date && !Number.isNaN(date.getTime())) { const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; const month = monthMap.get(key) ?? { sort: date.getUTCFullYear() * 12 + date.getUTCMonth(), pedidos: 0, valor: 0 }; month.pedidos++; month.valor += Number(row.value); monthMap.set(key, month); }
    });
    const delivered = count("Entregue"), overdue = count("Vencido"), expiring = count("Vencendo"), onTime = count("No prazo"), other = count("Outros");
    const result: DashboardData = {
      hasData: true,
      latestImport: { fileName: latest.fileName, createdAt: new Date(latest.createdAt).toISOString(), integrity: Number(latest.integrityScore) },
      metrics: { total: rows.length, active: rows.length - delivered, delivered, onTime, expiring, overdue, other, totalValue, deliveredValue, pendingValue: totalValue - deliveredValue, averageTicket: rows.length ? totalValue / rows.length : 0 },
      orders: rows.map((row, i) => ({ id: row.id, order: row.externalOrder, client: row.client ?? "—", supplier: row.supplier, representative: row.representative ?? "—", carrier: row.carrier ?? "—", invoice: row.invoice ?? "—", value: Number(row.value), status: statuses[i], sentAt: brDate(row.sentAt), dueAt: brDate(row.dueAt ?? row.expectedAt), deliveredAt: brDate(row.deliveredAt), deliveryTiming: deliveryTiming(row), sourceSheet: row.sourceSheet })),
      monthlyOrders: [...monthMap.entries()].sort((a, b) => a[1].sort - b[1].sort).map(([month, item]) => ({ month, pedidos: item.pedidos, valor: item.valor })),
      statusData: [{ name: "Entregues", value: delivered, color: "#3b82f6" }, { name: "No prazo", value: onTime, color: "#22c55e" }, { name: "Vencendo", value: expiring, color: "#f59e0b" }, { name: "Vencidos", value: overdue, color: "#ef4444" }, { name: "Outros", value: other, color: "#71717a" }],
      suppliers: [...supplierMap.entries()].map(([name, item]) => ({ name: name || "Sem fornecedor", value: item.value, orders: item.orders, late: item.late, sla: item.delivered ? Math.round((item.deliveredOnTime / item.delivered) * 1000) / 10 : 0 })).sort((a, b) => b.value - a.value),
      importHistory: imports.map((item) => ({ id: String(item.id), fileName: String(item.fileName), createdAt: new Date(String(item.createdAt)).toISOString(), rowsFound: Number(item.rowsFound), rowsInserted: Number(item.rowsInserted), totalExcel: Number(item.totalExcel), totalDatabase: Number(item.totalDatabase), integrity: Number(item.integrityScore), durationMs: Number(item.durationMs), status: String(item.status), userEmail: String(item.userEmail) })),
      proof: {
        rowsExcel: latest.rowsFound,
        rowsDatabase: latest.rowsInserted,
        totalExcel: Number(latest.totalExcel),
        totalDatabase: Number(latest.totalDatabase),
        rowMatch: latest.rowsFound === latest.rowsInserted,
        valueMatch: Math.abs(Number(latest.totalExcel) - Number(latest.totalDatabase)) < 0.01,
        issueCount: issueRows[0]?.count ?? 0,
        fileHashPrefix: latest.fileHash.slice(0, 12).toUpperCase(),
      },
    };
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Dashboard failed", error);
    return NextResponse.json({ message: "Não foi possível consultar o banco de dados." }, { status: 500 });
  }
}
