/**
 * Escalas maiores.
 *
 * A escala não é uma lista decorada: ela é *derivada* da fórmula
 * Tom–Tom–Semitom–Tom–Tom–Tom–Semitom. Construímos aqui de verdade, andando
 * pelas letras em ordem e ajustando com sustenidos/bemóis até a distância bater
 * com a fórmula. É por isso que Sol maior sai com Fá♯ (e não Sol♭) sem nenhuma
 * tabela codificada à mão — e é exatamente esse raciocínio que os exercícios
 * pedem para o aluno reproduzir.
 */

import {
  type Accidental,
  type Letter,
  LETTERS,
  LETTER_PT,
  type Note,
  noteName,
  pitchClass,
  note,
} from "./notes";

/** A fórmula, do jeito que se recita. */
export const MAJOR_FORMULA = ["T", "T", "S", "T", "T", "T", "S"] as const;
export type FormulaStep = (typeof MAJOR_FORMULA)[number];

export const STEP_LABEL: Record<FormulaStep, string> = { T: "Tom", S: "Semitom" };
export const STEP_SEMITONES: Record<FormulaStep, number> = { T: 2, S: 1 };

/** Distância acumulada, em semitons, da tônica até cada grau. */
const CUMULATIVE = MAJOR_FORMULA.reduce<number[]>(
  (acc, s) => [...acc, acc[acc.length - 1] + STEP_SEMITONES[s]],
  [0],
); // [0, 2, 4, 5, 7, 9, 11, 12]

const NATURAL_PITCH: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Graus em algarismo romano — a linguagem da harmonia. */
export const DEGREE_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

/** Nomes funcionais dos graus, úteis nas explicações. */
export const DEGREE_NAME = [
  "tônica",
  "supertônica",
  "mediante",
  "subdominante",
  "dominante",
  "submediante",
  "sensível",
] as const;

/**
 * Monta a escala maior a partir da tônica.
 *
 * Regra de ouro: uma escala maior usa **cada letra exatamente uma vez**. Então
 * as letras já estão decididas — só resta descobrir qual alteração cada uma
 * precisa para chegar na distância que a fórmula manda.
 */
export function buildMajorScale(tonic: Note, withOctave = false): Note[] {
  const tonicIdx = LETTERS.indexOf(tonic.letter);
  const tonicPc = pitchClass(tonic);
  const count = withOctave ? 8 : 7;

  return Array.from({ length: count }, (_, i) => {
    const abs = tonicIdx + i;
    const letter = LETTERS[abs % 7];
    const octave = tonic.octave + Math.floor(abs / 7);

    const targetPc = (tonicPc + CUMULATIVE[i]) % 12;
    // Normaliza para -6..+5 para que a alteração seja a menor possível.
    const accidental = ((((targetPc - NATURAL_PITCH[letter] + 6) % 12) + 12) % 12 - 6) as Accidental;

    return { letter, accidental, octave };
  });
}

export function scaleNoteNames(tonic: Note, withOctave = false): string[] {
  return buildMajorScale(tonic, withOctave).map(noteName);
}

/* ==========================================================================
   Armadura de clave
   ========================================================================== */

/** Ordem em que os sustenidos aparecem na armadura. */
export const SHARP_ORDER: Letter[] = ["F", "C", "G", "D", "A", "E", "B"];
/** Ordem dos bemóis — exatamente a inversa. */
export const FLAT_ORDER: Letter[] = ["B", "E", "A", "D", "G", "C", "F"];

export type KeySignature = {
  count: number;
  type: "sharp" | "flat" | "none";
  /** Letras alteradas, na ordem da armadura. */
  letters: Letter[];
  /** "Fá♯" — nomes prontos para exibir. */
  names: string[];
};

export function keySignature(tonic: Note): KeySignature {
  const scale = buildMajorScale(tonic);
  const sharps = scale.filter((n) => n.accidental > 0);
  const flats = scale.filter((n) => n.accidental < 0);

  if (sharps.length === 0 && flats.length === 0) {
    return { count: 0, type: "none", letters: [], names: [] };
  }

  const type = sharps.length > 0 ? "sharp" : "flat";
  const order = type === "sharp" ? SHARP_ORDER : FLAT_ORDER;
  const altered = type === "sharp" ? sharps : flats;
  const letters = order.filter((l) => altered.some((n) => n.letter === l));

  return {
    count: altered.length,
    type,
    letters,
    names: letters.map(
      (l) => LETTER_PT[l] + (type === "sharp" ? "♯" : "♭"),
    ),
  };
}

/* ==========================================================================
   Catálogo da V1
   ========================================================================== */

