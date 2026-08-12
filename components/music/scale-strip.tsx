import * as React from "react";
import { DEGREE_ROMAN, MAJOR_FORMULA, STEP_LABEL } from "@/lib/music/scales";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Fita de escala.

   Mostra os graus em fila com a distância entre cada par no vão — que é a
   forma mais direta de tornar a fórmula T-T-S-T-T-T-S visível em vez de
   decorada. Serve tanto para exibir uma escala pronta quanto para pedir que o
   aluno preencha lacunas.
   -------------------------------------------------------------------------- */

export type StripSlotState = "default" | "blank" | "target" | "correct" | "wrong" | "muted";

export type StripSlot = {
  /** Nome da nota, ou null quando é uma lacuna a preencher. */
  name: string | null;
  state?: StripSlotState;
};

const PILL: Record<StripSlotState, string> = {
  default: "border-rule-strong bg-paper-raised text-ink",
  blank: "border-dashed border-rule-strong bg-paper-sunken text-ink-faint",
  target: "border-brass bg-brass-wash text-brass ring-2 ring-brass/25",
  correct: "border-sage bg-sage-wash text-sage",
  wrong: "border-clay bg-clay-wash text-clay",
  muted: "border-rule bg-paper-sunken/60 text-ink-faint",
};

export function ScaleStrip({
  slots,
  showFormula = true,
  showDegrees = true,
  className,
}: {
  slots: StripSlot[];
  showFormula?: boolean;
  showDegrees?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1 pb-1", className)}>
      <div className="flex min-w-max items-stretch justify-center gap-0">
        {slots.map((slot, i) => {
          const state = slot.state ?? (slot.name === null ? "blank" : "default");
          const gap = i < slots.length - 1 ? MAJOR_FORMULA[i] : null;

          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                {showDegrees ? (
                  <span className="text-[0.625rem] font-semibold tracking-[0.1em] text-ink-faint">
                    {i < 7 ? DEGREE_ROMAN[i] : "I"}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "flex h-11 min-w-13 items-center justify-center rounded-lg border px-2.5",
                    "display text-[0.9375rem] font-semibold whitespace-nowrap transition-colors",
                    PILL[state],
                  )}
                >
                  {slot.name ?? "?"}
                </span>
              </div>

              {gap ? (
                <div
                  className={cn(
                    "flex w-11 shrink-0 flex-col items-center justify-end sm:w-14",
                    showDegrees ? "pb-3.5" : "pb-1.5",
                  )}
                >
                  {showFormula ? (
                    <span
                      className={cn(
                        "mb-1 rounded px-1 text-[0.625rem] font-bold tracking-wide",
                        gap === "S" ? "text-clay" : "text-ink-faint",
                      )}
                      title={STEP_LABEL[gap]}
                    >
                      {gap === "S" ? "½" : "1"}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "h-px w-full",
                      gap === "S"
                        ? "bg-clay/45"
                        : "bg-rule-strong",
                    )}
                  />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A fórmula sozinha, como uma régua. Aparece no conteúdo didático e no topo
 * dos exercícios de escala como referência permanente.
 */
export function FormulaRuler({ className }: { className?: string }) {
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1", className)}>
      <div className="flex min-w-max items-center justify-center gap-1.5">
        {MAJOR_FORMULA.map((s, i) => (
          <React.Fragment key={i}>
            <span
              className={cn(
                "flex h-9 items-center rounded-md border px-3 text-[0.8125rem] font-semibold",
                s === "S"
                  ? "border-clay/35 bg-clay-wash text-clay"
                  : "border-rule-strong bg-paper-raised text-ink-soft",
              )}
            >
              {STEP_LABEL[s]}
            </span>
            {i < MAJOR_FORMULA.length - 1 ? (
              <span className="text-ink-faint" aria-hidden>
                ·
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
