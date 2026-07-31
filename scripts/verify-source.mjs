import fs from "node:fs";
import crypto from "node:crypto";
import * as XLSX from "xlsx";
import { neon } from "@neondatabase/serverless";

const workbookPath = process.argv[2];
if (!workbookPath || !fs.existsSync(workbookPath)) throw new Error("Informe um arquivo Excel existente.");

const env = Object.fromEntries(fs.readFileSync(new URL("../.env", import.meta.url), "utf8")
  .split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1).replace(/^['\"]|['\"]$/g, "")]; }));
if (!env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const aliases = {
  sentAt: ["enviadoem"], expectedAt: ["vencimento", "datadevencimento"],
  supplier: ["nomefornec", "fornecedor", "fornece"], value: ["valortotal", "valor"],
  order: ["pedido", "numeropedido", "npedido"], carrier: ["transport", "transportadora"],
  deliveredAt: ["dtentrega", "dataentrega"], deadlineStatus: ["statuadevencimeno", "statusdevencimento", "statusvencimento"],
  deliveryStatus: ["statusdeentrega", "statusentrega"], invoice: ["nf", "notafiscal"],
};
const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
const identify = (value) => Object.entries(aliases).find(([, options]) => options.includes(normalize(value)))?.[0];
const parseValue = (input) => {
  if (typeof input === "number") return Number.isFinite(input) ? input : Number.NaN;
  const raw = String(input ?? "").replace(/[^\d,.-]/g, "");
  if (!raw) return 0;
  if (raw.includes(",") && raw.includes(".")) return Number(raw.replace(/,/g, ""));
  if (raw.includes(",")) return Number(raw.replace(/,/g, "."));
  return Number(raw);
};
const statusOf = (row) => {
  const source = normalize(row.sourceSheet), deadline = normalize(row.deadlineStatus), delivery = normalize(row.deliveryStatus);
  if (source.includes("entreg")) return "Entregue";
  if (deadline.includes("foradoprazo") || deadline.includes("vencido") || deadline.includes("atras")) return "Vencido";
  if (deadline.includes("dentrodoprazo")) return "No prazo";
  if (deadline.includes("vencendo")) return "Vencendo";
  if (delivery.includes("foradoprazo")) return "Vencido";
  if (delivery.includes("atencao") || delivery.includes("vencendo")) return "Vencendo";
  if (delivery === "ok") return "No prazo";
  return "Outros";
};
const countStatuses = (rows) => rows.reduce((acc, row) => { const status = statusOf(row); acc[status] = (acc[status] ?? 0) + 1; return acc; }, {});

const bytes = fs.readFileSync(workbookPath);
const hash = crypto.createHash("sha256").update(bytes).digest("hex");
const workbook = XLSX.read(bytes, { type: "buffer", cellFormula: true, cellDates: true });
const wanted = ["Produtos a Receber", "Entregues"];
const sheets = wanted.map((name) => workbook.SheetNames.find((sheet) => normalize(sheet) === normalize(name))).filter(Boolean);
const excelRows = [];
const headers = {};

for (const sheetName of sheets) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  range.e.c = Math.min(range.e.c, 63);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true, blankrows: false, range: XLSX.utils.encode_range(range) });
  const headerRow = rows.slice(0, 40).reduce((best, row, index) => {
    const score = new Set(row.map(identify).filter(Boolean)).size;
    return score > best.score ? { index, score } : best;
  }, { index: 0, score: -1 }).index;
  const map = new Map();
  rows[headerRow]?.forEach((header, index) => { const field = identify(header); if (field && !map.has(field)) map.set(field, index); });
  headers[sheetName] = { row: headerRow + 1, fields: [...map.keys()] };
  rows.slice(headerRow + 1).forEach((row, offset) => {
    if (!row.some((value) => value !== null && value !== "")) return;
    const get = (field) => map.has(field) ? row[map.get(field)] : null;
    const rawOrder = String(get("order") ?? "").trim();
    const [order, ...client] = rawOrder.split(" - ");
    excelRows.push({ sourceSheet: sheetName, sourceRow: headerRow + offset + 2, order, client: client.join(" - "), supplier: String(get("supplier") ?? "").trim(), value: parseValue(get("value")), deadlineStatus: String(get("deadlineStatus") ?? "").trim(), deliveryStatus: String(get("deliveryStatus") ?? "").trim() });
  });
}

