/**
 * Exercícios de leitura de notas em clave de sol.
 *
 * A chave do item é o próprio identificador da nota ("G4"), o que torna a
 * reconstrução trivial e faz a estatística "notas que mais erro" cair de
 * graça: cada nota é um item distinto.
 */

import {
  LETTER_PT,
  NATURALS_PT,
  NOTE_HINTS,
  type Note,
  noteId,
  noteName,
  parseNoteId,
  READING_RANGE,
  slotDescription,
  slotNoun,
  slotOf,
  slotSubject,
} from "@/lib/music/notes";
import type { Question, Rehydrator } from "@/lib/study/question";
import { sampleMany } from "@/lib/utils";

const OPTIONS = NATURALS_PT; // Dó … Si, sempre na mesma ordem
export const READING_SESSION_SIZE = 10;

function explainFor(target: Note) {
  return (given: string): ReturnType<Question["explain"]> => {
    const slot = slotOf(target);
    const name = noteName(target);
    const correct = given === name;

    return {
      headline: correct ? `É o ${name}.` : `Era ${name}, não ${given}.`,
      reason: `A cabeça de nota está ${slotDescription(slot)}. Em clave de sol, ${slotSubject(slot)} é o ${name}.`,
      tip: NOTE_HINTS[noteId(target)],
    };
  };
}

function toQuestion(target: Note): Question {
  return {
    key: noteId(target),
    module: "leitura",
    prompt: "Qual é esta nota?",
    itemLabel: `${noteName(target)} · ${slotNoun(slotOf(target))}`,
    options: OPTIONS,
    answer: LETTER_PT[target.letter],
    visual: { kind: "note", note: target },
    explain: explainFor(target),
  };
}

/** Sessão curta com notas sorteadas do conjunto de estudo. */
export function buildReadingSession(size = READING_SESSION_SIZE): Question[] {
  return sampleMany(READING_RANGE, size).map(toQuestion);
}

/**
 * Sessão focada num subconjunto — usada quando o aluno quer treinar só as
 * notas dentro da pauta, ou só as que saem dela.
 */
export function buildReadingSessionFrom(notes: Note[], size = READING_SESSION_SIZE): Question[] {
  return sampleMany(notes, size).map(toQuestion);
}

export const rehydrateReading: Rehydrator = (key) => {
  const target = parseNoteId(key);
  if (!target) return null;
  return toQuestion(target);
};

/** Recortes de prática oferecidos na página. */
export const READING_SCOPES = [
  {
    id: "todas",
    label: "Todas as notas",
    hint: "Do dó central ao sol acima da pauta — 12 notas.",
    notes: READING_RANGE,
  },
  {
    id: "linhas",
    label: "Só as linhas",
    hint: "Mi · Sol · Si · Ré · Fá — as cinco notas sobre as linhas.",
    notes: READING_RANGE.filter((n) => {
      const s = slotOf(n);
      return s >= 0 && s <= 8 && s % 2 === 0;
    }),
  },
  {
    id: "espacos",
    label: "Só os espaços",
    hint: "Fá · Lá · Dó · Mi — as quatro notas nos vãos.",
    notes: READING_RANGE.filter((n) => {
      const s = slotOf(n);
      return s >= 0 && s <= 8 && s % 2 === 1;
    }),
  },
  {
    id: "fora",
    label: "Fora da pauta",
    hint: "Dó central, Ré4 e Sol5 — as que exigem contar para fora.",
    notes: READING_RANGE.filter((n) => {
      const s = slotOf(n);
      return s < 0 || s > 8;
    }),
  },
] as const;

export type ReadingScopeId = (typeof READING_SCOPES)[number]["id"];
