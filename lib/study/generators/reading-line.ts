import { READING_RANGE, type Note, noteId } from "@/lib/music/notes";
import type { ErrorItem } from "@/lib/storage/types";

export const LINE_SIZES = { curta: 5, normal: 8, intensiva: 12 } as const;
export type LineSizeId = keyof typeof LINE_SIZES;

function weightedPick(pool: Note[], errors: Record<string, ErrorItem>): Note {
  const weights = pool.map((note) => 1 + Math.min(errors[noteId(note)]?.misses ?? 0, 5) * 0.16);
  let cursor = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < pool.length; index++) {
    cursor -= weights[index];
    if (cursor <= 0) return pool[index];
  }
  return pool[pool.length - 1];
}

function createsPredictableRun(notes: Note[], candidate: Note): boolean {
  if (notes.length < 2) return false;
  const ids = [...notes.slice(-2), candidate].map((note) => READING_RANGE.findIndex((n) => noteId(n) === noteId(note)));
  return ids[1] - ids[0] === ids[2] - ids[1] && Math.abs(ids[1] - ids[0]) === 1;
}

/** Sorteio variado, com reforço discreto das notas presentes na fila global. */
export function buildReadingLine(size: number, errors: Record<string, ErrorItem>): Note[] {
  const result: Note[] = [];
  while (result.length < size) {
    let candidate = weightedPick(READING_RANGE, errors);
    for (let retry = 0; retry < 8; retry++) {
      const repeated = noteId(result[result.length - 1] ?? candidate) === noteId(candidate);
      if (!repeated && !createsPredictableRun(result, candidate)) break;
      candidate = weightedPick(READING_RANGE, errors);
    }
    result.push(candidate);
  }
  return result;
}

export function buildErrorReviewLine(wrong: Note[]): Note[] {
  if (wrong.length === 0) return [];
  const size = Math.min(Math.max(wrong.length * 2, 3), 8);
  return Array.from({ length: size }, (_, index) => wrong[index % wrong.length])
    .map((value) => ({ value, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ value }) => value);
}
