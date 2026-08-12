import * as React from "react";
import { LETTER_PT, type Letter, type Note, pitch } from "@/lib/music/notes";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Teclado de uma oitava, do dó central ao dó seguinte.

   O desenho existe por um motivo pedagógico: é no teclado que fica óbvio por
   que Mi→Fá e Si→Dó são semitons. Nesses dois pares não há tecla preta no
   meio — as brancas se tocam. Por isso os vãos ausentes são marcados de
   propósito, em vez de simplesmente omitidos.
   -------------------------------------------------------------------------- */

const WHITE_W = 30;
const WHITE_H = 122;
const BLACK_W = 19;
const BLACK_H = 76;
const PAD = 2;

type WhiteKey = { letter: Letter; octave: number; pitch: number; index: number };
type BlackKey = { pitch: number; afterIndex: number; sharp: Letter; flat: Letter };

const WHITES: WhiteKey[] = [
  { letter: "C", octave: 4, pitch: 0, index: 0 },
  { letter: "D", octave: 4, pitch: 2, index: 1 },
  { letter: "E", octave: 4, pitch: 4, index: 2 },
  { letter: "F", octave: 4, pitch: 5, index: 3 },
  { letter: "G", octave: 4, pitch: 7, index: 4 },
  { letter: "A", octave: 4, pitch: 9, index: 5 },
  { letter: "B", octave: 4, pitch: 11, index: 6 },
  { letter: "C", octave: 5, pitch: 12, index: 7 },
];

const BLACKS: BlackKey[] = [
  { pitch: 1, afterIndex: 0, sharp: "C", flat: "D" },
  { pitch: 3, afterIndex: 1, sharp: "D", flat: "E" },
  { pitch: 6, afterIndex: 3, sharp: "F", flat: "G" },
  { pitch: 8, afterIndex: 4, sharp: "G", flat: "A" },
  { pitch: 10, afterIndex: 5, sharp: "A", flat: "B" },
];

/** Fronteiras entre brancas vizinhas sem preta no meio: Mi–Fá e Si–Dó. */
const SEMITONE_GAPS = [
  { afterIndex: 2, pair: "Mi–Fá" },
  { afterIndex: 6, pair: "Si–Dó" },
];

const TONES = {
  a: { fill: "var(--brass)", text: "#fff" },
  b: { fill: "var(--slate)", text: "#fff" },
  correct: { fill: "var(--sage)", text: "#fff" },
  wrong: { fill: "var(--clay)", text: "#fff" },
} as const;

export type KeyTone = keyof typeof TONES;

export type KeyboardMark = {
  note: Note;
  tone?: KeyTone;
  /** Rótulo curto sobre a tecla (ex.: "1", "2"). */
  badge?: string;
};

const VIEW_W = WHITES.length * WHITE_W + PAD * 2;
const LABEL_ROW = 20;
const VIEW_H = WHITE_H + PAD * 2 + LABEL_ROW;

/**
 * Alturas dos rótulos.
 *
 * O número da tecla branca fica **abaixo** de onde as pretas terminam. Se
 * ficasse no topo, as teclas pretas — pintadas depois, por estarem por cima —
 * cortariam o círculo pelas laterais.
 */
const WHITE_BADGE_Y = PAD + BLACK_H + 16;
const BLACK_BADGE_Y = PAD + BLACK_H - 14;
const WHITE_NAME_Y = PAD + WHITE_H - 10;
const GAP_LABEL_Y = PAD + WHITE_H + 14;

function whiteX(index: number) {
  return PAD + index * WHITE_W;
}

function blackX(afterIndex: number) {
  return PAD + (afterIndex + 1) * WHITE_W - BLACK_W / 2;
}

