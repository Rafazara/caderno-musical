import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Indicador de estudo.
 *
 * Deliberadamente sem moldura de cartão e sem cor de fundo: o número é grande,
 * o rótulo é pequeno, e a leitura é tipográfica em vez de gráfica — é o que
 * separa um caderno de um painel corporativo.
 */
export function StatTile({
  label,
  value,
  suffix,
  hint,
  ready = true,
  tone = "ink",
}: {
  label: string;
  value: number | string;
  suffix?: string;
  hint?: string;
  ready?: boolean;
  tone?: "ink" | "brass" | "sage" | "clay";
}) {
  const tones = {
    ink: "text-ink",
    brass: "text-brass",
    sage: "text-sage",
    clay: "text-clay",
  } as const;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-ink-faint uppercase">
        {label}
      </p>
      <p className={cn("display text-2xl font-semibold sm:text-[1.75rem]", tones[tone])}>
        {ready ? (
          <>
            <span className="tabular">{value}</span>
            {suffix ? <span className="text-base text-ink-faint">{suffix}</span> : null}
          </>
        ) : (
          <span className="inline-block h-7 w-10 animate-pulse rounded bg-paper-sunken align-middle" />
        )}
      </p>
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
