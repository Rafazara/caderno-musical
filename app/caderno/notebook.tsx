"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Link2,
  NotebookPen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/overlay";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/prose";
import { FUNDAMENTALS, findFundamental } from "@/lib/content/fundamentals";
import { KEYS } from "@/lib/storage/local";
import { NO_NOTES, type NotebookNote } from "@/lib/storage/types";
import { usePersistentState } from "@/lib/storage/use-persistent-state";
import { useTrackTopic } from "@/lib/study/provider";
import { cn, formatRelative, uid } from "@/lib/utils";

type Draft = {
  id: string | null;
  title: string;
  subject: string;
  body: string;
  tags: string;
  links: string[];
};

/** Assuntos oferecidos no editor. Casam com o campo `subject` dos fundamentos. */
const SUBJECTS = [
  "Leitura de notas",
  "Escalas maiores",
  "Tom e semitom",
  "Ciclo de quintas",
  "Aula da professora",
  "Dúvidas",
];

const emptyDraft = (): Draft => ({
  id: null,
  title: "",
  subject: "",
  body: "",
  tags: "",
  links: [],
});

/**
 * Vindo de um fundamento ("Anotar sobre isto"), a nota já nasce com o assunto
 * preenchido e o tópico ligado. Derivar isso na inicialização do estado, em vez
 * de num efeito, evita a nota aparecer vazia e ser preenchida em seguida.
 */
function draftFromParams(params: URLSearchParams): Draft | null {
  const assunto = params.get("assunto");
  const topico = params.get("topico");
  if (!assunto && !topico) return null;

  return {
    ...emptyDraft(),
    subject: assunto ?? "",
    links: topico && findFundamental(topico) ? [topico] : [],
  };
}

export function Notebook() {
  useTrackTopic("/caderno", "Meu caderno");

  const params = useSearchParams();
  const {
    value: notes,
    set: setNotes,
    ready,
    error: storeError,
  } = usePersistentState<NotebookNote[]>(KEYS.notebook, NO_NOTES);

  const [draft, setDraft] = React.useState<Draft | null>(() => draftFromParams(params));
  const [confirmDelete, setConfirmDelete] = React.useState<NotebookNote | null>(null);
  const [query, setQuery] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [notes]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (tagFilter && !n.tags.includes(tagFilter)) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
      );
  }, [notes, query, tagFilter]);

  function save(d: Draft) {
    const now = Date.now();
    const tags = d.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (d.id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === d.id
            ? {
                ...n,
                title: d.title.trim(),
                subject: d.subject.trim(),
                body: d.body,
                tags,
                links: d.links,
                updatedAt: now,
              }
            : n,
        ),
      );
    } else {
      setNotes((prev) => [
        ...prev,
        {
          id: uid(),
          title: d.title.trim(),
          subject: d.subject.trim(),
          body: d.body,
          tags,
          links: d.links,
          createdAt: now,
          updatedAt: now,
          pinned: false,
        },
      ]);
    }
    setDraft(null);
  }

  function togglePin(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setConfirmDelete(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Consultar"
        title="Meu caderno"
        description="Anotações suas, do jeito que você escreveria à mão. Use etiquetas e ligue cada nota a um fundamento para o conhecimento ficar conectado."
      >
        <Button variant="brass" onClick={() => setDraft(emptyDraft())}>
          <Plus />
          Nova anotação
        </Button>
      </SectionHeading>

      {storeError ? (
        <Callout title="Não foi possível salvar" tone="brass" icon={<AlertTriangle />}>
          {storeError}
        </Callout>
      ) : null}

      {!ready ? (
        <Card className="flex h-56 items-center justify-center">
          <p className="text-sm text-ink-faint">Abrindo o caderno…</p>
        </Card>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen />}
          title="Caderno em branco"
          description="Escreva o que a professora explicou, o que você entendeu com suas palavras, ou aquela dúvida que ficou. Suas palavras fixam melhor que as minhas."
        >
          <Button variant="brass" onClick={() => setDraft(emptyDraft())}>
            <Plus />
            Escrever a primeira
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* Busca e filtro por etiqueta */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nas anotações…"
                className="pl-9"
                aria-label="Buscar nas anotações"
              />
            </div>

            {allTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
                    tagFilter === null
                      ? "border-brass bg-brass text-white"
                      : "border-rule-strong bg-paper-raised text-ink-muted hover:border-brass-soft",
                  )}
                >
                  Todas
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
                      tag === tagFilter
                        ? "border-brass bg-brass text-white"
                        : "border-rule-strong bg-paper-raised text-ink-muted hover:border-brass-soft",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <Card className="flex h-40 items-center justify-center px-6 text-center">
              <p className="text-sm text-ink-muted">
                Nenhuma anotação corresponde a essa busca.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() =>
                    setDraft({
                      id: note.id,
                      title: note.title,
                      subject: note.subject,
                      body: note.body,
                      tags: note.tags.join(", "),
                      links: note.links,
                    })
                  }
                  onTogglePin={() => togglePin(note.id)}
                  onDelete={() => setConfirmDelete(note)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Montado só quando há rascunho: o estado do formulário nasce do próprio
          rascunho, sem precisar de efeito para sincronizar. */}
      {draft !== null ? (
        <NoteEditor
          key={draft.id ?? "nova"}
          initial={draft}
          onClose={() => setDraft(null)}
          onSave={save}
        />
      ) : null}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Apagar esta anotação?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              className="bg-clay hover:bg-clay/85"
              onClick={() => confirmDelete && remove(confirmDelete.id)}
            >
              <Trash2 />
              Apagar
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          <strong className="font-semibold text-ink">
            {confirmDelete?.title || "Anotação sem título"}
          </strong>{" "}
          será apagada deste navegador. Isso não pode ser desfeito.
        </p>
      </Modal>
    </div>
  );
}

