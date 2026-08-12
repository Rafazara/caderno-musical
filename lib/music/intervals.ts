/**
 * Tom e semitom.
 *
 * O fato central que este módulo existe para ensinar: entre as sete notas
 * naturais, **cinco distâncias são de um tom e duas são de um semitom** —
 * Mi→Fá e Si→Dó. No teclado isso é visível: são justamente os dois pares de
 * teclas brancas vizinhas sem tecla preta no meio.
 */

import {
  LETTERS,
  type Letter,
  LETTER_PT,
  type Note,
  noteName,
  pitch,
  note,
} from "./notes";

export type IntervalKind = "semitom" | "tom" | "outro";

export const INTERVAL_LABEL: Record<IntervalKind, string> = {
  semitom: "Semitom",
  tom: "Tom",
  outro: "Outra distância",
};

/** Distância em semitons entre duas notas, sempre positiva. */
export function semitonesBetween(a: Note, b: Note): number {
  return Math.abs(pitch(b) - pitch(a));
}

export function classify(a: Note, b: Note): IntervalKind {
  const d = semitonesBetween(a, b);
  if (d === 1) return "semitom";
  if (d === 2) return "tom";
  return "outro";
}

/** Os dois pares naturais que formam semitom — o coração do assunto. */
export const NATURAL_SEMITONE_PAIRS: Array<[Letter, Letter]> = [
  ["E", "F"],
  ["B", "C"],
];

export function isNaturalSemitonePair(a: Letter, b: Letter): boolean {
  return NATURAL_SEMITONE_PAIRS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  );
}

/* ==========================================================================
   Geração dos pares de exercício
   ========================================================================== */

export type IntervalPair = {
  /** Chave estável para o registro de erros: "E4-F4". */
  id: string;
  low: Note;
  high: Note;
  /** Direção em que o par é apresentado ao aluno. */
  direction: "asc" | "desc";
  answer: IntervalKind;
  /** Se envolve alteração — um pouco mais difícil. */
  hasAccidental: boolean;
};

function makePair(low: Note, high: Note, direction: "asc" | "desc"): IntervalPair {
  return {
    id: `${noteKey(low)}-${noteKey(high)}${direction === "desc" ? ":d" : ""}`,
    low,
    high,
    direction,
    answer: classify(low, high),
    hasAccidental: low.accidental !== 0 || high.accidental !== 0,
  };
}

function noteKey(n: Note) {
  const acc = n.accidental > 0 ? "#" : n.accidental < 0 ? "b" : "";
  return `${n.letter}${acc}${n.octave}`;
}

/** Os sete pares de naturais vizinhos, subindo do Dó4 ao Dó5. */
const ADJACENT_NATURALS: Array<[Note, Note]> = LETTERS.map((letter, i) => {
  const nextIdx = (i + 1) % 7;
  const low = note(letter, 0, 4);
  const high = note(LETTERS[nextIdx], 0, nextIdx === 0 ? 5 : 4);
  return [low, high];
});

/** Pares com alteração — mostram que qualquer tecla vizinha é um semitom. */
const ACCIDENTAL_PAIRS: Array<[Note, Note]> = [
  [note("C", 0, 4), note("C", 1, 4)], // Dó → Dó♯
  [note("C", 1, 4), note("D", 0, 4)], // Dó♯ → Ré
  [note("F", 0, 4), note("F", 1, 4)], // Fá → Fá♯
  [note("F", 1, 4), note("G", 0, 4)], // Fá♯ → Sol
  [note("G", 0, 4), note("G", 1, 4)], // Sol → Sol♯
  [note("B", -1, 4), note("B", 0, 4)], // Si♭ → Si
  [note("A", 0, 4), note("B", -1, 4)], // Lá → Si♭
  [note("E", 0, 4), note("F", 1, 4)], // Mi → Fá♯  (um tom, com alteração)
  [note("B", -1, 4), note("C", 0, 5)], // Si♭ → Dó  (um tom)
];

