"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Flame, RotateCcw, Sparkles } from "lucide-react";
import { StatTile } from "@/components/home/stat-tile";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { NAV } from "@/lib/nav";
import { MODULE_HREF, MODULE_LABEL } from "@/lib/storage/types";
import { currentStreak, useStudy } from "@/lib/study/provider";
import { overview, recentModules } from "@/lib/study/stats";
import { cn, formatRelative, plural } from "@/lib/utils";
import { labelForItem } from "@/lib/study/generators";
import { NextLesson } from "@/components/home/next-lesson";

/** Cartões de acesso: tudo menos a própria home. */
const CARDS = NAV.flatMap((g) => g.items).filter((i) => i.href !== "/");

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function HomeView() {
  const { state, ready } = useStudy();

  // A saudação depende da hora local, que o servidor não conhece. Calcular só
  // depois da hidratação evita divergência de HTML sem precisar de efeito.
  const hello = ready ? greeting() : null;

  const streak = ready ? currentStreak(state.studyDays) : 0;
  const stats = React.useMemo(() => overview(state, streak), [state, streak]);
  const recents = React.useMemo(() => recentModules(state.attempts, 3), [state.attempts]);

  const resume = state.lastTopic;
  const hasHistory = stats.overall.total > 0;
  const difficult = Object.values(state.errors).sort((a, b) => b.misses - a.misses).slice(0, 2);

  return (
    <div className="flex flex-col gap-12">
      {/* Cabeçalho de abertura */}
      <header>
        <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-ink-faint uppercase">
          {hello ?? "Olá"}
        </p>
        <h1 className="display mt-2 text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">
          Bom estudo.
        </h1>
        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-muted">
          {hasHistory
            ? "Continue de onde parou, ou escolha um assunto abaixo. Tudo o que você errar entra na fila de revisão."
            : "Este é o seu caderno de teoria musical. Comece pela leitura de notas ou pelos fundamentos — o progresso fica salvo neste navegador."}
        </p>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-brass-soft/35 bg-brass-wash px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-7">
        <div className="flex gap-3.5">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-paper-raised text-brass shadow-page"><Clock3 className="size-4" /></span>
          <div><p className="display text-lg font-semibold text-ink">{state.activeStudySession ? "Sua sessão está esperando" : "Estudar agora"}</p><p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">{state.activeStudySession ? `Continue no bloco ${state.activeStudySession.currentIndex + 1} de ${state.activeStudySession.blocks.length}, sem perder o roteiro.` : "Escolha o tempo disponível e receba um roteiro claro a partir da sua agenda, revisões e percurso."}</p></div>
        </div>
        <Link href="/sessao-de-estudo" className={buttonClass({ variant: "brass", size: "lg", className: "mt-4 sm:mt-0" })}>{state.activeStudySession ? "Continuar sessão" : "Montar sessão"}<ArrowRight /></Link>
      </section>

      <NextLesson />

      {difficult.length ? <section className="rounded-xl border border-brass-soft/30 bg-brass-wash px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6"><div className="flex gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-brass" /><div><p className="display font-semibold text-ink">Prática sugerida</p><p className="mt-1 text-sm text-ink-muted">Vale revisar {difficult.map((item) => labelForItem(item.module, item.itemKey)).join(" e ")}. São os pontos que mais pediram atenção recentemente.</p></div></div><Link href="/revisar" className={buttonClass({ variant: "brass", size: "sm", className: "mt-3 sm:mt-0" })}>Praticar agora <ArrowRight /></Link></section> : null}

      {/* Painel de estudo */}
      <Card className="overflow-hidden border-x-0 border-rule/70 bg-transparent">
        <div className="staff-texture h-1.5 opacity-50" aria-hidden />
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4 sm:divide-x sm:divide-rule/70 [&>*]:sm:pl-6 [&>*:first-child]:sm:pl-0">
            <StatTile
              label="Sequência"
              value={streak}
              suffix={streak === 1 ? " dia" : " dias"}
              hint={
                stats.longestStreak > streak
                  ? `Seu recorde é ${stats.longestStreak}.`
                  : streak > 0
                    ? "Seu recorde."
                    : "Responda hoje para começar."
              }
              ready={ready}
              tone={streak > 0 ? "brass" : "ink"}
            />
            <StatTile
              label="Exercícios"
              value={stats.overall.total}
              hint={
                stats.today.total > 0
                  ? `${stats.today.total} hoje.`
                  : `${plural(stats.daysStudied, "dia de estudo", "dias de estudo")}.`
              }
              ready={ready}
            />
            <StatTile
              label="Acertos"
              value={hasHistory ? stats.overall.accuracy : "—"}
              suffix={hasHistory ? "%" : undefined}
              hint={hasHistory ? `${stats.overall.correct} de ${stats.overall.total}.` : "Ainda sem dados."}
              ready={ready}
              tone={hasHistory && stats.overall.accuracy >= 80 ? "sage" : "ink"}
            />
            <StatTile
              label="A revisar"
              value={stats.pendingErrors}
              hint={stats.pendingErrors > 0 ? "Itens na fila." : "Fila limpa."}
              ready={ready}
              tone={stats.pendingErrors > 0 ? "clay" : "sage"}
            />
          </div>

          {hasHistory ? (
            <div className="mt-6">
              <Progress
                value={stats.overall.accuracy}
                tone={stats.overall.accuracy >= 80 ? "sage" : "brass"}
                label="Percentual de acerto geral"
              />
            </div>
          ) : null}

          {/* Ações de continuidade */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-rule pt-5">
            <Link
              href={resume?.href ?? "/leitura-de-notas"}
              className={buttonClass({ variant: "brass", size: "lg" })}
            >
              {resume ? "Continuar estudando" : "Começar a estudar"}
              <ArrowRight />
            </Link>
            {resume ? (
              <p className="text-xs text-ink-faint">
                Você estava em <span className="font-medium text-ink-muted">{resume.label}</span>,{" "}
                {formatRelative(resume.ts)}.
              </p>
            ) : null}
            {stats.pendingErrors > 0 ? (
              <Link href="/revisar" className={buttonClass({ variant: "outline", size: "lg" })}>
                <RotateCcw />
                Revisar {stats.pendingErrors}{" "}
                {stats.pendingErrors === 1 ? "erro" : "erros"}
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">Seu conhecimento</h2>
        <div className="grid gap-px overflow-hidden border-y border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: "Leitura de notas", href: "/leitura-de-notas", value: stats.byModule.leitura }, { label: "Escalas maiores", href: "/escalas-maiores", value: stats.byModule.escalas }, { label: "Tom e semitom", href: "/tom-e-semitom", value: stats.byModule.intervalos }, { label: "Fundamentos", href: "/fundamentos", value: null }].map((item) => <Link key={item.href} href={item.href} className="group bg-paper-raised p-4 transition-colors hover:bg-brass-wash"><BookOpen className="size-4 text-brass" /><p className="display mt-3 font-semibold text-ink">{item.label}</p><p className="mt-1 text-xs text-ink-faint">{item.value && item.value.total ? `${item.value.accuracy}% · ${item.value.total} respostas` : "Explorar conteúdo"}</p></Link>)}
        </div>
      </section>

      {/* Últimos tópicos estudados */}
      {ready && recents.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Últimos tópicos estudados
          </h2>
          <div className="flex flex-wrap gap-2">
            {recents.map(({ module, ts }) => {
              const tally = stats.byModule[module];
              return (
                <Link
                  key={module}
                  href={MODULE_HREF[module]}
                  className="group flex items-center gap-3 border-b border-rule px-1 py-2.5 transition-colors hover:text-brass"
                >
                  <span className="text-sm font-medium text-ink">{MODULE_LABEL[module]}</span>
                  <span className="tabular text-xs text-ink-faint">
                    {tally.accuracy}% · {formatRelative(ts)}
                  </span>
                  <ArrowRight className="size-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brass" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Acesso às áreas */}
      <section>
        <h2 className="mb-4 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">
          Áreas do caderno
        </h2>
        <div className="divide-y divide-rule/70 border-y border-rule/70">
          {CARDS.map((item) => {
            const Icon = item.icon;
            const isReview = item.href === "/revisar";
            const badge = isReview && stats.pendingErrors > 0 ? stats.pendingErrors : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-start gap-3.5 px-1 py-4 transition-colors duration-150 hover:bg-paper-raised/65 sm:px-3",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-ink-muted transition-colors group-hover:text-ink">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="display text-[0.9375rem] font-semibold text-ink">
                      {item.label}
                    </span>
                    {badge && ready ? <Badge tone="clay">{badge}</Badge> : null}
                  </span>
                  <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-muted">
                    {item.blurb}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brass" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Nota de rodapé sobre a sequência */}
      {ready && streak >= 3 ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Flame className="size-4 text-brass" />
          {streak} dias seguidos de estudo. Constância vale mais que sessões longas.
        </p>
      ) : null}
    </div>
  );
}
