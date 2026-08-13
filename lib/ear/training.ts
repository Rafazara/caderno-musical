import {
  note,
  noteId,
  parseNoteId,
  pitch,
  semitonesBetween,
  type Note,
} from "@/lib/music/notes";
import type { Attempt } from "@/lib/storage/types";
export type EarSkill = "pitch-direction" | "melody" | "relative-note" | "step";
export type EarExercise = {
  key: string;
  skill: EarSkill;
  notes: Note[];
  answer: string;
  options: string[];
};
const NATURALS = [
  note("C"),
  note("D"),
  note("E"),
  note("F"),
  note("G"),
  note("A"),
  note("B"),
  note("C", 0, 5),
];
export function direction(a: Note, b: Note) {
  return pitch(b) > pitch(a)
    ? "Mais aguda"
    : pitch(b) < pitch(a)
      ? "Mais grave"
      : "Igual";
}
export function encodeEar(skill: EarSkill, notes: Note[]) {
  return `ear:${skill}:${notes.map(noteId).join(":")}`;
}
export function decodeEar(key: string): EarExercise | null {
  const [prefix, skill, ...ids] = key.split(":");
  if (
    prefix !== "ear" ||
    !["pitch-direction", "melody", "relative-note", "step"].includes(skill)
  )
    return null;
  const notes = ids.map(parseNoteId);
  if (notes.some((n) => !n)) return null;
  return makeExercise(skill as EarSkill, notes as Note[]);
}
export function makeExercise(skill: EarSkill, notes: Note[]): EarExercise {
  let answer = "";
  let options: string[] = [];
  if (skill === "pitch-direction") {
    answer = direction(notes[0], notes[1]);
    options = ["Mais grave", "Igual", "Mais aguda"];
  } else if (skill === "melody") {
    const moves = notes
      .slice(1)
      .map((n, i) => Math.sign(pitch(n) - pitch(notes[i])));
    answer = moves.every((v) => v > 0)
      ? "Subiu"
      : moves.every((v) => v < 0)
        ? "Desceu"
        : moves.every((v) => v === 0)
          ? "Permaneceu"
          : "Mudou de direção";
    options = ["Subiu", "Desceu", "Permaneceu", "Mudou de direção"];
  } else if (skill === "relative-note") {
    answer = noteId(notes[1]);
    options = NATURALS.slice(0, 5).map(noteId);
  } else {
    answer = semitonesBetween(notes[0], notes[1]) === 1 ? "Semitom" : "Tom";
    options = ["Tom", "Semitom"];
  }
  return { key: encodeEar(skill, notes), skill, notes, answer, options };
}
export function recentSkillAccuracy(attempts: Attempt[], skill: EarSkill) {
  const list = attempts
    .filter(
      (a) => a.module === "ouvido" && a.itemKey.startsWith(`ear:${skill}:`),
    )
    .slice(-20);
  return {
    total: list.length,
    accuracy: list.length
      ? Math.round((list.filter((a) => a.correct).length / list.length) * 100)
      : 0,
  };
}
export function directionDistance(attempts: Attempt[]) {
  const recent = recentSkillAccuracy(attempts, "pitch-direction");
  return recent.total >= 8 && recent.accuracy >= 80
    ? [1, 2]
    : recent.total >= 5 && recent.accuracy >= 65
      ? [2, 3, 4]
      : [4, 5, 7];
}
export function randomExercise(
  skill: EarSkill,
  attempts: Attempt[] = [],
): EarExercise {
  const recentDifficulty=attempts.filter(attempt=>attempt.module==='ouvido'&&!attempt.correct&&attempt.itemKey.startsWith(`ear:${skill}:`)).slice(-6);
  if(recentDifficulty.length&&Math.random()<.3){const rebuilt=decodeEar(recentDifficulty[Math.floor(Math.random()*recentDifficulty.length)].itemKey);if(rebuilt)return rebuilt;}
  if (skill === "pitch-direction") {
    const gaps = directionDistance(attempts);
    if (Math.random() < 1/3) { const same=NATURALS[Math.floor(Math.random()*NATURALS.length)];return makeExercise(skill,[same,same]); }
    const pairs=NATURALS.flatMap((first,i)=>NATURALS.slice(i+1).map(second=>[first,second] as [Note,Note])).filter(([a,b])=>gaps.includes(semitonesBetween(a,b)));
    const pair=pairs[Math.floor(Math.random()*pairs.length)]??[NATURALS[0],NATURALS[4]];
    return makeExercise(skill,Math.random()<.5?pair:[pair[1],pair[0]]);
  }
  if (skill === "melody") {
    const choices = [
      [0, 2],
      [1, 4],
      [4, 1],
      [6, 3],
      [2, 2],
      [5, 5, 5],
      [0, 2, 1],
      [4, 2, 3],
    ];
    return makeExercise(
      skill,
      choices[Math.floor(Math.random() * choices.length)].map(
        (i) => NATURALS[i],
      ),
    );
  }
  if (skill === "relative-note") {
    const count=relativeOptionCount(attempts);
    const target = NATURALS[Math.floor(Math.random() * count)];
    const exercise=makeExercise(skill, [NATURALS[0], target]);
    exercise.options=shuffled(NATURALS.slice(0,count).map(noteId));
    return exercise;
  }
  const pairs = [
    [2, 3],
    [6, 7],
    [0, 1],
    [4, 5],
  ];
  return makeExercise(
    skill,
    pairs[Math.floor(Math.random() * pairs.length)].map((i) => NATURALS[i]),
  );
}
export function relativeOptionCount(attempts:Attempt[]){const evidence=recentSkillAccuracy(attempts,'relative-note');return evidence.total>=12&&evidence.accuracy>=80?7:evidence.total>=6&&evidence.accuracy>=70?5:3;}
function shuffled<T>(values:T[]){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
