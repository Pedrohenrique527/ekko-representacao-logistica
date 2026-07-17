"use client";

import { ArrowRight, CheckCircle2, LogOut, Moon, ShieldCheck, Sun, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";

type LoginViewProps = {
  signInHref: string;
  signOutHref: string;
  signedInEmail: string | null;
  allowed: boolean;
};

export function LoginView({ signInHref, signOutHref, signedInEmail, allowed }: LoginViewProps) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("pedro-theme") === "light";
    setLight(saved);
    document.documentElement.dataset.theme = saved ? "light" : "dark";
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("pedro-theme", next ? "light" : "dark");
  };

  const denied = Boolean(signedInEmail && !allowed);
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
        <button onClick={toggle} aria-label="Alternar tema" className="absolute right-6 top-6 grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">{light ? <Moon size={17} /> : <Sun size={17} />}</button>
        <div className="w-full max-w-[410px]">
          <div className="mb-9">
            <div className="h-16 w-[230px] overflow-hidden rounded-xl bg-black ring-1 ring-white/10"><img src="/pedro-mariniello-logo.png" alt="Pedro Mariniello" className="h-full w-full object-contain" /></div>
            <p className="mt-3 text-sm font-semibold text-[var(--text)]">Ekko Representação Logística</p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-500">Acesso corporativo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">{denied ? "Conta sem permissão" : allowed ? "Acesso confirmado" : "Bem-vindo"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {denied ? `A conta ${signedInEmail} não está autorizada. Saia e entre com a conta liberada.` : allowed ? `Você está conectado como ${signedInEmail}.` : "Entre com sua conta Google vinculada ao ChatGPT para acessar os dados operacionais."}
          </p>

          <div className="mt-8 space-y-3">
            {allowed ? (
              <a className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,.24)] transition hover:from-indigo-500 hover:to-violet-500" href="/"><CheckCircle2 size={17} />Abrir o sistema<ArrowRight size={16} /></a>
            ) : denied ? (
              <a className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,.24)] transition hover:from-indigo-500 hover:to-violet-500" href={signOutHref}><LogOut size={17} />Sair e trocar de conta</a>
            ) : (
              <a className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,.24)] transition hover:from-indigo-500 hover:to-violet-500" href={signInHref}><UserRoundCheck size={17} />Entrar com Google / ChatGPT<ArrowRight size={16} /></a>
            )}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Login real e protegido.</span> O sistema não armazena sua senha; a identidade é confirmada pelo provedor de acesso.
            </div>
          </div>
          <p className="mt-8 text-center text-[10px] text-[var(--muted)]">© Ekko Revestimentos • Versão 1.1.0</p>
        </div>
      </section>
    </main>
  );
}
