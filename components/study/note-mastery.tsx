"use client";

import Link from "next/link";
import { Staff } from "@/components/music/staff";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LETTER_PT, noteId, noteName, parseNoteId, READING_RANGE } from "@/lib/music/notes";
import type { Attempt } from "@/lib/storage/types";
import { cn, pct } from "@/lib/utils";

export function NoteMastery({ attempts }: { attempts: Attempt[] }) {
  const reading = attempts.filter((attempt) => attempt.module === "leitura");
  const values = READING_RANGE.map((note) => {
    const list = reading.filter((attempt) => attempt.itemKey === noteId(note));
    return { note, total: list.length, accuracy: list.length ? pct(list.filter((a) => a.correct).length, list.length) : null };
  });
  const weak = values.filter((value) => value.accuracy !== null && value.accuracy < 65).map((value) => noteId(value.note));

  return <Card>
    <CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle className="text-base">Mapa de domínio</CardTitle><p className="mt-1 text-sm text-ink-muted">Precisão por posição — não uma nota, mas o lugar exato na pauta.</p></div><Link href="/leitura-de-notas" className={buttonClass({ variant: "ghost", size: "sm" })}>Praticar leitura</Link></CardHeader>
    <CardContent className="flex flex-col gap-5">
      <Staff notes={values.map(({ note, accuracy }) => ({ note, state: accuracy === null ? "muted" : accuracy < 65 ? "wrong" : accuracy < 85 ? "query" : "correct", label: noteName(note) }))} ariaLabel="Mapa de domínio das notas no pentagrama" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">{values.map(({ note, total, accuracy }) => <div key={noteId(note)}><div className="flex items-center justify-between gap-2 text-xs"><span className="font-medium text-ink">{LETTER_PT[note.letter]}<sup className="text-ink-faint">{note.octave}</sup></span><span className="tabular text-ink-faint">{accuracy === null ? "—" : `${accuracy}%`}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-sunken"><div className={cn("h-full rounded-full", accuracy === null ? "bg-rule-strong" : accuracy < 65 ? "bg-brass-soft" : "bg-sage")} style={{ width: `${accuracy ?? 8}%` }} /></div><p className="mt-1 text-[0.625rem] text-ink-faint">{total ? `${total} respostas` : "ainda não estudada"}</p></div>)}</div>
      {weak.length ? <p className="text-xs text-ink-muted">Prioridade sugerida: {weak.map((id) => parseNoteId(id)).filter(Boolean).map((note) => noteName(note!)).join(" · ")}</p> : null}
    </CardContent>
  </Card>;
}
