"use client";

import * as React from "react";
import Link from "next/link";
import { LineChart, Trash2 } from "lucide-react";
import { StatTile } from "@/components/home/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/overlay";
import { Progress } from "@/components/ui/progress";
import { EmptyState, SectionHeading } from "@/components/ui/prose";
import { SCALES } from "@/lib/music/scales";
import { MODULE_HREF, MODULE_LABEL, type ModuleId } from "@/lib/storage/types";
import { labelForItem } from "@/lib/study/generators";
import { currentStreak, useStudy } from "@/lib/study/provider";
import { overview, recentActivity, worstItems } from "@/lib/study/stats";
import { cn, plural } from "@/lib/utils";
import { NoteMastery } from "@/components/study/note-mastery";
import { PedagogicalProgress } from "@/components/pedagogy/pedagogical-progress";
import { EarProgress } from "@/components/pedagogy/ear-progress";
import { IntervalProgress } from "@/components/pedagogy/interval-progress";
import { RhythmProgress } from "@/components/pedagogy/rhythm-progress";
import { ChordProgress } from "@/components/pedagogy/chord-progress";
import { HarmonyProgress } from "@/components/pedagogy/harmony-progress";

const MODULES: ModuleId[] = ["leitura", "escalas", "intervalos", "intervalos-musicais", "ouvido", "ritmo", "acordes", "harmonia"];

