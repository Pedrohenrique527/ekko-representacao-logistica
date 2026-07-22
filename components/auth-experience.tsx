"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Database,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export const authLoadingSteps = [
  "Validando credenciais",
  "Conectando ao banco de dados",
  "Lendo pedidos",
  "Validando pedidos",
  "Calculando indicadores",
  "Preparando dashboard",
  "Sincronizando dados",
  "Verificando auditorias",
  "Finalizando ambiente",
] as const;

type IntelligenceBackdropProps = {
  intensified?: boolean;
  compact?: boolean;
};

type NodePoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
};

function NetworkCanvas({ intensified = false }: { intensified?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let ratio = 1;
    let frame = 0;
    let nodes: NodePoint[] = [];

    const buildNodes = () => {
      const count = reduced ? 18 : Math.max(28, Math.min(58, Math.round((width * height) / 23000)));
      nodes = Array.from({ length: count }, (_, index) => ({
        x: ((index * 173.7) % Math.max(width, 1)) + Math.sin(index * 1.9) * 24,
        y: ((index * 97.3) % Math.max(height, 1)) + Math.cos(index * 1.4) * 20,
        vx: Math.sin(index * 2.41) * 0.055,
        vy: Math.cos(index * 1.73) * 0.045,
        radius: index % 7 === 0 ? 1.55 : 0.85,
        phase: index * 0.67,
      }));
    };

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildNodes();
    };

    const handlePointer = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const clearPointer = () => {
      pointer.active = false;
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);

      context.strokeStyle = "rgba(77, 166, 186, 0.055)";
      context.lineWidth = 1;
      const grid = width < 700 ? 44 : 58;
      const offset = reduced ? 0 : (time * 0.0022) % grid;
      for (let x = -grid + offset; x < width + grid; x += grid) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = -grid; y < height + grid; y += grid) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      nodes.forEach((node) => {
        if (!reduced) {
          const speed = intensified ? 2.4 : 1;
          node.x += node.vx * speed;
          node.y += node.vy * speed;
          if (node.x < -20) node.x = width + 20;
          if (node.x > width + 20) node.x = -20;
          if (node.y < -20) node.y = height + 20;
          if (node.y > height + 20) node.y = -20;
        }
      });

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        for (let next = index + 1; next < nodes.length; next += 1) {
          const other = nodes[next];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const limit = intensified ? 168 : 132;
          if (distance < limit) {
            const alpha = (1 - distance / limit) * (intensified ? 0.18 : 0.09);
            context.strokeStyle = `rgba(57, 187, 211, ${alpha})`;
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 190) {
            context.strokeStyle = `rgba(73, 207, 230, ${(1 - distance / 190) * 0.16})`;
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(pointer.x, pointer.y);
            context.stroke();
          }
        }

        const pulse = reduced ? 0.5 : 0.54 + Math.sin(time * 0.001 + node.phase) * 0.24;
        context.fillStyle = `rgba(98, 217, 233, ${pulse})`;
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }

      if (!reduced) frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", clearPointer);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
      document.documentElement.removeEventListener("pointerleave", clearPointer);
    };
  }, [intensified]);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />;
}

