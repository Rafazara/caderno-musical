"use client";

import * as React from "react";
import type { Question } from "./question";
import { useStudy } from "./provider";

export type SessionStatus = "answering" | "feedback" | "done";

export type Session = {
  status: SessionStatus;
  questions: Question[];
  index: number;
  current: Question | null;
  /** Resposta dada para a questão atual; null enquanto não respondeu. */
  given: string | null;
  /** Acerto/erro de cada questão já respondida, em ordem. */
  results: boolean[];
  correctCount: number;
  /** Questões erradas nesta sessão — alimenta o "refazer só os erros". */
  wrong: Question[];
  answer: (value: string) => void;
  next: () => void;
  /** Nova sessão com questões novas. */
  restart: () => void;
  /** Repete apenas as erradas desta sessão. */
  retryWrong: () => void;
};

/**
 * Ciclo de uma sessão de prática.
 *
 * As questões nascem de sorteio, e por isso **não podem** ser geradas durante a
 * renderização do servidor — o HTML divergiria do cliente. A solução aqui não é
 * gerar num efeito (o que causaria uma renderização em cascata), e sim garantir
 * que este hook só seja usado por um componente montado depois da hidratação.
 * Quem faz esse controle é o `PracticeRunner`, com `useHydrated()`. Assim o
 * inicializador tardio do `useState` já roda no cliente, uma única vez.
 */
export function useSession({
  build,
  /** Chamado quando a sessão termina — usado para marcar escala praticada, etc. */
  onFinish,
}: {
  build: () => Question[];
  onFinish?: () => void;
}): Session {
  const { record } = useStudy();

  const [questions, setQuestions] = React.useState<Question[]>(build);
  const [index, setIndex] = React.useState(0);
  const [given, setGiven] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<boolean[]>([]);
  const [wrong, setWrong] = React.useState<Question[]>([]);

  const start = React.useCallback((next: Question[]) => {
    setQuestions(next);
    setIndex(0);
    setGiven(null);
    setResults([]);
    setWrong([]);
  }, []);

  const current = questions[index] ?? null;

  const answer = React.useCallback(
    (value: string) => {
      if (!current || given !== null) return;

      const correct = value === current.answer;
      setGiven(value);
      setResults((prev) => [...prev, correct]);
      if (!correct) setWrong((prev) => [...prev, current]);

      record({
        module: current.module,
        itemKey: current.key,
        prompt: current.itemLabel,
        correct,
        given: value,
        expected: current.answer,
      });
    },
    [current, given, record],
  );

  const next = React.useCallback(() => {
    setGiven(null);
    setIndex((prev) => {
      const advanced = prev + 1;
      if (advanced >= questions.length) onFinish?.();
      return advanced;
    });
  }, [questions.length, onFinish]);

  const restart = React.useCallback(() => start(build()), [start, build]);

  const retryWrong = React.useCallback(() => {
    if (wrong.length === 0) return;
    start(wrong);
  }, [wrong, start]);

  const status: SessionStatus =
    index >= questions.length ? "done" : given === null ? "answering" : "feedback";

  return {
    status,
    questions,
    index,
    current,
    given,
    results,
    correctCount: results.filter(Boolean).length,
    wrong,
    answer,
    next,
    restart,
    retryWrong,
  };
}
