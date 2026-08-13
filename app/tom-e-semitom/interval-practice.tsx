"use client";

import * as React from "react";
import { Keyboard } from "@/components/music/keyboard";
import { PracticeRunner } from "@/components/study/practice-runner";
import { ScopePicker } from "@/components/study/scope-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout, SectionHeading } from "@/components/ui/prose";
import { INTERVAL_FACTS } from "@/lib/music/intervals";
import { note } from "@/lib/music/notes";
import { INTERVAL_SCOPES, type IntervalScopeId } from "@/lib/study/generators/intervals";
import { useTrackTopic } from "@/lib/study/provider";
import { IntervalLesson } from "@/components/pedagogy/interval-lesson";

export function IntervalPractice() {
  useTrackTopic("/tom-e-semitom", "Tom e semitom");

  const [scope, setScope] = React.useState<IntervalScopeId>("naturais");
  const active = INTERVAL_SCOPES.find((s) => s.id === scope) ?? INTERVAL_SCOPES[0];

  const build = React.useCallback(() => active.build(), [active]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Praticar"
        title="Tom e semitom"
        description="Medir a distância entre duas notas. O teclado aparece em cada correção porque é nele que a resposta fica visível: semitom é tecla vizinha, tom pula uma tecla."
      />

      <IntervalLesson />

      {/* A ideia central, antes de qualquer exercício. */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Os dois semitons naturais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="mx-auto w-full max-w-md">
            <Keyboard
              marks={[
                { note: note("E", 0, 4), tone: "a" },
                { note: note("F", 0, 4), tone: "a" },
                { note: note("B", 0, 4), tone: "b" },
                { note: note("C", 0, 5), tone: "b" },
              ]}
              markSemitoneGaps
            />
          </div>
          <p className="mx-auto max-w-lg text-center text-sm leading-relaxed text-ink-soft">
            Entre <strong className="font-semibold text-ink">Mi e Fá</strong> e entre{" "}
            <strong className="font-semibold text-ink">Si e Dó</strong> não existe tecla preta.
            São os dois únicos pares de notas naturais que formam semitom — todos os outros
            vizinhos formam tom.
          </p>
        </CardContent>
      </Card>

      <ScopePicker
        options={INTERVAL_SCOPES.map((s) => ({ id: s.id, label: s.label, hint: s.hint }))}
        value={scope}
        onChange={(id) => setScope(id as IntervalScopeId)}
      />

      <PracticeRunner key={scope} build={build} contextLabel={active.label} />

      <div className="grid gap-3 sm:grid-cols-3">
        {INTERVAL_FACTS.map((fact) => (
          <Callout key={fact.title} title={fact.title} tone="slate">
            {fact.body}
          </Callout>
        ))}
      </div>
    </div>
  );
}
