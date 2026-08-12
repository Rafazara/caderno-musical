"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles, Trash2 } from "lucide-react";
import { PracticeRunner } from "@/components/study/practice-runner";
import { ScopePicker } from "@/components/study/scope-picker";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/prose";
import { MASTERY_STREAK, MODULE_HREF, MODULE_LABEL, type ModuleId } from "@/lib/storage/types";
import { rehydrate } from "@/lib/study/generators";
import { useStudy, useTrackTopic } from "@/lib/study/provider";
import type { Question } from "@/lib/study/question";
import { formatRelative, plural, shuffle } from "@/lib/utils";

const MODULES: ModuleId[] = ["leitura", "escalas", "intervalos"];
const REVIEW_SIZE = 10;

export function ReviewStudio() {
  useTrackTopic("/revisar", "Revisar erros");

  const { state, ready, forgetError } = useStudy();
  const [scope, setScope] = React.useState<string>("todos");
  // Chave de sessão: incrementar força uma nova rodada com a fila atualizada.
  const [round, setRound] = React.useState(0);

  const errors = React.useMemo(
    () =>
      Object.values(state.errors).sort(
        (a, b) => b.misses - a.misses || b.lastMissTs - a.lastMissTs,
      ),
    [state.errors],
  );

  const countByModule = React.useMemo(() => {
    const out: Record<string, number> = { todos: errors.length };
    for (const m of MODULES) out[m] = errors.filter((e) => e.module === m).length;
    return out;
  }, [errors]);

  const filtered = scope === "todos" ? errors : errors.filter((e) => e.module === scope);

  /**
   * Monta a rodada a partir da fila de erros. Itens cuja chave o app não sabe
   * mais reconstruir (versão antiga) são simplesmente ignorados, para que uma
   * mudança de formato não trave a revisão.
   */
  const build = React.useCallback((): Question[] => {
    const questions = filtered
      .map((e) => rehydrate(e.module, e.itemKey))
      .filter((q): q is Question => q !== null);
    return shuffle(questions).slice(0, REVIEW_SIZE);
  }, [filtered]);

  const scopeOptions = [
    { id: "todos", label: `Tudo (${countByModule.todos})`, hint: "Mistura os erros de todos os assuntos." },
    ...MODULES.map((m) => ({
      id: m,
      label: `${MODULE_LABEL[m]} (${countByModule[m]})`,
      hint: `Somente os erros de ${MODULE_LABEL[m].toLowerCase()}.`,
      disabled: countByModule[m] === 0,
    })),
  ];

  if (!ready) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeading eyebrow="Praticar" title="Revisar erros" />
        <Card className="flex h-56 items-center justify-center">
          <p className="text-sm text-ink-faint">Carregando seus erros…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Praticar"
        title="Praticar somente o que errei"
        description={`Cada erro entra nesta fila e só sai depois de ${MASTERY_STREAK} acertos seguidos. É a repetição que faz o conteúdo ficar.`}
      />

      {errors.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Nada para revisar agora"
          description="Sua fila de erros está vazia. Faça uma sessão de prática — o que você errar aparece aqui automaticamente."
        >
          {MODULES.map((m) => (
            <Link key={m} href={MODULE_HREF[m]} className={buttonClass({ variant: "outline" })}>
              {MODULE_LABEL[m]}
            </Link>
          ))}
        </EmptyState>
      ) : (
        <>
          <ScopePicker
            options={scopeOptions}
            value={scope}
            onChange={(id) => {
              setScope(id);
              setRound((r) => r + 1);
            }}
            label="Revisar por tipo"
          />

          {filtered.length === 0 ? (
            <Callout title="Nenhum erro neste assunto" tone="sage">
              Escolha outro tipo acima, ou faça uma sessão nova.
            </Callout>
          ) : (
            <PracticeRunner
              key={`${scope}-${round}`}
              build={build}
              contextLabel="Revisão"
              emptyMessage="Os erros salvos são de uma versão anterior do app e não podem ser reconstruídos. Faça uma sessão nova para recriar a fila."
            />
          )}

          {/* A fila completa, para dar noção do que está pendente. */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Fila de revisão</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">
                  {plural(errors.length, "item pendente", "itens pendentes")}.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y divide-rule">
                {errors.map((item) => (
                  <li
                    key={item.itemKey}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.prompt}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {MODULE_LABEL[item.module]} · resposta: {item.expected} ·{" "}
                        {plural(item.misses, "erro", "erros")} · {formatRelative(item.lastMissTs)}
                      </p>
                    </div>

                    {/* Progresso rumo ao domínio: acertos seguidos necessários. */}
                    <div className="flex shrink-0 items-center gap-1" title={`${item.streak} de ${MASTERY_STREAK} acertos seguidos`}>
                      {Array.from({ length: MASTERY_STREAK }, (_, i) => (
                        <span
                          key={i}
                          className={
                            i < item.streak
                              ? "flex size-4 items-center justify-center rounded-full bg-sage text-white"
                              : "size-4 rounded-full border border-rule-strong"
                          }
                        >
                          {i < item.streak ? <Check className="size-2.5" /> : null}
                        </span>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => forgetError(item.itemKey)}
                      aria-label={`Remover ${item.prompt} da fila`}
                      title="Remover da fila"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {MODULES.filter((m) => countByModule[m] > 0).map((m) => (
              <Badge key={m} tone="clay">
                {MODULE_LABEL[m]}: {countByModule[m]}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
