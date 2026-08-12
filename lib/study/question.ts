import type { Note } from "@/lib/music/notes";
import type { IntervalPair } from "@/lib/music/intervals";
import type { StripSlot } from "@/components/music/scale-strip";
import type { ModuleId } from "@/lib/storage/types";

/**
 * Uma questão, no formato que os três módulos compartilham.
 *
 * O contrato existe para que o motor de sessão, o painel de correção e a
 * revisão de erros sejam escritos uma única vez. Cada módulo só precisa
 * fabricar questões e saber reconstruí-las a partir da `key`.
 */
export type Question = {
  /** Identidade do item praticado. Precisa ser suficiente para reconstruir a questão. */
  key: string;
  module: ModuleId;
  /** A pergunta em si: "Qual é esta nota?" */
  prompt: string;
  /** Nome curto do item, usado nas listas de erro: "Sol4", "Mi → Fá". */
  itemLabel: string;
  options: string[];
  answer: string;
  visual: QuestionVisual;
  /** Correção explicada, já sabendo o que foi respondido. */
  explain: (given: string) => Explanation;
};

export type QuestionVisual =
  | { kind: "note"; note: Note }
  | { kind: "interval"; pair: IntervalPair }
  | { kind: "scale"; slots: StripSlot[]; caption?: string }
  | { kind: "formula" }
  | { kind: "none" };

export type Explanation = {
  /** Frase de abertura, afirmando o que era. */
  headline: string;
  /** O raciocínio — o "por quê". */
  reason: string;
  /** Dica de memorização. */
  tip?: string;
};

/** Reconstrói uma questão a partir da chave salva. Usado pela revisão de erros. */
export type Rehydrator = (key: string) => Question | null;