/** Banco completo de pares: naturais nas duas direções + casos com alteração. */
export const INTERVAL_BANK: IntervalPair[] = [
  ...ADJACENT_NATURALS.map(([a, b]) => makePair(a, b, "asc")),
  ...ADJACENT_NATURALS.map(([a, b]) => makePair(a, b, "desc")),
  ...ACCIDENTAL_PAIRS.map(([a, b]) => makePair(a, b, "asc")),
];

export function findPair(id: string): IntervalPair | undefined {
  return INTERVAL_BANK.find((p) => p.id === id);
}

/** Como o par é lido em voz alta, respeitando a direção. */
export function pairLabel(p: IntervalPair): string {
  return p.direction === "asc"
    ? `${noteName(p.low)} → ${noteName(p.high)}`
    : `${noteName(p.high)} → ${noteName(p.low)}`;
}

/* ==========================================================================
   Explicação didática
   ========================================================================== */

export type IntervalExplanation = {
  headline: string;
  reason: string;
  tip: string;
};

export function explainPair(p: IntervalPair): IntervalExplanation {
  const semis = semitonesBetween(p.low, p.high);
  const naturalPair = !p.hasAccidental && isNaturalSemitonePair(p.low.letter, p.high.letter);

  if (p.answer === "semitom") {
    if (naturalPair) {
      const other = p.low.letter === "E" ? "Si → Dó" : "Mi → Fá";
      return {
        headline: `${pairLabel(p)} é um semitom.`,
        reason: `Entre ${LETTER_PT[p.low.letter]} e ${LETTER_PT[p.high.letter]} não existe tecla preta — são duas brancas coladas uma na outra. Esse é um dos dois únicos semitons naturais.`,
        tip: `Só há dois lugares assim no teclado: Mi → Fá e Si → Dó. Decorando esses dois pares, todas as outras vizinhas naturais são tom. O outro é ${other}.`,
      };
    }
    return {
      headline: `${pairLabel(p)} é um semitom.`,
      reason: `São duas teclas imediatamente vizinhas no teclado — uma branca e uma preta. Um semitom é sempre o menor passo possível: uma tecla para o lado, sem pular nada.`,
      tip: "Qualquer nota alterada para sustenido ou bemol se move exatamente um semitom. Dó → Dó♯ é um semitom por definição.",
    };
  }

  if (p.answer === "tom") {
    if (!p.hasAccidental) {
      return {
        headline: `${pairLabel(p)} é um tom.`,
        reason: `Entre ${LETTER_PT[p.low.letter]} e ${LETTER_PT[p.high.letter]} existe uma tecla preta no meio (${LETTER_PT[p.low.letter]}♯ / ${LETTER_PT[p.high.letter]}♭). Pular essa tecla é o que faz a distância valer dois semitons, ou seja, um tom.`,
        tip: "Regra prática: entre naturais vizinhas é tom, *exceto* Mi → Fá e Si → Dó. Essas duas são as exceções — todo o resto é tom.",
      };
    }
    return {
      headline: `${pairLabel(p)} é um tom.`,
      reason: `A distância é de dois semitons: existe uma tecla no meio do caminho. Um tom é sempre igual a dois semitons somados.`,
      tip: "Conte teclas, não nomes. Dois passos de tecla = um tom, independente de a nota ter sustenido ou bemol.",
    };
  }

  return {
    headline: `${pairLabel(p)} vale ${semis} semitons.`,
    reason: `Isso é mais do que um tom (2 semitons), então não é nem tom nem semitom.`,
    tip: "Tom = 2 semitons. Semitom = 1. Qualquer coisa maior já é outro intervalo.",
  };
}

/** Os dois fatos que resumem o assunto — usados na área de conteúdo. */
export const INTERVAL_FACTS = [
  {
    title: "Semitom é o menor passo",
    body: "É a distância entre duas teclas vizinhas no piano, sem pular nenhuma. No violão, é uma casa.",
  },
  {
    title: "Tom são dois semitons",
    body: "Um tom pula uma tecla. No violão, duas casas.",
  },
  {
    title: "Só existem dois semitons naturais",
    body: "Mi → Fá e Si → Dó. São os dois lugares do teclado onde duas brancas se tocam sem preta no meio.",
  },
];
