import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tipografia editorial para conteúdo didático.
 * Substitui @tailwindcss/typography — controlamos a medida e o ritmo à mão
 * para manter o ar de livro de teoria.
 */
export function Prose({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-[68ch] text-[0.9375rem] leading-[1.75] text-ink-soft",
        "[&_p]:mb-4",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_em]:text-brass [&_em]:not-italic [&_em]:font-medium",
        "[&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:pl-1",
        "[&_li]:relative [&_li]:pl-5",
        "[&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.62em]",
        "[&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-brass-soft",
        "[&_h3]:display [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Cabeçalho de seção com filete — o "título de capítulo" do caderno. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-brass uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="display text-2xl font-semibold text-balance text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </header>
  );
}

/** Bloco de destaque — para definições e dicas dentro do conteúdo. */
export function Callout({
  title,
  tone = "brass",
  icon,
  children,
  className,
}: {
  title?: string;
  tone?: "brass" | "sage" | "slate";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    brass: "border-brass-soft/35 bg-brass-wash",
    sage: "border-sage/30 bg-sage-wash",
    slate: "border-slate/25 bg-slate-wash",
  } as const;
  const marks = { brass: "text-brass", sage: "text-sage", slate: "text-slate" } as const;

  return (
    <div className={cn("rounded-lg border px-4 py-3.5", tones[tone], className)}>
      {title ? (
        <p
          className={cn(
            "mb-1.5 flex items-center gap-2 text-[0.8125rem] font-semibold",
            marks[tone],
          )}
        >
          {icon ? <span className="[&_svg]:size-3.5">{icon}</span> : null}
          {title}
        </p>
      ) : null}
      <div className="text-sm leading-relaxed text-ink-soft [&_p]:mb-2 [&_p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rule-strong bg-paper-raised/50 px-6 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-brass-wash text-brass [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="display text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
