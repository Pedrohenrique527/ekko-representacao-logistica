"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, LoaderCircle, LogOut, RotateCcw, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { DeveloperSignature } from "@/components/brand";

export const authLoadingSteps = [
  "Validando credenciais",
  "Conectando ao banco de dados",
  "Carregando pedidos",
  "Validando pedidos",
  "Carregando dashboards",
  "Preparando indicadores",
  "Sincronizando informações",
  "Verificando auditorias",
  "Sistema pronto",
] as const;

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    const particles = Array.from({ length: reduced ? 10 : 24 }, (_, index) => ({
      x: (index * 97) % 700,
      y: (index * 61) % 500,
      radius: index % 5 === 0 ? 1.25 : 0.7,
      speed: 0.055 + (index % 5) * 0.018,
      drift: ((index % 3) - 1) * 0.025,
    }));

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, width * ratio);
      canvas.height = Math.max(1, height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        if (!reduced) {
          particle.y -= particle.speed;
          particle.x += particle.drift;
          if (particle.y < -8) particle.y = height + 8;
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;
        }
        context.beginPath();
        context.fillStyle = index % 5 === 0 ? "rgba(43,184,202,.42)" : "rgba(151,180,184,.2)";
        context.arc(particle.x % Math.max(width, 1), particle.y % Math.max(height, 1), particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />;
}

function CircuitField() {
  return (
    <svg aria-hidden viewBox="0 0 900 900" className="absolute inset-0 h-full w-full opacity-[.2]">
      <defs>
        <linearGradient id="circuitGradient" x1="0" x2="1">
          <stop stopColor="#2bb8ca" stopOpacity="0" />
          <stop offset=".5" stopColor="#2bb8ca" />
          <stop offset="1" stopColor="#2bb8ca" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#circuitGradient)" strokeWidth="1">
        <path d="M0 150h180l42 42h120M900 210H710l-54 54H530M0 700h160l58-58h112M900 670H735l-48-48H565" />
        <path d="M100 0v110l50 50v92M780 0v105l-42 42v110M130 900V790l58-58v-92M760 900V780l-44-44v-100" />
      </g>
      <g fill="#70d5df"><circle cx="342" cy="192" r="3" /><circle cx="530" cy="264" r="3" /><circle cx="330" cy="642" r="3" /><circle cx="565" cy="622" r="3" /></g>
    </svg>
  );
}

function Robot({ mode }: { mode: "login" | "loading" | "logout" }) {
  const reduced = useReducedMotion();
  const working = mode !== "logout";
  return (
    <motion.svg
      aria-label="Assistente virtual da Ekko"
      role="img"
      viewBox="0 0 420 480"
      className="relative z-20 h-[46vh] min-h-[300px] max-h-[500px] w-auto drop-shadow-[0_28px_54px_rgba(0,0,0,.35)]"
      animate={reduced ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="robotShell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eef5f5" /><stop offset=".45" stopColor="#9fb2b7" /><stop offset="1" stopColor="#42565d" /></linearGradient>
        <linearGradient id="robotDark" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#17282f" /><stop offset="1" stopColor="#061014" /></linearGradient>
        <radialGradient id="coreGlow"><stop stopColor="#d6fbff" /><stop offset=".35" stopColor="#2bb8ca" /><stop offset="1" stopColor="#0e7182" /></radialGradient>
        <filter id="eyeGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <ellipse cx="210" cy="452" rx="112" ry="18" fill="#020709" opacity=".5" />
      <motion.g animate={reduced ? undefined : { rotate: working ? [0, -1.5, 1, 0] : [0, 1, 0] }} transition={{ duration: 4.2, repeat: Infinity }} style={{ transformOrigin: "210px 230px" }}>
        <path d="M150 259C159 237 181 226 210 226s51 11 60 33l20 117c4 26-17 50-43 50h-74c-26 0-47-24-43-50z" fill="url(#robotShell)" stroke="#d7e5e7" strokeOpacity=".34" />
        <path d="M161 279c20 15 78 15 98 0l11 94c2 17-11 32-28 32h-64c-17 0-30-15-28-32z" fill="url(#robotDark)" />
        <circle cx="210" cy="333" r="35" fill="#0c191e" stroke="#657b82" strokeWidth="2" />
        <motion.circle cx="210" cy="333" r="22" fill="url(#coreGlow)" filter="url(#eyeGlow)" animate={reduced ? undefined : { opacity: [.72, 1, .72], r: [20, 22.5, 20] }} transition={{ duration: 3, repeat: Infinity }} />
        <path d="M177 409l-14 35M243 409l14 35" stroke="#71868c" strokeWidth="20" strokeLinecap="round" />
        <path d="M159 447h42M219 447h42" stroke="#d9e5e6" strokeWidth="18" strokeLinecap="round" />
        <motion.g animate={reduced ? undefined : working ? { rotate: [0, -9, 3, 0] } : { rotate: [0, 6, 0] }} transition={{ duration: 3.8, repeat: Infinity }} style={{ transformOrigin: "145px 286px" }}><path d="M144 282l-46 54" stroke="url(#robotShell)" strokeWidth="28" strokeLinecap="round" /><circle cx="90" cy="345" r="18" fill="#afc0c4" /><path d="M80 345h-27" stroke="#879da3" strokeWidth="12" strokeLinecap="round" /></motion.g>
        <motion.g animate={reduced ? undefined : working ? { rotate: [0, 10, -2, 0] } : { rotate: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: .2 }} style={{ transformOrigin: "275px 286px" }}><path d="M276 282l46 54" stroke="url(#robotShell)" strokeWidth="28" strokeLinecap="round" /><circle cx="330" cy="345" r="18" fill="#afc0c4" /><path d="M340 345h27" stroke="#879da3" strokeWidth="12" strokeLinecap="round" /></motion.g>
      </motion.g>
      <motion.g animate={reduced ? undefined : { rotate: working ? [0, 1, -1, 0] : [0, -2, 0] }} transition={{ duration: 3.8, repeat: Infinity }} style={{ transformOrigin: "210px 170px" }}>
        <path d="M116 116c0-38 31-69 69-69h50c38 0 69 31 69 69v71c0 42-34 76-76 76h-36c-42 0-76-34-76-76z" fill="url(#robotShell)" stroke="#d9e7e8" strokeOpacity=".45" />
        <path d="M134 124c0-29 24-53 53-53h46c29 0 53 24 53 53v57c0 32-26 58-58 58h-36c-32 0-58-26-58-58z" fill="url(#robotDark)" />
        <path d="M210 47V22" stroke="#8ca1a7" strokeWidth="8" strokeLinecap="round" /><motion.circle cx="210" cy="18" r="7" fill="#70d5df" filter="url(#eyeGlow)" animate={reduced ? undefined : { opacity: [.5, 1, .5] }} transition={{ duration: 2.4, repeat: Infinity }} />
        {[164, 221].map((x, index) => <motion.rect key={x} x={x} y="139" width="35" height="10" rx="5" fill="#70d5df" filter="url(#eyeGlow)" animate={reduced ? undefined : { opacity: [.76, 1, .76], scaleX: [1, 1.06, 1] }} transition={{ duration: 2.8, repeat: Infinity, delay: index * .1 }} style={{ transformOrigin: `${x + 17}px 144px` }} />)}
        <path d={mode === "logout" ? "M194 194q16 6 32 0" : "M193 190q17 12 34 0"} fill="none" stroke="#88a6ad" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      {working && <motion.path aria-hidden d="M70 315l140-54 140 54-140 55z" fill="#2bb8ca" stroke="#70d5df" strokeOpacity=".3" animate={{ opacity: [.025, .08, .035] }} transition={{ duration: 3.6, repeat: Infinity }} />}
    </motion.svg>
  );
}

function EkkoLogoArtifact({ staticLogo = false }: { staticLogo?: boolean }) {
  const reduced = useReducedMotion();
  const animate = !reduced && !staticLogo;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[17%] z-30 flex justify-center sm:bottom-[19%]">
      <motion.div initial={animate ? { opacity: 0, y: 18, scale: .94 } : false} animate={animate ? { opacity: [0, 1, 1], y: [18, 0, 0], scale: [.94, 1, 1], rotate: [-1.5, .5, -1.5] } : { opacity: 1 }} transition={animate ? { duration: 6.5, times: [0, .23, 1], repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" } : undefined} className="text-center">
        <div className="relative mx-auto w-[142px] rounded-[12px] border border-white/25 bg-[#f7f8f5] p-2 shadow-[0_16px_38px_rgba(0,0,0,.3)] sm:w-[168px]">
          <Image src="/ekko-logo.png" alt="Ekko Revestimentos" width={365} height={365} priority className="w-full object-contain" />
          {animate && <motion.span className="absolute inset-x-2 top-2 h-px bg-[#2bb8ca]/70" animate={{ top: [8, "calc(100% - 8px)", 8] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />}
        </div>
        <motion.div initial={animate ? { opacity: 0, y: 5 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: animate ? 1.2 : 0 }} className="mt-4">
          <p className="text-sm font-semibold tracking-[-.01em] text-[var(--auth-title)]">Ekko Representação Logística</p>
          <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.16em] text-[var(--auth-muted)]">Business Intelligence para Gestão de Pedidos</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function RobotScene({ mode = "login", compact = false }: { mode?: "login" | "loading" | "logout"; compact?: boolean }) {
  return (
    <div className={`auth-stage relative isolate overflow-hidden ${compact ? "min-h-[300px]" : "h-full min-h-[420px]"}`}>
      <ParticleCanvas />
      <CircuitField />
      <div aria-hidden className="absolute left-1/2 top-[44%] size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[.07] blur-[110px]" />
      <div aria-hidden className="absolute bottom-[-12%] left-1/2 h-44 w-[78%] -translate-x-1/2 rounded-[50%] border border-cyan-300/10 bg-cyan-300/[.025]" />
      {mode !== "logout" && <EkkoLogoArtifact staticLogo={mode === "loading"} />}
      <div className={`absolute inset-x-0 z-20 flex justify-center ${compact ? "bottom-[-54px]" : "bottom-[-42px]"}`}><Robot mode={mode} /></div>
      <div aria-hidden className="absolute bottom-[10%] left-1/2 z-10 h-px w-[68%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent" />
      {!compact && <DeveloperSignature inverse className="absolute bottom-5 left-6 z-40 hidden sm:flex lg:left-10" />}
    </div>
  );
}

export function AuthLoadingScreen({ step, error, onRetry, onReady }: { step: number; error?: string; onRetry: () => void; onReady: () => void }) {
  const reduced = useReducedMotion();
  const ready = step >= authLoadingSteps.length - 1 && !error;
  return (
    <motion.div className="auth-shell fixed inset-0 z-[100] grid min-h-screen overflow-hidden bg-[var(--auth-bg)] lg:grid-cols-[1.12fr_.88fr]" initial={{ opacity: 1 }} animate={ready ? { opacity: 0, scale: 1.008, filter: "blur(7px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: reduced ? .1 : .65, ease: [.22, 1, .36, 1] }} onAnimationComplete={() => { if (ready) onReady(); }}>
      <div className="min-h-[46vh] lg:min-h-screen"><RobotScene mode="loading" /></div>
      <div className="relative z-30 flex items-center border-t border-[var(--auth-border)] bg-[var(--auth-panel)] px-6 py-10 backdrop-blur-2xl lg:border-l lg:border-t-0 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[9px] font-semibold uppercase tracking-[.17em] text-cyan-500">Ambiente Ekko</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--auth-title)]">Preparando seu ambiente...</h1>
          <p className="mt-2 text-xs leading-5 text-[var(--auth-muted)]">A tela será liberada somente depois que os dados reais estiverem disponíveis.</p>
          {error ? (
            <motion.div role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[12px] border border-red-500/20 bg-red-500/[.06] p-5">
              <div className="flex items-center gap-2 text-[var(--danger)]"><AlertTriangle size={17} /><span className="text-xs font-semibold">Não foi possível preparar o sistema</span></div>
              <p className="mt-2 text-xs leading-5 text-[var(--auth-muted)]">{error}</p>
              <button onClick={onRetry} className="mt-5 inline-flex h-10 items-center gap-2 rounded-[9px] bg-[var(--primary)] px-4 text-xs font-semibold text-white"><RotateCcw size={14} />Tentar novamente</button>
            </motion.div>
          ) : (
            <div className="mt-8 space-y-1" aria-live="polite">
              {authLoadingSteps.map((label, index) => {
                const complete = index < step || ready;
                const active = index === step && !ready;
                return <motion.div key={label} initial={{ opacity: 0, x: 6 }} animate={{ opacity: index <= step ? 1 : .26, x: 0 }} transition={{ duration: reduced ? 0 : .2 }} className={`flex min-h-10 items-center gap-3 rounded-[9px] px-3 ${active ? "bg-cyan-400/[.06]" : ""}`}>
                  <span className={`grid size-6 place-items-center rounded-full border ${complete ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-500" : active ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-500" : "border-[var(--auth-border)] text-[var(--auth-muted)]"}`}>{complete ? <Check size={13} /> : active ? <LoaderCircle size={13} className={reduced ? "" : "animate-spin"} /> : <span className="size-1 rounded-full bg-current" />}</span>
                  <span className={`text-xs ${complete || active ? "text-[var(--auth-title)]" : "text-[var(--auth-muted)]"}`}>{label}</span>
                </motion.div>;
              })}
            </div>
          )}
          <div className="mt-8 h-px overflow-hidden bg-[var(--auth-border)]"><motion.div className="h-full bg-[var(--primary)]" animate={{ width: `${Math.max(7, ((step + 1) / authLoadingSteps.length) * 100)}%` }} transition={{ duration: reduced ? 0 : .3 }} /></div>
          <p className="mt-4 flex items-center gap-2 text-[10px] text-[var(--auth-muted)]"><ShieldCheck size={13} />Os indicadores só aparecem após a confirmação dos dados reais.</p>
        </div>
      </div>
    </motion.div>
  );
}

export function LogoutDialog({ open, busy, onCancel, onConfirm }: { open: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={busy ? undefined : onCancel}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="logout-title" initial={{ opacity: 0, y: 14, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .99 }} transition={{ duration: reduced ? .08 : .22 }} onClick={(event) => event.stopPropagation()} className="auth-shell grid w-full max-w-3xl overflow-hidden rounded-[16px] border border-[var(--auth-border)] bg-[var(--auth-panel)] shadow-2xl md:grid-cols-[.9fr_1.1fr]">
        <div className="hidden min-h-[380px] md:block"><RobotScene mode="logout" compact /></div>
        <div className="flex flex-col justify-center p-7 sm:p-9">
          <span className="grid size-11 place-items-center rounded-[10px] border border-red-500/20 bg-red-500/[.07] text-[var(--danger)]"><LogOut size={20} /></span>
          <p className="mt-6 text-[9px] font-semibold uppercase tracking-[.17em] text-cyan-500">Sessão corporativa</p>
          <h2 id="logout-title" className="mt-2 text-2xl font-semibold tracking-tight text-[var(--auth-title)]">Tem certeza que deseja sair do sistema?</h2>
          <p className="mt-3 text-xs leading-5 text-[var(--auth-muted)]">Sua sessão será encerrada com segurança. Os dados e o histórico permanecem preservados no PostgreSQL.</p>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button disabled={busy} onClick={onCancel} className="h-11 rounded-[9px] border border-[var(--auth-border)] px-5 text-xs font-semibold text-[var(--auth-title)] transition hover:bg-[var(--auth-soft)] disabled:opacity-50">Cancelar</button>
            <button disabled={busy} onClick={onConfirm} className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[var(--danger)] px-5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}Sair</button>
          </div>
        </div>
      </motion.div>
    </motion.div>}</AnimatePresence>
  );
}
