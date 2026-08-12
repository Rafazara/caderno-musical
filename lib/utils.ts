import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Fisher–Yates. Só chamar no cliente (usa Math.random). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Sorteia `n` itens distintos; se `n` > tamanho, repete o ciclo embaralhado. */
export function sampleMany<T>(items: readonly T[], n: number): T[] {
  if (items.length === 0) return [];
  const out: T[] = [];
  while (out.length < n) {
    out.push(...shuffle(items).slice(0, Math.min(n - out.length, items.length)));
  }
  return out;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Chave de dia local no formato AAAA-MM-DD (não UTC, para a sequência de dias bater). */
export function dayKey(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", DATE_FORMAT);
}

/**
 * Formata uma chave de dia ("AAAA-MM-DD").
 *
 * Precisa quebrar a string à mão: `new Date("2026-08-12")` é interpretado como
 * meia-noite **UTC**, o que em fusos negativos (como o do Brasil) exibe o dia
 * anterior. Passar ano, mês e dia separados constrói a data no fuso local.
 */
export function formatDayKey(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", DATE_FORMAT);
}

export function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return formatDate(ts);
}

export function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** "3 notas" / "1 nota" */
export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
