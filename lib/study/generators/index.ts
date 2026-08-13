import type { ModuleId } from "@/lib/storage/types";
import type { Question, Rehydrator } from "@/lib/study/question";
import { rehydrateReading } from "./reading";
import { rehydrateScale } from "./scales";
import { rehydrateInterval } from "./intervals";
import { rehydrateEar } from "./ear";
import { rehydrateMusicalInterval } from "./musical-intervals";
import { rehydrateRhythm } from "./rhythm";
import { rehydrateChord } from "./chords";
import { rehydrateHarmony } from "./harmony";

/**
 * Reconstrói questões a partir da chave persistida.
 *
 * É o que permite que a revisão de erros funcione sem guardar as questões
 * inteiras no localStorage: basta a chave do item, e o módulo sabe remontar o
 * enunciado, as alternativas e a explicação.
 */
export const REHYDRATORS: Record<ModuleId, Rehydrator> = {
  leitura: rehydrateReading,
  escalas: rehydrateScale,
  intervalos: rehydrateInterval,
  ouvido: rehydrateEar,
  "intervalos-musicais": rehydrateMusicalInterval,
  ritmo: rehydrateRhythm,
  acordes: rehydrateChord,
  harmonia: rehydrateHarmony,
};

export function rehydrate(module: ModuleId, key: string): Question | null {
  try {
    return REHYDRATORS[module]?.(key) ?? null;
  } catch {
    // Chave de uma versão antiga do app: ignora em vez de derrubar a tela.
    return null;
  }
}

/** Rótulo legível de um item, para as estatísticas. */
export function labelForItem(module: ModuleId, key: string): string {
  return rehydrate(module, key)?.itemLabel ?? key;
}

export {
  buildReadingSession,
  buildReadingSessionFrom,
  READING_SCOPES,
  READING_SESSION_SIZE,
} from "./reading";
export { buildScaleSession, SCALE_SESSION_SIZE } from "./scales";
export {
  buildIntervalSession,
  buildNaturalIntervalSession,
  INTERVAL_SCOPES,
  INTERVAL_SESSION_SIZE,
} from "./intervals";
