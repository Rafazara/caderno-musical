"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/provider";
import { SYNC_LABEL, useCloudSync } from "@/lib/sync/provider";

export function CloudStatus({ compact = false }: { compact?: boolean }) {
  const { user, signOut, configured } = useAuth();
  const { status } = useCloudSync();
  if (!configured) return <p className="text-[0.6875rem] text-ink-faint">Salvo neste navegador</p>;
  if (!user) return <Link href="/entrar" className="text-xs font-medium text-ink-muted hover:text-ink">Entrar para sincronizar</Link>;
  const item = SYNC_LABEL[status];
  const Icon = item.icon;
  return (
    <div className={compact ? "flex items-center gap-3" : "flex flex-col gap-1.5"}>
      <span className="flex items-center gap-1.5 text-[0.6875rem] text-ink-faint"><Icon className={status === "syncing" ? "size-3.5 animate-spin" : "size-3.5"} />{item.text}</span>
      {!compact ? <span className="truncate text-[0.625rem] text-ink-faint" title={user.email}>{user.email}</span> : null}
      {!compact ? <button type="button" onClick={() => void signOut()} className="flex items-center gap-1 text-[0.6875rem] text-ink-muted hover:text-ink" aria-label="Sair da conta"><LogOut className="size-3" /> Sair</button> : null}
    </div>
  );
}
