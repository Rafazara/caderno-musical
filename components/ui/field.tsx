import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-rule-strong bg-paper-raised text-ink " +
  "placeholder:text-ink-faint transition-colors " +
  "hover:border-brass-soft/60 focus:border-brass focus:outline-none " +
  "disabled:opacity-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(base, "h-10 px-3 text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(base, "min-h-24 resize-y px-3 py-2.5 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(base, "h-10 cursor-pointer px-3 pr-8 text-sm", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}

/** Campo rotulado — agrupa Label + controle com espaçamento consistente. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement<{ id?: string }>(children)
        ? React.cloneElement(children, { id })
        : children}
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
