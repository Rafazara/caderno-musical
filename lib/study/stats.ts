/**
 * Estatísticas derivadas.
 *
 * Nada aqui é persistido: tudo sai da lista de tentativas. Isso mantém o
 * localStorage simples e garante que os números nunca fiquem inconsistentes
 * com o histórico.
 */

import { type Attempt, type ModuleId, type StudyState } from "@/lib/storage/types";
import { dayKey, daysBetween, pct } from "@/lib/utils";

export type Tally = { total: number; correct: number; accuracy: number };

function tally(attempts: Attempt[]): Tally {
  const correct = attempts.filter((a) => a.correct).length;
  return { total: attempts.length, correct, accuracy: pct(correct, attempts.length) };
}

export type Overview = {
  overall: Tally;
  byModule: Record<ModuleId, Tally>;
  /** Tentativas feitas hoje. */
  today: Tally;
  /** Itens aguardando revisão. */
  pendingErrors: number;
  streak: number;
  longestStreak: number;
  daysStudied: number;
};

export function overview(state: StudyState, streak: number): Overview {
  const today = dayKey();
  return {
    overall: tally(state.attempts),
    byModule: {
      leitura: tally(state.attempts.filter((a) => a.module === "leitura")),
      escalas: tally(state.attempts.filter((a) => a.module === "escalas")),
      intervalos: tally(state.attempts.filter((a) => a.module === "intervalos")),
      ouvido: tally(state.attempts.filter((a) => a.module === "ouvido")),
      "intervalos-musicais": tally(state.attempts.filter((a) => a.module === "intervalos-musicais")),
      ritmo: tally(state.attempts.filter((a) => a.module === "ritmo")),
      acordes: tally(state.attempts.filter((a) => a.module === "acordes")),
      harmonia: tally(state.attempts.filter((a) => a.module === "harmonia")),
    },
    today: tally(state.attempts.filter((a) => dayKey(new Date(a.ts)) === today)),
    pendingErrors: Object.keys(state.errors).length,
    streak,
    longestStreak: state.longestStreak,
    daysStudied: state.studyDays.length,
  };
}

/** Itens mais errados de um módulo, do pior para o melhor. */
export type ItemStat = {
  itemKey: string;
  label: string;
  total: number;
  misses: number;
  accuracy: number;
};

export function worstItems(
  attempts: Attempt[],
  module: ModuleId,
  labelFor: (itemKey: string) => string,
  limit = 6,
): ItemStat[] {
  const groups = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (a.module !== module) continue;
    const list = groups.get(a.itemKey) ?? [];
    list.push(a);
    groups.set(a.itemKey, list);
  }

  return [...groups.entries()]
    .map(([itemKey, list]) => {
      const misses = list.filter((a) => !a.correct).length;
      return {
        itemKey,
        label: labelFor(itemKey),
        total: list.length,
        misses,
        accuracy: pct(list.length - misses, list.length),
      };
    })
    .filter((s) => s.misses > 0)
    .sort((a, b) => b.misses - a.misses || a.accuracy - b.accuracy)
    .slice(0, limit);
}

/** Atividade dos últimos `days` dias, do mais antigo para o mais recente. */
export type DayBucket = { day: string; total: number; correct: number };

export function recentActivity(attempts: Attempt[], days = 14): DayBucket[] {
  const today = dayKey();
  const buckets = new Map<string, DayBucket>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    buckets.set(key, { day: key, total: 0, correct: 0 });
  }

  for (const a of attempts) {
    const key = dayKey(new Date(a.ts));
    if (daysBetween(key, today) >= days) continue;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total++;
    if (a.correct) bucket.correct++;
  }

  return [...buckets.values()];
}

/** Últimos módulos praticados, do mais recente para o mais antigo, sem repetir. */
export function recentModules(attempts: Attempt[], limit = 3): Array<{ module: ModuleId; ts: number }> {
  const seen = new Set<ModuleId>();
  const out: Array<{ module: ModuleId; ts: number }> = [];
  for (let i = attempts.length - 1; i >= 0 && out.length < limit; i--) {
    const a = attempts[i];
    if (seen.has(a.module)) continue;
    seen.add(a.module);
    out.push({ module: a.module, ts: a.ts });
  }
  return out;
}
