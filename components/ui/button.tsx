import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  /** Ação principal — tinta cheia, discreta. */
  solid:
    "bg-ink text-paper hover:bg-ink-soft active:bg-ink border border-transparent shadow-page",
  /** Ação de destaque — latão. */
  brass:
    "bg-ink text-paper hover:bg-ink-soft active:bg-ink border border-transparent",
  /** Padrão da interface — cartão de papel. */
  outline:
    "bg-paper-raised text-ink border border-rule hover:border-rule-strong hover:bg-paper-sunken/70",
  /** Terciária, sem moldura. */
  ghost:
    "bg-transparent text-ink-soft border border-transparent hover:bg-paper-sunken hover:text-ink",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[0.8125rem] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-[0.9375rem] gap-2.5 rounded-lg",
  icon: "h-10 w-10 rounded-lg",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/**
 * Classes do botão, expostas para que `<Link>` possa ter a mesma aparência sem
 * precisar de um mecanismo de composição (`asChild`) só para isso.
 */
export function buttonClass({
  variant = "outline",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-offset-2",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    sizes[size],
    variants[variant],
    className,
  );
}

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "outline",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
