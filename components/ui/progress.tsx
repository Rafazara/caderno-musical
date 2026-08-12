import * as React from "react";
import { cn } from "@/lib/utils";

const fills = {
  brass: "bg-brass",
  sage: "bg-sage",
  clay: "bg-clay",
  slate: "bg-slate",
  ink: "bg-ink-soft",
} as const;

export function Progress({
  value,
  tone = "brass",
  className,
  label,
}: {
  /** 0–100 */
  value: number;
  tone?: keyof typeof fills;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-paper-sunken ring-1 ring-rule ring-inset",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fills[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Pontos de progresso de uma sessão: acerto, erro, pendente. */
export function SessionDots({
  results,
  total,
  current,
}: {
  results: boolean[];
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const done = i < results.length;
        return (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              done
                ? results[i]
                  ? "w-4 bg-sage"
                  : "w-4 bg-clay"
                : i === current
                  ? "w-4 bg-brass"
                  : "w-1.5 bg-rule-strong",
            )}
          />
        );
      })}
    </div>
  );
}
