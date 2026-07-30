"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Database,
  FileBarChart,
  FileCheck2,
  FileSpreadsheet,
  HeartPulse,
  History,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, money, number } from "@/lib/utils";
import {
  emptyDashboard,
  type DashboardData,
  type DeliveryTiming,
  type Order,
  type OrderStatus,
  type SupplierSummary,
} from "@/lib/dashboard-data";
import { parseExcelFile, type ImportResult } from "@/lib/excel/importer";
import { AuthLoadingScreen, LogoutDialog } from "@/components/auth-experience";
import { DeveloperSignature, EkkoBrand } from "@/components/brand";

type PageId =
  | "dashboard"
  | "orders"
  | "delivered"
  | "suppliers"
  | "import"
  | "audit"
  | "health"
  | "reports"
  | "history"
  | "about";
type VerificationResult = {
  verifiedAt: string;
  fileName: string;
  importedAt: string;
  score: number;
  hashMatch: boolean;
  rowMatch: boolean;
  valueMatch: boolean;
  statusMatch: boolean;
  rowsExcel: number;
  rowsDatabase: number;
  totalExcel: number;
  totalDatabase: number;
  excelStatuses: Record<string, number>;
  databaseStatuses: Record<string, number>;
  mismatchCount: number;
  mismatches: Array<{
    sheet: string;
    row: number;
    order: string;
    fields: string[];
  }>;
  proofCode: string;
};

const nav = [
  {
    section: "VISÃO GERAL",
    items: [
      { id: "dashboard" as PageId, label: "Dashboard", icon: LayoutDashboard },
      { id: "orders" as PageId, label: "Pedidos ativos", icon: Boxes },
      {
        id: "delivered" as PageId,
        label: "Pedidos entregues",
        icon: PackageCheck,
      },
      { id: "suppliers" as PageId, label: "Fornecedores", icon: Building2 },
    ],
  },
  {
    section: "DADOS E CONTROLE",
    items: [
      { id: "import" as PageId, label: "Importar planilha", icon: UploadCloud },
      {
        id: "audit" as PageId,
        label: "Prova e auditoria",
        icon: ClipboardCheck,
      },
      { id: "health" as PageId, label: "Saúde da base", icon: HeartPulse },
      { id: "history" as PageId, label: "Histórico", icon: History },
    ],
  },
  {
    section: "ANÁLISES",
    items: [
      { id: "reports" as PageId, label: "Relatórios", icon: FileBarChart },
    ],
  },
  {
    section: "SISTEMA",
    items: [{ id: "about" as PageId, label: "Sobre", icon: Info }],
  },
];

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Visão executiva",
    subtitle: "Indicadores reais da última importação confirmada",
  },
  orders: {
    title: "Pedidos ativos",
    subtitle: "Pedidos ainda em acompanhamento operacional",
  },
  delivered: {
    title: "Pedidos entregues",
    subtitle: "Área exclusiva para os pedidos baixados",
  },
  suppliers: {
    title: "Fornecedores",
    subtitle: "Ranking, valor e desempenho por parceiro",
  },
  import: {
    title: "Importar planilha",
    subtitle: "Leitura segura sem alterar o arquivo do Excel",
  },
  audit: {
    title: "Prova e auditoria",
    subtitle: "Comparação independente entre Excel e PostgreSQL",
  },
  health: {
    title: "Saúde da base",
    subtitle: "Qualidade e ocorrências encontradas na origem",
  },
  reports: {
    title: "Central de relatórios",
    subtitle: "Relatórios com dados confirmados no banco",
  },
  history: {
    title: "Histórico",
    subtitle: "Rastreabilidade da última importação confirmada",
  },
  about: {
    title: "Sobre o sistema",
    subtitle: "Objetivo, arquitetura e evolução da plataforma",
  },
};

