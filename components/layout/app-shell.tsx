"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlay";
import { findNavItem } from "@/lib/nav";

/**
 * Estrutura da aplicação: barra lateral fixa no desktop, gaveta no mobile.
 *
 * A lateral é `sticky` com altura da viewport para que a navegação fique
 * sempre visível durante uma sessão de exercícios — trocar de assunto não
 * deveria exigir rolar a página até o topo.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  // A gaveta fecha no próprio clique do link (via `onNavigate` do NavLinks),
  // não observando a rota — assim não há efeito nem renderização extra.
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const current = findNavItem(pathname);

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {/* Lateral — desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-paper-raised/60 lg:flex">
        <div className="px-5 py-6">
          <Brand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          <NavLinks />
        </div>
        <div className="staff-texture h-10 shrink-0 opacity-40" aria-hidden />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior — mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule bg-paper/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir navegação"
          >
            <Menu />
          </Button>
          <span className="display min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-ink">
            {current?.label ?? "Caderno Musical"}
          </span>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6 lg:px-10">
          <p className="border-t border-rule pt-5 text-xs text-ink-faint">
            Caderno Musical · seus dados ficam salvos apenas neste navegador.
          </p>
        </footer>
      </div>

      {/* Gaveta — mobile */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Navegação">
        <div className="flex items-center justify-between px-5 py-5">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar navegação"
          >
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
        </div>
      </Sheet>
    </div>
  );
}
