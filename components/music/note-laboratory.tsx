"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Speaker } from "lucide-react";
import { Keyboard } from "@/components/music/keyboard";
import { SingleNoteStaff } from "@/components/music/staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { playNote, frequencyOf } from "@/lib/music/audio";
import { adjacentNatural, LETTER_PT, midiNumber, noteId, noteName, READING_RANGE, semitonesBetween, staffPosition, type Note } from "@/lib/music/notes";
import { cn } from "@/lib/utils";

export function NoteLaboratory() {
  const [selected, setSelected] = React.useState(2);
  const current = READING_RANGE[selected];
  const previous = adjacentNatural(current, -1);
  const next = adjacentNatural(current, 1);
  const position = staffPosition(current);

  return <div className="flex flex-col gap-6">
    <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Escolher nota">
      {READING_RANGE.map((note, index) => <button key={noteId(note)} role="option" aria-selected={index === selected} onClick={() => setSelected(index)} className={cn("min-h-10 shrink-0 rounded-md border px-3 text-sm font-medium transition-colors", index === selected ? "border-ink bg-ink text-paper" : "border-rule bg-transparent text-ink-muted hover:bg-paper-raised hover:text-ink")}>{noteName(note)}<span className="ml-0.5 text-[0.65rem] opacity-70">{note.octave}</span></button>)}
    </div>

    <Card className="overflow-hidden rounded-none border-x-0 bg-transparent">
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col items-center justify-center border-b border-rule/70 p-7 lg:border-r lg:border-b-0 lg:p-12">
          <SingleNoteStaff note={current} state="query" emphasize className="max-w-md" />
          <div className="mt-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" disabled={selected === 0} onClick={() => setSelected((i) => i - 1)} aria-label="Nota anterior"><ArrowLeft /></Button>
            <div className="min-w-28 text-center"><p className="display text-4xl font-semibold text-ink">{noteName(current)}<sup className="ml-1 text-base text-ink-faint">{current.octave}</sup></p><p className="mt-1 font-mono text-xs tracking-widest text-ink-muted">{current.letter}{current.accidental ? "♯" : ""}{current.octave}</p></div>
            <Button variant="ghost" size="icon" disabled={selected === READING_RANGE.length - 1} onClick={() => setSelected((i) => i + 1)} aria-label="Próxima nota"><ArrowRight /></Button>
          </div>
          <Button variant="brass" className="mt-5" onClick={() => playNote(current)}><Speaker /> Ouvir {noteName(current)}</Button>
        </div>

        <CardContent className="flex flex-col gap-7 pt-7">
          <p className="text-xs leading-5 text-ink-muted">Da posição escrita à altura física: cada dado abaixo descreve a mesma nota selecionada.</p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <Fact label="Nome" value={LETTER_PT[current.letter]} /><Fact label="Internacional" value={current.letter} />
            <Fact label="Oitava" value={String(current.octave)} /><Fact label="MIDI" value={String(midiNumber(current))} />
            <Fact label="Frequência" value={`${frequencyOf(current).toFixed(2)} Hz`} /><Fact label="Na pauta" value={position.label} />
          </dl>
          <div className="border-t border-rule pt-5"><p className="mb-3 text-[0.6875rem] font-semibold tracking-[.12em] text-ink-muted uppercase">A mesma nota no teclado</p><Keyboard marks={[{ note: current, tone: "a", badge: noteName(current) }]} markSemitoneGaps /></div>
          <div className="grid grid-cols-2 gap-3 border-t border-rule pt-5"><Relation label="Anterior" note={previous} semitones={semitonesBetween(previous, current)} /><Relation label="Próxima" note={next} semitones={semitonesBetween(current, next)} /></div>
        </CardContent>
      </div>
    </Card>
  </div>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-[0.625rem] font-medium tracking-wide text-ink-faint uppercase">{label}</dt><dd className="display mt-1 text-[1.05rem] font-medium text-ink">{value}</dd></div>; }
function Relation({ label, note, semitones }: { label: string; note: Note; semitones: number }) { return <div className="border-l border-rule pl-3"><p className="text-xs text-ink-faint">{label}</p><p className="display mt-1 text-lg font-semibold">{noteName(note)}{note.octave}</p><p className="text-xs text-ink-muted">{semitones} {semitones === 1 ? "semitom" : "semitons"}</p></div>; }
