"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, LoaderCircle, LogOut, RotateCcw, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { DeveloperSignature } from "@/components/brand";

export const authLoadingSteps = [
  "Validando credenciais",
  "Conectando ao banco de dados",
  "Carregando pedidos",
  "Validando pedidos",
  "Calculando indicadores",
  "Preparando dashboard",
  "Sincronizando informações",
  "Verificando auditorias",
  "Sistema pronto",
] as const;

type RobotMode = "login" | "loading" | "logout";
type Gaze = { x: number; y: number };
type RobotStage =
  | "entering"
  | "building"
  | "finalizing"
  | "resting"
  | "idle"
  | "click"
  | "scanning"
  | "loading"
  | "logout";

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
    const particles = Array.from({ length: reduced ? 9 : 24 }, (_, index) => ({
      x: (index * 97) % 700,
      y: (index * 61) % 500,
      radius: index % 5 === 0 ? 1.2 : 0.65,
      speed: 0.045 + (index % 5) * 0.018,
      drift: ((index % 3) - 1) * 0.022,
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
        context.fillStyle = index % 5 === 0 ? "rgba(59,189,210,.38)" : "rgba(150,177,184,.17)";
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
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-65" />;
}

function CircuitField() {
  return (
    <div aria-hidden className="absolute inset-0 opacity-30">
      <span className="absolute left-[8%] top-[18%] h-px w-[28%] bg-gradient-to-r from-transparent to-cyan-300/35" />
      <span className="absolute right-[7%] top-[24%] h-px w-[26%] bg-gradient-to-l from-transparent to-cyan-300/30" />
      <span className="absolute bottom-[24%] left-[11%] h-px w-[24%] bg-gradient-to-r from-transparent to-cyan-300/25" />
      <span className="absolute bottom-[18%] right-[9%] h-px w-[30%] bg-gradient-to-l from-transparent to-cyan-300/30" />
      {["left-[35%] top-[18%]", "right-[33%] top-[24%]", "left-[35%] bottom-[24%]", "right-[39%] bottom-[18%]"].map((position) => (
        <motion.span key={position} className={`absolute size-1 rounded-full bg-cyan-200 ${position}`} animate={{ opacity: [.25, 1, .25], scale: [.8, 1.3, .8] }} transition={{ duration: 2.8, repeat: Infinity }} />
      ))}
    </div>
  );
}

function HologramAssembly({ mode, stage }: { mode: RobotMode; stage: RobotStage }) {
  const reduced = useReducedMotion();
  if (mode === "logout") return null;
  if (mode === "loading") {
    return (
      <div aria-hidden className="absolute inset-x-[12%] top-[18%] z-10 h-40 sm:inset-x-[18%]">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <motion.div key={index} className="relative h-16 overflow-hidden rounded-[8px] border border-cyan-200/12 bg-cyan-200/[.025]" animate={reduced ? undefined : { y: [0, index === 1 ? -4 : 3, 0], opacity: [.45, .8, .45] }} transition={{ duration: 3.2 + index * .3, repeat: Infinity, ease: "easeInOut" }}>
              <span className="absolute inset-x-3 top-3 h-px bg-cyan-200/20" />
              <span className="absolute bottom-3 left-3 h-4 w-3 bg-cyan-300/25" />
              <span className="absolute bottom-3 left-8 h-7 w-3 bg-cyan-300/40" />
              <span className="absolute bottom-3 left-13 h-5 w-3 bg-cyan-300/30" />
            </motion.div>
          ))}
        </div>
        <div className="absolute inset-x-[8%] bottom-2 h-px bg-cyan-200/16">
          {[0, 1, 2].map((index) => (
            <motion.span key={index} className="absolute -top-4 grid size-4 place-items-center rounded-[3px] border border-cyan-200/25 bg-[#102b35] text-[7px] text-cyan-100/60" initial={{ left: `${index * 18}%` }} animate={reduced ? undefined : { left: [`${index * 18}%`, `${62 + index * 8}%`, `${index * 18}%`] }} transition={{ duration: 4.4 + index * .35, repeat: Infinity, ease: "easeInOut" }}>◆</motion.span>
          ))}
        </div>
      </div>
    );
  }
  const visible = stage === "building" || stage === "finalizing" || stage === "scanning";
  return (
    <motion.div aria-hidden className="absolute inset-x-[11%] top-[22%] z-10 h-40 sm:inset-x-[18%]" initial={false} animate={{ opacity: visible ? (stage === "finalizing" ? .18 : stage === "scanning" ? 1 : .75) : 0, scale: stage === "scanning" ? 1.03 : 1 }} transition={{ duration: reduced ? .05 : .55, ease: "easeOut" }}>
      <div className="absolute left-0 top-6 h-24 w-[34%] rounded-[8px] border border-cyan-200/16 bg-cyan-200/[.025] p-4">
        <span className="block h-px w-16 bg-cyan-100/20" />
        <div className="mt-5 flex h-10 items-end gap-2">{[34, 62, 48, 78].map((height) => <span key={height} className="flex-1 bg-cyan-300/30" style={{ height: `${height}%` }} />)}</div>
      </div>
      <div className="absolute right-0 top-0 h-24 w-[36%] rounded-[8px] border border-cyan-200/16 bg-cyan-200/[.025] p-4">
        <span className="block h-px w-20 bg-cyan-100/20" />
        <span className="mt-5 block h-px w-full rotate-[-8deg] bg-cyan-300/40" />
        <span className="mt-5 block h-px w-[72%] rotate-[5deg] bg-cyan-300/24" />
      </div>
      <span className="absolute left-[38%] top-[52%] h-px w-[24%] bg-cyan-200/25" />
    </motion.div>
  );
}

