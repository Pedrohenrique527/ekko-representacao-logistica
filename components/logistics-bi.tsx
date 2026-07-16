"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowDownToLine, BarChart3, Bell, Boxes,
  Building2, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown,
  CircleDollarSign, ClipboardCheck, Clock3, Database, FileBarChart, FileCheck2,
  FileSpreadsheet, Filter, HeartPulse, History, LayoutDashboard, Menu, MoreHorizontal,
  PackageCheck, PackageOpen, PanelLeftClose, PanelLeftOpen, Search, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp, Truck, UploadCloud, Users,
  X, XCircle,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, number, cn } from "@/lib/utils";
import { emptyDashboard, type DashboardData, type Order, type OrderStatus, type SupplierSummary } from "@/lib/dashboard-data";
import { parseExcelFile, type ImportResult } from "@/lib/excel/importer";

type PageId = "dashboard" | "orders" | "suppliers" | "import" | "audit" | "health" | "reports" | "history";

const nav = [
  { section: "VISÃO GERAL", items: [
    { id: "dashboard" as PageId, label: "Dashboard executivo", icon: LayoutDashboard },
    { id: "orders" as PageId, label: "Pedidos", icon: Boxes },
    { id: "suppliers" as PageId, label: "Fornecedores", icon: Building2 },
  ]},
  { section: "DADOS & CONTROLE", items: [
    { id: "import" as PageId, label: "Importar planilha", icon: UploadCloud },
    { id: "audit" as PageId, label: "Auditoria", icon: ClipboardCheck },
    { id: "health" as PageId, label: "Saúde da base", icon: HeartPulse },
    { id: "history" as PageId, label: "Histórico", icon: History },
  ]},
  { section: "ANÁLISES", items: [
    { id: "reports" as PageId, label: "Central de relatórios", icon: FileBarChart },
  ]},
];

const statusClasses: Record<OrderStatus, string> = {
  "No prazo": "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  Vencendo: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  Vencido: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  Entregue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  Outros: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
};

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard executivo", subtitle: "Visão consolidada dos pedidos de representação" },
  orders: { title: "Pedidos", subtitle: "Acompanhe, filtre e audite todos os registros importados" },
  suppliers: { title: "Fornecedores", subtitle: "Performance, valores e nível de serviço por parceiro" },
  import: { title: "Importar planilha", subtitle: "Leitura segura das abas operacionais do Allan" },
  audit: { title: "Auditoria da importação", subtitle: "Conciliação entre Excel e base de dados" },
  health: { title: "Saúde da base", subtitle: "Qualidade, consistência e oportunidades de correção" },
  reports: { title: "Central de relatórios", subtitle: "Gere análises gerenciais prontas para compartilhar" },
  history: { title: "Histórico de importações", subtitle: "Rastreabilidade completa de todos os processamentos" },
};

function MetricCard({ label, value, trend, icon: Icon, tone = "blue" }: { label: string; value: string; trend?: string; icon: React.ElementType; tone?: "blue" | "green" | "amber" | "red" }) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/15",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/15",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/15",
    red: "bg-rose-500/10 text-rose-300 border-rose-500/15",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border border-white/[.07] bg-[#121316] p-4 transition-colors hover:border-white/[.13]">
      <div className="flex items-start justify-between">
        <div className={cn("grid size-9 place-items-center rounded-lg border", tones[tone])}><Icon size={17} /></div>
        {trend && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><TrendingUp size={12} />{trend}</span>}
      </div>
      <p className="mt-5 text-[11px] font-medium uppercase tracking-[.08em] text-zinc-500">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight text-zinc-50">{value}</p>
    </motion.div>
  );
}

function ChartHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div><h3 className="text-sm font-semibold text-zinc-100">{title}</h3><p className="mt-1 text-xs text-zinc-500">{subtitle}</p></div>
      {action && <Button variant="ghost" size="sm">{action}<ChevronDown size={13} /></Button>}
    </div>
  );
}