/* ==========================================================================
   Cartão de anotação — folha de caderno
   ========================================================================== */

function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  note: NotebookNote;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const linked = note.links.map(findFundamental).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <Card className={cn("flex flex-col", note.pinned && "border-brass-soft/50")}>
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="display leading-snug font-semibold text-balance text-ink">
              {note.title || "Sem título"}
            </h3>
            <p className="mt-1 text-xs text-ink-faint">
              {note.subject ? `${note.subject} · ` : ""}
              {formatRelative(note.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePin}
              aria-label={note.pinned ? "Desafixar anotação" : "Fixar anotação"}
              className="size-8"
            >
              {note.pinned ? (
                <Pin className="fill-brass text-brass" />
              ) : (
                <PinOff className="text-ink-faint" />
              )}
            </Button>
          </div>
        </div>

        {/* O corpo em papel pautado — a parte que parece caderno. */}
        {note.body ? (
          <div className="ruled-paper rounded-lg bg-paper-sunken/40 px-3.5 py-2">
            <p className="text-sm whitespace-pre-wrap text-ink-soft">{note.body}</p>
          </div>
        ) : null}

        {note.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {linked.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.1em] text-ink-faint uppercase">
              <Link2 className="size-3" />
              Ver também
            </p>
            <div className="flex flex-wrap gap-1.5">
              {linked.map((f) => (
                <Link
                  key={f.slug}
                  href={`/fundamentos/${f.slug}`}
                  className="rounded-md border border-brass-soft/30 bg-brass-wash px-2 py-0.5 text-xs font-medium text-brass transition-colors hover:border-brass"
                >
                  {f.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-1 border-t border-rule pt-3">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label={`Apagar ${note.title || "anotação"}`}
            className="ml-auto"
          >
            <Trash2 />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
   Editor
   ========================================================================== */

function NoteEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: Draft;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [local, setLocal] = React.useState<Draft>(initial);

  const canSave = local.title.trim().length > 0 || local.body.trim().length > 0;

  function toggleLink(slug: string) {
    setLocal((prev) => ({
      ...prev,
      links: prev.links.includes(slug)
        ? prev.links.filter((s) => s !== slug)
        : [...prev.links, slug],
    }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial.id ? "Editar anotação" : "Nova anotação"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="brass" onClick={() => onSave(local)} disabled={!canSave}>
            Salvar anotação
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Título">
          <Input
            value={local.title}
            onChange={(e) => setLocal({ ...local, title: e.target.value })}
            placeholder="Ex.: Por que Sol maior tem Fá sustenido"
          />
        </Field>

        <Field label="Assunto">
          <Select
            value={local.subject}
            onChange={(e) => setLocal({ ...local, subject: e.target.value })}
          >
            <option value="">— sem assunto —</option>
            {/* Um assunto que venha de fora da lista (de um fundamento, ou de
                uma nota antiga) entra como opção: o select nunca deve exibir
                "sem assunto" enquanto guarda outro valor. */}
            {local.subject && !SUBJECTS.includes(local.subject) ? (
              <option value={local.subject}>{local.subject}</option>
            ) : null}
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Anotação">
          <Textarea
            value={local.body}
            onChange={(e) => setLocal({ ...local, body: e.target.value })}
            placeholder="Escreva com suas palavras…"
            className="ruled-paper min-h-40"
          />
        </Field>

        <Field
          label="Etiquetas"
          hint="Separe por vírgula. Ex.: revisar, dúvida, prova"
        >
          <Input
            value={local.tags}
            onChange={(e) => setLocal({ ...local, tags: e.target.value })}
            placeholder="revisar, dúvida"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-muted uppercase">
            Ligar a fundamentos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FUNDAMENTALS.map((f) => {
              const on = local.links.includes(f.slug);
              return (
                <button
                  key={f.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLink(f.slug)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-brass bg-brass text-white"
                      : "border-rule-strong bg-paper-raised text-ink-muted hover:border-brass-soft hover:text-ink",
                  )}
                >
                  {f.title}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-faint">
            As ligações aparecem como &ldquo;ver também&rdquo; no cartão da anotação.
          </p>
        </div>
      </div>
    </Modal>
  );
}
