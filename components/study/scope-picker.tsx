"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ScopeOption = { id: string; label: string; hint: string; disabled?: boolean };

/**
 * Seletor de recorte de prática.
 *
 * Aparece acima do exercício para escolher *o que* treinar. Trocar o recorte
 * reinicia a sessão, então o rótulo é explícito sobre isso.
 */
export function ScopePicker({
  options,
  value,
  onChange,
  label = "O que praticar",
}: {
  options: readonly ScopeOption[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const active = options.find((o) => o.id === value);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-40",
                selected
                  ? "border-brass bg-brass text-white"
                  : "border-rule-strong bg-paper-raised text-ink-soft hover:border-brass-soft hover:bg-brass-wash hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {active ? <p className="text-xs leading-relaxed text-ink-faint">{active.hint}</p> : null}
    </div>
  );
}