function AnalyticLayer({ intensified = false }: { intensified?: boolean }) {
  const reduced = useReducedMotion();
  const duration = intensified ? 1.4 : 5.8;
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-x-0 top-[10%] h-[38%] w-full opacity-45" viewBox="0 0 1440 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#39bdd5" stopOpacity="0" />
            <stop offset=".3" stopColor="#39bdd5" stopOpacity=".48" />
            <stop offset=".72" stopColor="#6ed8e8" stopOpacity=".82" />
            <stop offset="1" stopColor="#6ed8e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M-40 330 C120 326 150 285 275 294 S470 246 565 260 S715 164 835 190 S1020 118 1118 142 S1310 72 1480 88"
          fill="none"
          stroke="url(#trendStroke)"
          strokeWidth="1.4"
          initial={{ pathLength: reduced ? 1 : 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.74, 0.36] }}
          transition={{ duration, repeat: reduced ? 0 : Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        />
        <motion.path
          d="M-20 370 C180 340 255 365 390 314 S630 330 760 260 S1010 290 1160 220 S1330 230 1470 164"
          fill="none"
          stroke="#258da5"
          strokeOpacity=".27"
          strokeWidth="1"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: duration * 1.25, repeat: reduced ? 0 : Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
        />
      </svg>

      <div className="absolute bottom-[11%] left-[6%] hidden h-24 items-end gap-2 opacity-25 md:flex">
        {[28, 46, 35, 67, 52, 82, 63, 90, 72].map((height, index) => (
          <motion.span
            key={height + index}
            className="w-2 border-t border-cyan-300/60 bg-cyan-400/15"
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: reduced ? 0 : 1.3, delay: reduced ? 0 : 0.16 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>

      <div className="absolute right-[5%] top-[16%] hidden w-44 font-mono text-[8px] uppercase tracking-[.16em] text-cyan-100/25 lg:block">
        <div className="flex justify-between border-b border-cyan-200/10 py-2"><span>data stream</span><span>active</span></div>
        <div className="flex justify-between border-b border-cyan-200/10 py-2"><span>secure layer</span><span>tls</span></div>
        <div className="flex justify-between border-b border-cyan-200/10 py-2"><span>intelligence</span><span>ready</span></div>
      </div>

      <motion.div
        className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-cyan-200/20 to-transparent"
        initial={{ left: "-2%" }}
        animate={{ left: "102%" }}
        transition={{ duration: intensified ? 1.1 : 9, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06111d] to-transparent" />
    </div>
  );
}

export function IntelligenceBackdrop({ intensified = false, compact = false }: IntelligenceBackdropProps) {
  return (
    <div className={`auth-data-stage absolute inset-0 isolate overflow-hidden ${compact ? "min-h-[260px]" : "min-h-full"}`}>
      <NetworkCanvas intensified={intensified} />
      <AnalyticLayer intensified={intensified} />
      <div aria-hidden className="absolute left-1/2 top-[42%] h-[34rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[.045] blur-[120px]" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_5%,rgba(4,12,21,.44)_85%)]" />
    </div>
  );
}

export function AuthLoadingScreen({
  step,
  error,
  onRetry,
  onReady,
}: {
  step: number;
  error?: string;
  onRetry: () => void;
  onReady: () => void;
}) {
  const reduced = useReducedMotion();
  const finalStep = authLoadingSteps.length - 1;
  const targetStep = Math.min(step, finalStep);
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    if (error || visibleStep >= targetStep) return;
    const timer = window.setTimeout(
      () => setVisibleStep((current) => Math.min(current + 1, targetStep)),
      reduced ? 10 : step >= finalStep ? 210 : 120,
    );
    return () => window.clearTimeout(timer);
  }, [error, finalStep, reduced, step, targetStep, visibleStep]);

  const ready = step >= finalStep && visibleStep >= finalStep && !error;
  const progress = Math.round(((visibleStep + 1) / authLoadingSteps.length) * 100);

  return (
    <motion.div
      className="auth-shell fixed inset-0 z-[100] min-h-screen overflow-hidden bg-[#081423]"
      initial={{ opacity: 1 }}
      animate={ready ? { opacity: 0, scale: 1.012, filter: "blur(8px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: reduced ? 0.08 : 0.62, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => ready && onReady()}
    >
      <IntelligenceBackdrop intensified />
      <div className="relative z-10 flex min-h-screen flex-col px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.17em] text-cyan-100/45">
            <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,221,236,.8)]" />
            Centro de Inteligência Logística
          </div>
          <span className="font-mono text-[9px] tracking-[.16em] text-cyan-100/30">EKKO / SECURE ACCESS</span>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center py-12">
          <div className="w-full">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <Image src="/pedro-mariniello-logo.png" alt="Pedro Mariniello" width={1942} height={809} priority className="mx-auto h-auto w-48 object-contain sm:w-56" />
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100/50">Ekko Representação Logística</p>
            </motion.div>

            <div className="mt-12 border-y border-white/[.08] bg-[#0a1b2b]/55 px-5 py-6 backdrop-blur-xl sm:px-7">
              {error ? (
                <motion.div role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 text-red-300"><AlertTriangle size={18} /><span className="text-sm font-semibold">Não foi possível preparar o sistema</span></div>
                  <p className="mt-3 text-xs leading-5 text-slate-300/65">{error}</p>
                  <button onClick={onRetry} className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-xs font-semibold text-white transition hover:bg-cyan-600">
                    <RotateCcw size={14} /> Tentar novamente
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-300/65">Preparando seu ambiente</p>
                      <AnimatePresence mode="wait">
                        <motion.p key={visibleStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-2 text-base font-medium text-white sm:text-lg">
                          {authLoadingSteps[visibleStep]}...
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <span className="font-mono text-2xl font-light tabular-nums text-cyan-100/75">{progress}%</span>
                  </div>
                  <div className="mt-6 h-px overflow-hidden bg-white/10">
                    <motion.div className="h-full bg-cyan-300 shadow-[0_0_12px_rgba(82,211,230,.7)]" animate={{ width: `${progress}%` }} transition={{ duration: reduced ? 0 : 0.24, ease: "easeOut" }} />
                  </div>
                  <div className="mt-5 grid gap-x-5 gap-y-2 sm:grid-cols-2" aria-live="polite">
                    {authLoadingSteps.slice(0, visibleStep + 1).map((label, index) => (
                      <motion.div key={label} initial={{ opacity: 0, x: 5 }} animate={{ opacity: index === visibleStep ? 1 : 0.52, x: 0 }} className="flex items-center gap-2 text-[10px] text-cyan-50/70">
                        {index < visibleStep ? <Check size={12} className="text-emerald-400" /> : <LoaderCircle size={12} className={reduced ? "text-cyan-300" : "animate-spin text-cyan-300"} />}
                        {label}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-[9px] text-cyan-100/35">
              <ShieldCheck size={12} /> Dados reais confirmados antes da exibição dos indicadores
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LogoutDialog({
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-[#030b13]/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={busy ? undefined : onCancel}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="logout-title" initial={{ opacity: 0, y: 14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={{ duration: reduced ? 0.08 : 0.22 }} onClick={(event) => event.stopPropagation()} className="auth-shell relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--auth-border)] bg-[var(--auth-panel)] shadow-2xl">
            <div className="relative h-24 overflow-hidden border-b border-[var(--auth-border)] bg-[#081423]">
              <IntelligenceBackdrop intensified compact />
              <div className="relative z-10 flex h-full items-center px-7">
                <div className="grid size-10 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[.06] text-cyan-200"><LockKeyhole size={18} /></div>
                <div className="ml-4"><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-300/60">Sessão corporativa</p><p className="mt-1 text-xs text-white/70">Canal de acesso protegido</p></div>
              </div>
            </div>
            <div className="p-7 sm:p-8">
              <h2 id="logout-title" className="text-xl font-semibold tracking-tight text-[var(--auth-title)]">Tem certeza que deseja sair do sistema?</h2>
              <p className="mt-3 text-xs leading-5 text-[var(--auth-muted)]">Sua sessão será encerrada com segurança. Os dados e todo o histórico permanecem preservados.</p>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button disabled={busy} onClick={onCancel} className="h-11 rounded-lg border border-[var(--auth-border)] px-5 text-xs font-semibold text-[var(--auth-title)] transition hover:bg-[var(--auth-soft)] disabled:opacity-50">Cancelar</button>
                <button disabled={busy} onClick={onConfirm} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--danger)] px-5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />} Sair do sistema</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
