"use client";

import * as React from "react";
import { KEYS } from "@/lib/storage/local";
import { usePersistentState } from "@/lib/storage/use-persistent-state";
import {
  type Attempt,
  EMPTY_STUDY_STATE,
  emptyStudyState,
  type ErrorItem,
  MASTERY_STREAK,
  MAX_ATTEMPTS,
  type ModuleId,
  type StudyState,
} from "@/lib/storage/types";
import { dayKey, daysBetween, uid } from "@/lib/utils";
import { earDifficultyResolved } from "@/lib/ear/review";

/** O que se sabe de uma resposta no momento em que ela é registrada. */
export type RecordInput = {
  module: ModuleId;
  itemKey: string;
  /** Texto legível do item, para listar na revisão de erros. */
  prompt: string;
  correct: boolean;
  given: string;
  expected: string;
};

type StudyContextValue = {
  state: StudyState;
  ready: boolean;
  error: string | null;
  /** Registra uma resposta e atualiza erros, sequência de dias e último tópico. */
  record: (input: RecordInput) => void;
  /** Marca a escala como praticada. */
  markScalePracticed: (scaleId: string) => void;
  setLastTopic: (topic: { href: string; label: string }) => void;
  /** Remove um item da lista de revisão manualmente. */
  forgetError: (itemKey: string) => void;
  resetProgress: () => void;
};

const StudyContext = React.createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const { value, set, ready, error } = usePersistentState<StudyState>(
    KEYS.study,
    EMPTY_STUDY_STATE,
  );

  const record = React.useCallback(
    (input: RecordInput) => {
      set((prev) => {
        const now = Date.now();
        const attempt: Attempt = { id: uid(), ts: now, ...input };

        // Histórico limitado: mantém as mais recentes.
        const attempts = [...prev.attempts, attempt].slice(-MAX_ATTEMPTS);

        const errors = { ...prev.errors };
        const existing = errors[input.itemKey];

        if (input.correct) {
          if (existing) {
            const streak = existing.streak + 1;
            if (input.module === "ouvido" ? earDifficultyResolved(streak) : streak >= MASTERY_STREAK) {
              // Dominado de novo: sai da fila de revisão.
              delete errors[input.itemKey];
            } else {
              errors[input.itemKey] = { ...existing, streak, lastSeenTs: now };
            }
          }
        } else {
          const next: ErrorItem = existing
            ? {
                ...existing,
                prompt: input.prompt,
                expected: input.expected,
                misses: existing.misses + 1,
                streak: 0,
                lastMissTs: now,
                lastSeenTs: now,
              }
            : {
                itemKey: input.itemKey,
                module: input.module,
                prompt: input.prompt,
                expected: input.expected,
                misses: 1,
                streak: 0,
                lastMissTs: now,
                lastSeenTs: now,
              };
          errors[input.itemKey] = next;
        }

        // Sequência de dias: acrescenta o dia de hoje se ainda não estiver lá.
        const today = dayKey();
        const studyDays = prev.studyDays.includes(today)
          ? prev.studyDays
          : [...prev.studyDays, today].sort();

        const longestStreak = Math.max(prev.longestStreak, currentStreak(studyDays));

        return { ...prev, attempts, errors, studyDays, longestStreak };
      });
    },
    [set],
  );

  const markScalePracticed = React.useCallback(
    (scaleId: string) => {
      set((prev) =>
        prev.scalesPracticed.includes(scaleId)
          ? prev
          : { ...prev, scalesPracticed: [...prev.scalesPracticed, scaleId] },
      );
    },
    [set],
  );

  const setLastTopic = React.useCallback(
    (topic: { href: string; label: string }) => {
      set((prev) =>
        prev.lastTopic?.href === topic.href
          ? prev
          : { ...prev, lastTopic: { ...topic, ts: Date.now() } },
      );
    },
    [set],
  );

  const forgetError = React.useCallback(
    (itemKey: string) => {
      set((prev) => {
        if (!prev.errors[itemKey]) return prev;
        const errors = { ...prev.errors };
        delete errors[itemKey];
        return { ...prev, errors };
      });
    },
    [set],
  );

  const resetProgress = React.useCallback(() => set(emptyStudyState()), [set]);

  const contextValue = React.useMemo<StudyContextValue>(
    () => ({
      state: value,
      ready,
      error,
      record,
      markScalePracticed,
      setLastTopic,
      forgetError,
      resetProgress,
    }),
    [value, ready, error, record, markScalePracticed, setLastTopic, forgetError, resetProgress],
  );

  return <StudyContext.Provider value={contextValue}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const ctx = React.useContext(StudyContext);
  if (!ctx) throw new Error("useStudy precisa estar dentro de <StudyProvider>.");
  return ctx;
}

/**
 * Dias consecutivos de estudo até hoje.
 * Se o último dia registrado foi ontem, a sequência continua viva — quebra só
 * quando passa um dia inteiro sem estudar.
 */
export function currentStreak(studyDays: string[]): number {
  if (studyDays.length === 0) return 0;
  const days = [...studyDays].sort();
  const today = dayKey();
  const last = days[days.length - 1];

  const gap = daysBetween(last, today);
  if (gap > 1) return 0;

  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (daysBetween(days[i - 1], days[i]) === 1) streak++;
    else break;
  }
  return streak;
}

/** Registra a visita a um tópico — usado pelo botão "Continuar estudando". */
export function useTrackTopic(href: string, label: string) {
  const { setLastTopic, ready } = useStudy();
  React.useEffect(() => {
    if (ready) setLastTopic({ href, label });
  }, [ready, href, label, setLastTopic]);
}
