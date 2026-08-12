"use client";

import * as React from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScaleStrip } from "@/components/music/scale-strip";
import { noteName } from "@/lib/music/notes";
import {
  buildMajorScale,
  DEGREE_ROMAN,
  explainDegree,
  type ScaleEntry,
} from "@/lib/music/scales";
import { useHydrated } from "@/lib/storage/use-persistent-state";
import { useStudy } from "@/lib/study/provider";
import { cn, shuffle } from "@/lib/utils";

/**
 * Ordenar as notas da escala.
 *
 * Escolhido em vez de arrastar-e-soltar por dois motivos: funciona igual no
 * celular e no desktop, e permite corrigir *no momento do erro* — se a nota
 * clicada não é a próxima, a explicação aparece ali, com o raciocínio da
 * fórmula, em vez de só no fim.
 */
export function ScaleOrderExercise({ entry }: { entry: ScaleEntry }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <p className="text-sm text-ink-faint">Preparando…</p>
      </Card>
    );
  }

  // `key` garante estado limpo ao trocar de escala ou ao recomeçar.
  return <OrderBoard entry={entry} />;
}

function OrderBoard({ entry }: { entry: ScaleEntry }) {
  const { record } = useStudy();

  const expected = React.useMemo(
    () => buildMajorScale(entry.tonic, true).map(noteName),
    [entry],
  );

  // A tônica já vem posta — ancora o raciocínio e evita a dúvida "por onde começo".
  const [pool, setPool] = React.useState<string[]>(() => shuffle(expected.slice(1)));
  const [placed, setPlaced] = React.useState<string[]>(() => [expected[0]]);
  const [mistakes, setMistakes] = React.useState(0);
  const [hint, setHint] = React.useState<{ tried: string; text: string } | null>(null);

  function reset() {
    setPool(shuffle(expected.slice(1)));
    setPlaced([expected[0]]);
    setMistakes(0);
    setHint(null);
  }

  const done = placed.length === expected.length;

  function pick(candidate: string) {
    if (done) return;
    const nextIndex = placed.length;

    if (candidate !== expected[nextIndex]) {
      setMistakes((m) => m + 1);
      setHint({
        tried: candidate,
        text: `${explainDegree(entry, nextIndex)} Por isso ${candidate} não entra aqui.`,
      });
      return;
    }

    const nextPlaced = [...placed, candidate];
    setPlaced(nextPlaced);
    setPool((prev) => prev.filter((n) => n !== candidate));
    setHint(null);

    // Registra no clique que fecha a escala — o resultado já é conhecido aqui,
    // sem precisar de um efeito observando "acabou?".
    if (nextPlaced.length === expected.length) {
      record({
        module: "escalas",
        itemKey: `ordem:${entry.id}`,
        prompt: `Ordenar ${entry.label}`,
        correct: mistakes === 0,
        given: mistakes === 0 ? "sem erros" : `${mistakes} erro(s)`,
        expected: "sem erros",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Ordenar {entry.label}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Toque nas notas em ordem crescente, do grau I até a oitava.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw />
          Recomeçar
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Sequência montada até agora */}
        <ScaleStrip
          slots={expected.map((n, i) => ({
            name: i < placed.length ? placed[i] : null,
            state: i < placed.length ? "correct" : i === placed.length ? "target" : "blank",
          }))}
        />

        {/* Notas ainda disponíveis */}
        {!done ? (
          <div>
            <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
              Notas disponíveis
            </p>
            <div className="flex flex-wrap gap-2">
              {pool.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => pick(candidate)}
                  className={cn(
                    "display h-12 min-w-15 rounded-lg border px-3 font-semibold transition-all duration-150",
                    hint?.tried === candidate
                      ? "border-clay bg-clay-wash text-clay"
                      : "border-rule-strong bg-paper-raised text-ink hover:-translate-y-0.5 hover:border-brass hover:bg-brass-wash hover:shadow-page",
                  )}
                >
                  {candidate}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Correção no momento do erro */}
        {hint && !done ? (
          <div className="animate-rise flex items-start gap-2.5 rounded-lg border border-clay/35 bg-clay-wash px-4 py-3">
            <X className="mt-0.5 size-4 shrink-0 text-clay" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-clay">
                A próxima é o grau {DEGREE_ROMAN[placed.length] ?? "I"}.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{hint.text}</p>
            </div>
          </div>
        ) : null}

        {done ? (
          <div
            className={cn(
              "animate-rise flex items-start gap-2.5 rounded-lg border px-4 py-3.5",
              mistakes === 0
                ? "border-sage/35 bg-sage-wash"
                : "border-brass-soft/35 bg-brass-wash",
            )}
          >
            {mistakes === 0 ? (
              <Check className="mt-0.5 size-4 shrink-0 text-sage" />
            ) : (
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-brass" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  mistakes === 0 ? "text-sage" : "text-brass",
                )}
              >
                {mistakes === 0
                  ? "Escala completa, sem nenhum erro."
                  : `Escala completa, com ${mistakes} ${mistakes === 1 ? "tentativa errada" : "tentativas erradas"}.`}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {entry.label}: {expected.join(" · ")}. {entry.insight}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
                <RotateCcw />
                Fazer de novo
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