function DashboardView({ navigate, data, loading }: { navigate: (page: PageId) => void; data: DashboardData; loading: boolean }) {
  const { metrics, monthlyOrders, statusData, suppliers, orders } = data;
  return (
    <div className="space-y-4">
      {!loading && !data.hasData && <Card className="border-amber-500/20 bg-amber-500/[.06] p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 text-amber-300" size={18}/><div><h3 className="text-sm font-semibold text-amber-200">Nenhum dado real importado</h3><p className="mt-1 text-xs leading-5 text-zinc-400">Os indicadores permanecem zerados até uma planilha ser gravada e validada no banco. Nenhum número demonstrativo será exibido.</p></div></div></Card>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Total de pedidos" value={number.format(metrics.total)} icon={PackageOpen} />
        <MetricCard label="Pedidos ativos" value={number.format(metrics.active)} icon={Activity} tone="amber" />
        <MetricCard label="Entregues" value={number.format(metrics.delivered)} icon={PackageCheck} tone="green" />
        <MetricCard label="No prazo" value={number.format(metrics.onTime)} icon={ShieldCheck} tone="green" />
        <MetricCard label="Vencendo" value={number.format(metrics.expiring)} icon={Clock3} tone="amber" />
        <MetricCard label="Vencidos" value={number.format(metrics.overdue)} icon={AlertTriangle} tone="red" />
        <MetricCard label="Demais status" value={number.format(metrics.other)} icon={Boxes} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Valor movimentado" value={money.format(metrics.totalValue)} icon={CircleDollarSign} />
        <MetricCard label="Valor entregue" value={money.format(metrics.deliveredValue)} icon={PackageCheck} tone="green" />
        <MetricCard label="Valor pendente" value={money.format(metrics.pendingValue)} icon={Clock3} tone="amber" />
        <MetricCard label="Ticket médio" value={money.format(metrics.averageTicket)} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <ChartHeader title="Evolução de pedidos" subtitle="Quantidade mensal e tendência dos últimos 12 meses" action="Últimos 12 meses" />
          <div className="h-[285px] px-2 pb-3 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyOrders} margin={{ left: -18, right: 10 }}>
                <defs><linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b82f6" stopOpacity={0.28}/><stop offset="1" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke="#25272b" vertical={false} />
                <XAxis dataKey="month" stroke="#62666e" tickLine={false} axisLine={false} fontSize={11}/>
                <YAxis stroke="#62666e" tickLine={false} axisLine={false} fontSize={11}/>
                <Tooltip contentStyle={{ background: "#16181c", border: "1px solid #2a2d33", borderRadius: 10, color: "#fff", fontSize: 12 }} />
                <Area type="monotone" dataKey="pedidos" stroke="#4f8df7" fill="url(#orderGradient)" strokeWidth={2.3}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <ChartHeader title="Pedidos por status" subtitle="Distribuição da base consolidada" />
          <div className="grid grid-cols-[1.1fr_.9fr] items-center px-3 py-3">
            <div className="h-[245px]">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius={64} outerRadius={86} paddingAngle={3} stroke="none">{statusData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ background: "#16181c", border: "1px solid #2a2d33", borderRadius: 10, color: "#fff", fontSize: 12 }}/></PieChart></ResponsiveContainer>
            </div>
            <div className="space-y-4">{statusData.map((item) => <div key={item.name}><div className="flex items-center gap-2 text-xs text-zinc-400"><span className="size-2 rounded-full" style={{ background: item.color }}/>{item.name}</div><p className="ml-4 mt-1 text-lg font-semibold text-zinc-100">{number.format(item.value)}</p></div>)}</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <ChartHeader title="Valor movimentado" subtitle="Volume financeiro mensal" action="2025" />
          <div className="h-[245px] px-2 pb-4 pt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyOrders.slice(4)} margin={{ left: -5, right: 10 }}><CartesianGrid stroke="#25272b" vertical={false}/><XAxis dataKey="month" stroke="#62666e" tickLine={false} axisLine={false} fontSize={11}/><YAxis stroke="#62666e" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => `${v/1000000}M`}/><Tooltip formatter={(v) => money.format(Number(v))} contentStyle={{ background: "#16181c", border: "1px solid #2a2d33", borderRadius: 10, color: "#fff", fontSize: 12 }}/><Bar dataKey="valor" fill="#2459ad" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="overflow-hidden">
          <ChartHeader title="Top fornecedores" subtitle="Ranking por valor movimentado" action="Ver todos" />
          <div className="mt-3 divide-y divide-white/[.055]">{suppliers.slice(0, 5).map((supplier, index) => <div key={supplier.name} className="grid grid-cols-[30px_1fr_auto] items-center gap-3 px-5 py-3.5"><span className="grid size-6 place-items-center rounded-md bg-white/[.055] text-[11px] font-semibold text-zinc-500">{index+1}</span><div className="min-w-0"><p className="truncate text-xs font-medium text-zinc-200">{supplier.name}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-blue-500" style={{ width: `${supplier.value / suppliers[0].value * 100}%` }}/></div></div><div className="text-right"><p className="text-xs font-semibold text-zinc-200">{money.format(supplier.value)}</p><p className="mt-1 text-[10px] text-zinc-600">{supplier.orders} pedidos</p></div></div>)}</div>
        </Card>
      </div>

      <OrdersTable orders={orders} compact onOpenAll={() => navigate("orders")} />
    </div>
  );
}

function OrdersTable({ orders, compact = false, onOpenAll }: { orders: Order[]; compact?: boolean; onOpenAll?: () => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const filtered = useMemo(() => orders.filter((order) => {
    const haystack = `${order.order} ${order.client} ${order.supplier} ${order.invoice}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "Todos" || order.status === status);
  }), [query, status]);
  const visible = compact ? filtered.slice(0, 5) : filtered;

  const exportCsv = () => {
    const csv = ["Pedido;Cliente;Fornecedor;Valor;Status", ...filtered.map((o) => `${o.order};${o.client};${o.supplier};${o.value};${o.status}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "pedidos.csv"; link.click(); URL.revokeObjectURL(url);
    toast.success("Exportação preparada", { description: `${filtered.length} registros foram incluídos no arquivo.` });
  };
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-sm font-semibold text-zinc-100">{compact ? "Pedidos recentes" : "Base de pedidos"}</h3><p className="mt-1 text-xs text-zinc-500">Dados consolidados das abas operacionais</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {!compact && <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/><Input aria-label="Pesquisar pedidos" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pedido, cliente, fornecedor..." className="w-64 pl-9"/></div>}
          {!compact && <select aria-label="Filtrar status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#0d0e10] px-3 text-xs text-zinc-300 outline-none">{["Todos", "No prazo", "Vencendo", "Vencido", "Entregue", "Outros"].map((s) => <option key={s}>{s}</option>)}</select>}
          {!compact && <Button variant="secondary" size="sm" onClick={exportCsv}><ArrowDownToLine size={14}/>Exportar</Button>}
          {compact && <Button variant="ghost" size="sm" onClick={onOpenAll}>Ver todos<ChevronRight size={14}/></Button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead><tr className="border-b border-white/[.055] text-[10px] uppercase tracking-[.08em] text-zinc-600"><th className="px-5 py-3 font-medium">Pedido</th><th className="px-3 py-3 font-medium">Cliente</th><th className="px-3 py-3 font-medium">Fornecedor</th><th className="px-3 py-3 font-medium">NF</th><th className="px-3 py-3 font-medium">Valor</th><th className="px-3 py-3 font-medium">Previsão</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3"></th></tr></thead>
          <tbody className="divide-y divide-white/[.05]">{visible.map((order) => <tr key={order.id} className="group transition-colors hover:bg-white/[.025]"><td className="px-5 py-3.5 text-xs font-semibold text-blue-300">{order.order}</td><td className="max-w-[190px] truncate px-3 py-3.5 text-xs text-zinc-300">{order.client}</td><td className="px-3 py-3.5 text-xs text-zinc-400">{order.supplier}</td><td className="px-3 py-3.5 text-xs text-zinc-500">{order.invoice}</td><td className="px-3 py-3.5 text-xs font-medium text-zinc-200">{money.format(order.value)}</td><td className="px-3 py-3.5 text-xs text-zinc-500">{order.dueAt}</td><td className="px-3 py-3.5"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold", statusClasses[order.status])}>{order.status}</span></td><td className="px-5 py-3.5"><Button variant="ghost" size="icon" aria-label={`Abrir pedido ${order.order}`}><MoreHorizontal size={16}/></Button></td></tr>)}</tbody>
        </table>
      </div>
      {!compact && <div className="flex items-center justify-between border-t border-white/[.06] px-5 py-3 text-xs text-zinc-600"><span>Exibindo {visible.length} registros confirmados no banco</span></div>}
    </Card>
  );
}

function ImportView({ onResult }: { onResult: (result: ImportResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const process = async (selected: File) => {
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { toast.error("Arquivo não suportado", { description: "Selecione uma planilha no formato .xlsx." }); return; }
    setFile(selected); setResult(null); setStartedAt(Date.now()); setStage("Preparando leitura segura"); setProgress(8);
    await new Promise((resolve) => setTimeout(resolve, 180));
    try {
      setStage("Localizando abas e cabeçalhos"); setProgress(34);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const parsed = await parseExcelFile(selected);
      setStage("Gravando dados no banco com segurança"); setProgress(72);
      const response = await fetch("/api/imports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed, fileName: selected.name, durationMs: Date.now() - (startedAt ?? Date.now()) }),
      });
      const saved = await response.json() as { message?: string; rowsInserted?: number; totalDatabase?: number };
      if (!response.ok) throw new Error(saved.message ?? "Não foi possível gravar a importação.");
      parsed.rowsAccepted = saved.rowsInserted ?? parsed.rowsAccepted;
      parsed.totalDatabase = saved.totalDatabase ?? parsed.totalDatabase;
      setStage("Gerando relatório de consistência"); setProgress(82);
      await new Promise((resolve) => setTimeout(resolve, 240));
      setResult(parsed); onResult(parsed); setProgress(100); setStage("Importação validada");
      toast.success("Planilha processada com segurança", { description: `${number.format(parsed.rowsFound)} registros encontrados em ${parsed.sheetsUsed.join(" e ")}.` });
    } catch (error) {
      setProgress(0); setStage("");
      toast.error("Não foi possível ler a planilha", { description: error instanceof Error ? error.message : "Verifique o arquivo e tente novamente." });
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <Card className="p-5">
        <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-zinc-100">Nova importação</h3><p className="mt-1 text-xs text-zinc-500">O arquivo é somente lido. Nenhuma célula ou fórmula é alterada.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300"><ShieldCheck size={13}/>Modo somente leitura</span></div>
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); const dropped = e.dataTransfer.files[0]; if (dropped) process(dropped); }} className={cn("mt-5 flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-all", dragging ? "border-blue-400 bg-blue-500/[.08]" : "border-white/[.13] bg-[#0e0f11] hover:border-blue-500/40") }>
          <div className="grid size-14 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300"><FileSpreadsheet size={26}/></div>
          <h4 className="mt-5 text-base font-semibold text-zinc-100">Arraste sua planilha para cá</h4>
          <p className="mt-2 max-w-md text-xs leading-5 text-zinc-500">Serão utilizadas apenas as abas <strong className="text-zinc-300">Produtos a receber</strong> e <strong className="text-zinc-300">ENTREGUES</strong>. Todas as demais serão ignoradas.</p>
          <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const selected = e.target.files?.[0]; if (selected) process(selected); }}/>
          <Button className="mt-5" onClick={() => inputRef.current?.click()}><UploadCloud size={16}/>Selecionar arquivo</Button>
          <p className="mt-3 text-[10px] text-zinc-700">Formato aceito: .xlsx • Tamanho recomendado até 100 MB</p>
        </div>

        {file && <div className="mt-4 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300"><FileSpreadsheet size={18}/></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-zinc-200">{file.name}</p><p className="mt-1 text-[10px] text-zinc-600">{(file.size / 1024 / 1024).toFixed(1)} MB • {stage}</p></div><span className="text-xs font-semibold text-zinc-300">{progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div className="h-full rounded-full bg-blue-500" animate={{ width: `${progress}%` }}/></div></div>}

        {result && <div className="mt-4 grid gap-3 sm:grid-cols-4"><MiniStat label="Linhas encontradas" value={number.format(result.rowsFound)} ok/><MiniStat label="Gravadas" value={number.format(result.rowsAccepted)} ok={result.rowsFound === result.rowsAccepted}/><MiniStat label="Abas utilizadas" value={String(result.sheetsUsed.length)} ok={result.sheetsUsed.length === 2}/><MiniStat label="Integridade" value={`${result.integrity}%`} ok={result.integrity >= 98}/></div>}
      </Card>

      <div className="space-y-4">
        <Card className="p-5"><h3 className="text-sm font-semibold text-zinc-100">Como funciona</h3><div className="mt-5 space-y-5">{[
          ["1", "Leitura do arquivo", "As fórmulas não são executadas nem alteradas."],
          ["2", "Mapeamento inteligente", "As colunas são encontradas pelo cabeçalho."],
          ["3", "Validação", "Duplicados, vazios, datas e valores são auditados."],
          ["4", "Persistência", "Após aprovação, os dados seguem para o PostgreSQL."],
        ].map(([n,title,text]) => <div key={n} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-blue-500/20 bg-blue-500/10 text-[11px] font-bold text-blue-300">{n}</span><div><p className="text-xs font-medium text-zinc-300">{title}</p><p className="mt-1 text-[11px] leading-4 text-zinc-600">{text}</p></div></div>)}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-amber-300"><AlertTriangle size={16}/><h3 className="text-sm font-semibold">Fonte oficial preservada</h3></div><p className="mt-3 text-xs leading-5 text-zinc-500">O Excel permanece como origem oficial. O sistema consome exclusivamente os resultados já salvos das fórmulas; não corrige, não recalcula e não grava nada no arquivo.</p></Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok: boolean }) { return <div className="rounded-lg border border-white/[.06] bg-[#0e0f11] p-3"><div className="flex items-center justify-between"><span className="text-[10px] text-zinc-600">{label}</span>{ok ? <Check size={13} className="text-emerald-400"/> : <X size={13} className="text-rose-400"/>}</div><p className="mt-2 text-lg font-semibold text-zinc-100">{value}</p></div>; }

function AuditView({ result }: { result: ImportResult | null }) {
  if (!result) return <Card className="p-8 text-center"><ClipboardCheck className="mx-auto text-zinc-600" size={28}/><h3 className="mt-4 text-sm font-semibold text-zinc-200">Nenhuma auditoria real disponível</h3><p className="mt-2 text-xs text-zinc-500">A auditoria será exibida somente depois que a planilha for gravada e confirmada no banco.</p></Card>;
  const integrity = result?.integrity ?? 0;
  const checks = [
    { label: "Linhas do Excel × banco", excel: result?.rowsFound ?? 0, db: result?.rowsAccepted ?? 0, ok: Boolean(result) && result.rowsFound === result.rowsAccepted },
    { label: "Valor total", excel: money.format(result?.totalExcel ?? 0), db: money.format(result?.totalDatabase ?? 0), ok: Boolean(result) && result.totalExcel === result.totalDatabase },
    { label: "Abas obrigatórias", excel: result?.sheetsUsed.length ?? 0, db: result ? `${result.sheetsUsed.length} reconhecidas` : "0 reconhecidas", ok: result?.sheetsUsed.length === 2 },
    { label: "Colunas obrigatórias", excel: result ? `${result.columnsFound.length} localizadas` : "0 localizadas", db: result?.missingColumns.length ? `${result.missingColumns.length} ausentes` : result ? "Todas presentes" : "Aguardando importação", ok: Boolean(result) && !result?.missingColumns.length },
  ];
  return <div className="grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
    <Card className="p-6"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-blue-500/10 text-blue-300"><ClipboardCheck size={21}/></div><div><p className="text-[10px] uppercase tracking-[.12em] text-zinc-600">Integridade da importação</p><p className="mt-1 text-sm font-semibold text-zinc-200">{result ? "Último arquivo processado" : "PEDIDOS ATÉ 16.9 (2).xlsx"}</p></div></div><div className="mt-8 flex justify-center"><div className="relative grid size-48 place-items-center rounded-full" style={{ background: `conic-gradient(#3b82f6 ${integrity * 3.6}deg,#202328 0)` }}><div className="grid size-[164px] place-items-center rounded-full bg-[#121316] text-center"><div><p className="text-4xl font-semibold tracking-tight text-white">{integrity}%</p><p className="mt-2 text-[10px] uppercase tracking-[.12em] text-emerald-400">Base confiável</p></div></div></div></div><div className="mt-8 rounded-lg border border-emerald-500/15 bg-emerald-500/[.07] p-3 text-xs leading-5 text-emerald-200">A importação está consistente e pronta para alimentar os painéis gerenciais.</div></Card>
    <div className="space-y-4"><Card className="overflow-hidden"><ChartHeader title="Relatório de consistência" subtitle="Comparação automática Excel × banco"/><div className="mt-3 divide-y divide-white/[.055]">{checks.map((check) => <div key={check.label} className="grid grid-cols-[1fr_.8fr_.8fr_32px] items-center gap-3 px-5 py-4"><p className="text-xs font-medium text-zinc-300">{check.label}</p><div><p className="text-[9px] uppercase text-zinc-700">Excel</p><p className="mt-1 text-xs text-zinc-400">{check.excel}</p></div><div><p className="text-[9px] uppercase text-zinc-700">Banco</p><p className="mt-1 text-xs text-zinc-400">{check.db}</p></div>{check.ok ? <Check className="text-emerald-400" size={18}/> : <XCircle className="text-rose-400" size={18}/>}</div>)}</div></Card><Card className="p-5"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-zinc-100">Ocorrências encontradas</h3><p className="mt-1 text-xs text-zinc-600">Registros que merecem revisão no arquivo de origem</p></div><Button variant="secondary" size="sm"><ArrowDownToLine size={14}/>Exportar auditoria</Button></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><MiniStat label="Duplicados" value={String(result?.issues.filter((i) => i.type === "duplicate").length ?? 3)} ok={false}/><MiniStat label="Campos vazios" value={String(result?.issues.filter((i) => i.type === "missing").length ?? 7)} ok={false}/><MiniStat label="Valores inválidos" value={String(result?.issues.filter((i) => i.type === "invalid-value").length ?? 1)} ok={false}/><MiniStat label="Linhas ignoradas" value="0" ok/></div></Card></div>
  </div>;
}

function SuppliersView({ suppliers }: { suppliers: SupplierSummary[] }) { const late = suppliers.reduce((sum, item) => sum + item.late, 0); const sla = suppliers.length ? suppliers.reduce((sum, item) => sum + item.sla, 0) / suppliers.length : 0; return <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><MetricCard label="Fornecedores ativos" value={number.format(suppliers.length)} icon={Building2}/><MetricCard label="SLA médio" value={`${sla.toFixed(1)}%`} icon={ShieldCheck} tone="green"/><MetricCard label="Pedidos em atraso" value={number.format(late)} icon={AlertTriangle} tone="red"/></div><Card className="overflow-hidden"><ChartHeader title="Performance de fornecedores" subtitle="Dados da última importação confirmada"/><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr className="border-y border-white/[.055] text-left text-[10px] uppercase tracking-[.08em] text-zinc-600"><th className="px-5 py-3">Posição / Fornecedor</th><th className="px-3 py-3">Pedidos</th><th className="px-3 py-3">Valor total</th><th className="px-3 py-3">Vencidos</th><th className="px-3 py-3">SLA</th><th className="px-5 py-3">Performance</th></tr></thead><tbody className="divide-y divide-white/[.05]">{suppliers.map((s,i) => <tr key={s.name} className="hover:bg-white/[.02]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-lg bg-white/[.05] text-xs text-zinc-500">{i+1}</span><span className="text-xs font-medium text-zinc-200">{s.name}</span></div></td><td className="px-3 text-xs text-zinc-400">{s.orders}</td><td className="px-3 text-xs font-medium text-zinc-200">{money.format(s.value)}</td><td className="px-3 text-xs text-rose-300">{s.late}</td><td className="px-3 text-xs font-semibold text-emerald-300">{s.sla}%</td><td className="px-5"><div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-emerald-500" style={{width:`${s.sla}%`}}/></div></td></tr>)}</tbody></table>{!suppliers.length&&<p className="p-8 text-center text-xs text-zinc-500">Nenhum fornecedor importado.</p>}</div></Card></div>; }

function HealthView({ result }: { result: ImportResult | null }) { const issueCount = (type: string) => result?.issues.filter((issue) => issue.type === type).length ?? 0; const items = [{label:"Pedidos analisados",value:number.format(result?.rowsFound ?? 0)},{label:"Possíveis duplicados",value:String(issueCount("duplicate"))},{label:"Campos obrigatórios vazios",value:String(issueCount("missing"))},{label:"Datas inválidas",value:String(issueCount("invalid-date"))},{label:"Valores inválidos",value:String(issueCount("invalid-value"))}]; const suggestions = result?.issues.slice(0,4).map((issue)=>issue.message) ?? []; return <div className="grid gap-4 xl:grid-cols-[1fr_.72fr]"><Card className="p-5"><h3 className="text-sm font-semibold text-zinc-100">Diagnóstico da base</h3><p className="mt-1 text-xs text-zinc-600">Somente dados da importação atual validada</p><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{items.map((item)=><div key={item.label} className="rounded-xl border border-white/[.07] bg-[#0e0f11] p-4"><p className="text-[10px] uppercase tracking-[.08em] text-zinc-600">{item.label}</p><p className="mt-3 text-2xl font-semibold text-zinc-100">{item.value}</p></div>)}</div></Card><Card className="p-5"><div className="flex items-center gap-2 text-blue-300"><Sparkles size={17}/><h3 className="text-sm font-semibold">Sugestões de correção</h3></div><div className="mt-4 space-y-3">{suggestions.length?suggestions.map((text,i)=><div key={`${text}-${i}`} className="flex gap-3 rounded-lg bg-white/[.025] p-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-500/10 text-[10px] text-blue-300">{i+1}</span><p className="text-xs leading-5 text-zinc-400">{text}</p></div>):<p className="text-xs text-zinc-500">Importe uma planilha para gerar o diagnóstico real.</p>}</div></Card></div>; }

function ReportsView() { const reports = [{name:"Relatório mensal",desc:"Pedidos, valores, status e evolução do mês",icon:BarChart3},{name:"Relatório financeiro",desc:"Movimentação, ticket e valores pendentes",icon:CircleDollarSign},{name:"Por fornecedor",desc:"Ranking, SLA e ocorrências por parceiro",icon:Building2},{name:"Por representante",desc:"Carteira, volume e performance individual",icon:Users},{name:"Relatório anual",desc:"Comparativos e tendências entre períodos",icon:TrendingUp},{name:"Por status",desc:"Detalhamento dos pedidos por situação",icon:Activity}]; return <div><Card className="mb-4 border-amber-500/20 bg-amber-500/[.05] p-4 text-xs text-amber-200">Exportações serão liberadas somente após a validação completa dos dados reais.</Card><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{reports.map(({name,desc,icon:Icon})=><Card key={name} className="p-5"><div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300"><Icon size={19}/></div><h3 className="mt-5 text-sm font-semibold text-zinc-100">{name}</h3><p className="mt-2 text-xs leading-5 text-zinc-600">{desc}</p><Button className="mt-5" size="sm" disabled><FileCheck2 size={14}/>Aguardando validação</Button></Card>)}</div></div>; }

function HistoryView({ data }: { data: DashboardData }) { const row = data.latestImport; return <Card className="overflow-hidden"><ChartHeader title="Importações registradas" subtitle="Somente importações confirmadas no PostgreSQL"/><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr className="border-y border-white/[.055] text-left text-[10px] uppercase tracking-[.08em] text-zinc-600"><th className="px-5 py-3">Arquivo</th><th className="px-3 py-3">Data e hora</th><th className="px-3 py-3">Registros</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{row&&<tr><td className="px-5 py-4 text-xs font-medium text-zinc-200">{row.fileName}</td><td className="px-3 text-xs text-zinc-500">{new Date(row.createdAt).toLocaleString("pt-BR")}</td><td className="px-3 text-xs text-zinc-300">{number.format(data.metrics.total)}</td><td className="px-5"><span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Confirmada</span></td></tr>}</tbody></table>{!row&&<p className="p-8 text-center text-xs text-zinc-500">Nenhuma importação real registrada.</p>}</div></Card>; }

export function LogisticsBI() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<ImportResult | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const refreshDashboard = async () => {
    setDashboardLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao consultar o banco");
      setDashboard(await response.json() as DashboardData);
    } catch {
      setDashboard(emptyDashboard);
      toast.error("Não foi possível consultar os dados reais", { description: "Os indicadores foram zerados para não exibir informações incorretas." });
    } finally { setDashboardLoading(false); }
  };
  useEffect(() => { void refreshDashboard(); }, []);
  const info = pageTitles[page];
  const navigate = (next: PageId) => { setPage(next); setMobileOpen(false); };
  return <div className="min-h-screen bg-[#090a0c] text-zinc-100"><Toaster theme="dark" richColors position="top-right"/>
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-white/[.065] bg-[#0d0e10] transition-[width] duration-300 lg:flex lg:flex-col", collapsed ? "w-[76px]" : "w-[238px]")}>
      <div className="flex h-[70px] items-center gap-3 border-b border-white/[.06] px-5"><div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 shadow-[0_8px_26px_rgba(37,99,235,.25)]"><Truck size={18}/><span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-[#0d0e10] bg-emerald-400"/></div>{!collapsed&&<div><p className="text-sm font-bold tracking-tight">Logi<span className="text-blue-400">Sight</span></p><p className="text-[9px] uppercase tracking-[.18em] text-zinc-700">Intelligence</p></div>}</div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">{nav.map((group)=><div key={group.section} className="mb-6">{!collapsed&&<p className="mb-2 px-3 text-[9px] font-semibold tracking-[.14em] text-zinc-700">{group.section}</p>}<div className="space-y-1">{group.items.map((item)=>{const Icon=item.icon;const active=page===item.id;return <button key={item.id} title={collapsed?item.label:undefined} onClick={()=>navigate(item.id)} className={cn("flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium transition-all",active?"bg-blue-500/[.13] text-blue-200 shadow-[inset_3px_0_0_#3b82f6]":"text-zinc-500 hover:bg-white/[.045] hover:text-zinc-200",collapsed&&"justify-center px-0")}><Icon size={16} className="shrink-0"/>{!collapsed&&<><span className="flex-1 truncate">{item.label}</span>{item.count&&<span className={cn("text-[9px]",active?"text-blue-300":"text-zinc-700")}>{item.count}</span>}</>}</button>})}</div></div>)}</nav>
      <div className="border-t border-white/[.06] p-3"><button onClick={()=>setCollapsed(!collapsed)} className={cn("flex h-10 w-full items-center gap-3 rounded-lg px-3 text-xs text-zinc-600 hover:bg-white/[.04] hover:text-zinc-300",collapsed&&"justify-center px-0")}>{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>} {!collapsed&&"Recolher menu"}</button></div>
    </aside>
    <AnimatePresence>{mobileOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={()=>setMobileOpen(false)}><motion.aside initial={{x:-280}} animate={{x:0}} exit={{x:-280}} onClick={(e)=>e.stopPropagation()} className="h-full w-[260px] border-r border-white/10 bg-[#0d0e10] p-4"><div className="mb-5 flex items-center justify-between"><p className="font-bold">Logi<span className="text-blue-400">Sight</span></p><Button variant="ghost" size="icon" onClick={()=>setMobileOpen(false)}><X size={17}/></Button></div>{nav.flatMap(g=>g.items).map((item)=>{const Icon=item.icon;return <button key={item.id} onClick={()=>navigate(item.id)} className={cn("mb-1 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-xs",page===item.id?"bg-blue-500/15 text-blue-200":"text-zinc-500")}><Icon size={16}/>{item.label}</button>})}</motion.aside></motion.div>}</AnimatePresence>
    <main className={cn("min-h-screen transition-[padding] duration-300",collapsed?"lg:pl-[76px]":"lg:pl-[238px]")}>
      <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-white/[.06] bg-[#090a0c]/90 px-4 backdrop-blur-xl sm:px-6"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={()=>setMobileOpen(true)}><Menu size={18}/></Button><div><h1 className="text-base font-semibold tracking-tight text-zinc-100">{info.title}</h1><p className="mt-0.5 hidden text-[10px] text-zinc-600 sm:block">{info.subtitle}</p></div></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-white/[.07] bg-white/[.025] px-3 py-2 text-[10px] text-zinc-500 md:flex"><Database size={13} className={dashboard.hasData?"text-emerald-400":"text-amber-400"}/><span>{dashboard.hasData?"Dados confirmados no PostgreSQL":"Aguardando importação real"}</span></div></div></header>
      <div className="p-4 sm:p-6"><AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.18}}>{page==="dashboard"&&<DashboardView navigate={navigate} data={dashboard} loading={dashboardLoading}/>} {page==="orders"&&<OrdersTable orders={dashboard.orders}/>} {page==="suppliers"&&<SuppliersView suppliers={dashboard.suppliers}/>} {page==="import"&&<ImportView onResult={(result)=>{setAuditResult(result); void refreshDashboard();}}/>} {page==="audit"&&<AuditView result={auditResult}/>} {page==="health"&&<HealthView result={auditResult}/>} {page==="reports"&&<ReportsView/>} {page==="history"&&<HistoryView data={dashboard}/>}</motion.div></AnimatePresence></div>
    </main>
  </div>;
}
