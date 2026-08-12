"use client";

import { KEYS, STORE_VERSION } from "./local";

/**
 * O localStorage tratado como o que ele é: uma fonte de dados externa ao React.
 *
 * Este módulo existe para permitir `useSyncExternalStore` em vez de
 * "ler num efeito e chamar setState". A diferença importa: o efeito causaria
 * uma renderização em cascata a cada montagem e um piscar de valores vazios,
 * enquanto aqui o React lê o valor real na própria renderização (e usa o
 * snapshot do servidor durante a hidratação, sem divergência de HTML).
 *
 * O ponto delicado é que `getSnapshot` **precisa devolver a mesma referência**
 * enquanto o conteúdo não mudar — senão o React re-renderiza sem parar. Daí o
 * cache indexado pelo texto bruto: só reinterpretamos o JSON quando a string
 * do storage de fato mudou.
 */

type Snapshot = { raw: string | null; value: unknown };

const snapshots = new Map<string, Snapshot>();
const listeners = new Set<() => void>();

function notifyAll() {
  for (const listener of listeners) listener();
}

/** Mudanças vindas de outra aba. */
function onStorageEvent(event: StorageEvent) {
  if (event.key === null || Object.values(KEYS).includes(event.key as never)) notifyAll();
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (listeners.size === 1) window.addEventListener("storage", onStorageEvent);

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) window.removeEventListener("storage", onStorageEvent);
  };
}

function decode<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { version?: number; data?: T };
    // Formato de uma versão anterior: descarta em vez de quebrar na leitura.
    if (parsed?.version !== STORE_VERSION) return fallback;
    return parsed.data ?? fallback;
  } catch {
    return fallback;
  }
}

export function getSnapshot<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  const value = decode<T>(raw, fallback);
  snapshots.set(key, { raw, value });
  return value;
}

export class StorageFullError extends Error {
  constructor() {
    super("O armazenamento do navegador está cheio.");
    this.name = "StorageFullError";
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err.code === 22)
  );
}

export function write<T>(key: string, data: T): void {
  const raw = JSON.stringify({ version: STORE_VERSION, data });
  try {
    window.localStorage.setItem(key, raw);
  } catch (err) {
    if (isQuotaError(err)) throw new StorageFullError();
    throw err;
  }
  // Semeia o cache com o valor já em mãos, evitando reinterpretar o JSON.
  snapshots.set(key, { raw, value: data });
  notifyAll();
}

/** Lê o valor atual fora da renderização (para atualizações funcionais). */
export function peek<T>(key: string, fallback: T): T {
  return getSnapshot(key, fallback);
}
