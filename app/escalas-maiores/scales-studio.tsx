"use client";

import * as React from "react";
import { Compass, Ruler } from "lucide-react";
import { FormulaRuler, ScaleStrip } from "@/components/music/scale-strip";
import { Keyboard } from "@/components/music/keyboard";
import { PracticeRunner } from "@/components/study/practice-runner";
import { ScaleOrderExercise } from "@/components/study/scale-order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout, Prose, SectionHeading } from "@/components/ui/prose";
import { Tabs } from "@/components/ui/tabs";
import { noteName, note } from "@/lib/music/notes";
import { buildMajorScale, findScale, SCALES } from "@/lib/music/scales";
import { buildScaleSession } from "@/lib/study/generators/scales";
import { useStudy, useTrackTopic } from "@/lib/study/provider";
import { cn } from "@/lib/utils";
import { ScaleSheet } from "./scale-sheet";

const TABS = [
  { id: "aprender", label: "Aprender" },
  { id: "exercicios", label: "Exercícios" },
  { id: "ordenar", label: "Ordenar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ScalesStudio() {
  useTrackTopic("/escalas-maiores", "Escalas maiores");

  const { state, ready, markScalePracticed } = useStudy();
  const [tab, setTab] = React.useState<TabId>("aprender");

  // Escalas selecionadas para a sessão de exercícios.
  const [selected, setSelected] = React.useState<string[]>(["C"]);
  const [orderScaleId, setOrderScaleId] = React.useState("C");
  const orderScale = findScale(orderScaleId) ?? SCALES[0];

  const build = React.useCallback(() => buildScaleSession(selected), [selected]);

  const onFinish = React.useCallback(() => {
    for (const id of selected) markScalePracticed(id);
  }, [selected, markScalePracticed]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.length === 1
          ? prev // nunca deixa a seleção vazia
          : prev.filter((x) => x !== id)
        : [...prev, id],
    );
  }

  const cMajor = buildMajorScale(note("C", 0, 4), true);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Praticar"
        title="Escalas maiores"
        description="Uma escala maior não se decora: se constrói. Toda ela sai de uma única fórmula de distâncias, e é isso que esta seção treina."
      />

      <Tabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} ariaLabel="Seções de escalas maiores" />

      {tab === "aprender" ? (
        <div className="flex flex-col gap-8">
          {/* Os conceitos, na ordem em que fazem sentido. */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="size-4 text-brass" />
                O que é uma escala maior
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Prose>
                <p>
                  Uma <strong>escala</strong> é uma sequência de notas em ordem de altura, subindo
                  ou descendo, dentro de uma oitava. Ela funciona como o alfabeto de uma
                  tonalidade: define quais notas fazem parte daquele mundo sonoro e quais não.
                </p>
                <p>
                  A <strong>escala maior</strong> é a mais usada na música ocidental — é aquela do
                  som &ldquo;dó-ré-mi-fá-sol-lá-si-dó&rdquo;. O que a define não são as notas em si,
                  mas <em>as distâncias entre elas</em>. Sempre as mesmas, em qualquer tonalidade.
                </p>
              </Prose>

              <div className="rounded-xl border border-brass-soft/30 bg-brass-wash p-5">
                <p className="mb-4 text-center text-[0.6875rem] font-semibold tracking-[0.14em] text-brass uppercase">
                  A fórmula da escala maior
                </p>
                <FormulaRuler />
                <p className="mt-4 text-center text-sm leading-relaxed text-ink-soft">
                  Sete passos que levam do grau I até a oitava acima. Os dois semitons caem
                  sempre nos mesmos lugares: entre o <strong>3º e o 4º</strong> grau, e entre o{" "}
                  <strong>7º e o 8º</strong>.
                </p>
              </div>

              <Prose>
                <h3>Por que isso importa</h3>
                <p>
                  Porque a fórmula é o que permite construir a escala de <em>qualquer</em> nota
                  sem decorar nada. Escolha a tônica, ande pelas sete letras em ordem e ajuste com
                  sustenidos ou bemóis até cada distância bater com a fórmula. O resultado é a
                  escala maior daquela tonalidade — e as alterações que aparecem são exatamente a
                  armadura de clave dela.
                </p>
              </Prose>

              <Callout title="Uma regra que evita quase todo erro" tone="brass">
                Uma escala maior usa <strong>cada letra exatamente uma vez</strong>. Nunca repete
                nem pula. Se você escreveu Fá e Fá♯ na mesma escala, ou saltou do Mi direto para o
                Sol, algo está errado.
              </Callout>
            </CardContent>
          </Card>

          {/* Dó maior como exemplo trabalhado. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">O exemplo que explica todos</CardTitle>
              <p className="mt-1 text-sm text-ink-muted">
                Dó maior no teclado: só teclas brancas.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="mx-auto w-full max-w-lg">
                <Keyboard
                  marks={cMajor.map((n, i) => ({
                    note: n,
                    tone: "a",
                    badge: String(i + 1),
                  }))}
                  markSemitoneGaps
                />
              </div>
              <ScaleStrip slots={cMajor.map((n) => ({ name: noteName(n) }))} />
              <Prose className="max-w-none">
                <p>
                  Dó maior não precisa de nenhuma alteração por um acaso feliz: os dois semitons
                  naturais do teclado — <em>Mi–Fá</em> e <em>Si–Dó</em> — caem justamente nas duas
                  posições em que a fórmula pede semitom, o 3º→4º e o 7º→8º grau. Em qualquer outra
                  tonalidade esse alinhamento se desfaz, e é aí que entram os sustenidos e bemóis.
                </p>
              </Prose>
            </CardContent>
          </Card>

          {/* As quatro escalas da V1. */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-brass" />
              <h2 className="display text-lg font-semibold text-ink">
                As quatro escalas desta etapa
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
              Escolhidas por vizinhança no ciclo de quintas: Dó no centro, Sol e Ré avançando
              pelos sustenidos, Fá pelo lado dos bemóis.
            </p>
            <div className="grid gap-4">
              {SCALES.map((entry) => (
                <ScaleSheet
                  key={entry.id}
                  entry={entry}
                  practiced={ready && state.scalesPracticed.includes(entry.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "exercicios" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
              Escalas nesta sessão
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SCALES.map((entry) => {
                const on = selected.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(entry.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                      on
                        ? "border-brass bg-brass text-white"
                        : "border-rule-strong bg-paper-raised text-ink-soft hover:border-brass-soft hover:bg-brass-wash hover:text-ink",
                    )}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs leading-relaxed text-ink-faint">
              A sessão mistura completar a escala, a fórmula, as alterações e reconhecer a
              tonalidade.
            </p>
          </div>

          <PracticeRunner
            key={selected.join(",")}
            build={build}
            onFinish={onFinish}
            contextLabel={
              selected.length === 1
                ? (findScale(selected[0])?.label ?? "Escalas")
                : `${selected.length} escalas`
            }
          />
        </div>
      ) : null}

      {tab === "ordenar" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
              Escala
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SCALES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={orderScaleId === entry.id}
                  onClick={() => setOrderScaleId(entry.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                    orderScaleId === entry.id
                      ? "border-brass bg-brass text-white"
                      : "border-rule-strong bg-paper-raised text-ink-soft hover:border-brass-soft hover:bg-brass-wash hover:text-ink",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <ScaleOrderExercise key={orderScaleId} entry={orderScale} />
        </div>
      ) : null}
    </div>
  );
}
