import * as React from "react";
import { CircleOfFifths } from "@/components/music/circle-of-fifths";
import { Keyboard } from "@/components/music/keyboard";
import { FormulaRuler, ScaleStrip } from "@/components/music/scale-strip";
import { Staff } from "@/components/music/staff";
import {
  isOnLine,
  LETTER_PT,
  noteAtSlot,
  noteName,
  note,
  slotNoun,
} from "@/lib/music/notes";
import { buildMajorScale, SCALES } from "@/lib/music/scales";
import type { FundamentalVisual } from "@/lib/content/fundamentals";

/** As nove posições dentro da pauta, de baixo para cima. */
const IN_STAFF = Array.from({ length: 9 }, (_, i) => noteAtSlot(i));

/**
 * Diagrama da pauta: as nove posições nomeadas, mais a legenda que liga cada
 * uma à sua descrição ("1ª linha", "1º espaço"). É o apoio que transforma a
 * regra decorada em algo conferível.
 */
function StaffAnatomy() {
  return (
    <div className="flex flex-col gap-5">
      <Staff
        notes={IN_STAFF.map((n, slot) => ({
          note: n,
          // Notas de linha em tinta cheia, de espaço em tom apagado — o
          // contraste é o que separa visualmente os dois grupos.
          state: isOnLine(slot) ? "default" : "muted",
          label: LETTER_PT[n.letter],
        }))}
        markGuideLine
        ariaLabel="As nove posições da pauta em clave de sol, do Mi da 1ª linha ao Fá da 5ª linha"
      />

      <div className="grid gap-x-6 gap-y-1.5 text-[0.8125rem] sm:grid-cols-2">
        {IN_STAFF.map((n, i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-3 border-b border-rule/60 pb-1"
          >
            <span className="text-ink-muted">{slotNoun(i)}</span>
            <span className="display font-semibold text-ink">{LETTER_PT[n.letter]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A clave apontando para a própria nota que lhe dá nome. */
function ClefFocus() {
  return (
    <div className="flex flex-col gap-3">
      <Staff
        notes={[{ note: note("G", 0, 4), state: "query", label: "Sol" }]}
        emphasizeSlot={2}
        markGuideLine
        minNotes={2}
        ariaLabel="Clave de sol com a 2ª linha destacada, onde fica o Sol"
      />
      <p className="text-center text-sm leading-relaxed text-ink-muted">
        A espiral da clave se enrola na <strong className="text-ink">2ª linha</strong> — e essa
        linha é o <strong className="text-brass">Sol</strong>. É daí que vem o nome.
      </p>
    </div>
  );
}

/** A fórmula, com Dó maior como exemplo imediato. */
function ScaleFormulaVisual() {
  const cMajor = buildMajorScale(note("C", 0, 4), true);
  return (
    <div className="flex flex-col gap-5">
      <FormulaRuler />
      <ScaleStrip slots={cMajor.map((n) => ({ name: noteName(n) }))} />
      <p className="text-center text-xs text-ink-faint">
        Dó maior. Os números entre as notas são a fórmula: 1 = tom, ½ = semitom.
      </p>
    </div>
  );
}

/** Os dois semitons naturais, marcados onde falta a tecla preta. */
function KeyboardSemitones() {
  return (
    <div className="flex flex-col gap-3">
      <Keyboard
        marks={[
          { note: note("E", 0, 4), tone: "a" },
          { note: note("F", 0, 4), tone: "a" },
          { note: note("B", 0, 4), tone: "b" },
          { note: note("C", 0, 5), tone: "b" },
        ]}
        markSemitoneGaps
      />
      <p className="text-center text-sm leading-relaxed text-ink-muted">
        Os dois únicos pares de notas naturais sem tecla preta no meio.
      </p>
    </div>
  );
}

export function FundamentalVisualView({ visual }: { visual: FundamentalVisual }) {
  switch (visual) {
    case "staff-anatomy":
      return <StaffAnatomy />;
    case "clef":
      return <ClefFocus />;
    case "scale-formula":
      return <ScaleFormulaVisual />;
    case "keyboard-semitones":
      return <KeyboardSemitones />;
    case "circle":
      return (
        <div className="flex flex-col items-center gap-3">
          <CircleOfFifths highlight={SCALES.map((s) => s.id)} />
          <p className="max-w-md text-center text-sm leading-relaxed text-ink-muted">
            Em destaque, as quatro tonalidades desta etapa. O número dentro de cada círculo é
            quantas alterações a armadura tem.
          </p>
        </div>
      );
    case "note-values":
    case null:
      return null;
  }
}
