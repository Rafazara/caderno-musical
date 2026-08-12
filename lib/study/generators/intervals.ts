/**
 * Exercícios de tom e semitom.
 *
 * Só duas alternativas — Tom ou Semitom — de propósito: a decisão é binária, e
 * o valor do exercício está na explicação que vem depois, não na dificuldade
 * de escolher.
 */

import {
  explainPair,
  INTERVAL_BANK,
  type IntervalPair,
  findPair,
  pairLabel,
} from "@/lib/music/intervals";
import type { Question, Rehydrator } from "@/lib/study/question";
import { sampleMany } from "@/lib/utils";

const OPTIONS = ["Tom", "Semitom"];
export const INTERVAL_SESSION_SIZE = 10;

function toQuestion(pair: IntervalPair): Question {
  const answer = pair.answer === "semitom" ? "Semitom" : "Tom";

  return {
    key: pair.id,
    module: "intervalos",
    prompt: `Qual é a distância de ${pairLabel(pair)}?`,
    itemLabel: pairLabel(pair),
    options: OPTIONS,
    answer,
    visual: { kind: "interval", pair },
    explain: (given) => {
      const base = explainPair(pair);
      const correct = given === answer;
      return {
        headline: correct ? base.headline : `${base.headline} Você respondeu ${given}.`,
        reason: base.reason,
        tip: base.tip,
      };
    },
  };
}

/** O banco só contém pares de tom ou semitom, então toda questão é respondível. */
const PRACTICABLE = INTERVAL_BANK.filter((p) => p.answer !== "outro");

export function buildIntervalSession(size = INTERVAL_SESSION_SIZE): Question[] {
  return sampleMany(PRACTICABLE, size).map(toQuestion);
}

/** Só pares de notas naturais — o recorte inicial, sem alterações. */
export function buildNaturalIntervalSession(size = INTERVAL_SESSION_SIZE): Question[] {
  return sampleMany(
    PRACTICABLE.filter((p) => !p.hasAccidental),
    size,
  ).map(toQuestion);
}

export const rehydrateInterval: Rehydrator = (key) => {
  const pair = findPair(key);
  return pair && pair.answer !== "outro" ? toQuestion(pair) : null;
};

export const INTERVAL_SCOPES = [
  {
    id: "naturais",
    label: "Notas naturais",
    hint: "Só as sete notas, subindo e descendo. É aqui que Mi–Fá e Si–Dó se revelam.",
    build: buildNaturalIntervalSession,
  },
  {
    id: "todas",
    label: "Com sustenidos e bemóis",
    hint: "Inclui teclas pretas — mostra que qualquer vizinha é semitom.",
    build: buildIntervalSession,
  },
] as const;

export type IntervalScopeId = (typeof INTERVAL_SCOPES)[number]["id"];