export type KeyboardProps = {
  marks?: KeyboardMark[];
  /** Escreve Dó, Ré, Mi… sob as teclas brancas. */
  showNames?: boolean;
  /** Sinaliza onde duas brancas se tocam sem preta no meio. */
  markSemitoneGaps?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function Keyboard({
  marks = [],
  showNames = true,
  markSemitoneGaps = false,
  className,
  ariaLabel,
}: KeyboardProps) {
  // Nota marcada por altura absoluta — o teclado cobre só uma oitava,
  // então a altura já identifica a tecla sem ambiguidade.
  const marked = new Map<number, KeyboardMark>();
  for (const m of marks) {
    const absolute = pitch(m.note);
    // Este teclado é um mapa compacto de uma oitava. Notas de outras oitavas
    // apontam para a tecla de mesma classe de altura; o Dó superior fica em 12.
    const visible = absolute !== 0 && absolute % 12 === 0 ? 12 : ((absolute % 12) + 12) % 12;
    if (!marked.has(visible)) marked.set(visible, m);
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={ariaLabel ?? "Teclado de uma oitava, do dó central ao dó seguinte"}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 1. Teclas brancas */}
      {WHITES.map((key) => {
        const tone = toneOf(marked.get(key.pitch));
        return (
          <rect
            key={`w-${key.pitch}`}
            x={whiteX(key.index)}
            y={PAD}
            width={WHITE_W}
            height={WHITE_H}
            rx={3}
            fill={tone ? tone.fill : "var(--paper-raised)"}
            stroke="var(--rule-strong)"
            strokeWidth={1.2}
          />
        );
      })}

      {/* 2. Onde faltam teclas pretas: os dois semitons naturais. */}
      {markSemitoneGaps
        ? SEMITONE_GAPS.map((gap) => {
            const x = PAD + (gap.afterIndex + 1) * WHITE_W;
            return (
              <g key={gap.pair}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD + 4}
                  y2={PAD + BLACK_H}
                  stroke="var(--brass)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  opacity={0.75}
                />
                <text
                  x={x}
                  y={GAP_LABEL_Y}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="var(--font-sans)"
                  fill="var(--brass)"
                >
                  {gap.pair}
                </text>
              </g>
            );
          })
        : null}

      {/* 3. Teclas pretas, por cima das brancas */}
      {BLACKS.map((key) => {
        const tone = toneOf(marked.get(key.pitch));
        return (
          <rect
            key={`b-${key.pitch}`}
            x={blackX(key.afterIndex)}
            y={PAD}
            width={BLACK_W}
            height={BLACK_H}
            rx={2.5}
            fill={tone ? tone.fill : "var(--ink)"}
            stroke={tone ? tone.fill : "var(--ink)"}
            strokeWidth={1}
          />
        );
      })}

      {/* 4. Nomes e números por último, para nada cobri-los. */}
      {WHITES.map((key) => {
        const mark = marked.get(key.pitch);
        const tone = toneOf(mark);
        const cx = whiteX(key.index) + WHITE_W / 2;
        return (
          <g key={`wl-${key.pitch}`}>
            {showNames ? (
              <text
                x={cx}
                y={WHITE_NAME_Y}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill={tone ? tone.text : "var(--ink-muted)"}
              >
                {LETTER_PT[key.letter]}
              </text>
            ) : null}
            {mark?.badge ? (
              <Badge
                cx={cx}
                cy={WHITE_BADGE_Y}
                r={9}
                fontSize={11}
                label={mark.badge}
                color={tone ? tone.fill : "var(--ink)"}
              />
            ) : null}
          </g>
        );
      })}

      {BLACKS.map((key) => {
        const mark = marked.get(key.pitch);
        if (!mark?.badge) return null;
        const tone = toneOf(mark);
        return (
          <Badge
            key={`bl-${key.pitch}`}
            cx={blackX(key.afterIndex) + BLACK_W / 2}
            cy={BLACK_BADGE_Y}
            r={8}
            fontSize={10}
            label={mark.badge}
            color={tone ? tone.fill : "var(--ink)"}
          />
        );
      })}
    </svg>
  );
}

function toneOf(mark: KeyboardMark | undefined) {
  return mark ? TONES[mark.tone ?? "a"] : null;
}

/** Círculo numerado sobre uma tecla. */
function Badge({
  cx,
  cy,
  r,
  fontSize,
  label,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  fontSize: number;
  label: string;
  color: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--paper-raised)" stroke={color} strokeWidth={1.5} />
      <text
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Teclado mostrando o par do exercício de tom e semitom, numerado na ordem em
 * que as notas são lidas.
 */
export function IntervalKeyboard({
  first,
  second,
  tone = "a",
  showGaps = false,
  className,
}: {
  first: Note;
  second: Note;
  tone?: KeyTone;
  showGaps?: boolean;
  className?: string;
}) {
  return (
    <Keyboard
      marks={[
        { note: first, tone, badge: "1" },
        { note: second, tone: tone === "a" ? "b" : tone, badge: "2" },
      ]}
      markSemitoneGaps={showGaps}
      className={className}
    />
  );
}