const sourceQuality = {
  uniqueOrderNumbers: new Set(excelRows.map((row) => normalize(row.order)).filter(Boolean)).size,
  missingOrder: excelRows.filter((row) => !row.order).length,
  missingSupplier: excelRows.filter((row) => !row.supplier).length,
  blankOrderAndSupplier: excelRows.filter((row) => !row.order && !row.supplier).length,
  rowsBySheet: Object.fromEntries(sheets.map((sheet) => [sheet, excelRows.filter((row) => row.sourceSheet === sheet).length])),
  sampleMissing: excelRows.filter((row) => !row.order || !row.supplier).slice(0, 12),
};
const validExcelRows = excelRows.filter((row) => Boolean(row.order && row.supplier));
if (process.argv.includes("--workbook-only")) {
  console.log(JSON.stringify({ sheets, headers, physicalRows: excelRows.length, accepted: { rows: validExcelRows.length, total: validExcelRows.reduce((sum, row) => sum + row.value, 0), statuses: countStatuses(validExcelRows) }, sourceQuality }, null, 2));
  process.exit(0);
}

const sql = neon(env.DATABASE_URL);
const batches = await sql`SELECT "id", "fileName", "fileHash", "rowsFound", "rowsInserted", "totalExcel", "totalDatabase", "integrityScore", "createdAt" FROM "ImportBatch" WHERE "status"='COMPLETED' ORDER BY "createdAt" DESC LIMIT 1`;
if (!batches.length) throw new Error("Nenhuma importação concluída no banco.");
const batch = batches[0];
const storedDbRows = await sql`SELECT "sourceSheet", "sourceRow", "externalOrder", "supplier", "value", "deadlineStatus", "deliveryStatus" FROM "Order" WHERE "importBatchId"=${batch.id} ORDER BY "sourceSheet", "sourceRow"`;
const dbRows = storedDbRows.filter((row) => Boolean(row.externalOrder?.trim() && row.supplier?.trim()));
const issueRows = await sql`SELECT "type", COUNT(*)::int AS "count" FROM "ValidationIssue" WHERE "importBatchId"=${batch.id} GROUP BY "type" ORDER BY "type"`;
const dbMap = new Map(dbRows.map((row) => [`${normalize(row.sourceSheet)}:${row.sourceRow}`, row]));
const mismatches = [];
for (const row of validExcelRows) {
  const db = dbMap.get(`${normalize(row.sourceSheet)}:${row.sourceRow}`);
  if (!db) { mismatches.push({ sheet: row.sourceSheet, row: row.sourceRow, reason: "não gravado" }); continue; }
  const checks = {
    pedido: String(db.externalOrder) === row.order,
    fornecedor: String(db.supplier) === row.supplier,
    valor: Math.abs(Number(db.value) - row.value) < 0.005,
    status: statusOf({ sourceSheet: db.sourceSheet, deadlineStatus: db.deadlineStatus, deliveryStatus: db.deliveryStatus }) === statusOf(row),
  };
  if (Object.values(checks).some((ok) => !ok)) mismatches.push({ sheet: row.sourceSheet, row: row.sourceRow, order: row.order, checks });
}

const excelTotal = validExcelRows.reduce((sum, row) => sum + row.value, 0);
const dbTotal = dbRows.reduce((sum, row) => sum + Number(row.value), 0);
const result = {
  verifiedAt: new Date().toISOString(), workbook: workbookPath, fileHashMatchesLatestImport: hash === batch.fileHash,
  sheets, headers, excel: { rows: validExcelRows.length, total: excelTotal, statuses: countStatuses(validExcelRows) },
  sourceQuality,
  database: { rows: dbRows.length, total: dbTotal, statuses: countStatuses(dbRows) },
  importBatch: { fileName: batch.fileName, rowsFound: batch.rowsFound, rowsInserted: batch.rowsInserted, totalExcel: Number(batch.totalExcel), totalDatabase: Number(batch.totalDatabase), integrity: Number(batch.integrityScore), issues: Object.fromEntries(issueRows.map((row) => [row.type, row.count])), createdAt: batch.createdAt },
  reconciliation: { rowDifference: validExcelRows.length - dbRows.length, valueDifference: excelTotal - dbTotal, mismatchCount: mismatches.length, sampleMismatches: mismatches.slice(0, 20) },
};
console.log(JSON.stringify(result, null, 2));
