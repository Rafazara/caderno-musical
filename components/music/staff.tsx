import * as React from "react";
import {
  ACCIDENTAL_SIGN,
  isOnLine,
  ledgerSlots,
  type Note,
  noteNameSpoken,
  slotOf,
} from "@/lib/music/notes";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Geometria
   Uma única constante manda em tudo: o espaçamento entre linhas. Todo o resto
   (altura da pauta, tamanho da cabeça de nota, linhas suplementares) é medido
   em fração dela, como na gravação musical de verdade.
   -------------------------------------------------------------------------- */

const SPACE = 14; // distância entre duas linhas
const HALF = SPACE / 2; // um grau diatônico = meio espaço
const TOP_LINE = 22;
const BOTTOM_LINE = TOP_LINE + SPACE * 4; // 78
const VIEW_HEIGHT = 116;

const CLEF_X = 6;
const FIRST_NOTE_X = 74;
const NOTE_GAP = 46;
const TRAILING_X = 34;

/** y do centro de um slot (0 = 1ª linha, cresce para cima). */
function slotY(slot: number) {
  return BOTTOM_LINE - slot * HALF;
}

export type StaffState = "default" | "correct" | "wrong" | "muted" | "query";

export type StaffNote = {
  note: Note;
  state?: StaffState;
  /** Rótulo curto abaixo da nota (ex.: o nome, ou o grau). */
  label?: string;
};

const HEAD_FILL: Record<StaffState, string> = {
  default: "var(--ink)",
  correct: "var(--sage)",
  wrong: "var(--clay)",
  muted: "var(--ink-faint)",
  query: "var(--brass)",
};

/* --------------------------------------------------------------------------
   Clave de sol
   Desenhada em dois traços que se sobrepõem: a haste (com o laço inferior) e
   a espiral que envolve a 2ª linha — exatamente a linha do Sol, que é a razão
   de ser da clave. Traço uniforme e ponta arredondada, para ler como tinta
   sobre papel em vez de tipografia impressa.
   -------------------------------------------------------------------------- */

