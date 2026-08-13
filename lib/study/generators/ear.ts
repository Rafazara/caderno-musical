import { decodeEar } from "@/lib/ear/training";
import { noteName } from "@/lib/music/notes";
import type { Question, Rehydrator } from "@/lib/study/question";
export const rehydrateEar: Rehydrator = (key) => {
  const exercise = decodeEar(key);
  if (!exercise) return null;
  const names = exercise.notes.map((n) => `${noteName(n)}${n.octave}`);
  const answer =
    exercise.skill === "relative-note"
      ? noteName(exercise.notes[1])
      : exercise.answer;
  const options =
    exercise.skill === "relative-note"
      ? exercise.options.map((id) => {
          const n = decodeEar(`ear:relative-note:C4:${id}`)?.notes[1];
          return n ? noteName(n) : id;
        })
      : exercise.options;
  return {
    key,
    module: "ouvido",
    prompt: "Ouça novamente esta dificuldade no módulo Ouvido Musical.",
    itemLabel: names.join(" → "),
    options,
    answer,
    visual: { kind: "none" },
    explain: (given) => ({
      headline: given === answer ? "Correto." : `A resposta é ${answer}.`,
      reason: `A sequência era ${names.join(" → ")}.`,
      tip: `Abra Ouvido Musical para ouvir e comparar novamente.`,
    }),
  } satisfies Question;
};
