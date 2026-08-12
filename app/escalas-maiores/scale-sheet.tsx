"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Speaker } from "lucide-react";
import { Keyboard } from "@/components/music/keyboard";
import { Staff } from "@/components/music/staff";
import { ScaleStrip } from "@/components/music/scale-strip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { playNoteLine } from "@/lib/music/audio";
import { noteName } from "@/lib/music/notes";
import { buildMajorScale, DEGREE_NAME, DEGREE_ROMAN, explainDegree, keySignature, MAJOR_FORMULA, STEP_LABEL, type ScaleEntry } from "@/lib/music/scales";

/**
 * A "ficha" de uma escala: as notas na pauta, a fita com a fórmula e o motivo
 * de a escala ser assim. Repetir esse mesmo layout para as quatro escalas é
 * proposital — a comparação entre elas é parte do aprendizado.
 */
export function ScaleSheet({ entry, practiced }: { entry: ScaleEntry; practiced?: boolean }) {
  const [details, setDetails] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const scale = buildMajorScale(entry.tonic, true);
  const sig = keySignature(entry.tonic);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{entry.label}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            {sig.count === 0
              ? "Nenhuma alteração"
              : `${sig.count} ${sig.count === 1 ? "alteração" : "alterações"}: ${sig.names.join(", ")}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {practiced ? <Badge tone="sage">Praticada</Badge> : null}
          <Badge tone={sig.count === 0 ? "neutral" : sig.type === "sharp" ? "brass" : "slate"}>
            {sig.count === 0 ? "—" : `${sig.count}${sig.type === "sharp" ? "♯" : "♭"}`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <Staff
          notes={scale.map((n) => ({
            note: n,
            state: n.accidental !== 0 ? "query" : "default",
            label: noteName(n),
          }))}
          ariaLabel={`${entry.label} na pauta: ${scale.map(noteName).join(", ")}`}
        />

        <ScaleStrip slots={scale.map((n) => ({ name: noteName(n) }))} />

        <div className="mx-auto w-full max-w-xl rounded-xl bg-paper-sunken/45 p-3 sm:p-5">
          <Keyboard marks={scale.map((note, index) => ({ note, tone: index === 0 || index === 7 ? "a" : "b", badge: index === 7 ? "I" : DEGREE_ROMAN[index] }))} />
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{entry.insight}</p>

        <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
          <Button onClick={() => playNoteLine(scale)}><Speaker /> Ouvir ascendente</Button>
          <Button variant="ghost" onClick={() => playNoteLine([...scale].reverse())}><Speaker /> Descendente</Button>
          <Button variant="ghost" onClick={() => setDetails((value) => !value)} aria-expanded={details}>Detalhes técnicos <ChevronDown className={details ? "rotate-180" : ""} /></Button>
        </div>

        {details ? <div className="animate-rise grid gap-2 border-t border-rule pt-4 sm:grid-cols-4">{scale.slice(0, 7).map((note, index) => <div key={noteName(note)} className="rounded-lg bg-paper-sunken/55 p-3"><p className="font-mono text-xs text-brass">{DEGREE_ROMAN[index]}</p><p className="display mt-1 font-semibold">{noteName(note)}</p><p className="mt-0.5 text-xs capitalize text-ink-muted">{DEGREE_NAME[index]}</p></div>)}</div> : null}

        <div className="rounded-xl border border-brass-soft/30 bg-brass-wash p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="display font-semibold text-ink">Construir escala</p><p className="mt-1 text-xs text-ink-muted">Avance pela fórmula e veja cada distância acontecer.</p></div><Badge tone="brass">Passo {step + 1}/8</Badge></div>
          <div className="mt-5 flex items-center gap-3"><span className="display text-3xl font-semibold text-brass">{noteName(scale[step])}</span>{step < 7 ? <><ChevronRight className="text-ink-faint" /><span className="text-sm"><strong>{MAJOR_FORMULA[step]}</strong> · {STEP_LABEL[MAJOR_FORMULA[step]]}</span></> : <span className="text-sm text-ink-muted">oitava concluída</span>}</div>
          <p className="mt-3 min-h-10 text-sm leading-relaxed text-ink-soft">{step === 0 ? explainDegree(entry, 0) : explainDegree(entry, step)}</p>
          <div className="mt-4"><Keyboard marks={scale.slice(0, step + 1).map((note, index) => ({ note, tone: index === step ? "a" : "b", badge: String(index + 1) }))} markSemitoneGaps /></div>
          <div className="mt-4 flex justify-end gap-2"><Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Voltar</Button><Button size="sm" variant="brass" disabled={step === 7} onClick={() => setStep((value) => value + 1)}>Próximo passo <ChevronRight /></Button></div>
        </div>
      </CardContent>
    </Card>
  );
}
