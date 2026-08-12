"use client";

import * as React from "react";
import { getSnapshot, peek, StorageFullError, subscribe, write } from "./store";

/**
 * "Já estamos no cliente?" sem efeito e sem estado.
 *
 * `getServerSnapshot` devolve false (é o que o HTML do servidor contém) e
 * `getSnapshot` devolve true, então o React troca o valor na hidratação sem
 * risco de divergência. Serve para decidir entre esqueleto e dados reais.
 */
const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export type PersistentState<T> = {
  value: T;
  /** Aceita valor ou função, como o useState. */
  set: (next: T | ((prev: T) => T)) => void;
  /** false durante a hidratação. Evita mostrar zeros antes dos dados reais. */
  ready: boolean;
  /** Mensagem de erro de escrita, tipicamente cota estourada. */
  error: string | null;
  clearError: () => void;
};

/**
 * Estado espelhado no localStorage.
 *
 * `initial` precisa ser uma constante estável (definida fora do componente):
 * ela participa da leitura do snapshot, e recriá-la a cada renderização faria
 * trabalho desnecessário.
 *
 * A escrita é síncrona e acontece antes de notificar o React: se o storage
 * recusar por falta de espaço, a mudança é descartada e o estado em memória
 * continua igual ao que está persistido, em vez de divergir em silêncio.
 */
export function usePersistentState<T>(key: string, initial: T): PersistentState<T> {
  const ready = useHydrated();
  const [error, setError] = React.useState<string | null>(null);

  const value = React.useSyncExternalStore(
    subscribe,
    () => getSnapshot<T>(key, initial),
    () => initial,
  );

  const set = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(peek<T>(key, initial))
          : next;

      try {
        write(key, resolved);
        setError(null);
      } catch (err) {
        setError(
          err instanceof StorageFullError
            ? "O armazenamento do navegador está cheio. Remova algum material antigo para liberar espaço."
            : "Não foi possível salvar no navegador.",
        );
      }
    },
    [key, initial],
  );

  const clearError = React.useCallback(() => setError(null), []);

  return { value, set, ready, error, clearError };
}
