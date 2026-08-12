"use client";

import * as React from "react";
import { Music4 } from "lucide-react";
import Link from "next/link";
import { Staff } from "@/components/music/staff";
import { PracticeRunner } from "@/components/study/practice-runner";
import { ScopePicker } from "@/components/study/scope-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { Callout, SectionHeading } from "@/components/ui/prose";
import { LETTER_PT, READING_MNEMONICS, noteAtSlot } from "@/lib/music/notes";
import {
  buildReadingSessionFrom,
  READING_SCOPES,
  type ReadingScopeId,
} from "@/lib/study/generators/reading";
import { useTrackTopic } from "@/lib/study/provider";
import { LineReadingPractice } from "./line-reading-practice";

/** Notas das cinco linhas e dos quatro espaços, para o quadro de referência. */
const LINE_NOTES = [0, 2, 4, 6, 8].map((s) => noteAtSlot(s));
const SPACE_NOTES = [1, 3, 5, 7].map((s) => noteAtSlot(s));

export function ReadingPractice() {
  useTrackTopic("/leitura-de-notas", "Leitura de notas");

  const [scope, setScope] = React.useState<ReadingScopeId>("todas");
  const [mode, setMode] = React.useState<"individual" | "linha">("individual");
  const active = READING_SCOPES.find((s) => s.id === scope) ?? READING_SCOPES[0];

  // A sessão reinicia quando o recorte muda: `key` no runner força a remontagem.
  const build = React.useCallback(
    () => buildReadingSessionFrom([...active.notes]),
    [active],
  );

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Praticar"
        title="Leitura de notas"
        description="Reconhecer a nota pela posição na pauta, em clave de sol. Ao errar, a correção mostra em que linha ou espaço a nota está e como fixá-la."
      />

      <ScopePicker
        label="Modo de prática"
        value={mode}
        onChange={(id) => setMode(id as "individual" | "linha")}
        options={[
          { id: "individual", label: "Nota individual", hint: "O exercício original, uma nota por vez." },
          { id: "linha", label: "Leitura em linha", hint: "Uma pequena partitura, corrigida inteira no final." },
        ]}
      />
      <div className="-mt-5 flex items-center gap-2 text-xs text-ink-faint">
        <span>Outra maneira de praticar:</span>
        <Link href="/revisar" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Revisar minhas dificuldades
        </Link>
      </div>

      {mode === "linha" ? <LineReadingPractice /> : <>

      <ScopePicker
        options={READING_SCOPES.map((s) => ({ id: s.id, label: s.label, hint: s.hint }))}
        value={scope}
        onChange={(id) => setScope(id as ReadingScopeId)}
      />

      <PracticeRunner key={scope} build={build} contextLabel={active.label} />
      </>}

      {/* Quadro de referência — fica abaixo, para consulta sem interromper a prática. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Music4 className="size-4 text-brass" />
            Quadro de referência
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                As cinco linhas
              </p>
              <Staff
                notes={LINE_NOTES.map((n) => ({
                  note: n,
                  state: "default" as const,
                  label: LETTER_PT[n.letter],
                }))}
                markGuideLine
                minNotes={5}
                ariaLabel="Notas das cinco linhas: Mi, Sol, Si, Ré, Fá"
              />
            </div>
            <div>
              <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                Os quatro espaços
              </p>
              <Staff
                notes={SPACE_NOTES.map((n) => ({
                  note: n,
                  state: "muted" as const,
                  label: LETTER_PT[n.letter],
                }))}
                minNotes={5}
                ariaLabel="Notas dos quatro espaços: Fá, Lá, Dó, Mi"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {READING_MNEMONICS.map((m) => (
              <Callout key={m.title} title={m.title} tone="brass">
                {m.body}
              </Callout>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