function TrebleClef() {
  return (
    <g
      transform={`translate(${CLEF_X}, 0)`}
      fill="none"
      stroke="var(--ink)"
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Haste: da voluta superior até o laço abaixo da pauta. */}
      <path
        d="M29 7
           C20 16, 16 28, 18.5 41
           C21 54, 26.5 70, 28.5 84
           C30.5 95, 26 103, 18 104
           C11 104.5, 6 100, 7.5 94.5
           C9 89.5, 15 88, 18.5 91.5"
      />
      {/* Espiral centrada na 2ª linha (Sol). */}
      <path
        d="M21 37
           C9 38, 2 51, 3.5 65
           C5 80, 14 89.5, 23 88
           C33 86.5, 38.5 76, 36 66.5
           C33.5 57.5, 24 54.5, 18.5 61
           C14 66.5, 16.5 71.5, 21 70"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */

export type StaffProps = {
  notes: StaffNote[];
  /** Destaca a linha ou espaço da nota — usado nas explicações. */
  emphasizeSlot?: number | null;
  /** Marca a 2ª linha, para lembrar de onde a clave tira o nome. */
  markGuideLine?: boolean;
  /**
   * Reserva espaço para pelo menos N notas. Serve para alinhar pautas de
   * tamanhos diferentes lado a lado: sem isso, a de menos notas escalaria mais
   * e ficaria com linhas visivelmente mais grossas.
   */
  minNotes?: number;
  className?: string;
  /** Descrição para leitores de tela. Se omitida, é gerada das notas. */
  ariaLabel?: string;
};

/**
 * Pentagrama em clave de sol.
 *
 * Escala com o contêiner: o SVG usa `viewBox` + largura 100%, então a mesma
 * pauta serve no celular e no desktop sem recalcular nada em JavaScript.
 */
export function Staff({
  notes,
  emphasizeSlot = null,
  markGuideLine = false,
  minNotes = 1,
  className,
  ariaLabel,
}: StaffProps) {
  const width = FIRST_NOTE_X + Math.max(minNotes, notes.length) * NOTE_GAP + TRAILING_X;

  const label =
    ariaLabel ??
    (notes.length === 1
      ? `Pentagrama em clave de sol com a nota ${noteNameSpoken(notes[0].note)}`
      : `Pentagrama em clave de sol com as notas ${notes
          .map((n) => noteNameSpoken(n.note))
          .join(", ")}`);

  return (
    <svg
      viewBox={`0 0 ${width} ${VIEW_HEIGHT}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Faixa de destaque atrás da pauta — só na linha/espaço em questão. */}
      {emphasizeSlot !== null ? (
        <rect
          x={FIRST_NOTE_X - 30}
          y={slotY(emphasizeSlot) - (isOnLine(emphasizeSlot) ? 2 : HALF - 1)}
          width={width - FIRST_NOTE_X + 20}
          height={isOnLine(emphasizeSlot) ? 4 : SPACE - 2}
          fill="var(--brass)"
          opacity={0.16}
          rx={2}
        />
      ) : null}

      {/* As cinco linhas. */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = TOP_LINE + i * SPACE;
        const isGuide = markGuideLine && i === 3; // 2ª linha, contando de baixo
        return (
          <line
            key={i}
            x1={2}
            x2={width - 2}
            y1={y}
            y2={y}
            stroke={isGuide ? "var(--brass)" : "var(--rule-strong)"}
            strokeWidth={isGuide ? 2 : 1.4}
          />
        );
      })}

      <TrebleClef />

      {notes.map((entry, i) => {
        const slot = slotOf(entry.note);
        const x = FIRST_NOTE_X + i * NOTE_GAP;
        const y = slotY(slot);
        const state = entry.state ?? "default";
        const fill = HEAD_FILL[state];
        const acc = ACCIDENTAL_SIGN[entry.note.accidental];

        return (
          <g key={`${i}-${entry.note.letter}${entry.note.octave}`}>
            {/* Linhas suplementares, quando a nota sai da pauta. */}
            {ledgerSlots(slot).map((s) => (
              <line
                key={s}
                x1={x - 15}
                x2={x + 15}
                y1={slotY(s)}
                y2={slotY(s)}
                stroke="var(--rule-strong)"
                strokeWidth={1.4}
              />
            ))}

            {/* Cabeça de nota: elipse inclinada, como na gravação tradicional. */}
            <ellipse
              cx={x}
              cy={y}
              rx={9.4}
              ry={6.6}
              fill={fill}
              transform={`rotate(-20 ${x} ${y})`}
            />

            {acc ? (
              <text
                x={x - 16}
                y={y + 5}
                textAnchor="end"
                fill={fill}
                fontSize={22}
                fontFamily="var(--font-sans)"
              >
                {acc}
              </text>
            ) : null}

            {entry.label ? (
              <text
                x={x}
                y={VIEW_HEIGHT - 3}
                textAnchor="middle"
                fill="var(--ink-muted)"
                fontSize={13}
                fontWeight={600}
                fontFamily="var(--font-sans)"
              >
                {entry.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Pauta em branco com uma nota só — o formato usado no exercício de leitura.
 * Encapsula o enquadramento para a nota nunca "dançar" entre questões.
 */
export function SingleNoteStaff({
  note: n,
  state = "query",
  emphasize = false,
  markGuideLine = false,
  className,
}: {
  note: Note;
  state?: StaffState;
  emphasize?: boolean;
  markGuideLine?: boolean;
  className?: string;
}) {
  return (
    <Staff
      notes={[{ note: n, state }]}
      emphasizeSlot={emphasize ? slotOf(n) : null}
      markGuideLine={markGuideLine}
      className={cn("max-w-[19rem]", className)}
    />
  );
}
