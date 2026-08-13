import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Marca do caderno: três linhas de pauta e uma cabeça de nota. */
function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden
      fill="none"
    >
      <rect
        x="0.7"
        y="0.7"
        width="30.6"
        height="30.6"
        rx="7.5"
        fill="var(--paper-raised)"
        stroke="var(--rule-strong)"
      />
      {[10, 15, 20].map((y) => (
        <line
          key={y}
          x1="7"
          x2="25"
          y1={y}
          y2={y}
          stroke="var(--ink-faint)"
          strokeWidth="1.1"
          opacity="0.5"
        />
      ))}
      <ellipse
        cx="13.5"
        cy="20"
        rx="4.3"
        ry="3.1"
        fill="var(--ink-soft)"
        transform="rotate(-20 13.5 20)"
      />
      <path
        d="M17.6 19.2V8.6"
        stroke="var(--ink-soft)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Caderno Musical — ir para o início"
    >
      <Mark className="transition-opacity duration-200 group-hover:opacity-75" />
      <span className="min-w-0">
        <span className="display block text-[0.9375rem] leading-tight font-semibold tracking-tight text-ink">
          Caderno Musical
        </span>
        <span className="block text-[0.6875rem] leading-tight tracking-[0.08em] text-ink-faint uppercase">
          Workspace de estudo
        </span>
      </span>
    </Link>
  );
}
