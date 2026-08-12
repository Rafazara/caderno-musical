"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { useStudy } from "@/lib/study/provider";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { state, ready } = useStudy();
  const pendingErrors = ready ? Object.keys(state.errors).length : 0;

  return (
    <nav className="flex flex-col gap-6">
      {NAV.map((group, gi) => (
        <div key={gi}>
          {group.title ? (
            <p className="mb-2 px-3 text-[0.625rem] font-semibold tracking-[0.14em] text-ink-faint uppercase">
              {group.title}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const showBadge = item.href === "/revisar" && pendingErrors > 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2",
                      "text-sm transition-colors duration-150",
                      active
                        ? "bg-brass-wash font-semibold text-ink"
                        : "text-ink-soft hover:bg-paper-sunken hover:text-ink",
                    )}
                  >
                    {/* Filete de página ativa — discreto, como um marcador. */}
                    <span
                      className={cn(
                        "absolute top-1/2 left-0 h-5 w-[2.5px] -translate-y-1/2 rounded-r-full transition-opacity",
                        active ? "bg-brass opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-brass" : "text-ink-faint group-hover:text-ink-muted",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {showBadge ? (
                      <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[0.6875rem] font-semibold text-white">
                        {pendingErrors}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
