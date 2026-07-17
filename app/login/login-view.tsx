"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Moon, ShieldCheck, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  remember: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function LoginView({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [light, setLight] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail, password: "", remember: true },
  });

  useEffect(() => {
    const saved = localStorage.getItem("pedro-theme") === "light";
    setLight(saved);
    document.documentElement.dataset.theme = saved ? "light" : "dark";
  }, []);

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("pedro-theme", next ? "light" : "dark");
  };

  const submit = handleSubmit(async (values) => {
    setServerError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setServerError(result.message ?? "Não foi possível entrar.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setServerError("Não foi possível conectar ao servidor. Tente novamente.");
    }
  });

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[linear-gradient(135deg,#080b13,#19122d)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative">
          <div className="h-20 w-[280px] overflow-hidden rounded-xl bg-black ring-1 ring-white/10"><img src="/pedro-mariniello-logo.png" alt="Pedro Mariniello" className="h-full w-full object-contain" /></div>
          <p className="mt-4 text-sm font-semibold text-white">Ekko Representação Logística</p>
        </div>
        <div className="relative max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-400">Business Intelligence</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.08] tracking-[-.045em] text-white">Confiança para acompanhar cada pedido.</h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300">Excel preservado, dados reais no PostgreSQL e auditoria linha por linha para decisões seguras.</p>
        </div>
        <p className="relative flex items-center gap-2 text-[10px] text-slate-400"><ShieldCheck size={14} />Ambiente corporativo protegido e auditável</p>
      </section>

      <section className="relative flex items-center justify-center p-6 sm:p-12">
        <button onClick={toggleTheme} aria-label="Alternar tema" className="absolute right-6 top-6 grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">{light ? <Moon size={17} /> : <Sun size={17} />}</button>
        <div className="w-full max-w-[410px]">
          <div className="mb-9">
            <div className="h-16 w-[230px] overflow-hidden rounded-xl bg-black ring-1 ring-white/10"><img src="/pedro-mariniello-logo.png" alt="Pedro Mariniello" className="h-full w-full object-contain" /></div>
            <p className="mt-3 text-sm font-semibold text-[var(--text)]">Ekko Representação Logística</p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-500">Acesso corporativo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">Bem-vindo</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Entre com as credenciais da representação para acessar os dados operacionais.</p>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[var(--muted)]">E-mail</span>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} /><input autoComplete="username" {...register("email")} className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3 text-sm text-[var(--text)] outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10" /></div>
              {errors.email && <span className="mt-1.5 block text-[11px] text-rose-500">{errors.email.message}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[var(--muted)]">Senha</span>
              <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} /><input autoComplete="current-password" type={showPassword ? "text" : "password"} {...register("password")} className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-11 text-sm text-[var(--text)] outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              {errors.password && <span className="mt-1.5 block text-[11px] text-rose-500">{errors.password.message}</span>}
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]"><input type="checkbox" {...register("remember")} className="size-4 accent-indigo-600" />Lembrar-me neste dispositivo</label>
            {serverError && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">{serverError}</div>}
            <button disabled={isSubmitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,.24)] transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Validando acesso..." : <>Entrar<ArrowRight size={16} /></>}</button>
          </form>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted)]"><span className="font-medium text-[var(--text)]">Acesso protegido.</span> A senha não é gravada no navegador nem enviada ao GitHub.</div>
          <p className="mt-8 text-center text-[10px] text-[var(--muted)]">© Ekko Revestimentos • Versão 1.2.0</p>
        </div>
      </section>
    </main>
  );
}
