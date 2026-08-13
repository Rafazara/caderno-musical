"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, RotateCcw, Sparkles, X } from "lucide-react";
import { QuestionVisualView } from "@/components/study/question-visual";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SessionDots } from "@/components/ui/progress";
import { useHydrated } from "@/lib/storage/use-persistent-state";
import type { Question } from "@/lib/study/question";
import { useSession } from "@/lib/study/session";
import { cn, pct } from "@/lib/utils";

/* ==========================================================================
   Grade de respostas
   ========================================================================== */

function AnswerGrid({
  options,
  answer,
  given,
  onPick,
}: {
  options: string[];
  answer: string;
  given: string | null;
  onPick: (value: string) => void;
}) {
  const locked = given !== null;
  // Poucas alternativas ganham botões largos; muitas viram grade.
  const wide = options.length <= 3;

  return (
    <div
      className={cn("grid gap-2", !wide && "grid-cols-3 sm:grid-cols-4")}
      // Com poucas alternativas o número de colunas é dinâmico, então vai por
      // estilo em vez de classe utilitária (que precisa existir no build).
      style={wide ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option, i) => {
        const isAnswer = option === answer;
        const isGiven = option === given;

        return (
          <button
            key={option}
            type="button"
            disabled={locked}
            onClick={() => onPick(option)}
            className={cn(
              "group relative flex items-center justify-center gap-2 rounded-lg border px-3",
              "display font-semibold transition-all duration-150",
              wide ? "h-14 text-base" : "h-13 text-[0.9375rem]",
              locked
                ? isAnswer
                  ? "border-sage bg-sage-wash text-sage"
                  : isGiven
                    ? "border-clay bg-clay-wash text-clay"
                    : "border-rule bg-paper-raised/50 text-ink-faint"
                : "border-rule-strong bg-paper-raised text-ink hover:-translate-y-0.5 hover:border-brass hover:bg-brass-wash hover:shadow-page active:translate-y-0",
            )}
          >
            {/* Atalho de teclado — repetir rápido é o objetivo. */}
            {!locked && i < 9 ? (
              <kbd className="absolute top-1.5 left-2 hidden text-[0.625rem] font-medium text-ink-faint sm:block">
                {i + 1}
              </kbd>
            ) : null}
            <span>{option}</span>
            {locked && isAnswer ? <Check className="size-4" /> : null}
            {locked && isGiven && !isAnswer ? <X className="size-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   Painel de correção
   ========================================================================== */

function FeedbackPanel({
  question,
  given,
  onNext,
  isLast,
}: {
  question: Question;
  given: string;
  onNext: () => void;
  isLast: boolean;
}) {
  const correct = given === question.answer;
  const explanation = question.explain(given);

  return (
    <div
      className={cn(
        "animate-rise rounded-xl border p-4 sm:p-5",
        correct ? "border-sage/35 bg-sage-wash" : "border-clay/35 bg-clay-wash",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
            correct ? "bg-sage text-white" : "bg-clay text-white",
          )}
        >
          {correct ? <Check className="size-4" /> : <X className="size-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "display text-base font-semibold",
              correct ? "text-sage" : "text-clay",
            )}
          >
            {correct ? "Isso mesmo. " : ""}
            {explanation.headline}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{explanation.reason}</p>

          {!correct ? <details className="mt-3 border-t border-ink/8 pt-3"><summary className="cursor-pointer text-sm font-semibold text-ink">Entender meu erro</summary><div className="mt-3"><QuestionVisualView visual={question.visual} revealed correct className="mb-3"/><p className="text-sm leading-relaxed text-ink-soft">Você respondeu <strong>{given}</strong>. A resposta correta é <strong>{question.answer}</strong>. {explanation.reason}</p></div></details> : null}

          {explanation.tip ? (
            <p className="mt-3 flex items-start gap-2 border-t border-ink/8 pt-3 text-sm leading-relaxed text-ink-soft">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-brass" />
              <span>{explanation.tip}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant={correct ? "solid" : "brass"} onClick={onNext} autoFocus>
          {isLast ? "Ver resultado" : "Próxima"}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Resumo da sessão
   ========================================================================== */

function SessionSummary({
  total,
  correct,
  wrong,
  onRestart,
  onRetryWrong,
}: {
  total: number;
  correct: number;
  wrong: Question[];
  onRestart: () => void;
  onRetryWrong: () => void;
}) {
  const accuracy = pct(correct, total);
  const perfect = wrong.length === 0;

  return (
    <Card className="animate-rise overflow-hidden">
      <div className="staff-texture h-1.5 opacity-50" aria-hidden />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-brass uppercase">
              Sessão concluída
            </p>
            <p className="display mt-1.5 text-3xl font-semibold text-ink">
              <span className="tabular">{correct}</span>
              <span className="text-ink-faint">/{total}</span>
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              <span className="tabular">{accuracy}%</span> de acerto nesta rodada.
            </p>
          </div>

          {perfect ? (
            <Badge tone="sage">
              <Sparkles />
              Sem erros
            </Badge>
          ) : (
            <Badge tone="clay">
              {wrong.length} {wrong.length === 1 ? "erro" : "erros"}
            </Badge>
          )}
        </div>

        {!perfect ? (
          <div className="mt-6 rounded-lg border border-rule bg-paper-sunken/60 p-4">
            <p className="mb-2.5 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
              O que revisar
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {wrong.map((q) => (
                <li key={q.key}>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-clay/25 bg-clay-wash px-2 py-1 text-[0.8125rem] text-clay">
                    <span className="font-medium">{q.itemLabel}</span>
                    <span className="text-clay/60">→ {q.answer}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-ink-muted">
            Rodada limpa. Vale repetir mais uma para fixar, ou seguir para outro assunto.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          {!perfect ? (
            <Button variant="brass" onClick={onRetryWrong}>
              <RotateCcw />
              Refazer só os erros
            </Button>
          ) : null}
          <Button variant={perfect ? "brass" : "outline"} onClick={onRestart}>
            Nova sessão
          </Button>
          <Link href="/revisar" className={buttonClass({ variant: "ghost" })}>
            Revisar erros acumulados
          </Link>
        </div>
      </div>
    </Card>
  );
}

/* ==========================================================================
   Runner
   ========================================================================== */

export type PracticeRunnerProps = {
  build: () => Question[];
  onFinish?: () => void;
  /** Mostrado acima do enunciado, ex.: "Dó maior". */
  contextLabel?: string;
  emptyMessage?: string;
};

/**
 * Portão de hidratação.
 *
 * As questões são sorteadas, então só podem ser criadas no cliente. Em vez de
 * gerá-las num efeito, o runner de verdade só é montado depois da hidratação —
 * assim ele já nasce com a sessão pronta, sem renderização em cascata.
 */
export function PracticeRunner(props: PracticeRunnerProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Card className="flex h-80 items-center justify-center">
        <p className="text-sm text-ink-faint">Preparando os exercícios…</p>
      </Card>
    );
  }

  return <Runner {...props} />;
}

function Runner({
  build,
  onFinish,
  contextLabel,
  emptyMessage = "Nenhum exercício disponível agora.",
}: PracticeRunnerProps) {
  const session = useSession({ build, onFinish });
  const { status, current, given, questions, index, results, correctCount, wrong } = session;

  // Atalhos: números escolhem a alternativa, Enter avança.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (status === "answering" && current) {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= current.options.length) {
          e.preventDefault();
          session.answer(current.options[n - 1]);
        }
        return;
      }
      if (status === "feedback" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        session.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, current, session]);

  if (questions.length === 0) {
    return (
      <Card className="flex h-56 items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-muted">{emptyMessage}</p>
      </Card>
    );
  }

  if (status === "done") {
    return (
      <SessionSummary
        total={questions.length}
        correct={correctCount}
        wrong={wrong}
        onRestart={session.restart}
        onRetryWrong={session.retryWrong}
      />
    );
  }

  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        {/* Cabeçalho da questão */}
        <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3.5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            {contextLabel ? `${contextLabel} · ` : ""}
            Questão <span className="tabular text-ink">{index + 1}</span> de{" "}
            <span className="tabular">{questions.length}</span>
          </p>
          <SessionDots results={results} total={questions.length} current={index} />
        </div>

        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <h2 className="display mb-6 text-center text-lg font-semibold text-balance text-ink sm:text-xl">
            {current.prompt}
          </h2>

          <QuestionVisualView
            visual={current.visual}
            revealed={given !== null}
            correct={given === current.answer}
            className="mb-8"
          />

          <AnswerGrid
            options={current.options}
            answer={current.answer}
            given={given}
            onPick={session.answer}
          />
        </div>
      </Card>

      {given !== null ? (
        <FeedbackPanel
          question={current}
          given={given}
          onNext={session.next}
          isLast={index === questions.length - 1}
        />
      ) : null}
    </div>
  );
}
