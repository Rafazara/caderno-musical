"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { CloudStatus } from "@/components/layout/cloud-status";
import { NavLinks } from "@/components/layout/nav-links";
import { ThemeControl } from "@/components/layout/theme-control";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlay";
import { useAuth } from "@/lib/auth/provider";
import { findNavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "caderno-musical:sidebar-collapsed";
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen,setMenuOpen]=React.useState(false);
  const [collapsed,setCollapsed]=React.useState(false);
  const pathname=usePathname(); const current=findNavItem(pathname); const {user,ready}=useAuth();
  React.useEffect(()=>{queueMicrotask(()=>setCollapsed(localStorage.getItem(SIDEBAR_KEY)==="1"));},[]);
  function toggle(){setCollapsed(value=>{const next=!value;localStorage.setItem(SIDEBAR_KEY,next?"1":"0");return next;});}
  if(pathname==="/entrar"||(pathname==="/"&&ready&&!user))return <>{children}</>;
  const atelier=pathname==="/atelie-de-partitura";
  return <div className={cn("flex min-h-dvh flex-col transition-[grid-template-columns] duration-200 lg:grid",collapsed?"lg:grid-cols-[4.75rem_minmax(0,1fr)]":"lg:grid-cols-[15.5rem_minmax(0,1fr)]")}>
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule/70 bg-paper-sunken/28 lg:flex">
      <div className={cn("flex items-center pt-6 pb-7",collapsed?"justify-center px-2":"justify-between px-5")}><Brand compact={collapsed}/>{collapsed?null:<Button variant="ghost" size="icon" onClick={toggle} aria-label="Recolher barra lateral"><ChevronLeft/></Button>}</div>
      {collapsed?<Button variant="ghost" size="icon" onClick={toggle} aria-label="Expandir barra lateral" className="mx-auto mb-4"><ChevronRight/></Button>:null}
      <div className={cn("min-h-0 flex-1 overflow-y-auto pb-8",collapsed?"px-2":"px-2.5")}><NavLinks compact={collapsed}/></div>
      <div className={cn("mb-5 border-t border-rule/70 pt-4",collapsed?"mx-auto":"mx-5")}><ThemeControl compact={collapsed}/>{collapsed?null:<div className="mt-3"><CloudStatus/></div>}</div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule/70 bg-paper/92 px-4 py-2.5 backdrop-blur-md lg:hidden"><Button variant="ghost" size="icon" onClick={()=>setMenuOpen(true)} aria-label="Abrir navegação"><Menu/></Button><span className="display min-w-0 flex-1 truncate text-[.9375rem] font-semibold text-ink">{current?.label??"Caderno Musical"}</span><CloudStatus compact/></header>
      <main className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-7 sm:py-12 lg:py-12",atelier?"max-w-[112rem] lg:px-6":"max-w-5xl lg:px-12 lg:py-16")}>{children}</main>
      <footer className={cn("mx-auto w-full px-4 pb-10 sm:px-7",atelier?"max-w-[112rem] lg:px-6":"max-w-5xl lg:px-12")}><p className="text-[.6875rem] text-ink-faint">Caderno Musical · local-first, com sincronização privada opcional.</p></footer>
    </div>
    <Sheet open={menuOpen} onClose={()=>setMenuOpen(false)} title="Navegação"><div className="flex items-center justify-between px-5 py-5"><Brand/><Button variant="ghost" size="icon" onClick={()=>setMenuOpen(false)} aria-label="Fechar navegação"><X/></Button></div><div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6"><NavLinks onNavigate={()=>setMenuOpen(false)}/></div><div className="space-y-4 border-t border-rule/70 px-5 py-4"><ThemeControl/><CloudStatus/></div></Sheet>
  </div>;
}
