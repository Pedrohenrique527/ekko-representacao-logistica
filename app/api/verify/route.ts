import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyOrderStatus } from "@/lib/order-status";
import { getChatGPTUser, isChatGPTUserAllowed } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  sourceSheet: z.string(),
  sourceRow: z.number().int().positive(),
  order: z.string(),
  supplier: z.string(),
  value: z.number().finite(),
  deadlineStatus: z.string(),
  deliveryStatus: z.string(),
});
const payloadSchema = z.object({
  fileHash: z.string().length(64),
  rowsFound: z.number().int().nonnegative(),
  totalExcel: z.number().finite(),
  orders: z.array(orderSchema),
});

type CheckOrder = z.infer<typeof orderSchema>;
type DbOrder = { sourceSheet: string; sourceRow: number; externalOrder: string; supplier: string; value: string | number; deadlineStatus: string | null; deliveryStatus: string | null };
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
const countStatuses = (rows: Array<{ sourceSheet: string; deadlineStatus: string | null; deliveryStatus: string | null }>) => rows.reduce<Record<string, number>>((acc, row) => {
  const status = classifyOrderStatus(row); acc[status] = (acc[status] ?? 0) + 1; return acc;
}, {});

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return NextResponse.json({ message: "Faça login para executar a auditoria." }, { status: 401 });
    if (!isChatGPTUserAllowed(user)) return NextResponse.json({ message: "Esta conta não possui permissão." }, { status: 403 });
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "A planilha não pôde ser validada." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ message: "Banco de dados não configurado." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const batches = await sql`SELECT "id", "fileName", "fileHash", "rowsFound", "rowsInserted", "totalExcel", "totalDatabase", "createdAt" FROM "ImportBatch" WHERE "status"='COMPLETED' ORDER BY "createdAt" DESC LIMIT 1`;
    if (!batches.length) return NextResponse.json({ message: "Não existe uma importação concluída para comparar." }, { status: 404 });
    const batch = batches[0] as { id: string; fileName: string; fileHash: string; rowsFound: number; rowsInserted: number; totalExcel: string | number; totalDatabase: string | number; createdAt: string };
    const storedRows = await sql`SELECT "sourceSheet", "sourceRow", "externalOrder", "supplier", "value", "deadlineStatus", "deliveryStatus" FROM "Order" WHERE "importBatchId"=${batch.id}` as DbOrder[];
    const dbRows = storedRows.filter((row) => Boolean(row.externalOrder.trim() && row.supplier.trim()));
    const dbMap = new Map(dbRows.map((row) => [`${normalize(row.sourceSheet)}:${row.sourceRow}`, row]));
    const mismatches: Array<{ sheet: string; row: number; order: string; fields: string[] }> = [];
    let matchedFields = 0;
    let checkedFields = 0;
    parsed.data.orders.forEach((excel: CheckOrder) => {
      const db = dbMap.get(`${normalize(excel.sourceSheet)}:${excel.sourceRow}`);
      if (!db) { mismatches.push({ sheet: excel.sourceSheet, row: excel.sourceRow, order: excel.order, fields: ["registro ausente"] }); return; }
      const checks = {
        pedido: db.externalOrder === excel.order,
        fornecedor: db.supplier === excel.supplier,
        valor: Math.abs(Number(db.value) - excel.value) < 0.005,
        status: classifyOrderStatus(db) === classifyOrderStatus(excel),
      };
      checkedFields += 4;
      matchedFields += Object.values(checks).filter(Boolean).length;
      const fields = Object.entries(checks).filter(([, ok]) => !ok).map(([field]) => field);
      if (fields.length) mismatches.push({ sheet: excel.sourceSheet, row: excel.sourceRow, order: excel.order, fields });
    });
    const excelTotal = parsed.data.totalExcel;
    const dbTotal = dbRows.reduce((sum, row) => sum + Number(row.value), 0);
    const hashMatch = parsed.data.fileHash === batch.fileHash;
    const rowMatch = parsed.data.rowsFound === dbRows.length;
    const valueMatch = Math.abs(excelTotal - dbTotal) < 0.01;
    const excelStatuses = countStatuses(parsed.data.orders);
    const databaseStatuses = countStatuses(dbRows);
    const statusMatch = ["Entregue", "No prazo", "Vencendo", "Vencido", "Outros"]
      .every((status) => (excelStatuses[status] ?? 0) === (databaseStatuses[status] ?? 0));
    const fieldAccuracy = checkedFields ? matchedFields / checkedFields : 0;
    const score = Math.round((Number(hashMatch) * 20 + Number(rowMatch) * 20 + Number(valueMatch) * 20 + Number(statusMatch) * 10 + fieldAccuracy * 30) * 10) / 10;

    return NextResponse.json({
      verifiedAt: new Date().toISOString(),
      fileName: batch.fileName,
      importedAt: new Date(batch.createdAt).toISOString(),
      score,
      hashMatch,
      rowMatch,
      valueMatch,
      statusMatch,
      rowsExcel: parsed.data.rowsFound,
      rowsDatabase: dbRows.length,
      totalExcel: excelTotal,
      totalDatabase: dbTotal,
      excelStatuses,
      databaseStatuses,
      mismatchCount: mismatches.length,
      mismatches: mismatches.slice(0, 20),
      proofCode: batch.fileHash.slice(0, 12).toUpperCase(),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Verification failed", error);
    return NextResponse.json({ message: "Não foi possível concluir a comparação com o banco." }, { status: 500 });
  }
}
