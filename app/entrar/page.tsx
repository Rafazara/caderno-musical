"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cloud } from "lucide-react";
import { Brand, BrandMark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Callout } from "@/components/ui/prose";
import { useAuth } from "@/lib/auth/provider";

export default function SignInPage() {
  const auth = useAuth(); const router = useRouter();
  const [mode,setMode]=React.useState<"in"|"up">("in"); const [email,setEmail]=React.useState(""); const [password,setPassword]=React.useState(""); const [busy,setBusy]=React.useState(false); const [message,setMessage]=React.useState<string|null>(null); const [error,setError]=React.useState<string|null>(null);
  React.useEffect(()=>{ if(auth.ready&&auth.user) router.replace("/"); if(window.location.hash==="#criar") queueMicrotask(()=>setMode("up")); },[auth.ready,auth.user,router]);
  async function submit(event:React.FormEvent){ event.preventDefault(); setBusy(true); setError(null); setMessage(null); try { if(mode==="in"){await auth.signIn(email.trim(),password);router.replace("/");}else{const confirm=await auth.signUp(email.trim(),password);if(confirm){setMessage("Confira seu e-mail para confirmar a conta. Depois, volte para entrar.");setMode("in");}else router.replace("/");}}catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível continuar.");}finally{setBusy(false);} }
  return <main className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(28rem,.78fr)]">
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-rule/70 p-10 lg:flex xl:p-16"><Brand/><div className="max-w-xl"><BrandMark className="mb-8 size-14 text-brass"/><p className="display text-4xl leading-tight font-medium xl:text-5xl">Seu estudo continua de onde você parou.</p><p className="mt-5 max-w-md text-base leading-7 text-ink-muted">Progresso, anotações, materiais e quadros reunidos em uma cópia privada.</p></div><p className="font-mono text-[.625rem] tracking-[.16em] text-ink-faint">TEORIA · VOLUME I</p></section>
    <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20"><div className="flex items-center justify-between lg:justify-end"><Link href="/" className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink lg:hidden"><ArrowLeft className="size-4"/> Voltar</Link><div className="lg:hidden"><Brand/></div></div><div className="my-auto w-full max-w-md self-center py-14"><p className="type-label text-brass">Caderno pessoal</p><h1 className="display mt-3 text-4xl font-medium tracking-tight">{mode==="in"?"Entre no seu caderno":"Comece seu caderno"}</h1><p className="mt-3 text-sm leading-6 text-ink-muted">{mode==="in"?"Use o mesmo e-mail para continuar em qualquer dispositivo.":"Uma conta simples para manter seus estudos em segurança."}</p>
      {!auth.configured?<div className="mt-8"><Callout title="Sincronização não configurada" tone="brass" icon={<Cloud/>}>Adicione as variáveis do Supabase ao ambiente para habilitar contas.</Callout></div>:<form onSubmit={submit} className="mt-9 flex flex-col gap-5"><Field label="E-mail"><Input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Senha" hint="Use pelo menos 6 caracteres."><Input type="password" autoComplete={mode==="in"?"current-password":"new-password"} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></Field>{error?<p role="alert" className="text-sm text-clay">{error}</p>:null}{message?<p role="status" className="text-sm leading-relaxed text-sage">{message}</p>:null}<Button type="submit" variant="solid" size="lg" disabled={busy}>{busy?"Aguarde…":mode==="in"?"Entrar":"Criar conta"}</Button><button type="button" onClick={()=>{setMode(mode==="in"?"up":"in");setError(null);}} className="text-sm text-ink-muted underline decoration-rule-strong underline-offset-4 hover:text-ink">{mode==="in"?"Ainda não tenho uma conta":"Já tenho uma conta"}</button></form>}
    </div><p className="text-center text-[.6875rem] leading-5 text-ink-faint">Seus dados permanecem disponíveis neste navegador.<br/>A nuvem é uma cópia privada e opcional.</p></section>
  </main>;
}