const statusClasses: Record<OrderStatus, string> = {
  "No prazo": "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
  Vencendo: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  Vencido: "border-red-500/25 bg-red-500/10 text-[var(--danger)]",
  Entregue: "border-cyan-500/25 bg-cyan-500/10 text-cyan-500",
  Outros: "border-slate-500/25 bg-slate-500/10 text-slate-500",
};
const deliveryTimingClasses: Record<DeliveryTiming, string> = {
  "Dentro do prazo": "border-emerald-500/25 bg-emerald-500/10 text-[var(--success)]",
  "Fora do prazo": "border-red-500/25 bg-red-500/10 text-[var(--danger)]",
  "Não informado": "border-slate-500/25 bg-slate-500/10 text-[var(--muted)]",
};
const deliveryTimingLabel: Record<DeliveryTiming, string> = {
  "Dentro do prazo": "Entregue dentro do prazo",
  "Fora do prazo": "Entregue fora do prazo",
  "Não informado": "Não informado na planilha",
};
const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function statusColor(name: string) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  if (normalized.includes("entreg")) return "var(--accent)";
  if (normalized.includes("vencendo")) return "var(--warning)";
  if (normalized.includes("vencido")) return "var(--danger)";
  if (normalized.includes("prazo")) return "var(--success)";
  return "var(--muted)";
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <EkkoBrand compact={compact} />;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  detail,
  tooltip,
}: {
  label: string;
  value: string;
  icon: ElementType;
  tone?: "brand" | "green" | "amber" | "red" | "cyan";
  detail?: string;
  tooltip: string;
}) {
  const tones = {
    brand: "bg-[var(--primary-soft)] text-[var(--primary)]",
    green: "bg-emerald-500/10 text-[var(--success)]",
    amber: "bg-orange-500/10 text-[var(--warning)]",
    red: "bg-red-500/10 text-[var(--danger)]",
    cyan: "bg-cyan-500/10 text-[var(--accent)]",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group relative min-h-[150px] rounded-[10px] bg-transparent p-4 transition-colors hover:bg-[var(--surface-2)]"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid size-9 place-items-center rounded-[9px]",
            tones[tone],
          )}
        >
          <Icon size={18} />
        </div>
        <div className="flex items-center gap-2">
          {detail && <span className="text-[10px] font-medium text-[var(--muted)]">{detail}</span>}
          <button type="button" aria-label={`Explicar ${label}`} className="peer grid size-7 place-items-center rounded-[7px] text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:text-[var(--text)]">
            <Info size={14} />
          </button>
          <span role="tooltip" className="pointer-events-none absolute right-3 top-12 z-20 w-64 translate-y-1 rounded-[9px] border border-[var(--border-strong)] bg-[var(--surface-3)] p-3 text-left text-[11px] font-normal leading-5 text-[var(--text)] opacity-0 shadow-xl transition duration-150 peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100">
            {tooltip}
          </span>
        </div>
      </div>
      <p className="mt-4 min-h-8 text-[11px] font-medium leading-4 text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold tracking-[-0.025em] text-[var(--text)]">
        {value}
      </p>
    </motion.div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function DashboardView({
  navigate,
  data,
  loading,
}: {
  navigate: (page: PageId) => void;
  data: DashboardData;
  loading: boolean;
}) {
  const { metrics, monthlyOrders, statusData, suppliers, orders } = data;
  const years = useMemo(
    () =>
      [...new Set(monthlyOrders.map((item) => item.month.slice(0, 4)))]
        .sort()
        .reverse(),
    [monthlyOrders],
  );
  const [year, setYear] = useState("Todos");
  const [month, setMonth] = useState("Todos");
  const [trendWindow, setTrendWindow] = useState("12");
  const filteredFinancial = monthlyOrders.filter(
    (item) =>
      (year === "Todos" || item.month.startsWith(year)) &&
      (month === "Todos" || item.month.slice(5, 7) === month),
  );
  const trendData =
    trendWindow === "Todos"
      ? monthlyOrders
      : monthlyOrders.slice(-Number(trendWindow));
  const filteredValue = filteredFinancial.reduce(
    (sum, item) => sum + item.valor,
    0,
  );

  return (
    <div className="space-y-5">
      <section className="border-b border-[var(--border)] pb-5 pt-1">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--primary)]">Visão geral</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)] sm:text-[28px]">
              Ekko Representação Logística
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              Business Intelligence para gestão de pedidos de representação
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
            {[
              [
                "ÚLTIMA ATUALIZAÇÃO",
                data.latestImport
                  ? new Date(data.latestImport.createdAt).toLocaleString(
                      "pt-BR",
                    )
                  : "Sem dados",
              ],
              [
                "ARQUIVO OFICIAL",
                data.latestImport?.fileName ?? "Nenhuma importação",
              ],
              ["RESPONSÁVEL", "Representação Ekko"],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 border-l border-[var(--border-strong)] pl-3">
                <p className="text-[9px] font-semibold tracking-[.1em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-1.5 max-w-52 truncate text-xs font-medium text-[var(--text)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {!loading && !data.hasData && (
        <Card className="border-amber-500/25 bg-amber-500/[.06] p-5">
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-500" size={19} />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                Nenhum dado real disponível
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Os indicadores permanecem zerados até uma planilha ser
                confirmada no banco.
              </p>
            </div>
          </div>
        </Card>
      )}
      {data.proof && (
        <Card className="border-emerald-500/20 bg-emerald-500/[.045] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/12 text-emerald-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  Conciliação básica aprovada
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {number.format(data.proof.rowsExcel)} linhas físicas lidas;{" "}
                  {number.format(metrics.total)} pedidos válidos.{" "}
                  {number.format(
                    Math.max(0, data.proof.rowsExcel - metrics.total),
                  )}{" "}
                  linhas sem pedido/fornecedor obrigatório foram
                  desconsideradas. Valor válido:{" "}
                  {money.format(metrics.totalValue)}.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate("audit")}
            >
              Ver prova completa
              <ChevronRight size={14} />
            </Button>
          </div>
        </Card>
      )}
      <section aria-label="Indicadores operacionais" className="grid grid-cols-1 overflow-visible rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total de pedidos"
          value={number.format(metrics.total)}
          icon={PackageOpen}
          tooltip="Quantidade total de pedidos válidos gravados na importação mais recente, incluindo ativos e entregues."
        />
        <MetricCard
          label="Pedidos entregues"
          value={number.format(metrics.delivered)}
          icon={PackageCheck}
          tone="cyan"
          tooltip="Pedidos baixados que vieram da aba ENTREGUES da planilha oficial."
        />
        <MetricCard
          label="Pedidos não entregues"
          value={number.format(metrics.active)}
          icon={Activity}
          tone="amber"
          tooltip="Pedidos que continuam em acompanhamento e ainda não constam como entregues na planilha oficial."
        />
        <MetricCard
          label="Pedidos não entregues (dentro do prazo de entrega)"
          value={number.format(metrics.onTime)}
          icon={ShieldCheck}
          tone="green"
          tooltip="Pedidos não entregues cujo status calculado e salvo pelo Excel indica que ainda estão dentro do prazo."
        />
        <MetricCard
          label="Pedidos não entregues (próximos ao vencimento de entrega)"
          value={number.format(metrics.expiring)}
          icon={Clock3}
          tone="amber"
          tooltip="Pedidos não entregues que a fórmula da planilha oficial classifica como próximos do vencimento."
        />
        <MetricCard
          label="Pedidos não entregues (serão entregues com atraso)"
          value={number.format(metrics.overdue)}
          icon={AlertTriangle}
          tone="red"
          tooltip="Pedidos não entregues que a fórmula da planilha oficial classifica como vencidos."
        />
      </section>
      <section aria-label="Indicadores financeiros" className="grid grid-cols-1 overflow-visible rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow)] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Valor total de todos os pedidos (R$)"
          value={money.format(metrics.totalValue)}
          icon={CircleDollarSign}
          tooltip="Soma do valor de todos os pedidos válidos da importação mais recente."
        />
        <MetricCard
          label="Soma dos pedidos entregues (R$)"
          value={money.format(metrics.deliveredValue)}
          icon={PackageCheck}
          tone="cyan"
          tooltip="Soma dos valores dos pedidos já entregues e baixados na planilha oficial."
        />
        <MetricCard
          label="Soma dos pedidos ainda não entregues (R$)"
          value={money.format(metrics.pendingValue)}
          icon={Clock3}
          tone="amber"
          tooltip="Soma dos valores dos pedidos que ainda permanecem em acompanhamento."
        />
        <MetricCard
          label="Valor médio por pedido (R$)"
          value={money.format(metrics.averageTicket)}
          icon={TrendingUp}
          tooltip="Valor total dos pedidos dividido pela quantidade de pedidos válidos."
        />
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Card>
          <SectionHeader
            title="Evolução de pedidos"
            subtitle="Quantidade mensal com período selecionável"
            action={
              <select
                aria-label="Período da evolução"
                value={trendWindow}
                onChange={(e) => setTrendWindow(e.target.value)}
                className="control"
              >
                <option value="6">Últimos 6 meses</option>
                <option value="12">Últimos 12 meses</option>
                <option value="Todos">Todo o período</option>
              </select>
            }
          />
          <div className="h-[290px] px-2 pb-4 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -18, right: 10 }}>
                <defs>
                  <linearGradient
                    id="ekkoAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0" stopColor="var(--accent)" stopOpacity={0.28} />
                    <stop offset="1" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--chart-axis)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  stroke="var(--chart-axis)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text)",
                    boxShadow: "var(--shadow)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pedidos"
                  stroke="var(--accent)"
                  fill="url(#ekkoAreaGradient)"
                  strokeWidth={2.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionHeader
            title="Pedidos por status"
            subtitle="Distribuição da base confirmada"
          />
          <div className="grid grid-cols-[1.1fr_.9fr] items-center p-3">
            <div className="h-[245px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={87}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusData.map((item) => (
                      <Cell key={item.name} fill={statusColor(item.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      color: "var(--text)",
                      boxShadow: "var(--shadow)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {statusData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: statusColor(item.name) }}
                    />
                    {item.name}
                  </div>
                  <p className="ml-4 mt-1 text-lg font-semibold text-[var(--text)]">
                    {number.format(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <SectionHeader
            title="Valor movimentado"
            subtitle={`${money.format(filteredValue)} no período selecionado`}
            action={
              <div className="flex gap-2">
                <select
                  aria-label="Selecionar ano"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setMonth("Todos");
                  }}
                  className="control"
                >
                  <option>Todos</option>
                  {years.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select
                  aria-label="Selecionar mês"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="control"
                >
                  <option value="Todos">Todos os meses</option>
                  {monthNames.map((name, index) => (
                    <option
                      key={name}
                      value={String(index + 1).padStart(2, "0")}
                    >
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            }
          />
          <div className="h-[260px] px-2 pb-4 pt-5">
            {filteredFinancial.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredFinancial}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--chart-axis)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    stroke="var(--chart-axis)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(v) =>
                      `${(Number(v) / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    formatter={(v) => money.format(Number(v))}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      color: "var(--text)",
                      boxShadow: "var(--shadow)",
                    }}
                  />
                  <Bar dataKey="valor" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-xs text-[var(--muted)]">
                Nenhum movimento encontrado nesse período.
              </div>
            )}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <SectionHeader
            title="Top fornecedores"
            subtitle="Ranking por valor movimentado"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("suppliers")}
              >
                Ver todos
                <ChevronRight size={14} />
              </Button>
            }
          />
          <div className="mt-3 divide-y divide-[var(--border)]">
            {suppliers.slice(0, 5).map((supplier, index) => (
              <button
                key={supplier.name}
                onClick={() => navigate("suppliers")}
                className="grid w-full grid-cols-[30px_1fr_auto] items-center gap-3 px-5 py-3.5 text-left transition hover:bg-[var(--surface-2)]"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--muted)]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--text)]">
                    {supplier.name}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{
                        width: `${suppliers[0]?.value ? (supplier.value / suppliers[0].value) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[var(--text)]">
                    {money.format(supplier.value)}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {supplier.orders} pedidos
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <OrdersTable
        orders={orders.filter((order) => order.status !== "Entregue")}
        compact
        onOpenAll={() => navigate("orders")}
      />
    </div>
  );
}

function OrderModal({ order, onClose, hideStatus = false }: { order: Order; onClose: () => void; hideStatus?: boolean }) {
  const fields = [
    ["Pedido", order.order],
    ["Cliente", order.client],
    ["Fornecedor", order.supplier],
    ["Transportadora", order.carrier],
    ["Nota fiscal", order.invoice],
    ["Valor", money.format(order.value)],
    ["Enviado em", order.sentAt],
    ["Previsão", order.dueAt],
    ["Entregue em", order.deliveredAt],
    ...(order.status === "Entregue"
      ? [["Prazo da entrega", deliveryTimingLabel[order.deliveryTiming]]]
      : []),
    ["Origem", order.sourceSheet],
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--primary)]">
              Detalhes do pedido
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">
              {order.order}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[var(--muted)]">
                {label}
              </p>
              <p className="mt-1.5 text-xs font-medium text-[var(--text)]">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--border)] p-5">
          {hideStatus ? (
            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", deliveryTimingClasses[order.deliveryTiming])}>
              {deliveryTimingLabel[order.deliveryTiming]}
            </span>
          ) : (
            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusClasses[order.status])}>
              {order.status}
            </span>
          )}
          <p className="text-xs text-[var(--muted)]">
            Registro confirmado no PostgreSQL.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrdersTable({
  orders,
  compact = false,
  onOpenAll,
  title = "Base de pedidos",
  showDeliveryTiming = false,
}: {
  orders: Order[];
  compact?: boolean;
  onOpenAll?: () => void;
  title?: string;
  showDeliveryTiming?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [sort, setSort] = useState("pedido");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const pageSize = compact ? 5 : 20;
  const filtered = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            `${order.order} ${order.client} ${order.supplier} ${order.invoice} ${order.carrier} ${deliveryTimingLabel[order.deliveryTiming]}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (showDeliveryTiming || status === "Todos" || order.status === status),
        )
        .sort((a, b) =>
          sort === "valor"
            ? b.value - a.value
            : sort === "fornecedor"
              ? a.supplier.localeCompare(b.supplier)
              : a.order.localeCompare(b.order),
        ),
    [orders, query, status, sort],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = compact
    ? filtered.slice(0, 5)
    : filtered.slice((page - 1) * pageSize, page * pageSize);
  const exportCsv = () => {
    const clean = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
        showDeliveryTiming
        ? "Pedido;Cliente;Fornecedor;NF;Transportadora;Valor;Vencimento;Data da entrega;Prazo da entrega"
        : "Pedido;Cliente;Fornecedor;NF;Transportadora;Valor;Status",
      ...filtered.map((o) =>
        (showDeliveryTiming
          ? [o.order, o.client, o.supplier, o.invoice, o.carrier, o.value, o.dueAt, o.deliveredAt, deliveryTimingLabel[o.deliveryTiming]]
          : [o.order, o.client, o.supplier, o.invoice, o.carrier, o.value, o.status])
          .map(clean)
          .join(";"),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = title.toLowerCase().replaceAll(" ", "-") + ".csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo exportado", {
      description: `${filtered.length} registros incluídos.`,
    });
  };
  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              {compact ? "Pedidos recentes" : title}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {number.format(filtered.length)} registros encontrados
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!compact && (
              <>
                <div className="group/search relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-transform duration-200 group-focus-within/search:translate-x-0.5 group-focus-within/search:text-[var(--primary)]"
                    size={14}
                  />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Pedido, cliente, fornecedor..."
                    className="w-64 pl-9"
                  />
                </div>
                {!showDeliveryTiming && (
                  <select
                    aria-label="Filtrar status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="control"
                  >
                    <option>Todos</option>
                    {["No prazo", "Vencendo", "Vencido", "Entregue", "Outros"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                )}
                <select
                  aria-label="Ordenar pedidos"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="control"
                >
                  <option value="pedido">Ordenar por pedido</option>
                  <option value="fornecedor">Por fornecedor</option>
                  <option value="valor">Maior valor</option>
                </select>
                <Button variant="secondary" size="sm" onClick={exportCsv}>
                  <ArrowDownToLine size={14} />
                  Exportar
                </Button>
              </>
            )}
            {compact && (
              <Button variant="ghost" size="sm" onClick={onOpenAll}>
                Ver todos
                <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left", showDeliveryTiming ? "min-w-[1140px]" : "min-w-[940px]")}>
            <thead className="sticky top-0 z-10 bg-[var(--surface)]">
              <tr className="border-b border-[var(--border)] text-[9px] uppercase tracking-[.09em] text-[var(--muted)]">
                <th className="px-5 py-3">Pedido</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Fornecedor</th>
                <th className="px-3 py-3">NF</th>
                <th className="px-3 py-3">Valor</th>
                <th className="px-3 py-3">{showDeliveryTiming ? "Vencimento / entrega" : "Previsão / entrega"}</th>
                {!showDeliveryTiming && <th className="px-3 py-3">Status</th>}
                {showDeliveryTiming && <th className="px-3 py-3">Prazo da entrega</th>}
                <th className="px-5 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visible.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-[var(--surface-2)]"
                >
                  <td className="px-5 py-3.5 text-xs font-semibold text-[var(--primary)]">
                    {order.order}
                  </td>
                  <td className="max-w-[190px] truncate px-3 text-xs text-[var(--text)]">
                    {order.client}
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {order.supplier}
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {order.invoice}
                  </td>
                  <td className="px-3 text-xs font-medium text-[var(--text)]">
                    {money.format(order.value)}
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {showDeliveryTiming ? (
                      <div className="space-y-1 py-2">
                        <p><span className="text-[9px] uppercase tracking-[.06em] text-[var(--muted)]">Vencimento</span> <span className="ml-1 text-[var(--text)]">{order.dueAt}</span></p>
                        <p><span className="text-[9px] uppercase tracking-[.06em] text-[var(--muted)]">Entrega</span> <span className="ml-1 text-[var(--text)]">{order.deliveredAt}</span></p>
                      </div>
                    ) : order.status === "Entregue" ? order.deliveredAt : order.dueAt}
                  </td>
                  {!showDeliveryTiming && (
                    <td className="px-3">
                      <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold", statusClasses[order.status])}>
                        {order.status}
                      </span>
                    </td>
                  )}
                  {showDeliveryTiming && (
                    <td className="px-3">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold", deliveryTimingClasses[order.deliveryTiming])}>
                        {deliveryTimingLabel[order.deliveryTiming]}
                      </span>
                    </td>
                  )}
                  <td className="px-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(order)}
                    >
                      Abrir
                      <ChevronRight size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="p-10 text-center text-xs text-[var(--muted)]">
              Nenhum pedido corresponde aos filtros.
            </p>
          )}
        </div>
        {!compact && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
            <p className="text-xs text-[var(--muted)]">
              Página {page} de {pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
      <AnimatePresence>
        {selected && (
            <OrderModal order={selected} hideStatus={showDeliveryTiming} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DeliveredView({ data }: { data: DashboardData }) {
  const delivered = data.orders.filter((order) => order.status === "Entregue");
  const deliveredOnTime = delivered.filter((order) => order.deliveryTiming === "Dentro do prazo").length;
  const deliveredLate = delivered.filter((order) => order.deliveryTiming === "Fora do prazo").length;
  const deliveryTimingMissing = delivered.filter((order) => order.deliveryTiming === "Não informado").length;
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-cyan-500/20 bg-[linear-gradient(135deg,var(--surface),rgba(6,182,212,.08))] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-cyan-500">
              Baixados / entregues
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
              Pedidos concluídos
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Registros vindos exclusivamente da aba ENTREGUES. A classificação de prazo é lida do resultado salvo pelo Excel.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[10px] text-[var(--muted)]">QUANTIDADE</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                {number.format(delivered.length)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[.055] p-4">
              <p className="text-[10px] text-[var(--muted)]">DENTRO DO PRAZO</p>
              <p className="mt-1 text-xl font-semibold text-[var(--success)]">
                {number.format(deliveredOnTime)}
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[.055] p-4">
              <p className="text-[10px] text-[var(--muted)]">FORA DO PRAZO</p>
              <p className="mt-1 text-xl font-semibold text-[var(--danger)]">
                {number.format(deliveredLate)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[10px] text-[var(--muted)]">VALOR ENTREGUE</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                {money.format(
                  delivered.reduce((sum, item) => sum + item.value, 0),
                )}
              </p>
            </div>
          </div>
        </div>
        {deliveryTimingMissing > 0 && (
          <div className="mt-5 flex items-start gap-2 border-t border-[var(--border)] pt-4 text-[11px] text-[var(--muted)]">
            <Info size={14} className="mt-px shrink-0 text-[var(--warning)]" />
            {number.format(deliveryTimingMissing)} pedido(s) entregue(s) sem classificação de prazo informada pela planilha. Esses registros não foram classificados automaticamente.
          </div>
        )}
      </Card>
      <OrdersTable orders={delivered} title="Pedidos entregues" showDeliveryTiming />
    </div>
  );
}

function ImportView({
  onResult,
}: {
  onResult: (result: ImportResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const process = async (selected: File) => {
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Selecione um arquivo .xlsx");
      return;
    }
    setFile(selected);
    setResult(null);
    setProgress(12);
    setStage("Lendo cabeçalhos e resultados salvos");
    const started = Date.now();
    try {
      const parsed = await parseExcelFile(selected);
      setProgress(62);
      setStage("Gravando no PostgreSQL");
      const response = await fetch("/api/imports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed,
          fileName: selected.name,
          durationMs: Date.now() - started,
        }),
      });
      const saved = (await response.json()) as {
        message?: string;
        rowsInserted?: number;
        totalDatabase?: number;
      };
      if (!response.ok)
        throw new Error(saved.message ?? "Não foi possível gravar.");
      parsed.rowsAccepted = saved.rowsInserted ?? parsed.rowsAccepted;
      parsed.totalDatabase = saved.totalDatabase ?? parsed.totalDatabase;
      setResult(parsed);
      onResult(parsed);
      setProgress(100);
      setStage("Importação confirmada");
      toast.success("Importação concluída", {
        description: `${parsed.rowsAccepted} registros gravados.`,
      });
    } catch (error) {
      setProgress(0);
      setStage("");
      toast.error("Importação não concluída", {
        description:
          error instanceof Error ? error.message : "Verifique o arquivo.",
      });
    }
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Nova importação
            </h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Somente leitura. Nenhuma célula ou fórmula é modificada.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-500">
            MODO SOMENTE LEITURA
          </span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex min-h-[320px] w-full flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-8 text-center transition hover:border-[var(--primary)]"
        >
          <div className="grid size-14 place-items-center rounded-[12px] bg-[var(--primary-soft)] text-[var(--primary)]">
            <FileSpreadsheet size={26} />
          </div>
          <h4 className="mt-5 text-base font-semibold text-[var(--text)]">
            Selecione a planilha oficial
          </h4>
          <p className="mt-2 max-w-md text-xs leading-5 text-[var(--muted)]">
            Usaremos somente Produtos a receber e ENTREGUES. As demais abas
            serão ignoradas.
          </p>
          <span className="mt-5 rounded-[9px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm">
            Escolher arquivo
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void process(selected);
          }}
        />
        {file && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text)]">
                  {file.name}
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">{stage}</p>
              </div>
              <b className="text-xs text-[var(--text)]">{progress}%</b>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-[var(--primary)]"
              />
            </div>
          </div>
        )}
        {result && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat
              label="Linhas"
              value={number.format(result.rowsFound)}
              ok={result.rowsFound === result.rowsAccepted}
            />
            <MiniStat
              label="Gravadas"
              value={number.format(result.rowsAccepted)}
              ok={result.rowsAccepted === result.rowsFound}
            />
            <MiniStat
              label="Abas"
              value={String(result.sheetsUsed.length)}
              ok={result.sheetsUsed.length === 2}
            />
            <MiniStat
              label="Valor"
              value={money.format(result.totalDatabase)}
              ok={Math.abs(result.totalExcel - result.totalDatabase) < 0.01}
            />
          </div>
        )}
      </Card>
      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Garantias do processo
          </h3>
          <div className="mt-5 space-y-4">
            {[
              [
                ShieldCheck,
                "Arquivo preservado",
                "O sistema não grava no Excel.",
              ],
              [
                Search,
                "Cabeçalhos inteligentes",
                "A posição das colunas pode mudar.",
              ],
              [
                Database,
                "Banco de dados",
                "Dashboards consultam somente o PostgreSQL.",
              ],
              [ClipboardCheck, "Auditoria", "Totais e linhas são conciliados."],
            ].map(([Icon, title, text]) => (
              <div key={String(title)} className="flex gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text)]">
                    {title as string}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {text as string}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--muted)]">{label}</span>
        {ok ? (
          <Check size={14} className="text-emerald-500" />
        ) : (
          <XCircle size={14} className="text-[var(--danger)]" />
        )}
      </div>
      <p className="mt-2 text-lg font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function VerificationPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const verify = async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const parsed = await parseExcelFile(file);
      const accepted = parsed.orders.filter(
        (order) => order.order.trim() && order.supplier.trim(),
      );
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileHash: parsed.fileHash,
          rowsFound: accepted.length,
          totalExcel: accepted.reduce((sum, order) => sum + order.value, 0),
          orders: accepted.map((o) => ({
            sourceSheet: o.sourceSheet,
            sourceRow: o.sourceRow,
            order: o.order,
            supplier: o.supplier,
            value: o.value,
            deadlineStatus: o.deadlineStatus,
            deliveryStatus: o.deliveryStatus,
          })),
        }),
      });
      const data = (await response.json()) as VerificationResult & {
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.message ?? "Falha na verificação.");
      setResult(data);
      toast.success("Verificação concluída", {
        description: `Compatibilidade de ${data.score}%.`,
      });
    } catch (error) {
      toast.error("Não foi possível verificar", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };
  const checks = result
    ? [
        ["Arquivo idêntico ao importado", result.hashMatch],
        ["Quantidade de linhas", result.rowMatch],
        ["Valor total", result.valueMatch],
        ["Contagem por status", result.statusMatch],
        ["Registros linha a linha", result.mismatchCount === 0],
      ]
    : [];
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-cyan-500">
            Teste independente
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
            Provar resultados agora
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Selecione a mesma planilha. Ela será apenas lida e comparada linha
            por linha com o banco.
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={loading}>
          <ClipboardCheck size={16} />
          {loading ? "Comparando..." : "Selecionar e comparar"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void verify(file);
            e.target.value = "";
          }}
        />
      </div>
      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
            <div className="grid place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/[.07] p-5 text-center">
              <p className="text-4xl font-semibold text-emerald-500">
                {result.score}%
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">
                Compatibilidade
              </p>
              <p className="mt-2 text-[10px] text-[var(--muted)]">
                Código {result.proofCode}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {checks.map(([label, ok]) => (
                <div
                  key={String(label)}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  {ok ? (
                    <Check className="text-emerald-500" size={17} />
                  ) : (
                    <XCircle className="text-[var(--danger)]" size={17} />
                  )}
                  <span className="text-xs font-medium text-[var(--text)]">
                    {label as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Linhas Excel × banco"
              value={`${number.format(result.rowsExcel)} × ${number.format(result.rowsDatabase)}`}
              ok={result.rowMatch}
            />
            <MiniStat
              label="Valor Excel × banco"
              value={`${money.format(result.totalExcel)} × ${money.format(result.totalDatabase)}`}
              ok={result.valueMatch}
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="bg-[var(--surface-2)] text-[9px] uppercase tracking-[.1em] text-[var(--muted)]">
                  <th className="p-3">Status</th>
                  <th className="p-3">Excel</th>
                  <th className="p-3">Banco</th>
                  <th className="p-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {["Entregue", "No prazo", "Vencendo", "Vencido", "Outros"].map(
                  (status) => (
                    <tr
                      key={status}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="p-3 text-xs text-[var(--text)]">
                        {status}
                      </td>
                      <td className="p-3 text-xs text-[var(--muted)]">
                        {result.excelStatuses[status] ?? 0}
                      </td>
                      <td className="p-3 text-xs text-[var(--muted)]">
                        {result.databaseStatuses[status] ?? 0}
                      </td>
                      <td className="p-3">
                        {(result.excelStatuses[status] ?? 0) ===
                        (result.databaseStatuses[status] ?? 0) ? (
                          <Check size={16} className="text-emerald-500" />
                        ) : (
                          <XCircle size={16} className="text-[var(--danger)]" />
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {result.mismatchCount === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[.06] p-4 text-xs text-emerald-600">
              Nenhuma divergência encontrada nos pedidos, fornecedores, valores
              ou status.
            </div>
          ) : (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[.06] p-4 text-xs text-[var(--danger)]">
              {result.mismatchCount} divergências encontradas. As primeiras
              ocorrências foram registradas para revisão.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AuditView({
  data,
  importResult,
}: {
  data: DashboardData;
  importResult: ImportResult | null;
}) {
  const proof = data.proof;
  const exportAudit = () => {
    if (!proof) {
      toast.error("Nenhuma auditoria disponível");
      return;
    }
    const csv = `Indicador;Excel;Banco;Resultado\nLinhas;${proof.rowsExcel};${proof.rowsDatabase};${proof.rowMatch ? "OK" : "Divergente"}\nValor;${proof.totalExcel};${proof.totalDatabase};${proof.valueMatch ? "OK" : "Divergente"}\nCódigo de prova;${proof.fileHashPrefix};;`;
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria-ekko.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Auditoria exportada");
  };
  return (
    <div className="space-y-4">
      <VerificationPanel />
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--primary)]">
                Última importação
              </p>
              <h3 className="mt-2 text-sm font-semibold text-[var(--text)]">
                Conciliação armazenada
              </h3>
            </div>
            <Button variant="secondary" size="sm" onClick={exportAudit}>
              <ArrowDownToLine size={14} />
              Exportar
            </Button>
          </div>
          {proof ? (
            <div className="mt-5 space-y-3">
              <MiniStat
                label="Linhas Excel × banco"
                value={`${proof.rowsExcel} × ${proof.rowsDatabase}`}
                ok={proof.rowMatch}
              />
              <MiniStat
                label="Valor Excel × banco"
                value={`${money.format(proof.totalExcel)} × ${money.format(proof.totalDatabase)}`}
                ok={proof.valueMatch}
              />
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <p className="text-[10px] text-[var(--muted)]">
                  CÓDIGO DO ARQUIVO
                </p>
                <p className="mt-1 font-mono text-sm text-[var(--text)]">
                  {proof.fileHashPrefix}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-xs text-[var(--muted)]">
              Nenhuma importação confirmada.
            </p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            O que esta auditoria comprova
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [
                "Mesmo arquivo",
                "O código SHA-256 identifica se o arquivo é exatamente o importado.",
              ],
              [
                "Mesma quantidade",
                "Compara as linhas encontradas com as gravadas.",
              ],
              [
                "Mesmo valor",
                "Concilia o total do Excel com a soma no PostgreSQL.",
              ],
              ["Mesmos status", "Reconta cada status nos dois lados."],
              [
                "Linha a linha",
                "Compara pedido, fornecedor, valor e status de cada registro.",
              ],
              ["Sem alteração", "O teste nunca escreve no arquivo do Excel."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
              >
                <p className="text-xs font-semibold text-[var(--text)]">
                  {title}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                  {text}
                </p>
              </div>
            ))}
          </div>
          {importResult && (
            <p className="mt-4 text-xs text-[var(--muted)]">
              A importação atual encontrou {importResult.issues.length}{" "}
              ocorrências para revisão no arquivo de origem.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function SuppliersView({ suppliers }: { suppliers: SupplierSummary[] }) {
  return (
    <Card className="overflow-hidden">
      <SectionHeader
        title="Todos os fornecedores"
        subtitle="Ranking completo por valor movimentado"
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-y border-[var(--border)] text-[9px] uppercase tracking-[.09em] text-[var(--muted)]">
              <th className="px-5 py-3">Posição / fornecedor</th>
              <th className="px-3">Pedidos</th>
              <th className="px-3">Valor total</th>
              <th className="px-3">Vencidos</th>
              <th className="px-5">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {suppliers.map((supplier, index) => (
              <tr key={supplier.name} className="hover:bg-[var(--surface-2)]">
                <td className="px-5 py-4">
                  <span className="mr-3 inline-grid size-7 place-items-center rounded-lg bg-[var(--surface-2)] text-xs text-[var(--muted)]">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-[var(--text)]">
                    {supplier.name}
                  </span>
                </td>
                <td className="px-3 text-xs text-[var(--muted)]">
                  {supplier.orders}
                </td>
                <td className="px-3 text-xs font-semibold text-[var(--text)]">
                  {money.format(supplier.value)}
                </td>
                <td className="px-3 text-xs text-[var(--danger)]">{supplier.late}</td>
                <td className="px-5 text-xs font-semibold text-emerald-500">
                  {supplier.sla}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HealthView({ data }: { data: DashboardData }) {
  const proof = data.proof;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          Diagnóstico atual
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat
            label="Pedidos analisados"
            value={number.format(data.metrics.total)}
            ok={data.hasData}
          />
          <MiniStat
            label="Linhas conciliadas"
            value={number.format(proof?.rowsDatabase ?? 0)}
            ok={Boolean(proof?.rowMatch)}
          />
          <MiniStat
            label="Ocorrências na origem"
            value={number.format(proof?.issueCount ?? 0)}
            ok={(proof?.issueCount ?? 0) === 0}
          />
          <MiniStat
            label="Sem fornecedor"
            value={number.format(data.orders.filter((o) => !o.supplier).length)}
            ok={!data.orders.some((o) => !o.supplier)}
          />
          <MiniStat
            label="Sem transportadora"
            value={number.format(
              data.orders.filter((o) => o.carrier === "—").length,
            )}
            ok={!data.orders.some((o) => o.carrier === "—")}
          />
          <MiniStat label="Valores inválidos" value="0" ok />
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-2 text-[var(--primary)]">
          <Sparkles size={17} />
          <h3 className="text-sm font-semibold">Leitura responsável</h3>
        </div>
        <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
          Ocorrências não são corrigidas automaticamente. Elas são sinalizadas
          para que Allan revise o Excel, que continua sendo a fonte oficial.
        </p>
        <Button
          className="mt-5"
          variant="secondary"
          onClick={() =>
            toast.info(
              "Use a página Prova e auditoria para comparar a planilha atual.",
            )
          }
        >
          Como verificar
        </Button>
      </Card>
    </div>
  );
}

function ReportsView({ data }: { data: DashboardData }) {
  const reports = [
    "Relatório mensal",
    "Relatório financeiro",
    "Por fornecedor",
    "Relatório anual",
    "Por status",
  ];
  const generate = (title: string) => {
    if (!data.hasData) {
      toast.error("Nenhum dado real disponível.");
      return;
    }
    const popup = window.open("", "_blank", "width=1000,height=760");
    if (!popup) {
      toast.error("Permita janelas para gerar o relatório.");
      return;
    }
    const rows = data.suppliers
      .slice(0, 30)
      .map(
        (s) =>
          `<tr><td>${s.name}</td><td>${s.orders}</td><td>${money.format(s.value)}</td><td>${s.sla}%</td></tr>`,
      )
      .join("");
    popup.document.write(
      `<!doctype html><html><head><title>${title}</title><style>@page{size:A4;margin:18mm}body{font-family:Arial;color:#142126}header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #0e7182;padding-bottom:14px}header img{width:88px;border:1px solid #dce5e6;border-radius:8px}.meta{font-size:11px;color:#667}h1{font-size:21px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.card{border:1px solid #d9e2e3;padding:12px;border-radius:8px}.card small{color:#667}.card b{display:block;margin-top:6px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:8px;border-bottom:1px solid #d9e2e3;text-align:left}th{background:#f1f5f6}footer{position:fixed;bottom:0;border-top:1px solid #d9e2e3;width:100%;padding-top:8px;font-size:9px;color:#667}</style></head><body><header><img src="${location.origin}/ekko-logo.png"><div><h1>Ekko Representação Logística</h1><div>${title}</div><p class="meta">Gerado em ${new Date().toLocaleString("pt-BR")} • Usuário: representacao@ekkorevestimentos.com.br</p></div></header><div class="cards"><div class="card"><small>Pedidos</small><b>${data.metrics.total}</b></div><div class="card"><small>Valor</small><b>${money.format(data.metrics.totalValue)}</b></div><div class="card"><small>Entregues</small><b>${data.metrics.delivered}</b></div></div><table><thead><tr><th>Fornecedor</th><th>Pedidos</th><th>Valor</th><th>SLA</th></tr></thead><tbody>${rows}</tbody></table><footer>Ekko Representação Logística • Versão 1.6.0 • Desenvolvido por Pedro Mariniello</footer></body></html>`,
    );
    popup.document.close();
    setTimeout(() => popup.print(), 400);
  };
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((name, index) => (
        <Card key={name} className="p-5">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            {index % 2 ? <FileCheck2 size={20} /> : <BarChart3 size={20} />}
          </div>
          <h3 className="mt-5 text-sm font-semibold text-[var(--text)]">
            {name}
          </h3>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Gerado somente com a última base confirmada.
          </p>
          <Button className="mt-5" size="sm" onClick={() => generate(name)}>
            Gerar PDF
          </Button>
        </Card>
      ))}
    </div>
  );
}