function Robot({ mode, stage, gaze }: { mode: RobotMode; stage: RobotStage; gaze: Gaze }) {
  const reduced = useReducedMotion();
  const seated = stage === "resting" || stage === "idle" || stage === "click";
  const working = stage === "building" || stage === "finalizing" || stage === "scanning" || stage === "loading";
  const walking = stage === "entering";
  const scanning = stage === "scanning";
  return (
    <motion.div initial={reduced ? false : { x: mode === "login" ? -150 : 0, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: reduced ? .1 : 1.25, ease: [.22, 1, .36, 1] }} className="relative z-20">
      <motion.svg aria-label="Assistente virtual da Ekko" role="img" viewBox="0 0 420 480" className="h-[45vh] min-h-[292px] max-h-[490px] w-auto drop-shadow-[0_28px_54px_rgba(0,0,0,.34)]" animate={reduced ? undefined : { y: [0, -3, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}>
        <defs>
          <linearGradient id="robotShell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f0f5f5" /><stop offset=".45" stopColor="#a2b3b8" /><stop offset="1" stopColor="#42565d" /></linearGradient>
          <linearGradient id="robotDark" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#17282f" /><stop offset="1" stopColor="#061014" /></linearGradient>
          <radialGradient id="coreGlow"><stop stopColor="#d6fbff" /><stop offset=".35" stopColor="#3bbdd2" /><stop offset="1" stopColor="#0b6677" /></radialGradient>
          <filter id="eyeGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {seated && <motion.g initial={{ opacity: 0, x: 35 }} animate={{ opacity: .9, x: 0 }} transition={{ duration: reduced ? .05 : .75 }}>
          <rect x="122" y="282" width="176" height="128" rx="46" fill="#0a171c" stroke="#597078" strokeOpacity=".36" strokeWidth="3" />
          <path d="M210 398v45M155 448h110M170 448l-22 18M250 448l22 18" stroke="#5e747a" strokeWidth="10" strokeLinecap="round" />
          <circle cx="144" cy="468" r="8" fill="#1b3037" /><circle cx="276" cy="468" r="8" fill="#1b3037" />
        </motion.g>}
        <ellipse cx="210" cy="460" rx="112" ry="15" fill="#020709" opacity=".48" />

        <motion.g animate={reduced ? undefined : { rotate: working ? [0, -1, .8, 0] : [0, .7, 0] }} transition={{ duration: 4.4, repeat: Infinity }} style={{ transformOrigin: "210px 230px" }}>
          <path d="M150 259C159 237 181 226 210 226s51 11 60 33l20 117c4 26-17 50-43 50h-74c-26 0-47-24-43-50z" fill="url(#robotShell)" stroke="#d7e5e7" strokeOpacity=".34" />
          <path d="M161 279c20 15 78 15 98 0l11 94c2 17-11 32-28 32h-64c-17 0-30-15-28-32z" fill="url(#robotDark)" />
          <circle cx="210" cy="333" r="35" fill="#0c191e" stroke="#657b82" strokeWidth="2" />
          <motion.circle cx="210" cy="333" r="22" fill="url(#coreGlow)" filter="url(#eyeGlow)" animate={reduced ? undefined : { opacity: [.7, 1, .7], r: [20, 22, 20] }} transition={{ duration: 3.2, repeat: Infinity }} />

          {seated ? <>
            <motion.path d="M178 407q30 18 58 38" stroke="#71868c" strokeWidth="20" strokeLinecap="round" animate={reduced ? undefined : { rotate: [0, 1.5, 0, -1.2, 0] }} transition={{ duration: 5.2, repeat: Infinity }} style={{ transformOrigin: "178px 407px" }} />
            <motion.path d="M242 407q-15 22-39 40" stroke="#71868c" strokeWidth="20" strokeLinecap="round" animate={reduced ? undefined : { rotate: [0, -2.5, 1.5, 0] }} transition={{ duration: 3.8, repeat: Infinity }} style={{ transformOrigin: "242px 407px" }} />
            <path d="M222 448h41M166 448h40" stroke="#d9e5e6" strokeWidth="17" strokeLinecap="round" />
          </> : <>
            <motion.path d="M177 409l-14 35" stroke="#71868c" strokeWidth="20" strokeLinecap="round" animate={walking && !reduced ? { rotate: [-9, 9, -9] } : undefined} transition={{ duration: .7, repeat: Infinity }} style={{ transformOrigin: "177px 409px" }} />
            <motion.path d="M243 409l14 35" stroke="#71868c" strokeWidth="20" strokeLinecap="round" animate={walking && !reduced ? { rotate: [9, -9, 9] } : undefined} transition={{ duration: .7, repeat: Infinity }} style={{ transformOrigin: "243px 409px" }} />
            <path d="M159 447h42M219 447h42" stroke="#d9e5e6" strokeWidth="18" strokeLinecap="round" />
          </>}

          <motion.g animate={reduced ? undefined : scanning ? { rotate: [0, -24, -18, -24, 0] } : working ? { rotate: [0, -10, 3, 0] } : seated ? { rotate: [0, -34, -34, 0, 0] } : { rotate: [0, 6, 0] }} transition={{ duration: scanning ? 2.4 : seated ? 7.8 : 4.2, repeat: Infinity, times: seated ? [0, .55, .7, .82, 1] : undefined }} style={{ transformOrigin: "145px 286px" }}>
            <path d="M144 282l-46 54" stroke="url(#robotShell)" strokeWidth="28" strokeLinecap="round" /><circle cx="90" cy="345" r="18" fill="#afc0c4" /><path d="M80 345h-27" stroke="#879da3" strokeWidth="12" strokeLinecap="round" />
          </motion.g>
          <motion.g animate={reduced ? undefined : scanning ? { rotate: [0, 20, 12, 20, 0] } : working ? { rotate: [0, 12, -2, 0, -24, -24, 0] } : seated ? { rotate: [0, 5, 0, -28, -28, 0] } : { rotate: [0, -8, 0] }} transition={{ duration: scanning ? 2.4 : 7.2, repeat: Infinity, times: scanning ? undefined : [0, .2, .4, .58, .68, .78, 1] }} style={{ transformOrigin: "275px 286px" }}>
            <path d="M276 282l46 54" stroke="url(#robotShell)" strokeWidth="28" strokeLinecap="round" /><circle cx="330" cy="345" r="18" fill="#afc0c4" /><path d="M340 345h27" stroke="#879da3" strokeWidth="12" strokeLinecap="round" />
            <motion.path d="M367 345v-18M367 327h10" stroke="#d8e5e6" strokeWidth="7" strokeLinecap="round" animate={reduced ? undefined : { opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 7.2, repeat: Infinity, times: [0, .55, .64, .8, 1] }} />
          </motion.g>
        </motion.g>

        <motion.g animate={reduced ? undefined : { rotate: gaze.x * 3.2, x: gaze.x * 3.5, y: gaze.y * 2.2 }} transition={{ type: "spring", stiffness: 90, damping: 16 }} style={{ transformOrigin: "210px 170px" }}>
          <path d="M116 116c0-38 31-69 69-69h50c38 0 69 31 69 69v71c0 42-34 76-76 76h-36c-42 0-76-34-76-76z" fill="url(#robotShell)" stroke="#d9e7e8" strokeOpacity=".45" />
          <path d="M134 124c0-29 24-53 53-53h46c29 0 53 24 53 53v57c0 32-26 58-58 58h-36c-32 0-58-26-58-58z" fill="url(#robotDark)" />
          <path d="M210 47V22" stroke="#8ca1a7" strokeWidth="8" strokeLinecap="round" />
          <motion.circle cx="210" cy="18" r="7" fill="#70d5df" filter="url(#eyeGlow)" animate={reduced ? undefined : { opacity: [.5, 1, .5] }} transition={{ duration: 2.5, repeat: Infinity }} />
          <motion.g animate={reduced ? undefined : { x: gaze.x * 5, y: gaze.y * 2.5 }} transition={{ type: "spring", stiffness: 120, damping: 17 }}>
            {[164, 221].map((x, index) => <motion.rect key={x} x={x} y="139" width="35" height="10" rx="5" fill="#70d5df" filter="url(#eyeGlow)" animate={reduced ? undefined : { scaleY: [1, 1, .08, 1, 1] }} transition={{ duration: 4.8 + index * .2, repeat: Infinity, times: [0, .72, .75, .79, 1] }} style={{ transformOrigin: `${x + 17}px 144px` }} />)}
          </motion.g>
          <motion.path d={mode === "logout" ? "M194 194q16 6 32 0" : "M193 190q17 12 34 0"} fill="none" stroke="#88a6ad" strokeWidth="4" strokeLinecap="round" animate={reduced ? undefined : { d: ["M193 190q17 12 34 0", "M193 190q17 16 34 0", "M193 190q17 12 34 0"] }} transition={{ duration: 5.5, repeat: Infinity }} />
        </motion.g>

        {(stage === "entering" || stage === "building") && <motion.g initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .45 }}>
          <rect x="48" y="358" width="72" height="44" rx="7" fill="#12272e" stroke="#70d5df" strokeOpacity=".4" /><path d="M70 358v-12h28v12" fill="none" stroke="#82999f" strokeWidth="6" /><path d="M67 379h34" stroke="#70d5df" strokeOpacity=".45" />
        </motion.g>}
        {scanning && <motion.g initial={{ opacity: 0, scale: .82 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .3 }}>
          <rect x="114" y="315" width="192" height="78" rx="12" fill="#0b2631" fillOpacity=".7" stroke="#70d5df" strokeOpacity=".6" />
          <motion.path d="M126 328h168" stroke="#9ff6ff" strokeWidth="3" filter="url(#eyeGlow)" animate={{ y: [0, 50, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
          <path d="M139 346h52M139 362h116M229 346h45" stroke="#70d5df" strokeOpacity=".3" strokeWidth="4" strokeLinecap="round" />
        </motion.g>}
        {working && <motion.path aria-hidden d="M70 315l140-54 140 54-140 55z" fill="#2bb8ca" stroke="#70d5df" strokeOpacity=".26" animate={{ opacity: [.02, .07, .025] }} transition={{ duration: 3.8, repeat: Infinity }} />}
      </motion.svg>
    </motion.div>
  );
}

function BrandAssembly({ mode, stage }: { mode: RobotMode; stage: RobotStage }) {
  const reduced = useReducedMotion();
  if (mode === "logout") return null;
  if (mode === "loading") return (
    <div className="pointer-events-none absolute inset-x-0 top-[8%] z-30 text-center">
      <p className="text-sm font-semibold tracking-[-.01em] text-[var(--auth-title)]">Ekko Representação Logística</p>
      <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.18em] text-[var(--auth-muted)]">Business Intelligence para Gestão de Pedidos</p>
    </div>
  );
  const visible = stage === "finalizing" || stage === "resting" || stage === "idle" || stage === "click" || stage === "scanning";
  const glowing = stage === "scanning";
  return (
    <div className="pointer-events-none absolute inset-x-[8%] top-[5%] z-30 flex justify-center lg:justify-start">
      <motion.div className="w-[250px] text-center sm:w-[300px] lg:w-[320px] lg:text-left" initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 18, scale: glowing ? 1.035 : visible ? 1 : .96, filter: glowing ? "drop-shadow(0 0 18px rgba(112,213,223,.38))" : "drop-shadow(0 0 0 rgba(0,0,0,0))" }} transition={{ duration: reduced ? .05 : .65, ease: [.22, 1, .36, 1] }}>
        <div className="relative">
          <Image src="/pedro-mariniello-logo.png" alt="Pedro Mariniello" width={1942} height={809} priority className="w-full object-contain" />
          {!reduced && stage === "finalizing" && <motion.span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent" animate={{ top: [0, "100%"] }} transition={{ duration: 1.4, ease: "easeInOut" }} />}
        </div>
        <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 7 }} transition={{ delay: stage === "finalizing" && !reduced ? .45 : 0, duration: .55 }} className="mt-4">
          <p className="text-sm font-semibold tracking-[-.01em] text-[var(--auth-title)]">Ekko Representação Logística</p>
          <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.17em] text-[var(--auth-muted)]">Business Intelligence para Gestão de Pedidos</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function RobotScene({ mode = "login", compact = false, active = false }: { mode?: RobotMode; compact?: boolean; active?: boolean }) {
  const [gaze, setGaze] = useState<Gaze>({ x: 0, y: 0 });
  const [stage, setStage] = useState<RobotStage>(mode === "loading" ? "loading" : mode === "logout" ? "logout" : "entering");
  const stageBeforeClick = useRef<RobotStage>("idle");
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode === "loading") { setStage("loading"); return; }
    if (mode === "logout") { setStage("logout"); return; }
    if (active) { setStage("scanning"); return; }
    const sequence: Array<[RobotStage, number]> = [
      ["entering", 0],
      ["building", 1500],
      ["finalizing", 5100],
      ["resting", 7350],
      ["idle", 8750],
    ];
    const timers = sequence.map(([next, delay]) => setTimeout(() => setStage(next), delay));
    return () => timers.forEach(clearTimeout);
  }, [mode, active]);

  const track = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setGaze({ x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) });
  };
  const reactToClick = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setGaze({ x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) });
    if (mode !== "login" || active) return;
    stageBeforeClick.current = stage === "click" ? stageBeforeClick.current : stage;
    setStage("click");
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setStage(stageBeforeClick.current), 620);
  };

  useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current); }, []);

  return (
    <div data-robot-stage={stage} onPointerMove={track} onPointerDown={reactToClick} onPointerLeave={() => setGaze({ x: 0, y: 0 })} className={`auth-stage relative isolate overflow-hidden ${compact ? "min-h-[300px]" : "h-full min-h-[420px]"}`}>
      <ParticleCanvas /><CircuitField /><HologramAssembly mode={mode} stage={stage} />
      <div aria-hidden className="absolute left-1/2 top-[44%] size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[.055] blur-[110px]" />
      <BrandAssembly mode={mode} stage={stage} />
      <div className={`absolute inset-x-0 z-20 flex justify-center ${compact ? "bottom-[-54px]" : "bottom-[-38px]"}`}><Robot mode={mode} stage={stage} gaze={gaze} /></div>
      <div aria-hidden className="absolute bottom-[10%] left-1/2 z-10 h-px w-[68%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200/22 to-transparent" />
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
          <p className="mt-2 text-xs leading-5 text-[var(--auth-muted)]">O dashboard será liberado quando os dados reais estiverem disponíveis.</p>
          {error ? <motion.div role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[12px] border border-red-500/20 bg-red-500/[.06] p-5">
            <div className="flex items-center gap-2 text-[var(--danger)]"><AlertTriangle size={17} /><span className="text-xs font-semibold">Não foi possível preparar o sistema</span></div><p className="mt-2 text-xs leading-5 text-[var(--auth-muted)]">{error}</p><button onClick={onRetry} className="mt-5 inline-flex h-10 items-center gap-2 rounded-[9px] bg-[var(--primary)] px-4 text-xs font-semibold text-white"><RotateCcw size={14} />Tentar novamente</button>
          </motion.div> : <div className="mt-8 space-y-1" aria-live="polite">{authLoadingSteps.map((label, index) => {
            const complete = index < step || ready; const active = index === step && !ready;
            return <motion.div key={label} initial={{ opacity: 0, x: 6 }} animate={{ opacity: index <= step ? 1 : .25, x: 0 }} className={`flex min-h-10 items-center gap-3 rounded-[8px] px-3 ${active ? "bg-cyan-400/[.05]" : ""}`}><span className={`grid size-6 place-items-center rounded-full border ${complete ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-500" : active ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-500" : "border-[var(--auth-border)] text-[var(--auth-muted)]"}`}>{complete ? <Check size={13} /> : active ? <LoaderCircle size={13} className={reduced ? "" : "animate-spin"} /> : <span className="size-1 rounded-full bg-current" />}</span><span className={`text-xs ${complete || active ? "text-[var(--auth-title)]" : "text-[var(--auth-muted)]"}`}>{label}</span></motion.div>;
          })}</div>}
          <div className="mt-8 h-px overflow-hidden bg-[var(--auth-border)]"><motion.div className="h-full bg-[var(--primary)]" animate={{ width: `${Math.max(7, ((step + 1) / authLoadingSteps.length) * 100)}%` }} /></div>
          <p className="mt-4 flex items-center gap-2 text-[10px] text-[var(--auth-muted)]"><ShieldCheck size={13} />Indicadores exibidos somente após a confirmação dos dados reais.</p>
        </div>
      </div>
    </motion.div>
  );
}

