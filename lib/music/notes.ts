/**
 * Modelo de notas e posição no pentagrama (clave de sol).
 *
 * Duas ideias sustentam todo o módulo:
 *
 * 1. `step` — grau diatônico absoluto. Dó4 = 0, Ré4 = 1, … Si4 = 6, Dó5 = 7.
 *    Serve para posicionar a nota no pentagrama, porque na partitura cada
 *    linha/espaço é exatamente um grau diatônico.
 *
 * 2. `pitchClass` — altura em semitons dentro da oitava (Dó = 0 … Si = 11).
 *    Serve para calcular distâncias (tom/semitom) e montar escalas.
 *
 * Um Dó♯ e um Ré♭ têm o mesmo `pitchClass` mas `step` diferente — é
 * justamente essa distinção que faz as escalas saírem com a grafia correta.
 */

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Letter = (typeof LETTERS)[number];

/** Nomes em português — é assim que o conteúdo é apresentado no app. */
export const LETTER_PT: Record<Letter, string> = {
  C: "Dó",
  D: "Ré",
  E: "Mi",
  F: "Fá",
  G: "Sol",
  A: "Lá",
  B: "Si",
};

/** Ordem em que as notas naturais aparecem, começando no Dó. */
export const NATURALS_PT = LETTERS.map((l) => LETTER_PT[l]);

/** Altura da nota natural dentro da oitava, em semitons. */
const NATURAL_PITCH: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** -2 = dobrado bemol … +2 = dobrado sustenido */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export const ACCIDENTAL_SIGN: Record<Accidental, string> = {
  [-2]: "♭♭",
  [-1]: "♭",
  0: "",
  1: "♯",
  2: "♯♯",
};

export const ACCIDENTAL_NAME: Record<Accidental, string> = {
  [-2]: "dobrado bemol",
  [-1]: "bemol",
  0: "natural",
  1: "sustenido",
  2: "dobrado sustenido",
};

export type Note = {
  letter: Letter;
  accidental: Accidental;
  /** Oitava científica: o dó central é 4. */
  octave: number;
};

export type StaffPosition = {
  slot: number;
  kind: "line" | "space";
  label: string;
};

export function note(letter: Letter, accidental: Accidental = 0, octave = 4): Note {
  return { letter, accidental, octave };
}

/** Grau diatônico absoluto (Dó4 = 0). */
export function step(n: Note): number {
  return LETTERS.indexOf(n.letter) + (n.octave - 4) * 7;
}

/** Altura absoluta em semitons (Dó4 = 0). Pode ser negativa/acima de 12. */
export function pitch(n: Note): number {
  return NATURAL_PITCH[n.letter] + n.accidental + (n.octave - 4) * 12;
}

/** Número MIDI oficial (Dó4 = 60). */
export function midiNumber(n: Note): number {
  return 60 + pitch(n);
}

/** Altura dentro da oitava, 0–11. */
export function pitchClass(n: Note): number {
  return ((pitch(n) % 12) + 12) % 12;
}

/** "Dó", "Fá♯" — nome curto, do jeito que se lê em voz alta. */
export function noteName(n: Note): string {
  return LETTER_PT[n.letter] + ACCIDENTAL_SIGN[n.accidental];
}

/** "Fá sustenido" — para leitores de tela e textos corridos. */
export function noteNameSpoken(n: Note): string {
  return n.accidental === 0
    ? LETTER_PT[n.letter]
    : `${LETTER_PT[n.letter]} ${ACCIDENTAL_NAME[n.accidental]}`;
}

/** "Dó4" — identificador único e estável, usado nas chaves de erro. */
export function noteId(n: Note): string {
  const acc = n.accidental > 0 ? "#".repeat(n.accidental) : "b".repeat(-n.accidental);
  return `${n.letter}${acc}${n.octave}`;
}

export function parseNoteId(id: string): Note | null {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d)$/.exec(id);
  if (!m) return null;
  const [, letter, acc = "", octave] = m;
  const accidental = (acc ? (acc.startsWith("#") ? acc.length : -acc.length) : 0) as Accidental;
  return { letter: letter as Letter, accidental, octave: Number(octave) };
}

export function sameNote(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.accidental === b.accidental && a.octave === b.octave;
}

/* ==========================================================================
   Posição no pentagrama — clave de sol
   ========================================================================== */

/**
 * `slot` = posição vertical na pauta, contando de meio em meio grau a partir
 * da 1ª linha (a de baixo).
 *
 *   slot 0 = 1ª linha    → Mi4        slot 5 = 3º espaço  → Dó5
 *   slot 1 = 1º espaço   → Fá4        slot 6 = 4ª linha   → Ré5
 *   slot 2 = 2ª linha    → Sol4       slot 7 = 4º espaço  → Mi5
 *   slot 3 = 2º espaço   → Lá4        slot 8 = 5ª linha   → Fá5
 *   slot 4 = 3ª linha    → Si4        slot 9 = acima      → Sol5
 *
 * Slots pares caem em linha, ímpares em espaço. Abaixo de 0 e acima de 8 a
 * nota sai da pauta e pode precisar de linha suplementar.
 */
export const TREBLE_BOTTOM_STEP = step(note("E", 0, 4)); // Mi4

export function slotOf(n: Note): number {
  return step(n) - TREBLE_BOTTOM_STEP;
}

export function noteAtSlot(slot: number): Note {
  const absStep = slot + TREBLE_BOTTOM_STEP;
  const letter = LETTERS[((absStep % 7) + 7) % 7];
  const octave = 4 + Math.floor(absStep / 7);
  return { letter, accidental: 0, octave };
}

