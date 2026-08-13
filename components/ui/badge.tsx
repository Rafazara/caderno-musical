import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-paper-sunken text-ink-soft border-rule-strong",
  brass: "bg-brass-wash text-brass border-brass-soft/40",
  sage: "bg-sage-wash text-sage border-sage/30",
  clay: "bg-clay-wash text-clay border-clay/30",
  slate: "bg-slate-wash text-slate border-slate/30",
} as const;

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5",
        "text-[0.6875rem] font-medium tracking-[.025em]",
        "[&_svg]:size-3 [&_svg]:shrink-0",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
