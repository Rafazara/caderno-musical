import {
  analyzeInterval,
  constructInterval,
  MUSICAL_INTERVALS,
} from "@/lib/music/intervals";
import { noteId, noteName, parseNoteId } from "@/lib/music/notes";
import type { Question, Rehydrator } from "@/lib/study/question";
const roots = ["C4", "D4", "E4", "F4", "G4"];
export function intervalQuestion(
  rootId: string,
  targetId: string,
  kind: "number" | "identify" | "ear" = "identify",
): Question | null {
  const root = parseNoteId(rootId),
    target = parseNoteId(targetId);
  if (!root || !target) return null;
  const analyzed = analyzeInterval(root, target);
  if (!analyzed) return null;
  const answer = kind === "number" ? `${analyzed.number}ª` : analyzed.shortName;
  const options =
    kind === "number"
      ? ["1ª", "2ª", "3ª", "4ª", "5ª", "8ª"]
      : MUSICAL_INTERVALS.map((item) => item.shortName);
  return {
    key: `interval:${kind}:${noteId(root)}:${noteId(target)}`,
    module: "intervalos-musicais",
    prompt:
      kind === "number"
        ? "Qual é o número deste intervalo?"
        : kind === "ear"
          ? "Qual intervalo você ouviu?"
          : "Qual intervalo está representado?",
    itemLabel: `${noteName(root)} → ${noteName(target)} · ${analyzed.name}`,
    options,
    answer,
    visual: { kind: "musicalInterval", root, target },
    explain: (given) => ({
      headline: given === answer ? "Correto." : `A resposta é ${answer}.`,
      reason: `Contamos ${analyzed.number} nomes de notas e medimos ${analyzed.semitones} semitons: ${analyzed.name}.`,
      tip: "Número vem das letras; qualidade vem da distância real.",
    }),
  };
}
export const rehydrateMusicalInterval: Rehydrator = (key) => {
  const [prefix, kind, root, target] = key.split(":");
  return prefix === "interval" &&
    (kind === "number" || kind === "identify" || kind === "ear")
    ? intervalQuestion(root, target, kind)
    : null;
};
export function buildMusicalIntervalSession(size = 10) {
  const examples = roots
    .flatMap((root) =>
      MUSICAL_INTERVALS.filter((item) => item.id !== "P8").map((item) => {
        const rootNote = parseNoteId(root)!;
        return intervalQuestion(
          root,
          noteId(constructInterval(rootNote, item.id)),
          "identify",
        );
      }),
    )
    .filter((q): q is Question => Boolean(q));
  return Array.from({ length: size }, (_, i) => examples[i % examples.length]);
}