export function isOnLine(slot: number): boolean {
  return slot % 2 === 0;
}

/** Linhas suplementares necessárias para desenhar a nota (em slots pares). */
export function ledgerSlots(slot: number): number[] {
  const out: number[] = [];
  if (slot <= -2) for (let s = -2; s >= slot; s -= 2) out.push(s);
  if (slot >= 10) for (let s = 10; s <= slot; s += 2) out.push(s);
  return out;
}

const ORDINAL = ["1ª", "2ª", "3ª", "4ª", "5ª"];
const ORDINAL_M = ["1º", "2º", "3º", "4º"];

/**
 * A posição na pauta, guardada como artigo + substantivo.
 *
 * Separar as duas partes existe por causa do português: a mesma posição precisa
 * aparecer como "**no** 3º espaço" (com preposição) e como "**o** 3º espaço"
 * (sujeito da frase). Montar as duas formas de uma descrição já flexionada
 * daria concordância errada.
 */
type Place = { article: "a" | "o"; noun: string };

function place(slot: number): Place {
  if (slot >= 0 && slot <= 8) {
    return isOnLine(slot)
      ? { article: "a", noun: `${ORDINAL[slot / 2]} linha` }
      : { article: "o", noun: `${ORDINAL_M[(slot - 1) / 2]} espaço` };
  }
  if (slot === 9) return { article: "o", noun: "espaço acima da 5ª linha" };
  if (slot === -1) return { article: "o", noun: "espaço abaixo da 1ª linha" };
  if (slot <= -2) return { article: "a", noun: "linha suplementar abaixo da pauta" };
  return { article: "a", noun: "linha suplementar acima da pauta" };
}

/** Com preposição: "na 2ª linha", "no 3º espaço". */
export function slotDescription(slot: number): string {
  const p = place(slot);
  return `${p.article === "a" ? "na" : "no"} ${p.noun}`;
}

/** Como sujeito: "a 2ª linha", "o 3º espaço". */
export function slotSubject(slot: number): string {
  const p = place(slot);
  return `${p.article} ${p.noun}`;
}

/** Sem artigo: "2ª linha", "3º espaço" — para rótulos e tabelas. */
export function slotNoun(slot: number): string {
  return place(slot).noun;
}

export function staffPosition(n: Note): StaffPosition {
  const slot = slotOf(n);
  return { slot, kind: isOnLine(slot) ? "line" : "space", label: slotNoun(slot) };
}

export function adjacentNatural(n: Note, direction: -1 | 1): Note {
  const current = step(n);
  const target = current + direction;
  const letter = LETTERS[((target % 7) + 7) % 7];
  return { letter, accidental: 0, octave: 4 + Math.floor(target / 7) };
}

export function semitonesBetween(a: Note, b: Note): number {
  return Math.abs(pitch(b) - pitch(a));
}

/* ==========================================================================
   Conjunto de estudo da V1 — notas naturais do Dó central ao Sol5
   ========================================================================== */

/**
 * Doze notas naturais que cobrem toda a pauta de clave de sol mais o dó
 * central. Só o Dó4 usa linha suplementar, o que mantém a leitura acessível
 * para quem está começando.
 */
export const READING_RANGE: Note[] = Array.from({ length: 12 }, (_, i) => noteAtSlot(i - 2));

/** Dica de memorização por nota — o "porquê" que aparece na correção. */
export const NOTE_HINTS: Record<string, string> = {
  C4: "O dó central mora embaixo da pauta, na sua própria linha suplementar. É a nota que liga a clave de sol à clave de fá — por isso vive na fronteira.",
  D4: "Ré4 fica pendurado no espaço logo abaixo da 1ª linha, como se estivesse apoiado nela.",
  E4: "Mi4 é a nota da 1ª linha, a de baixo. Guarde: a pauta da clave de sol começa no Mi.",
  F4: "Fá4 é o 1º espaço, entre a 1ª e a 2ª linha — o primeiro vão que você encontra subindo.",
  G4: "Sol4 é a 2ª linha, exatamente onde a espiral da clave de sol se enrola. A clave aponta para o seu próprio nome.",
  A4: "Lá4 é o 2º espaço. Fica logo acima da linha da clave (Sol).",
  B4: "Si4 é a 3ª linha, a do meio da pauta. Um bom ponto de referência: no centro está o Si.",
  C5: "Dó5 é o 3º espaço, logo acima da linha central. É uma oitava acima do dó central.",
  D5: "Ré5 é a 4ª linha, a penúltima subindo.",
  E5: "Mi5 é o 4º espaço, o último vão dentro da pauta. Note que a pauta começa e termina em Mi.",
  F5: "Fá5 é a 5ª linha, a de cima. A pauta vai do Mi (embaixo) ao Fá (em cima).",
  G5: "Sol5 fica no espaço acima da 5ª linha, apoiado sobre ela.",
};

/** Mnemônicos gerais, mostrados junto às correções de leitura. */
export const READING_MNEMONICS = [
  {
    title: "As cinco linhas, de baixo para cima",
    body: "Mi · Sol · Si · Ré · Fá — a frase que resolve metade da leitura.",
  },
  {
    title: "Os quatro espaços, de baixo para cima",
    body: "Fá · Lá · Dó · Mi — o que sobra entre as linhas.",
  },
  {
    title: "A clave mostra o caminho",
    body: "A espiral da clave de sol se enrola na 2ª linha justamente porque ali é o Sol. Achando o Sol, você conta o resto.",
  },
];