function HistoryView({ data }: { data: DashboardData }) {
  return (
    <Card className="overflow-hidden">
      <SectionHeader
        title="Histórico completo de importações"
        subtitle={`${number.format(data.importHistory.length)} importações preservadas no PostgreSQL`}
      />
      {data.importHistory.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-y border-[var(--border)] text-[9px] uppercase tracking-[.09em] text-[var(--muted)]">
                <th className="px-5 py-3">Data e hora</th>
                <th className="px-3">Arquivo</th>
                <th className="px-3">Encontrados</th>
                <th className="px-3">Gravados</th>
                <th className="px-3">Integridade</th>
                <th className="px-3">Duração</th>
                <th className="px-3">Usuário</th>
                <th className="px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.importHistory.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-2)]">
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td
                    className="max-w-72 truncate px-3 text-xs font-medium text-[var(--text)]"
                    title={item.fileName}
                  >
                    {item.fileName}
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {number.format(item.rowsFound)}
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {number.format(item.rowsInserted)}
                  </td>
                  <td className="px-3 text-xs font-semibold text-emerald-500">
                    {item.integrity.toLocaleString("pt-BR")}%
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {(item.durationMs / 1000).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}
                    s
                  </td>
                  <td className="px-3 text-xs text-[var(--muted)]">
                    {item.userEmail}
                  </td>
                  <td className="px-5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        item.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : item.status === "FAILED"
                            ? "bg-red-500/10 text-[var(--danger)]"
                            : "bg-amber-500/10 text-amber-500",
                      )}
                    >
                      {item.status === "COMPLETED"
                        ? "Concluída"
                        : item.status === "FAILED"
                          ? "Falhou"
                          : "Em processamento"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-5 text-xs text-[var(--muted)]">
          Nenhuma importação encontrada.
        </p>
      )}
    </Card>
  );
}

