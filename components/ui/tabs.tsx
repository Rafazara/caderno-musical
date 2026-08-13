"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string };

/**
 * Controle segmentado. Usado onde uma página tem conteúdo de estudo e prática
 * lado a lado — separar em abas evita a página poluída sem esconder nada atrás
 * de navegação.
 */
export function Tabs({
  tabs,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  tabs: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full gap-1 border-b border-rule bg-transparent sm:w-auto",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px flex-1 border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium whitespace-nowrap",
              "transition-colors duration-150 sm:flex-none",
              selected
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
