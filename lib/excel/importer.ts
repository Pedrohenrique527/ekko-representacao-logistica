import type { WorkBook, WorkSheet } from "xlsx";

export type ImportedOrder = {
  sourceSheet: string;
  sourceRow: number;
  order: string;
  client: string;
  supplier: string;
  value: number;
  carrier: string;
  invoice: string;
  sentAt: unknown;
  expectedAt: unknown;
  deliveredAt: unknown;
  deadlineStatus: string;
  deliveryStatus: string;
};

export type AuditIssue = {
  type: "duplicate" | "missing" | "invalid-value" | "invalid-date";
  row: number;
  sheet: string;
  order: string;
  message: string;
};

export type ImportResult = {
  fileHash: string;
  sheetsUsed: string[];
  rowsFound: number;
  rowsAccepted: number;
  totalExcel: number;
  totalDatabase: number;
  integrity: number;
  columnsFound: string[];
  missingColumns: string[];
  issues: AuditIssue[];
  orders: ImportedOrder[];
};

const aliases = {
  sentAt: ["enviadoem"],
  // A planilha oficial possui tanto "Recebimento previsto para" quanto
  // "VENCIMENTO". Para os pedidos ativos, a data exibida como previsão de
  // entrega é exclusivamente o vencimento calculado pela planilha.
  expectedAt: ["vencimento", "datadevencimento"],
  supplier: ["nomefornec", "fornecedor", "fornece"],
  value: ["valortotal", "valor"],
  order: ["pedido", "numeropedido", "npedido"],
  carrier: ["transport", "transportadora"],
  deliveredAt: ["dtentrega", "dataentrega"],
  deadlineStatus: ["statuadevencimeno", "statusdevencimento", "statusvencimento"],
  deliveryStatus: ["statusdeentrega", "statusentrega"],
  invoice: ["nf", "notafiscal"],
} as const;

type Field = keyof typeof aliases;
const required: Field[] = ["supplier", "value", "order", "deadlineStatus"];

export const normalizeHeader = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9]/g, "")
  .toLocaleLowerCase("pt-BR");

const identifyField = (value: unknown): Field | undefined => {
  const normalized = normalizeHeader(value);
  return (Object.entries(aliases) as [Field, readonly string[]][])
    .find(([, options]) => options.includes(normalized))?.[0];
};

const parseValue = (input: unknown) => {
  if (typeof input === "number") return Number.isFinite(input) ? input : Number.NaN;
  const raw = String(input ?? "").replace(/[^\d,.-]/g, "");
  if (!raw) return 0;
  if (raw.includes(",") && raw.includes(".")) return Number(raw.replace(/,/g, ""));
  if (raw.includes(",")) return Number(raw.replace(/,/g, "."));
  return Number(raw);
};

const splitOrder = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const [order, ...client] = raw.split(" - ");
  return { order, client: client.join(" - ") };
};

const readSheet = async (xlsx: typeof import("xlsx"), workbook: WorkBook, sheetName: string) => {
  const sheet: WorkSheet = workbook.Sheets[sheetName];
  const decoded = xlsx.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  decoded.e.c = Math.min(decoded.e.c, 63);
  const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
    range: xlsx.utils.encode_range(decoded),
  });

  const headerRow = rows.slice(0, 40).reduce(
    (best, row, index) => {
      const score = new Set(row.map(identifyField).filter(Boolean)).size;
      return score > best.score ? { index, score } : best;
    },
    { index: 0, score: -1 },
  ).index;

  const map = new Map<Field, number>();
  rows[headerRow]?.forEach((header, index) => {
    const field = identifyField(header);
    if (field && !map.has(field)) map.set(field, index);
  });

  const orders: ImportedOrder[] = [];
  const issues: AuditIssue[] = [];
  const seen = new Set<string>();

  rows.slice(headerRow + 1).forEach((row, offset) => {
    const sourceRow = headerRow + offset + 2;
    if (!row.some((value) => value !== null && value !== "")) return;
    const get = (field: Field) => map.has(field) ? row[map.get(field)!] : null;
    const parsed = splitOrder(get("order"));
    const supplier = String(get("supplier") ?? "").trim();
    const value = parseValue(get("value"));
    const carrier = String(get("carrier") ?? "").trim();
    const invoice = String(get("invoice") ?? "").trim();
    const deadlineStatus = String(get("deadlineStatus") ?? "").trim();
    const deliveryStatus = String(get("deliveryStatus") ?? "").trim();
    const meaningful = Boolean(parsed.order || supplier || carrier || invoice || deadlineStatus || deliveryStatus || value !== 0);
    if (!meaningful) return;

    if (!parsed.order || !supplier) {
      issues.push({ type: "missing", row: sourceRow, sheet: sheetName, order: parsed.order || "—", message: "Pedido ou fornecedor obrigatório não informado." });
    }
    if (!Number.isFinite(value)) {
      issues.push({ type: "invalid-value", row: sourceRow, sheet: sheetName, order: parsed.order || "—", message: "Valor não pôde ser interpretado." });
    }
    const duplicateKey = `${normalizeHeader(parsed.order)}:${normalizeHeader(supplier)}`;
    if (parsed.order && seen.has(duplicateKey)) {
      issues.push({ type: "duplicate", row: sourceRow, sheet: sheetName, order: parsed.order, message: "Possível pedido duplicado nesta aba." });
    }
    seen.add(duplicateKey);

    orders.push({
      sourceSheet: sheetName,
      sourceRow,
      order: parsed.order,
      client: parsed.client,
      supplier,
      value: Number.isFinite(value) ? value : 0,
      carrier,
      invoice,
      sentAt: get("sentAt"),
      expectedAt: get("expectedAt"),
      deliveredAt: get("deliveredAt"),
      deadlineStatus,
      deliveryStatus,
    });
  });

  return { map, orders, issues };
};

export async function parseExcelFile(file: File): Promise<ImportResult> {
  const xlsxModule = await import("xlsx");
  const xlsx = (xlsxModule.default ?? xlsxModule) as typeof import("xlsx");
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const fileHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const workbook = xlsx.read(bytes, {
    type: "array",
    cellFormula: true,
    cellDates: true,
  });

  const requested = ["Produtos a Receber", "Entregues"];
  const sheetsUsed = requested.flatMap((requestedName) => {
    const found = workbook.SheetNames.find(
      (sheet) => normalizeHeader(sheet) === normalizeHeader(requestedName),
    );
    return found ? [found] : [];
  });

  const parts = await Promise.all(sheetsUsed.map((sheet) => readSheet(xlsx, workbook, sheet)));
  const orders = parts.flatMap((part) => part.orders);
  const issues = parts.flatMap((part) => part.issues);
  const foundFields = new Set(parts.flatMap((part) => [...part.map.keys()]));
  const missingColumns = required.filter((field) => !foundFields.has(field));
  const rowsAccepted = orders.filter((order) => order.order && order.supplier).length;
  const totalExcel = orders.reduce((sum, order) => sum + order.value, 0);
  const penalty = issues.length + missingColumns.length * 25 + Math.max(0, requested.length - sheetsUsed.length) * 50;

  return {
    fileHash,
    sheetsUsed,
    rowsFound: orders.length,
    rowsAccepted,
    totalExcel,
    totalDatabase: totalExcel,
    integrity: Math.max(0, Math.round((1 - penalty / Math.max(orders.length, 1)) * 1000) / 10),
    columnsFound: [...foundFields],
    missingColumns,
    issues,
    orders,
  };
}
