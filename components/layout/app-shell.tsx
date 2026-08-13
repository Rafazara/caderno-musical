"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlay";
import { findNavItem } from "@/lib/nav";
import { CloudStatus } from "@/components/layout/cloud-status";
import { useAuth } from "@/lib/auth/provider";

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
  const { user, ready } = useAuth();

  // A porta de entrada e o acesso têm composição própria; a pessoa autenticada
  // chega diretamente ao índice do caderno, sem rever a apresentação.
  if (pathname === "/entrar" || (pathname === "/" && ready && !user)) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      {/* Lateral — desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule/70 bg-paper-sunken/28 lg:flex">
        <div className="px-5 pt-6 pb-8">
          <Brand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-8">
          <NavLinks />
        </div>
        <div className="mx-5 mb-5 border-t border-rule/70 pt-4"><CloudStatus /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior — mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule/70 bg-paper/92 px-4 py-2.5 backdrop-blur-md lg:hidden">
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
          <CloudStatus compact />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-7 sm:py-12 lg:px-12 lg:py-16">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-7 lg:px-12">
          <p className="text-[0.6875rem] text-ink-faint">
            Caderno Musical · local-first, com sincronização privada opcional.
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
        <div className="border-t border-rule/70 px-5 py-4"><CloudStatus /></div>
      </Sheet>
    </div>
  );
}
