"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function useDismiss(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);
}

/** Painel deslizante — usado na navegação mobile. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "left",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  useDismiss(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="animate-fade absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 flex w-[19rem] max-w-[85vw] flex-col",
          "border-rule bg-paper shadow-lift",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
        )}
        style={{
          animation: `slide-${side} 0.28s cubic-bezier(0.22,1,0.36,1) both`,
        }}
      >
        <style>{`
          @keyframes slide-left { from { transform: translateX(-100%) } to { transform: none } }
          @keyframes slide-right { from { transform: translateX(100%) } to { transform: none } }
        `}</style>
        {children}
      </div>
    </div>
  );
}

/** Modal centrado — usado para visualizar material e confirmar exclusões. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "full";
}) {
  useDismiss(open, onClose);
  if (!open) return null;

  const widths = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    full: "max-w-5xl",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-fade absolute inset-0 bg-ink/30 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-rise relative flex max-h-full w-full flex-col overflow-hidden",
          "rounded-xl border border-rule bg-paper-raised shadow-lift",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule p-5">
          <div className="min-w-0">
            <h2 className="display truncate text-lg font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X />
          </Button>
        </div>
        {children ? <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div> : null}
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-rule bg-paper-sunken/50 p-4 px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
