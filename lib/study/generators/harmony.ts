import {
  buildMajorKeyHarmony,
  buildProgression,
  progressionSymbols,
} from "@/lib/music/harmony";
import { parseNoteId } from "@/lib/music/notes";
import type { Question, Rehydrator } from "@/lib/study/question";
type Kind =
  | "degree-quality"
  | "degree-chord"
  | "roman"
  | "function"
  | "transpose";
const TONICS = ["C4", "G4", "F4", "D4"];
export function harmonyQuestion(
  tonicId: string,
  degree: number,
  kind: Kind,
): Question | null {
  const tonic = parseNoteId(tonicId);
  if (!tonic || degree < 1 || degree > 7) return null;
  const harmony = buildMajorKeyHarmony(tonic),
    item = harmony.degrees[degree - 1];
  let prompt = "",
    answer = "",
    options: string[] = [];
  if (kind === "degree-quality") {
    prompt = `Em ${harmony.name}, qual é a qualidade do ${degree}º grau?`;
    answer =
      item.triad.quality === "major"
        ? "Maior"
        : item.triad.quality === "minor"
          ? "Menor"
          : "Diminuto";
    options = ["Maior", "Menor", "Diminuto"];
  } else if (kind === "degree-chord") {
    prompt = `Qual acorde nasce sobre o ${degree}º grau de ${harmony.name}?`;
    answer = item.triad.symbol;
    options = harmony.degrees
      .map((d) => d.triad.symbol)
      .slice(Math.max(0, degree - 2), Math.max(0, degree - 2) + 3);
    if (!options.includes(answer)) options[0] = answer;
  } else if (kind === "roman") {
    prompt = `Qual numeral representa ${item.triad.symbol} em ${harmony.name}?`;
    answer = item.roman;
    options = ["III", "IV", "V", item.roman];
  } else if (kind === "function") {
    prompt = `Qual função inicial associamos principalmente a ${item.roman} em ${harmony.name}?`;
    answer = item.functionLabel;
    options = [
      "área tônica",
      "predominante / subdominante inicial",
      "dominante",
      "comportamento contextual",
    ];
  } else {
    const progression = buildProgression(harmony, "I-IV-V-I");
    prompt = `Como I–IV–V–I aparece em ${harmony.name}?`;
    answer = progressionSymbols(progression).join(" – ");
    options = [answer, "C – F – G – C", "G – D – C – G"];
  }
  return {
    key: `harmony:${kind}:${tonicId}:${degree}`,
    module: "harmonia",
    prompt,
    itemLabel: `${harmony.name} · ${item.roman}`,
    options: [...new Set(options)],
    answer,
    visual: { kind: "chord", notes: item.triad.pitches },
    explain: (given) => ({
      headline: given === answer ? "Correto." : `A resposta é ${answer}.`,
      reason: `O grau ${item.roman} nasce de ${item.triad.pitches.map((n) => n.letter).join("–")} e sua qualidade é calculada pelas notas reais da escala.`,
      tip: "Cifra nomeia o acorde; numeral descreve sua posição na tonalidade.",
    }),
  };
}
export const rehydrateHarmony: Rehydrator = (key) => {
  const [prefix, kind, tonic, degree] = key.split(":");
  return prefix === "harmony" &&
    [
      "degree-quality",
      "degree-chord",
      "roman",
      "function",
      "transpose",
    ].includes(kind)
    ? harmonyQuestion(tonic, Number(degree), kind as Kind)
    : null;
};
export function buildHarmonySession(size = 10) {
  const bank = TONICS.flatMap((tonic) =>
    [1, 2, 4, 5, 6, 7].flatMap((degree) =>
      (
        [
          "degree-quality",
          "degree-chord",
          "roman",
          "function",
          "transpose",
        ] as Kind[]
      ).map((kind) => harmonyQuestion(tonic, degree, kind)),
    ),
  ).filter((q): q is Question => Boolean(q));
  return Array.from({ length: size }, (_, i) => bank[(i * 7) % bank.length]);
}
