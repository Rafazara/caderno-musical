import {
  decodeEar,
  makeExercise,
  type EarExercise,
  type EarSkill,
} from "@/lib/ear/training";
import { note, pitch, type Note } from "@/lib/music/notes";
import type { Attempt, ErrorItem } from "@/lib/storage/types";
export const EAR_REVIEW_STREAK = 4;
export function earDifficultyResolved(streak: number) {
  return streak >= EAR_REVIEW_STREAK;
}
const STEP_FAMILY = [
  [note("E"), note("F")],
  [note("B"), note("C", 0, 5)],
  [note("C"), note("D")],
  [note("G"), note("A")],
  [note("E"), note("F", 1)],
];
const MELODY_FAMILY = [
  [note("C"), note("E")],
  [note("G"), note("D")],
  [note("C"), note("E"), note("D")],
  [note("G"), note("E"), note("F")],
  [note("E"), note("E")],
];
function family(origin: EarExercise): EarExercise[] {
  if (origin.skill === "step")
    return STEP_FAMILY.map((notes) => makeExercise("step", notes));
  if (origin.skill === "melody")
    return MELODY_FAMILY.map((notes) => makeExercise("melody", notes));
  if (origin.skill === "relative-note") {
    const target = origin.notes[1];
    const neighbors = [
      target,
      naturalAtPitch(pitch(target) - 2),
      naturalAtPitch(pitch(target) + 2),
    ].filter((item): item is Note => Boolean(item));
    return neighbors.map((item) =>
      makeExercise("relative-note", [origin.notes[0], item]),
    );
  }
  const distance = Math.max(
    1,
    Math.abs(pitch(origin.notes[1]) - pitch(origin.notes[0])),
  );
  const candidates = [
    [note("C"), note("C")],
    [note("C"), note("G")],
    [note("G"), note("C")],
    [note("D"), note("F")],
    [note("F"), note("A")],
  ];
  return candidates
    .filter(
      ([a, b]) =>
        a === b || Math.abs(pitch(b) - pitch(a)) >= Math.min(2, distance - 1),
    )
    .map((notes) => makeExercise("pitch-direction", notes));
}
function naturalAtPitch(value: number) {
  const pool = [
    note("C"),
    note("D"),
    note("E"),
    note("F"),
    note("G"),
    note("A"),
    note("B"),
    note("C", 0, 5),
  ];
  return pool.sort(
    (a, b) => Math.abs(pitch(a) - value) - Math.abs(pitch(b) - value),
  )[0];
}
export type EarDifficulty = {
  skill: EarSkill;
  label: string;
  originKeys: string[];
  misses: number;
};
const LABEL: Record<EarSkill, string> = {
  "pitch-direction": "Grave / Agudo",
  melody: "Movimento melódico",
  "relative-note": "Reconhecimento relativo",
  step: "Tom × Semitom",
};
export function auditoryDifficulties(
  errors: Record<string, ErrorItem>,
): EarDifficulty[] {
  const grouped = new Map<EarSkill, EarDifficulty>();
  for (const error of Object.values(errors)) {
    if (error.module !== "ouvido") continue;
    const exercise = decodeEar(error.itemKey);
    if (!exercise) continue;
    const current = grouped.get(exercise.skill) ?? {
      skill: exercise.skill,
      label: LABEL[exercise.skill],
      originKeys: [],
      misses: 0,
    };
    current.originKeys.push(error.itemKey);
    current.misses += error.misses;
    grouped.set(exercise.skill, current);
  }
  return [...grouped.values()].sort((a, b) => b.misses - a.misses);
}
export function buildFocusedReview(
  errors: Record<string, ErrorItem>,
  size: number,
): EarExercise[] {
  const origins = Object.values(errors)
    .filter((error) => error.module === "ouvido")
    .map((error) => decodeEar(error.itemKey))
    .filter((item): item is EarExercise => Boolean(item));
  if (!origins.length) return [];
  const pools = origins.map((origin) => family(origin));
  const result: EarExercise[] = [];
  let cursor = 0;
  while (result.length < size) {
    const pool = pools[cursor % pools.length];
    const candidate = pool[Math.floor(cursor / pools.length) % pool.length];
    if (result.at(-1)?.key !== candidate.key) result.push(candidate);
    cursor++;
    if (cursor > size * 10) break;
  }
  return result;
}
export type DerivedEarSession = {
  skill: EarSkill;
  startedAt: number;
  endedAt: number;
  total: number;
  correct: number;
  accuracy: number;
};
export function deriveEarSessions(
  attempts: Attempt[],
  gapMs = 20 * 60_000,
): DerivedEarSession[] {
  const ear = attempts
    .filter((a) => a.module === "ouvido")
    .sort((a, b) => a.ts - b.ts);
  const groups: Attempt[][] = [];
  for (const attempt of ear) {
    const current = groups.at(-1);
    if (!current || attempt.ts - current.at(-1)!.ts > gapMs)
      groups.push([attempt]);
    else current.push(attempt);
  }
  return groups.map((group) => {
    const skills = group
      .map((a) => decodeEar(a.itemKey)?.skill)
      .filter((v): v is EarSkill => Boolean(v));
    const skill =
      skills
        .sort(
          (a, b) =>
            skills.filter((v) => v === a).length -
            skills.filter((v) => v === b).length,
        )
        .at(-1) ?? "pitch-direction";
    const correct = group.filter((a) => a.correct).length;
    return {
      skill,
      startedAt: group[0].ts,
      endedAt: group.at(-1)!.ts,
      total: group.length,
      correct,
      accuracy: Math.round((correct / group.length) * 100),
    };
  });
}
export function comparableImprovement(
  sessions: DerivedEarSession[],
  skill: EarSkill,
) {
  const comparable = sessions
    .filter((s) => s.skill === skill && s.total >= 5)
    .slice(-2);
  if (comparable.length < 2) return null;
  const delta = comparable[1].accuracy - comparable[0].accuracy;
  return Math.abs(delta) >= 8
    ? {
        previous: comparable[0].accuracy,
        current: comparable[1].accuracy,
        delta,
      }
    : null;
}
