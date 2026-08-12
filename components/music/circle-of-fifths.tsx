"use client";

import * as React from "react";
import Link from "next/link";
import { CIRCLE_OF_FIFTHS, scaleNoteNames } from "@/lib/music/scales";
import { buttonClass } from "@/components/ui/button";
import { noteName } from "@/lib/music/notes";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Ciclo de quintas.

   Doze tonalidades num mostrador. Andando no sentido horário, cada passo sobe
   uma quinta e ganha um sustenido; no anti-horário, desce uma quinta e ganha
   um bemol. O Dó fica no topo justamente porque é o ponto sem alteração
   nenhuma — o "zero" do relógio.
   -------------------------------------------------------------------------- */

const SIZE = 260;
const CENTER = SIZE / 2;
const RING = 100;
const CHIP = 25;

function positionAt(index: number, radius: number) {
  const angle = (-90 + index * 30) * (Math.PI / 180);
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

export function CircleOfFifths({
  /** Ids em destaque (as escalas do catálogo, por exemplo). */
  highlight = [],
  className,
}: {
  highlight?: string[];
  className?: string;
}) {
  const [selectedId, setSelectedId] = React.useState("C");
  const selected = CIRCLE_OF_FIFTHS.find((entry) => entry.id === selectedId) ?? CIRCLE_OF_FIFTHS[0];
  return (
    <div className={cn("flex w-full flex-col items-center gap-4", className)}><svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-[19rem]"
      role="img"
      aria-label="Ciclo de quintas com as doze tonalidades maiores"
    >
      {/* Anel de apoio */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING}
        fill="none"
        stroke="var(--rule)"
        strokeWidth={1.2}
      />

      {/* Setas indicando os dois sentidos */}
      <text
        x={CENTER}
        y={CENTER - 16}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--ink-faint)"
        letterSpacing="0.1em"
      >
        ♭ BEMÓIS
      </text>
      <text
        x={CENTER}
        y={CENTER + 3}
        textAnchor="middle"
        fontSize={16}
        fontFamily="var(--font-sans)"
        fill="var(--ink-faint)"
      >
        ↺ ↻
      </text>
      <text
        x={CENTER}
        y={CENTER + 20}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--ink-faint)"
        letterSpacing="0.1em"
      >
        SUSTENIDOS ♯
      </text>

      {CIRCLE_OF_FIFTHS.map((entry) => {
        const { x, y } = positionAt(entry.position, RING);
        const on = highlight.includes(entry.id) || selectedId === entry.id;
        const sig = entry.signature;

        return (
          <g key={entry.id} role="button" tabIndex={0} aria-label={`Explorar ${entry.label}`} onClick={() => setSelectedId(entry.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(entry.id); } }} className="cursor-pointer outline-none">
            <circle
              cx={x}
              cy={y}
              r={CHIP}
              fill={on ? "var(--brass)" : "var(--paper-raised)"}
              stroke={on ? "var(--brass)" : "var(--rule-strong)"}
              strokeWidth={1.4}
            />
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fontFamily="var(--font-display), serif"
              fill={on ? "#fff" : "var(--ink)"}
            >
              {noteName(entry.tonic)}
            </text>
            <text
              x={x}
              y={y + 14}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={on ? "rgb(255 255 255 / 0.75)" : "var(--ink-faint)"}
            >
              {sig.count === 0
                ? "—"
                : `${sig.count}${sig.type === "sharp" ? "♯" : "♭"}`}
            </text>
          </g>
        );
      })}
    </svg><div className="w-full max-w-md rounded-xl border border-rule bg-paper-raised p-4 text-center shadow-page"><p className="display text-lg font-semibold">{selected.label}</p><p className="mt-1 text-xs text-ink-muted">{selected.signature.count === 0 ? "Sem acidentes" : `${selected.signature.count} ${selected.signature.type === "sharp" ? "sustenido(s)" : "bemol(is)"}: ${selected.signature.names.join(", ")}`}</p><p className="mt-3 text-sm text-ink-soft">{scaleNoteNames(selected.tonic, true).join(" · ")}</p>{selected.inV1 ? <Link href="/escalas-maiores" className={buttonClass({ variant: "ghost", size: "sm", className: "mt-3" })}>Abrir esta escala</Link> : <p className="mt-3 text-xs text-ink-faint">Tonalidade disponível para exploração; a prática virá em uma etapa futura.</p>}</div></div>
  );
}
