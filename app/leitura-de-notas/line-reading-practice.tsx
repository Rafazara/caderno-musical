"use client";

import * as React from "react";
import { Check, ChevronRight, Focus, Minimize2, RotateCcw, Speaker, X } from "lucide-react";
import { Staff } from "@/components/music/staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScopePicker } from "@/components/study/scope-picker";
import { NoteCompare } from "@/components/pedagogy/note-compare";
import { playNote, playNoteLine } from "@/lib/music/audio";
import { LETTERS, LETTER_PT, NATURALS_PT, note, type Note, noteId, noteName, parseNoteId, slotDescription, slotOf, slotSubject } from "@/lib/music/notes";
import { buildErrorReviewLine, buildReadingLine, LINE_SIZES, type LineSizeId } from "@/lib/study/generators/reading-line";
import { useStudy } from "@/lib/study/provider";
import { cn } from "@/lib/utils";

type SessionStats = { lines: number; answered: number; correct: number; misses: Record<string, number> };
const EMPTY_STATS: SessionStats = { lines: 0, answered: 0, correct: 0, misses: {} };

function chunks<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, i) => values.slice(i * size, i * size + size));
}

export function LineReadingPractice() {
  const { state, record } = useStudy();
  const [sizeId, setSizeId] = React.useState<LineSizeId>("normal");
  const [notes, setNotes] = React.useState<Note[]>(() => buildReadingLine(LINE_SIZES.normal, state.errors));
  const [answers, setAnswers] = React.useState<(string | null)[]>(Array(LINE_SIZES.normal).fill(null));
  const [active, setActive] = React.useState(0);
  const [corrected, setCorrected] = React.useState(false);
  const [stats, setStats] = React.useState<SessionStats>(EMPTY_STATS);
  const [focusMode, setFocusMode] = React.useState(false);
  const stopLine = React.useRef<null | (() => void)>(null);
  const allAnswered = answers.every(Boolean);
  const score = corrected ? answers.filter((answer, i) => answer === LETTER_PT[notes[i].letter]).length : 0;

  const replaceLine = React.useCallback((next: Note[]) => {
    stopLine.current?.();
    setNotes(next);
    setAnswers(Array(next.length).fill(null));
    setActive(0);
    setCorrected(false);
  }, []);

  const choose = React.useCallback((answer: string) => {
    if (corrected) return;
    setAnswers((current) => current.map((value, index) => index === active ? answer : value));
    setActive((index) => Math.min(index + 1, notes.length - 1));
  }, [active, corrected, notes.length]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (corrected || event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (number >= 1 && number <= 7) choose(NATURALS_PT[number - 1]);
      if (event.key === "ArrowLeft") setActive((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight") setActive((i) => Math.min(notes.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, corrected, notes.length]);

  function correctLine() {
    if (!allAnswered || corrected) return;
    const misses = { ...stats.misses };
    notes.forEach((note, index) => {
      const expected = LETTER_PT[note.letter];
      const correct = answers[index] === expected;
      record({ module: "leitura", itemKey: noteId(note), prompt: `${noteName(note)} · ${slotDescription(slotOf(note))}`, correct, given: answers[index]!, expected });
      if (!correct) misses[noteId(note)] = (misses[noteId(note)] ?? 0) + 1;
    });
    setStats({ lines: stats.lines + 1, answered: stats.answered + notes.length, correct: stats.correct + answers.filter((answer, i) => answer === LETTER_PT[notes[i].letter]).length, misses });
    setCorrected(true);
  }

  const wrongNotes = corrected ? notes.filter((note, index) => answers[index] !== LETTER_PT[note.letter]) : [];
  const firstWrong = corrected ? notes.findIndex((item, index) => answers[index] !== LETTER_PT[item.letter]) : -1;
  const mistakenLetter = firstWrong >= 0 ? LETTERS[NATURALS_PT.indexOf(answers[firstWrong] ?? "")] : null;
  const percentage = stats.answered ? Math.round(stats.correct / stats.answered * 100) : 0;
  const frequent = Object.entries(stats.misses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => parseNoteId(id)).filter((note): note is Note => note !== null).map((note) => noteName(note));

  return (
    <div className={cn("flex flex-col gap-5", focusMode && "fixed inset-0 z-50 overflow-y-auto bg-paper px-4 py-5 sm:px-8 sm:py-8 lg:px-[max(2rem,calc((100vw-64rem)/2))]")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ScopePicker label="Tamanho da linha" value={sizeId} onChange={(id) => {
          const nextId = id as LineSizeId;
          setSizeId(nextId);
          replaceLine(buildReadingLine(LINE_SIZES[nextId], state.errors));
        }} options={[
          { id: "curta", label: "Curta · 5", hint: "Cinco notas por linha." },
          { id: "normal", label: "Normal · 8", hint: "Oito notas por linha — padrão." },
          { id: "intensiva", label: "Intensiva · 12", hint: "Doze notas por linha." },
        ]} />
        <div className="flex items-center gap-2"><p className="tabular text-sm text-ink-muted" aria-live="polite">
          Linha {stats.lines + 1} · {stats.correct}/{stats.answered} corretas{stats.answered ? ` · ${percentage}%` : ""}
        </p><Button variant="ghost" size="sm" onClick={() => setFocusMode((value) => !value)}>{focusMode ? <Minimize2 /> : <Focus />}{focusMode ? "Sair do foco" : "Modo foco"}</Button></div>
      </div>

      <Card className="overflow-hidden border-rule/70 bg-paper-raised">
        <CardHeader className="border-b border-rule bg-paper-sunken/40 py-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="display font-semibold text-ink">Leia da esquerda para a direita</p><p className="text-xs text-ink-faint">Escolha cada nome; a correção acontece somente no final.</p></div>
            <span className="text-xs text-ink-faint">Teclas 1–7 também respondem</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-3 pt-5 sm:px-6 sm:pt-6">
          <div className="hidden sm:flex sm:flex-col sm:gap-3"><LineRow notes={notes} answers={answers} active={active} corrected={corrected} offset={0} onActivate={setActive} /></div>
          <div className="flex flex-col gap-5 sm:hidden">{chunks(notes, 4).map((part, row) => <LineRow key={row} notes={part} answers={answers.slice(row * 4, row * 4 + part.length)} active={active} corrected={corrected} offset={row * 4} onActivate={setActive} />)}</div>

          {!corrected ? (
            <div className="rounded-lg border border-rule bg-paper p-3">
              <p className="mb-2 text-center text-xs text-ink-faint">Nota {active + 1} de {notes.length}</p>
              <div className="grid grid-cols-7 gap-1" role="group" aria-label={`Resposta da nota ${active + 1}`}>
                {NATURALS_PT.map((name, index) => <button key={name} type="button" onClick={() => choose(name)} className={cn("min-h-11 rounded-md border px-1 py-2 text-sm font-medium transition-colors", answers[active] === name ? "border-ink bg-ink text-paper" : "border-rule bg-paper-raised text-ink hover:bg-paper-sunken")}>{name}<span className="ml-1 hidden text-[0.6rem] opacity-65 lg:inline">{index + 1}</span></button>)}
              </div>
            </div>
          ) : (
            <div className={cn("rounded-lg border p-4", score === notes.length ? "border-sage/40 bg-sage-wash" : "border-clay/35 bg-clay-wash")}>
              <p className="display text-lg font-semibold">{score} de {notes.length} corretas — {Math.round(score / notes.length * 100)}%</p>
              {wrongNotes.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{notes.map((note, i) => answers[i] !== LETTER_PT[note.letter] ? <div key={i} className="rounded-md bg-paper-raised/75 p-3 text-sm"><p><strong>Correto: {noteName(note)}</strong> <span className="text-ink-muted">(você marcou {answers[i]})</span></p><p className="mt-1 text-xs leading-relaxed text-ink-muted">A cabeça da nota está {slotDescription(slotOf(note))}. Em clave de sol, {slotSubject(slotOf(note))} é {noteName(note)}.</p></div> : null)}</div> : <p className="mt-1 text-sm text-sage">Linha inteira reconhecida.</p>}
              {firstWrong >= 0 && mistakenLetter ? <details className="mt-4 border-t border-clay/20 pt-3"><summary className="cursor-pointer text-sm font-medium">Comparar minha resposta com a nota correta</summary><NoteCompare first={notes[firstWrong]} second={note(mistakenLetter, 0, notes[firstWrong].octave)} /></details> : null}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
            <Button variant="ghost" onClick={() => playNote(notes[active])}><Speaker /> Ouvir nota {active + 1}</Button>
            {!corrected ? <Button variant="brass" disabled={!allAnswered} onClick={correctLine}><Check /> Corrigir linha</Button> : <div className="flex flex-wrap gap-2"><Button onClick={() => { stopLine.current?.(); stopLine.current = playNoteLine(notes); }}><Speaker /> Ouvir linha</Button>{wrongNotes.length ? <Button onClick={() => replaceLine(buildErrorReviewLine(wrongNotes))}><RotateCcw /> Refazer erros</Button> : null}<Button variant="brass" onClick={() => replaceLine(buildReadingLine(LINE_SIZES[sizeId], state.errors))}>Próxima linha <ChevronRight /></Button></div>}
          </div>
        </CardContent>
      </Card>
      {frequent.length ? <p className="text-xs text-ink-faint">Mais desafiadoras nesta sessão: {frequent.join(" · ")}</p> : null}
    </div>
  );
}

function LineRow({ notes, answers, active, corrected, offset, onActivate }: { notes: Note[]; answers: (string | null)[]; active: number; corrected: boolean; offset: number; onActivate: (index: number) => void }) {
  return <div><Staff notes={notes.map((note, index) => ({ note, state: corrected ? (answers[index] === LETTER_PT[note.letter] ? "correct" : "wrong") : active === offset + index ? "query" : "default" }))} minNotes={notes.length} /><div className="grid items-start" style={{ gridTemplateColumns: `74fr repeat(${notes.length}, 46fr) 34fr` }}><span />{notes.map((note, index) => { const global = offset + index; const correct = answers[index] === LETTER_PT[note.letter]; return <button key={global} type="button" onClick={() => onActivate(global)} className={cn("mx-0.5 flex min-h-9 min-w-0 items-center justify-center gap-0.5 rounded-md border px-0.5 text-xs font-semibold transition-colors", corrected ? correct ? "border-sage/40 bg-sage-wash text-sage" : "border-clay/40 bg-clay-wash text-clay" : active === global ? "border-brass bg-brass-wash text-ink" : "border-rule-strong bg-paper-raised text-ink-muted")} aria-label={`Nota ${global + 1}: ${answers[index] ?? "sem resposta"}`}>{corrected ? correct ? <Check className="size-3" /> : <X className="size-3" /> : null}<span className="truncate">{answers[index] ?? "?"}</span></button>;})}<span /></div></div>;
}