export type ScaleEntry = {
  /** Identificador estável, usado nas chaves de erro: "C", "G", "D", "F". */
  id: string;
  tonic: Note;
  /** "Dó maior" */
  label: string;
  /** Ordem de estudo sugerida. */
  order: number;
  /** O que torna esta escala interessante de estudar. */
  insight: string;
};

/**
 * Quatro escalas na V1, escolhidas por proximidade no ciclo de quintas: Dó
 * (nenhuma alteração), Sol e Ré (um passo e dois passos no sentido dos
 * sustenidos), Fá (um passo no sentido dos bemóis).
 */
export const SCALES: ScaleEntry[] = [
  {
    id: "C",
    tonic: note("C", 0, 4),
    label: "Dó maior",
    order: 1,
    insight:
      "A escala sem nenhuma alteração — só notas naturais. É o mapa onde os semitons naturais (Mi–Fá e Si–Dó) caem exatamente onde a fórmula pede.",
  },
  {
    id: "G",
    tonic: note("G", 0, 4),
    label: "Sol maior",
    order: 2,
    insight:
      "Um sustenido: o Fá♯. Sem ele, a distância de Mi para Fá seria só um semitom, e a fórmula exige um tom naquele ponto.",
  },
  {
    id: "D",
    tonic: note("D", 0, 4),
    label: "Ré maior",
    order: 3,
    insight:
      "Dois sustenidos: Fá♯ e Dó♯. Repare que ela herda o Fá♯ de Sol maior e acrescenta um — é assim que o ciclo de quintas avança.",
  },
  {
    id: "F",
    tonic: note("F", 0, 4),
    label: "Fá maior",
    order: 4,
    insight:
      "Um bemol: o Si♭. Aqui o ciclo anda para o outro lado. Sem o bemol, Lá para Si daria um tom onde a fórmula pede semitom.",
  },
];

export function findScale(id: string): ScaleEntry | undefined {
  return SCALES.find((s) => s.id === id);
}

/**
 * Explica, grau por grau, por que cada nota é aquela.
 * É o texto que aparece na correção dos exercícios de escala.
 */
export function explainDegree(entry: ScaleEntry, degree: number): string {
  const scale = buildMajorScale(entry.tonic, true);
  const target = scale[degree];
  const prev = scale[degree - 1];

  if (degree === 0) {
    return `O grau I é a própria tônica, a nota que dá nome à escala: ${noteName(target)}.`;
  }

  const gap = MAJOR_FORMULA[degree - 1];
  const gapLabel = STEP_LABEL[gap].toLowerCase();
  const base = `Da fórmula, o passo do grau ${DEGREE_ROMAN[degree - 1]} para o grau ${
    degree === 7 ? "I (a oitava)" : DEGREE_ROMAN[degree]
  } é um ${gapLabel}. Subindo um ${gapLabel} a partir de ${noteName(prev)}, chegamos em ${noteName(target)}.`;

  if (target.accidental !== 0) {
    const natural = LETTER_PT[target.letter];
    return `${base} O ${natural} natural ficaria a uma distância errada, por isso ele aparece alterado: ${noteName(target)}.`;
  }

  return base;
}

/* ==========================================================================
   Ciclo de quintas
   ========================================================================== */

export type CircleEntry = {
  id: string;
  tonic: Note;
  label: string;
  signature: KeySignature;
  /** Posição no mostrador, 0 = Dó no topo, sentido horário. */
  position: number;
  /** Se está no catálogo de estudo da V1. */
  inV1: boolean;
};

const CIRCLE_TONICS: Array<[Letter, Accidental]> = [
  ["C", 0],
  ["G", 0],
  ["D", 0],
  ["A", 0],
  ["E", 0],
  ["B", 0],
  ["F", 1], // Fá♯
  ["D", -1], // Ré♭
  ["A", -1], // Lá♭
  ["E", -1], // Mi♭
  ["B", -1], // Si♭
  ["F", 0],
];

/**
 * Doze tonalidades maiores em quintas ascendentes. Cada passo no sentido
 * horário sobe uma quinta e acrescenta um sustenido; no anti-horário, desce
 * uma quinta e acrescenta um bemol.
 */
export const CIRCLE_OF_FIFTHS: CircleEntry[] = CIRCLE_TONICS.map(([letter, acc], i) => {
  const tonic = note(letter, acc, 4);
  return {
    id: `${letter}${acc > 0 ? "#" : acc < 0 ? "b" : ""}`,
    tonic,
    label: `${noteName(tonic)} maior`,
    signature: keySignature(tonic),
    position: i,
    inV1: SCALES.some((s) => s.tonic.letter === letter && s.tonic.accidental === acc),
  };
});
