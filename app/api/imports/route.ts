import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { prisma } from "@/lib/db/prisma";

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
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed; }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const parsed = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000); return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
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
    const existing = await prisma.importBatch.findUnique({ where: { fileHash: data.fileHash } });
    if (existing) return NextResponse.json({ message: "Esta mesma planilha já foi importada.", importId: existing.id }, { status: 409 });

    const batch = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email }, update: { name: signedUser?.displayName ?? "Usuário LogiSight" },
        create: { email, name: signedUser?.displayName ?? "Usuário LogiSight", passwordHash: "SIWC_MANAGED", role: "ADMIN" },
      });
      const created = await tx.importBatch.create({ data: {
        fileName: data.fileName, fileHash: data.fileHash, status: "PROCESSING", sheetsUsed: data.sheetsUsed,
        rowsFound: data.rowsFound, rowsInserted: 0, totalExcel: new Prisma.Decimal(data.totalExcel), totalDatabase: new Prisma.Decimal(0),
        integrityScore: new Prisma.Decimal(data.integrity), durationMs: data.durationMs, userId: user.id,
      }});
      await tx.order.createMany({ data: validOrders.map((order) => ({
        externalOrder: order.order.trim(), client: order.client || null, supplier: order.supplier.trim(), carrier: order.carrier || null,
        invoice: order.invoice || null, value: new Prisma.Decimal(order.value), sentAt: excelDate(order.sentAt), expectedAt: excelDate(order.expectedAt),
        deliveredAt: excelDate(order.deliveredAt), deadlineStatus: order.deadlineStatus || null, deliveryStatus: order.deliveryStatus || null,
        sourceSheet: order.sourceSheet, sourceRow: order.sourceRow, importBatchId: created.id,
      })) });
      if (data.issues.length) await tx.validationIssue.createMany({ data: data.issues.map((issue) => ({
        type: issue.type, severity: issue.type === "duplicate" ? "warning" : "error", sourceSheet: issue.sheet,
        sourceRow: issue.row, externalOrder: issue.order || null, message: issue.message, importBatchId: created.id,
      })) });
      await tx.auditLog.create({ data: { action: "IMPORT_COMPLETED", entity: "ImportBatch", entityId: created.id, userId: user.id,
        metadata: { fileName: data.fileName, rowsFound: data.rowsFound, rowsInserted: validOrders.length } } });
      return tx.importBatch.update({ where: { id: created.id }, data: {
        status: "COMPLETED", rowsInserted: validOrders.length, totalDatabase: new Prisma.Decimal(totalDatabase),
      }});
    });
    return NextResponse.json({ importId: batch.id, rowsInserted: batch.rowsInserted, totalDatabase: Number(batch.totalDatabase), integrity: Number(batch.integrityScore) });
  } catch (error) {
    console.error("Import failed", error);
    return NextResponse.json({ message: "Não foi possível gravar a importação. Nenhum dado parcial foi mantido." }, { status: 500 });
  }
}
