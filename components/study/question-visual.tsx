import * as React from "react";
import { IntervalKeyboard } from "@/components/music/keyboard";
import { FormulaRuler, ScaleStrip } from "@/components/music/scale-strip";
import { SingleNoteStaff, Staff } from "@/components/music/staff";
import { noteName } from "@/lib/music/notes";
import { pairLabel } from "@/lib/music/intervals";
import type { QuestionVisual } from "@/lib/study/question";
import { cn } from "@/lib/utils";

/**
 * Renderiza o apoio visual de uma questão.
 *
 * `revealed` muda o desenho depois da resposta: a nota ganha cor de
 * acerto/erro, a linha em questão é destacada e o teclado passa a marcar os
 * semitons naturais. O visual participa da explicação, não só do enunciado.
 */
export function QuestionVisualView({
  visual,
  revealed = false,
  correct = false,
  className,
}: {
  visual: QuestionVisual;
  revealed?: boolean;
  correct?: boolean;
  className?: string;
}) {
  const wrapper = cn(
    "flex w-full flex-col items-center justify-center gap-3",
    className,
  );

  switch (visual.kind) {
    case "note":
      return (
        <div className={wrapper}>
          <SingleNoteStaff
            note={visual.note}
            state={revealed ? (correct ? "correct" : "wrong") : "query"}
            emphasize={revealed}
            markGuideLine={revealed}
          />
          {revealed ? (
            <p className="text-xs text-ink-muted">
              A 2ª linha em destaque é o <strong className="font-semibold text-brass">Sol</strong> —
              a referência que a clave marca.
            </p>
          ) : null}
        </div>
      );

    case "interval":
      return (
        <div className={wrapper}>
          <Staff
            notes={[
              {
                note: visual.pair.direction === "asc" ? visual.pair.low : visual.pair.high,
                state: revealed ? (correct ? "correct" : "wrong") : "query",
                label: noteName(
                  visual.pair.direction === "asc" ? visual.pair.low : visual.pair.high,
                ),
              },
              {
                note: visual.pair.direction === "asc" ? visual.pair.high : visual.pair.low,
                state: revealed ? (correct ? "correct" : "wrong") : "query",
                label: noteName(
                  visual.pair.direction === "asc" ? visual.pair.high : visual.pair.low,
                ),
              },
            ]}
            className="max-w-[17rem]"
            ariaLabel={`Pentagrama com as notas ${pairLabel(visual.pair)}`}
          />
          <div className="w-full max-w-[21rem]">
            <IntervalKeyboard
              first={visual.pair.direction === "asc" ? visual.pair.low : visual.pair.high}
              second={visual.pair.direction === "asc" ? visual.pair.high : visual.pair.low}
              tone={revealed ? (correct ? "correct" : "wrong") : "a"}
              showGaps={revealed}
            />
          </div>
        </div>
      );
    case "musicalInterval":
      return <div className={wrapper}><Staff notes={[{note:visual.root,label:noteName(visual.root),state:revealed?(correct?'correct':'wrong'):'query'},{note:visual.target,label:noteName(visual.target),state:revealed?(correct?'correct':'wrong'):'query'}]} className="max-w-[20rem]"/><div className="w-full max-w-[21rem]"><IntervalKeyboard first={visual.root} second={visual.target} tone={revealed?(correct?'correct':'wrong'):'a'} showGaps={revealed}/></div></div>;
    case "chord":
      return <div className={wrapper}><Staff notes={visual.notes.map((note)=>({note,label:noteName(note),state:revealed?(correct?'correct':'wrong'):'query'}))} minNotes={3} className="max-w-[22rem]"/></div>;

    case "scale":
      return (
        <div className={cn(wrapper, "gap-4")}>
          <ScaleStrip slots={visual.slots} />
          {visual.caption ? (
            <p className="text-center text-xs text-ink-muted">{visual.caption}</p>
          ) : null}
        </div>
      );

    case "formula":
      return (
        <div className={cn(wrapper, "gap-3")}>
          <FormulaRuler />
          <p className="text-center text-xs text-ink-faint">
            A fórmula da escala maior, do grau I ao grau I da oitava acima.
          </p>
        </div>
      );

    case "none":
      return null;
  }
}
