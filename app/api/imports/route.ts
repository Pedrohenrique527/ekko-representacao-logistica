import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  sourceSheet: z.string().min(1), sourceRow: z.number().int().positive(), order: z.string(), client: z.string(),
  supplier: z.string(), value: z.number().finite(), carrier: z.string(), invoice: z.string(), sentAt: z.unknown(),
  expectedAt: z.unknown(), deliveredAt: z.unknown(), deadlineStatus: z.string(), deliveryStatus: z.string(),
});
const issueSchema = z.object({ type: z.string(), row: z.number().int().positive(), sheet: z.string(), order: z.string(), message: z.string() });
const payloadSchema = z.object({
  fileName: z.string().min(1), fileHash: z.string().length(64), sheetsUsed: z.array(z.string()),
  rowsFound: z.number().int().nonnegative(), rowsAccepted: z.number().int().nonnegative(), totalExcel: z.number().finite(),
  integrity: z.number().min(0).max(100), issues: z.array(issueSchema), orders: z.array(orderSchema), durationMs: z.number().int().nonnegative(),
});

function excelDate(value: unknown): Date | null {
  if (typeof value === "string" && value.trim()) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed; }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
  return null;
}

export async function POST(request: Request) {
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Os dados da planilha não passaram pela validação de segurança." }, { status: 400 });
    const data = parsed.data;
    const validOrders = data.orders.filter((order) => order.order.trim() && order.supplier.trim());
    const totalDatabase = validOrders.reduce((sum, order) => sum + order.value, 0);
    const signedUser = await getChatGPTUser();
    const email = signedUser?.email ?? (process.env.NODE_ENV === "development" ? "pessoalpedro5@gmail.com" : null);
    if (!email) return NextResponse.json({ message: "Faça login novamente para importar a planilha." }, { status: 401 });
    const connection = process.env.DATABASE_URL;
    if (!connection) return NextResponse.json({ message: "O banco de dados não está configurado no ambiente publicado." }, { status: 503 });
    const sql = neon(connection);
    const existing = await sql`SELECT "id" FROM "ImportBatch" WHERE "fileHash" = ${data.fileHash} LIMIT 1`;
    if (existing.length) return NextResponse.json({ message: "Esta mesma planilha já foi importada.", importId: existing[0].id }, { status: 409 });

    const userRows = await sql`SELECT "id" FROM "User" WHERE "email" = ${email} LIMIT 1`;
    const userId = userRows[0]?.id ?? crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const name = signedUser?.displayName ?? "Usuário LogiSight";
    const statements = [];
    if (!userRows.length) statements.push(sql`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt") VALUES (${userId}, ${name}, ${email}, 'SIWC_MANAGED', 'ADMIN', NOW(), NOW())`);
    statements.push(sql`INSERT INTO "ImportBatch" ("id", "fileName", "fileHash", "status", "sheetsUsed", "rowsFound", "rowsInserted", "totalExcel", "totalDatabase", "integrityScore", "durationMs", "userId", "createdAt") VALUES (${batchId}, ${data.fileName}, ${data.fileHash}, 'PROCESSING', ${data.sheetsUsed}, ${data.rowsFound}, 0, ${data.totalExcel}, 0, ${data.integrity}, ${data.durationMs}, ${userId}, NOW())`);
    for (const order of validOrders) {
      statements.push(sql`INSERT INTO "Order" ("id", "externalOrder", "client", "supplier", "carrier", "invoice", "value", "sentAt", "expectedAt", "deliveredAt", "deadlineStatus", "deliveryStatus", "sourceSheet", "sourceRow", "importBatchId", "createdAt") VALUES (${crypto.randomUUID()}, ${order.order.trim()}, ${order.client || null}, ${order.supplier.trim()}, ${order.carrier || null}, ${order.invoice || null}, ${order.value}, ${excelDate(order.sentAt)}, ${excelDate(order.expectedAt)}, ${excelDate(order.deliveredAt)}, ${order.deadlineStatus || null}, ${order.deliveryStatus || null}, ${order.sourceSheet}, ${order.sourceRow}, ${batchId}, NOW())`);
    }
    for (const issue of data.issues) statements.push(sql`INSERT INTO "ValidationIssue" ("id", "type", "severity", "sourceSheet", "sourceRow", "externalOrder", "message", "importBatchId", "createdAt") VALUES (${crypto.randomUUID()}, ${issue.type}, ${issue.type === "duplicate" ? "warning" : "error"}, ${issue.sheet}, ${issue.row}, ${issue.order || null}, ${issue.message}, ${batchId}, NOW())`);
    statements.push(sql`UPDATE "ImportBatch" SET "status" = 'COMPLETED', "rowsInserted" = ${validOrders.length}, "totalDatabase" = ${totalDatabase} WHERE "id" = ${batchId}`);
    statements.push(sql`INSERT INTO "AuditLog" ("id", "action", "entity", "entityId", "metadata", "userId", "createdAt") VALUES (${crypto.randomUUID()}, 'IMPORT_COMPLETED', 'ImportBatch', ${batchId}, ${JSON.stringify({ fileName: data.fileName, rowsFound: data.rowsFound, rowsInserted: validOrders.length })}::jsonb, ${userId}, NOW())`);
    await sql.transaction(statements);
    return NextResponse.json({ importId: batchId, rowsInserted: validOrders.length, totalDatabase, integrity: data.integrity });
  } catch (error) {
    console.error("Import failed", error);
    return NextResponse.json({ message: "Não foi possível gravar a importação. Nenhum dado parcial foi mantido." }, { status: 500 });
  }
}