export function ProgressView() {
  const { state, ready, resetProgress } = useStudy();
  const [confirmReset, setConfirmReset] = React.useState(false);

  const streak = ready ? currentStreak(state.studyDays) : 0;
  const stats = React.useMemo(() => overview(state, streak), [state, streak]);
  const activity = React.useMemo(() => recentActivity(state.attempts, 14), [state.attempts]);

  const worst = React.useMemo(
    () =>
      MODULES.map((module) => ({
        module,
        items: worstItems(state.attempts, module, (key) => labelForItem(module, key), 5),
      })).filter((g) => g.items.length > 0),
    [state.attempts],
  );

  const maxDay = Math.max(1, ...activity.map((d) => d.total));
  const hasHistory = stats.overall.total > 0;

  if (!ready) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeading eyebrow="Consultar" title="Progresso" />
        <Card className="flex h-56 items-center justify-center">
          <p className="text-sm text-ink-faint">Somando seus exercícios…</p>
        </Card>
      </div>
    );
  }

  if (!hasHistory) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeading eyebrow="Consultar" title="Progresso" />
        <EmptyState
          icon={<LineChart />}
          title="Ainda sem exercícios"
          description="Faça uma sessão de prática e os números aparecem aqui: acertos, erros por categoria e frequência de estudo."
        >
          {MODULES.map((m) => (
            <Link key={m} href={MODULE_HREF[m]} className={buttonClass({ variant: "outline" })}>
              {MODULE_LABEL[m]}
            </Link>
          ))}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Consultar"
        title="Progresso"
        description="O que os seus exercícios mostram até agora. Serve para decidir o que praticar em seguida — não para cobrar meta."
      />

      <PedagogicalProgress state={state} />
      <EarProgress attempts={state.attempts} />
      <IntervalProgress attempts={state.attempts} />
      <RhythmProgress attempts={state.attempts} />
      <ChordProgress attempts={state.attempts} />
      <HarmonyProgress attempts={state.attempts} />

      {/* Números gerais */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatTile label="Exercícios feitos" value={stats.overall.total} />
            <StatTile
              label="Taxa de acerto"
              value={stats.overall.accuracy}
              suffix="%"
              tone={stats.overall.accuracy >= 80 ? "sage" : "ink"}
            />
            <StatTile
              label="Sequência"
              value={streak}
              suffix={streak === 1 ? " dia" : " dias"}
              hint={`Recorde: ${stats.longestStreak}.`}
              tone={streak > 0 ? "brass" : "ink"}
            />
            <StatTile
              label="A revisar"
              value={stats.pendingErrors}
              tone={stats.pendingErrors > 0 ? "clay" : "sage"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Desempenho por assunto */}
      <NoteMastery attempts={state.attempts} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por assunto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {MODULES.map((module) => {
            const tally = stats.byModule[module];
            return (
              <div key={module} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={MODULE_HREF[module]}
                    className="text-sm font-medium text-ink transition-colors hover:text-brass"
                  >
                    {MODULE_LABEL[module]}
                  </Link>
                  <p className="tabular text-xs text-ink-faint">
                    {tally.total === 0
                      ? "sem exercícios"
                      : `${tally.correct}/${tally.total} · ${tally.accuracy}%`}
                  </p>
                </div>
                <Progress
                  value={tally.accuracy}
                  tone={
                    tally.total === 0
                      ? "ink"
                      : tally.accuracy >= 80
                        ? "sage"
                        : tally.accuracy >= 60
                          ? "brass"
                          : "clay"
                  }
                  label={`Acerto em ${MODULE_LABEL[module]}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Frequência de estudo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequência — últimos 14 dias</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Altura é quantidade de exercícios; a parte cheia são os acertos.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end justify-between gap-1">
            {activity.map((day) => {
              const height = (day.total / maxDay) * 100;
              const correctShare = day.total > 0 ? (day.correct / day.total) * 100 : 0;
              const label = day.day.slice(8);

              return (
                <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-full w-full items-end justify-center">
                    {day.total > 0 ? (
                      <div
                        className="relative w-full max-w-6 overflow-hidden rounded-t-sm bg-clay/35"
                        style={{ height: `${Math.max(height, 6)}%` }}
                        title={`${day.day}: ${day.correct} de ${day.total} corretos`}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-sage"
                          style={{ height: `${correctShare}%` }}
                        />
                      </div>
                    ) : (
                      <div
                        className="h-0.5 w-full max-w-6 rounded-full bg-rule"
                        title={`${day.day}: sem exercícios`}
                      />
                    )}
                  </div>
                  <span className="tabular text-[0.625rem] text-ink-faint">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-rule pt-3 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-sage" />
              Acertos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-clay/35" />
              Erros
            </span>
            <span className="ml-auto">
              {plural(stats.daysStudied, "dia de estudo no total", "dias de estudo no total")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Erros por categoria */}
      {worst.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">O que você mais erra</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">
              Por item, dentro de cada assunto. É a lista mais útil da página.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {worst.map(({ module, items }) => (
              <div key={module} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                    {MODULE_LABEL[module]}
                  </p>
                  <Link
                    href={MODULE_HREF[module]}
                    className="text-xs font-medium text-brass underline decoration-brass/30 underline-offset-4 hover:decoration-brass"
                  >
                    Praticar
                  </Link>
                </div>
                <ul className="flex flex-col divide-y divide-rule">
                  {items.map((item) => (
                    <li key={item.itemKey} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {item.label}
                      </span>
                      <span className="tabular shrink-0 text-xs text-ink-faint">
                        {item.misses} de {item.total}
                      </span>
                      <span className="w-16 shrink-0">
                        <Progress
                          value={item.accuracy}
                          tone={item.accuracy >= 60 ? "brass" : "clay"}
                        />
                      </span>
                      <span
                        className={cn(
                          "tabular w-9 shrink-0 text-right text-xs font-semibold",
                          item.accuracy >= 60 ? "text-ink-muted" : "text-clay",
                        )}
                      >
                        {item.accuracy}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Escalas estudadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Escalas já praticadas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SCALES.map((entry) => {
            const done = state.scalesPracticed.includes(entry.id);
            return (
              <Badge key={entry.id} tone={done ? "sage" : "neutral"}>
                {entry.label}
                {done ? " ✓" : ""}
              </Badge>
            );
          })}
        </CardContent>
      </Card>

      {/* Zerar */}
      <div className="border-t border-rule pt-6">
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          <Trash2 />
          Zerar meu progresso
        </Button>
        <p className="mt-1.5 text-xs text-ink-faint">
          Apaga exercícios, erros e sequência de dias. Suas anotações e o material da professora
          não são afetados.
        </p>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Zerar todo o progresso?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              className="bg-clay hover:bg-clay/85"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              <Trash2 />
              Zerar progresso
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Serão apagados <strong className="font-semibold text-ink">{stats.overall.total}</strong>{" "}
          exercícios, a fila de {plural(stats.pendingErrors, "erro", "erros")} e a sequência de{" "}
          {plural(stats.daysStudied, "dia", "dias")}. Isso não pode ser desfeito.
        </p>
      </Modal>
    </div>
  );
}