export function LogoutDialog({ open, busy, onCancel, onConfirm }: { open: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const reduced = useReducedMotion();
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-[#02080b]/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={busy ? undefined : onCancel}>
    <motion.div role="dialog" aria-modal="true" aria-labelledby="logout-title" initial={{ opacity: 0, y: 14, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .99 }} transition={{ duration: reduced ? .08 : .22 }} onClick={(event) => event.stopPropagation()} className="auth-shell grid w-full max-w-3xl overflow-hidden rounded-[16px] border border-[var(--auth-border)] bg-[var(--auth-panel)] shadow-2xl md:grid-cols-[.9fr_1.1fr]">
      <div className="hidden min-h-[380px] md:block"><RobotScene mode="logout" compact /></div>
      <div className="flex flex-col justify-center p-7 sm:p-9"><span className="grid size-11 place-items-center rounded-[10px] border border-red-500/20 bg-red-500/[.07] text-[var(--danger)]"><LogOut size={20} /></span><p className="mt-6 text-[9px] font-semibold uppercase tracking-[.17em] text-cyan-500">Sessão corporativa</p><h2 id="logout-title" className="mt-2 text-2xl font-semibold tracking-tight text-[var(--auth-title)]">Tem certeza que deseja sair do sistema?</h2><p className="mt-3 text-xs leading-5 text-[var(--auth-muted)]">Sua sessão será encerrada com segurança. Os dados e o histórico permanecem preservados.</p><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button disabled={busy} onClick={onCancel} className="h-11 rounded-[9px] border border-[var(--auth-border)] px-5 text-xs font-semibold text-[var(--auth-title)] transition hover:bg-[var(--auth-soft)] disabled:opacity-50">Cancelar</button><button disabled={busy} onClick={onConfirm} className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[var(--danger)] px-5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}Sair</button></div></div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
