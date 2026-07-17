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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RobotScene } from "@/components/auth-experience";

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  remember: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const fieldClass =
  "h-12 w-full rounded-xl border border-[var(--auth-border)] bg-[var(--auth-input)] pl-10 pr-3 text-sm text-[var(--auth-title)] outline-none transition placeholder:text-[var(--auth-muted)]/60 focus:border-cyan-500/60 focus:ring-4 focus:ring-cyan-500/10";

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
    const saved = localStorage.getItem("pedro-theme") === "light";
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
    localStorage.setItem("pedro-theme", next ? "light" : "dark");
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

  const pageContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.08,
        delayChildren: reduced ? 0 : 5.2,
      },
    },
  };
  const formContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.08,
        delayChildren: 0,
      },
    },
  };
  const item = {
    hidden: { opacity: 0, x: reduced ? 0 : 12, y: reduced ? 0 : 8 },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: reduced ? 0 : 0.38 } },
  };

  return (
    <main className="auth-shell grid min-h-screen overflow-x-hidden bg-[var(--auth-bg)] lg:h-screen lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative min-h-[345px] overflow-hidden border-b border-[var(--auth-border)] lg:min-h-screen lg:border-b-0 lg:border-r">
        <RobotScene mode="login" />
        <div className="pointer-events-none absolute bottom-5 left-6 z-40 hidden items-center gap-2 text-[9px] font-medium uppercase tracking-[.16em] text-[var(--auth-muted)] sm:flex lg:left-10">
          <ShieldCheck size={13} className="text-cyan-500" />
          Ambiente corporativo protegido
        </div>
      </section>

      <section className="relative flex min-h-[640px] items-center justify-center bg-[var(--auth-panel)] px-5 py-12 backdrop-blur-2xl sm:px-10 lg:min-h-screen lg:px-12">
        <button
          onClick={toggleTheme}
          aria-label={light ? "Ativar tema escuro" : "Ativar tema claro"}
          className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl border border-[var(--auth-border)] bg-[var(--auth-input)] text-[var(--auth-muted)] transition hover:border-cyan-500/30 hover:text-[var(--auth-title)]"
        >
          {light ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <motion.div
          variants={pageContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[430px]"
        >
          <motion.div variants={item} className="mb-8 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-indigo-500/15 to-cyan-400/10 text-sm font-bold text-cyan-500 shadow-[0_0_30px_rgba(34,211,238,.08)]">
              PM
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--auth-title)]">
                Ekko Representação Logística
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[.13em] text-[var(--auth-muted)]">
                Business Intelligence para Gestão de Pedidos
              </p>
            </div>
          </motion.div>
          <motion.p
            variants={item}
            className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-500"
          >
            Acesso corporativo
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-3 text-3xl font-semibold tracking-[-.035em] text-[var(--auth-title)] sm:text-[2.15rem]"
          >
            Bem-vindo ao seu centro de inteligência.
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-3 text-sm leading-6 text-[var(--auth-muted)]"
          >
            Entre para acompanhar pedidos, indicadores e auditorias da
            representação em um ambiente seguro.
          </motion.p>

          <AnimatePresence mode="popLayout">
            {information && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[.07] p-3 text-xs text-[var(--auth-title)]"
              >
                <Info size={16} className="mt-px shrink-0 text-cyan-500" />
                {information}
              </motion.div>
            )}
            {serverError && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[.07] p-3 text-xs text-rose-500"
              >
                <Info size={16} className="mt-px shrink-0" />
                {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            variants={formContainer}
            className="mt-7 space-y-5"
            onSubmit={submit}
          >
            <motion.label variants={item} className="block">
              <span className="mb-2 block text-[11px] font-medium text-[var(--auth-muted)]">
                E-mail
              </span>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--auth-muted)]"
                  size={16}
                />
                <input
                  aria-label="E-mail"
                  autoComplete="username"
                  {...register("email")}
                  className={fieldClass}
                />
              </div>
              {errors.email && (
                <span className="mt-1.5 block text-[11px] text-rose-500">
                  {errors.email.message}
                </span>
              )}
            </motion.label>
            <motion.label variants={item} className="block">
              <span className="mb-2 block text-[11px] font-medium text-[var(--auth-muted)]">
                Senha
              </span>
              <div className="relative">
                <LockKeyhole
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--auth-muted)]"
                  size={16}
                />
                <input
                  aria-label="Senha"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`${fieldClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--auth-muted)] transition hover:text-[var(--auth-title)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1.5 block text-[11px] text-rose-500">
                  {errors.password.message}
                </span>
              )}
            </motion.label>
            <motion.div
              variants={item}
              className="flex items-center justify-between gap-4"
            >
              <label className="flex items-center gap-2 text-[11px] text-[var(--auth-muted)]">
                <input
                  type="checkbox"
                  {...register("remember")}
                  className="size-4 rounded accent-cyan-500"
                />
                Lembrar dispositivo
              </label>
              <button
                type="button"
                onClick={() =>
                  setInformation(
                    "Para redefinir a senha, entre em contato com o administrador responsável pelo sistema.",
                  )
                }
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-600 transition hover:text-cyan-500"
              >
                <HelpCircle size={13} />
                Esqueci minha senha
              </button>
            </motion.div>
            <motion.button
              variants={item}
              whileHover={reduced ? undefined : { scale: 1.012 }}
              whileTap={reduced ? undefined : { scale: 0.99 }}
              disabled={isSubmitting}
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(79,70,229,.22)] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 translate-x-[-110%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[110%]" />
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    size={16}
                    className={reduced ? "" : "animate-spin"}
                  />
                  Validando acesso...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div
            variants={item}
            className="mt-6 flex items-start gap-3 rounded-xl border border-[var(--auth-border)] bg-[var(--auth-soft)] p-4"
          >
            <ShieldCheck
              size={16}
              className="mt-0.5 shrink-0 text-emerald-500"
            />
            <p className="text-[10px] leading-5 text-[var(--auth-muted)]">
              <span className="font-semibold text-[var(--auth-title)]">
                Acesso protegido.
              </span>{" "}
              Sua senha não é armazenada no navegador nem enviada ao GitHub.
            </p>
          </motion.div>
          <motion.p
            variants={item}
            className="mt-7 text-center text-[9px] text-[var(--auth-muted)]"
          >
            © Ekko Revestimentos · Desenvolvido por Pedro Mariniello · v1.3.0
          </motion.p>
        </motion.div>
      </section>
    </main>
  );
}