function AboutView() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-7">
        <BrandLogo />
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--primary)]">
          Software corporativo exclusivo
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--text)]">
          Ekko Representação Logística
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Business Intelligence para Pedidos de Representação
        </p>
        <p className="mt-5 max-w-3xl text-xs leading-6 text-[var(--muted)]">
          O Excel permanece como fonte oficial. O sistema lê os resultados
          salvos, valida a integridade, grava no PostgreSQL e transforma os
          registros em indicadores gerenciais auditáveis.
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Tecnologias
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Next.js",
              "TypeScript",
              "TailwindCSS",
              "PostgreSQL / Neon",
              "Zod",
              "Recharts",
              "Framer Motion",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-1.5 text-[10px] text-[var(--primary)]"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--muted)]">
            Versão 1.6.0
          </p>
          <DeveloperSignature className="mt-3" />
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Próximas evoluções
          </h3>
          <div className="mt-4 space-y-2">
            {[
              "Integração automática com pasta",
              "Integração com ERP",
              "Alertas e notificações",
              "Relatórios agendados",
              "Metas e KPIs personalizados",
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-xl bg-[var(--surface-2)] p-3"
              >
                <span className="grid size-6 place-items-center rounded-full bg-[var(--primary-soft)] text-[10px] text-[var(--primary)]">
                  {index + 1}
                </span>
                <p className="text-xs text-[var(--muted)]">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function LogisticsBIV2() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initialStep, setInitialStep] = useState(0);
  const [initialError, setInitialError] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const paint = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const refresh = async (initial = false) => {
    setLoading(true);
    if (initial) {
      setInitializing(true);
      setInitialError("");
      setInitialStep(0);
    }
    try {
      if (initial) {
        await paint();
        setInitialStep(1);
        await paint();
      }
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.status === 401) {
        localStorage.removeItem("ekko-session-known");
        window.location.assign("/login?reason=expired");
        return;
      }
      if (!response.ok) throw new Error(`Falha ${response.status}`);
      if (initial) {
        setInitialStep(2);
        await paint();
      }
      const data = (await response.json()) as DashboardData;
      if (initial) {
        setInitialStep(3);
        await paint();
      }
      setDashboard(data);
      if (initial) {
        setInitialStep(4);
        await paint();
        setInitialStep(5);
        await paint();
        setInitialStep(6);
        await paint();
        setInitialStep(7);
        await paint();
        setInitialStep(8);
      }
    } catch {
      if (initial) {
        setInitialError(
          "A conexão com os dados reais não foi concluída. Verifique sua internet e tente novamente.",
        );
      } else {
        setDashboard(emptyDashboard);
        toast.error("Não foi possível consultar o banco", {
          description:
            "Os números foram zerados para evitar informação incorreta.",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const saved = localStorage.getItem("ekko-theme") === "light" || localStorage.getItem("pedro-theme") === "light";
    document.documentElement.dataset.theme = saved ? "light" : "dark";
    const frame = requestAnimationFrame(() => {
      setLight(saved);
      void refresh(true);
    });
    return () => cancelAnimationFrame(frame);
    // The first real-data refresh is intentionally executed only once after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const navigate = (next: PageId) => {
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("ekko-theme", next ? "light" : "dark");
  };
  const info = pageTitles[page];
  const confirmLogout = async () => {
    setLogoutBusy(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      localStorage.removeItem("ekko-session-known");
      sessionStorage.removeItem("ekko-auth-transition");
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("ekko-"))
            .map((key) => caches.delete(key)),
        );
      }
      window.location.assign("/login?loggedOut=1");
    } catch {
      setLogoutBusy(false);
      toast.error("Não foi possível encerrar a sessão", {
        description: "Tente novamente. Sua sessão continua protegida.",
      });
    }
  };
  if (initializing)
    return (
      <>
        <Toaster
          theme={light ? "light" : "dark"}
          richColors
          position="top-right"
        />
        <AuthLoadingScreen
          step={initialStep}
          error={initialError}
          onRetry={() => void refresh(true)}
          onReady={() => {
            sessionStorage.removeItem("ekko-auth-transition");
            setInitializing(false);
          }}
        />
      </>
    );
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <Toaster
        theme={light ? "light" : "dark"}
        richColors
        position="top-right"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-[width] duration-300 lg:flex",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div
          className={cn(
            "flex h-[88px] items-center border-b border-[var(--border)]",
            collapsed ? "justify-center px-3" : "px-5",
          )}
        >
          <BrandLogo compact={collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {nav.map((group) => (
            <div key={group.section} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-[9px] font-semibold tracking-[.14em] text-[var(--muted)]">
                  {group.section}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      title={collapsed ? item.label : undefined}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        "relative flex h-10 w-full items-center gap-3 rounded-[9px] px-3 text-left text-xs font-medium transition",
                        active
                          ? "bg-[var(--primary-soft)] text-[var(--accent)] before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--accent)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon size={16} />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-[var(--border)] p-3">
          {!collapsed && (
            <div className="mb-3 px-2 pt-1">
              <p className="text-[9px] text-[var(--muted)]">Versão 1.6.0</p>
              <DeveloperSignature className="mt-2" />
            </div>
          )}
          <button
            onClick={() => setLogoutOpen(true)}
            title="Sair do sistema"
            className={cn("flex h-10 w-full items-center gap-3 rounded-[9px] px-3 text-xs text-[var(--muted)] transition hover:bg-red-500/[.07] hover:text-[var(--danger)]", collapsed && "justify-center")}
          >
            <LogOut size={16} /> {!collapsed && "Sair do sistema"}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-[9px] px-3 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}{" "}
            {!collapsed && "Recolher menu"}
          </button>
        </div>
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[285px] overflow-y-auto bg-[var(--sidebar)] p-4"
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandLogo />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                >
                  <X size={17} />
                </Button>
              </div>
              {nav
                .flatMap((group) => group.items)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        "mb-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-xs",
                        page === item.id
                          ? "bg-[var(--primary-soft)] text-[var(--accent)]"
                          : "text-[var(--muted)]",
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]",
        )}
      >
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-[var(--border)] bg-[var(--header)] px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <p className="hidden text-[9px] font-semibold uppercase tracking-[.14em] text-[var(--primary)] xl:block">
                  EKKO REPRESENTAÇÃO LOGÍSTICA
                </p>
                <span className="hidden text-[var(--muted)] xl:block">/</span>
                <h1 className="truncate text-sm font-semibold text-[var(--text)]">
                  {info.title}
                </h1>
              </div>
              <p className="mt-1 hidden text-[10px] text-[var(--muted)] sm:block">
                {info.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("orders")}
              className="hidden h-9 items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] md:flex"
            >
              <Search size={14} />
              Pesquisar pedidos
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={light ? "Tema escuro" : "Tema claro"}
            >
              {light ? <Moon size={17} /> : <Sun size={17} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast.info("Nenhuma notificação pendente.")}
              title="Notificações"
            >
              <Bell size={17} />
            </Button>
            <div className="relative ml-1 border-l border-[var(--border)] pl-2 sm:pl-3">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-[9px] p-1 pr-1.5 transition hover:bg-[var(--surface-2)]"
              >
                <div className="grid size-8 place-items-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                  ER
                </div>
                <div className="hidden text-left xl:block">
                  <p className="text-[10px] font-medium text-[var(--text)]">Representação Ekko</p>
                  <p className="text-[9px] text-[var(--muted)]">Administrador</p>
                </div>
                <ChevronDown size={13} className={cn("hidden text-[var(--muted)] transition sm:block", userMenuOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl"
                  >
                    <div className="border-b border-[var(--border)] px-3 py-3">
                      <p className="text-xs font-semibold text-[var(--text)]">Representação Ekko</p>
                      <p className="mt-1 truncate text-[10px] text-[var(--muted)]">representacao@ekkorevestimentos.com.br</p>
                    </div>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setUserMenuOpen(false); setLogoutOpen(true); }}
                      className="mt-2 flex h-10 w-full items-center gap-3 rounded-[9px] px-3 text-left text-xs font-medium text-[var(--danger)] transition hover:bg-red-500/[.07]"
                    >
                      <LogOut size={15} /> Sair do Sistema
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {page === "dashboard" && (
              <DashboardView
                navigate={navigate}
                data={dashboard}
                loading={loading}
              />
            )}{" "}
            {page === "orders" && (
              <OrdersTable
                orders={dashboard.orders.filter(
                  (order) => order.status !== "Entregue",
                )}
                title="Pedidos ativos"
              />
            )}{" "}
            {page === "delivered" && <DeliveredView data={dashboard} />}{" "}
            {page === "suppliers" && (
              <SuppliersView suppliers={dashboard.suppliers} />
            )}{" "}
            {page === "import" && (
              <ImportView
                onResult={(result) => {
                  setImportResult(result);
                  void refresh();
                }}
              />
            )}{" "}
            {page === "audit" && (
              <AuditView data={dashboard} importResult={importResult} />
            )}{" "}
            {page === "health" && <HealthView data={dashboard} />}{" "}
            {page === "reports" && <ReportsView data={dashboard} />}{" "}
            {page === "history" && <HistoryView data={dashboard} />}{" "}
            {page === "about" && <AboutView />}
          </motion.div>
        </div>
        <footer className="mx-4 flex flex-col gap-2 border-t border-[var(--border)] py-5 text-[10px] text-[var(--muted)] sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
          <span>© Ekko Revestimentos</span>
          <span>Ekko Representação Logística • Versão 1.6.0</span>
          <DeveloperSignature />
        </footer>
      </main>
      <LogoutDialog
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => void confirmLogout()}
      />
    </div>
  );
}
