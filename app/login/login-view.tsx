"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { IntelligenceBackdrop } from "@/components/auth-experience";
import { DeveloperSignature } from "@/components/brand";

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  remember: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const fieldClass =
  "h-[54px] w-full border-0 bg-transparent pl-11 pr-3 text-sm text-[var(--auth-title)] outline-none placeholder:text-[var(--auth-muted)]/55";

export function LoginView({
  defaultEmail,
  notice,
}: {
  defaultEmail: string;
  notice?: "expired" | "logged-out";
}) {
  const reduced = useReducedMotion();
  const [light, setLight] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [information, setInformation] = useState(
    notice === "logged-out"
      ? "Sessão encerrada com segurança."
      : notice === "expired"
        ? "Sua sessão expirou por segurança."
        : "",
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail, password: "", remember: true },
  });

  useEffect(() => {
    const saved = localStorage.getItem("ekko-theme") === "light" || localStorage.getItem("pedro-theme") === "light";
    document.documentElement.dataset.theme = saved ? "light" : "dark";
    const frame = requestAnimationFrame(() => {
      setLight(saved);
      if (!notice && localStorage.getItem("ekko-session-known") === "1") {
        setInformation("Sua sessão expirou por segurança.");
        localStorage.removeItem("ekko-session-known");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [notice]);

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("ekko-theme", next ? "light" : "dark");
  };

  const submit = handleSubmit(async (values) => {
    setServerError("");
    setInformation("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setServerError(result.message ?? "Não foi possível entrar.");
        return;
      }
      localStorage.setItem("ekko-session-known", "1");
      sessionStorage.setItem("ekko-auth-transition", "1");
      window.location.assign("/");
    } catch {
      setServerError("Não foi possível conectar ao servidor. Tente novamente.");
    }
  });

  const item = {
    hidden: { opacity: 0, y: reduced ? 0 : 10, filter: reduced ? "blur(0px)" : "blur(5px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: reduced ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <main className="auth-shell relative min-h-screen overflow-hidden bg-[#081423]">
      <IntelligenceBackdrop intensified={isSubmitting} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#06111d]/90 to-transparent" />
      <div className="absolute left-5 top-5 z-30 hidden items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-100/45 sm:flex lg:left-8 lg:top-7">
        <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,221,236,.8)]" />
        Centro de Inteligência Logística
      </div>
      <div className="absolute right-5 top-5 z-30 flex items-center gap-2 lg:right-8 lg:top-7">
        <span className="hidden font-mono text-[8px] uppercase tracking-[.16em] text-cyan-100/30 sm:block">Acesso seguro</span>
        <button
          onClick={toggleTheme}
          aria-label={light ? "Ativar tema escuro" : "Ativar tema claro"}
          className="grid size-10 place-items-center rounded-lg border border-white/10 bg-[#0a1b2b]/65 text-cyan-50/65 backdrop-blur-xl transition hover:border-cyan-300/20 hover:text-white"
        >
          {light ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="relative z-20 mx-auto flex min-h-screen w-full max-w-[1180px] flex-col items-center justify-center px-5 py-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : -5, filter: reduced ? "blur(0px)" : "blur(8px)" }}
          animate={{ opacity: isSubmitting ? 0.35 : 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 1.15 }}
          className="mb-7 text-center"
        >
          <Image
            src="/pedro-mariniello-logo.png"
            alt="Pedro Mariniello"
            width={1942}
            height={809}
            priority
            className="mx-auto h-auto w-[190px] object-contain drop-shadow-[0_0_18px_rgba(73,199,220,.13)] sm:w-[228px]"
          />
          <motion.h1
            initial={{ opacity: 0, y: reduced ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : 1.8 }}
            className="mt-5 text-xl font-semibold tracking-[-.025em] text-white sm:text-2xl"
          >
            Ekko Representação Logística
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 2.05 }}
            className="mt-2 text-[9px] font-medium uppercase tracking-[.2em] text-cyan-100/45 sm:text-[10px]"
          >
            Business Intelligence para Gestão de Pedidos
          </motion.p>
        </motion.div>

        <motion.section
          aria-label="Acesso ao sistema"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.075, delayChildren: reduced ? 0 : 2.05 } } }}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[430px]"
        >
          <motion.div
            variants={item}
            animate={isSubmitting
              ? { opacity: 0, y: -10, scale: 0.985, filter: "blur(7px)" }
              : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: reduced ? 0 : 0.35 }}
            className="relative overflow-hidden rounded-xl border border-[var(--auth-border)] bg-[var(--auth-panel)] px-5 py-6 shadow-[0_28px_80px_rgba(0,5,12,.34)] backdrop-blur-2xl sm:px-7 sm:py-7"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[var(--primary)]">Acesso corporativo</p>
                <h2 className="mt-2 text-[22px] font-semibold tracking-[-.03em] text-[var(--auth-title)]">Acesse seu ambiente</h2>
                <p className="mt-2 text-xs leading-5 text-[var(--auth-muted)]">Consulte pedidos, indicadores e auditorias com segurança.</p>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--auth-border)] bg-[var(--auth-soft)] text-[var(--primary)]"><ShieldCheck size={16} /></span>
            </div>

            <AnimatePresence mode="popLayout">
              {information && (
                <motion.div role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 flex items-start gap-3 border-l-2 border-cyan-400 bg-cyan-500/[.055] px-3 py-2.5 text-xs text-[var(--auth-title)]">
                  <Info size={15} className="mt-px shrink-0 text-cyan-500" /> {information}
                </motion.div>
              )}
              {serverError && (
                <motion.div role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 flex items-start gap-3 border-l-2 border-red-400 bg-red-500/[.06] px-3 py-2.5 text-xs text-[var(--danger)]">
                  <Info size={15} className="mt-px shrink-0" /> {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <motion.label variants={item} className="block">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--auth-muted)]">E-mail corporativo</span>
                <div className="auth-field relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-muted)]" size={16} />
                  <input aria-label="E-mail" autoComplete="username" {...register("email")} className={fieldClass} />
                </div>
                {errors.email && <span className="mt-1.5 block text-[11px] text-[var(--danger)]">{errors.email.message}</span>}
              </motion.label>

              <motion.label variants={item} className="block">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--auth-muted)]">Senha</span>
                <div className="auth-field relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-muted)]" size={16} />
                  <input aria-label="Senha" autoComplete="current-password" type={showPassword ? "text" : "password"} {...register("password")} className={`${fieldClass} pr-11`} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-muted)] transition hover:text-[var(--auth-title)]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="mt-1.5 block text-[11px] text-[var(--danger)]">{errors.password.message}</span>}
              </motion.label>

              <motion.div variants={item} className="flex items-center justify-between gap-4 py-1">
                <label className="flex items-center gap-2 text-[11px] text-[var(--auth-muted)]">
                  <input type="checkbox" {...register("remember")} className="size-4 rounded accent-[var(--primary)]" />
                  Lembrar dispositivo
                </label>
                <button type="button" onClick={() => setInformation("Para redefinir a senha, entre em contato com o administrador responsável pelo sistema.")} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--primary)] transition hover:text-[var(--accent)]">
                  <HelpCircle size={13} /> Esqueci minha senha
                </button>
              </motion.div>

              <motion.button variants={item} whileHover={reduced ? undefined : { y: -1 }} whileTap={reduced ? undefined : { scale: 0.995 }} disabled={isSubmitting} className="auth-submit group relative inline-flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--primary)] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(4,102,128,.22)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-65">
                <span className="absolute inset-y-0 left-0 w-24 -translate-x-32 skew-x-[-20deg] bg-white/10 transition-transform duration-700 group-hover:translate-x-[480px]" />
                {isSubmitting ? <><LoaderCircle size={16} className={reduced ? "" : "animate-spin"} /> Validando acesso...</> : <>Entrar <ArrowRight size={16} /></>}
              </motion.button>
            </form>
          </motion.div>

          <motion.div variants={item} className="mt-5 flex flex-col items-center gap-2 text-center">
            <DeveloperSignature inverse />
            <p className="text-[9px] text-cyan-100/35">© Ekko Revestimentos · v1.6.0</p>
          </motion.div>
        </motion.section>
      </div>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 bottom-12 z-30 mx-auto w-[calc(100%-40px)] max-w-md text-center">
            <p className="font-mono text-[9px] uppercase tracking-[.2em] text-cyan-100/55">Estabelecendo canal seguro</p>
            <div className="mx-auto mt-3 h-px w-full overflow-hidden bg-white/10"><motion.div className="h-full w-1/3 bg-cyan-300" animate={{ x: ["-110%", "310%"] }} transition={{ duration: reduced ? 0 : 0.9, repeat: Infinity, ease: "easeInOut" }} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
