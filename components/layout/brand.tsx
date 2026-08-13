import Link from "next/link";
import { cn } from "@/lib/utils";

/** Página, pauta e um gesto de escrita reunidos em uma marca de um só traço. */
export function BrandMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 40 40" className={cn("size-8", className)} aria-hidden fill="none">
    <path d="M8 5.5h19l5 5V34.5H8z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M27 5.5v5h5" stroke="currentColor" strokeWidth="1.5" />
    {[14,17.5,21,24.5,28].map(y => <line key={y} x1="12" x2="28" y1={y} y2={y} stroke="currentColor" strokeWidth=".8" opacity=".42" />)}
    <ellipse cx="18" cy="24.5" rx="3.4" ry="2.4" fill="currentColor" transform="rotate(-18 18 24.5)" />
    <path d="M21.2 23.7V12.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}

export function Brand({ className }: { className?: string }) {
  return <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="Caderno Musical — ir para o início">
    <BrandMark className="text-ink transition-opacity group-hover:opacity-70" />
    <span className="min-w-0"><span className="display block text-[.9375rem] leading-tight font-semibold text-ink">Caderno Musical</span><span className="block text-[.625rem] leading-tight tracking-[.12em] text-ink-faint uppercase">Teoria · Volume I</span></span>
  </Link>;
}
