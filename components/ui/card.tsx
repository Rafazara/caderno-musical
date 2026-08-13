import * as React from "react";
import { cn } from "@/lib/utils";

/** Folha de papel: base de quase toda a interface. */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border border-rule/70 bg-paper-raised",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-5 sm:p-7", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("display text-lg font-semibold text-ink sm:text-xl", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm leading-relaxed text-ink-muted", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0 sm:p-7 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3 border-t border-rule p-5 sm:px-6", className)}
      {...props}
    />
  );
}
