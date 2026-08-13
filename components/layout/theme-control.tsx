"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/theme/provider";
import { cn } from "@/lib/utils";

const options: Array<{ id: ThemePreference; label: string; icon: typeof Sun }> = [
  { id: "light", label: "Claro", icon: Sun }, { id: "dark", label: "Escuro", icon: Moon }, { id: "system", label: "Sistema", icon: Monitor },
];
export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  return <div className={cn("flex items-center rounded-md border border-rule/70 p-0.5", compact && "flex-col border-0")} aria-label="Tema da interface">{options.map(({id,label,icon:Icon})=><button key={id} type="button" title={label} aria-label={`Tema ${label}`} aria-pressed={preference===id} onClick={()=>setPreference(id)} className={cn("flex min-h-8 items-center gap-1.5 rounded px-2 text-[.6875rem] transition-colors",preference===id?"bg-paper-raised text-ink shadow-page":"text-ink-faint hover:text-ink",compact&&"w-9 justify-center px-0")}><Icon className="size-3.5"/>{compact?null:<span>{label}</span>}</button>)}</div>;
}
