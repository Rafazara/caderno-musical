"use client";

import * as React from "react";
import Image from "next/image";
import { AlertTriangle, FileText, Library, Maximize2, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/overlay";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/prose";
import { formatBytes, KEYS } from "@/lib/storage/local";
import { ACCEPT_ATTR, FileRejected, prepareFile, type PreparedFile } from "@/lib/storage/files";
import { type MaterialItem, NO_MATERIAL } from "@/lib/storage/types";
import { usePersistentState } from "@/lib/storage/use-persistent-state";
import { useTrackTopic } from "@/lib/study/provider";
import { dayKey, formatDayKey, uid } from "@/lib/utils";

export function MaterialLibrary() {
  useTrackTopic("/material", "Material da professora");

  const {
    value: items,
    set: setItems,
    ready,
    error: storeError,
  } = usePersistentState<MaterialItem[]>(KEYS.material, NO_MATERIAL);

  const [adding, setAdding] = React.useState(false);
  const [viewing, setViewing] = React.useState<MaterialItem | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<MaterialItem | null>(null);

  // Espaço ocupado pelos arquivos, derivado da própria lista — é o número que
  // interessa ao usuário, já que o material é de longe o que mais consome cota.
  const used = React.useMemo(
    () => items.reduce((total, item) => total + item.fileSize, 0),
    [items],
  );

  const sorted = React.useMemo(
    () => [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [items],
  );

  function addItem(item: MaterialItem) {
    setItems((prev) => [...prev, item]);
    setAdding(false);
  }

  function updateNotes(id: string, notes: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmDelete(null);
    setViewing(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Consultar"
        title="Material da professora"
        description="Guarde aqui as fotos e PDFs passados em aula, com título, data, assunto e suas anotações ao lado."
      >
        <Button variant="brass" onClick={() => setAdding(true)}>
          <Plus />
          Adicionar
        </Button>
      </SectionHeading>

      {storeError ? (
        <Callout title="Não foi possível salvar" tone="brass" icon={<AlertTriangle />}>
          {storeError}
        </Callout>
      ) : null}

      {!ready ? (
        <Card className="flex h-56 items-center justify-center">
          <p className="text-sm text-ink-faint">Carregando seu material…</p>
        </Card>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title="Nenhum material ainda"
          description="Adicione uma foto da lousa, um exercício em PDF ou a folha que a professora passou. O arquivo fica salvo neste navegador."
        >
          <Button variant="brass" onClick={() => setAdding(true)}>
            <Upload />
            Adicionar material
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4">
            {sorted.map((item) => (
              <MaterialCard
                key={item.id}
                item={item}
                onOpen={() => setViewing(item)}
                onDelete={() => setConfirmDelete(item)}
                onNotesChange={(notes) => updateNotes(item.id, notes)}
              />
            ))}
          </div>

          <p className="text-xs text-ink-faint">
            {sorted.length} {sorted.length === 1 ? "material" : "materiais"} ·{" "}
            {formatBytes(used)} em arquivos. O navegador costuma permitir cerca de 5 MB no total.
          </p>
        </>
      )}

      {/* Montado só quando aberto: cada abertura começa com o formulário limpo. */}
      {adding ? (
        <AddMaterialModal onClose={() => setAdding(false)} onAdd={addItem} />
      ) : null}

      {/* Visualização em tela grande */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ""}
        description={
          viewing
            ? [formatDayKey(viewing.date), viewing.subject].filter(Boolean).join(" · ")
            : undefined
        }
        size="full"
      >
        {viewing ? <MaterialPreview item={viewing} tall /> : null}
      </Modal>

      {/* Confirmação de exclusão — o arquivo não tem cópia em nenhum outro lugar. */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Remover este material?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              onClick={() => confirmDelete && remove(confirmDelete.id)}
              className="bg-clay hover:bg-clay/85"
            >
              <Trash2 />
              Remover
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          <strong className="font-semibold text-ink">{confirmDelete?.title}</strong> e as anotações
          dele serão apagados deste navegador. Como o arquivo não está salvo em nenhum outro lugar,
          isso não pode ser desfeito.
        </p>
      </Modal>
    </div>
  );
}

/* ==========================================================================
   Cartão de material — visualização + anotação lado a lado
   ========================================================================== */

function MaterialCard({
  item,
  onOpen,
  onDelete,
  onNotesChange,
}: {
  item: MaterialItem;
  onOpen: () => void;
  onDelete: () => void;
  onNotesChange: (notes: string) => void;
}) {
  // Rascunho local para o textarea não gravar no storage a cada tecla. O cartão
  // é a única origem de edição destas anotações, então o valor inicial basta —
  // não há alteração externa para sincronizar.
  const [draft, setDraft] = React.useState(item.notes);
  const [saved, setSaved] = React.useState(false);

  function save() {
    if (draft === item.notes) return;
    onNotesChange(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        {/* O material */}
        <div className="relative border-b border-rule bg-paper-sunken/60 lg:border-r lg:border-b-0">
          <MaterialPreview item={item} />
          <Button
            variant="outline"
            size="sm"
            onClick={onOpen}
            className="absolute top-3 right-3 shadow-page"
          >
            <Maximize2 />
            Ampliar
          </Button>
        </div>

        {/* A ficha e as anotações */}
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="display text-[1.0625rem] leading-snug font-semibold text-balance text-ink">
                {item.title}
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                <span>{formatDayKey(item.date)}</span>
                <span aria-hidden>·</span>
                <span>{formatBytes(item.fileSize)}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label={`Remover ${item.title}`}
            >
              <Trash2 />
            </Button>
          </div>

          {item.subject ? <Badge tone="brass">{item.subject}</Badge> : null}

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <label
              htmlFor={`notes-${item.id}`}
              className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-muted uppercase"
            >
              Minhas anotações
            </label>
            <Textarea
              id={`notes-${item.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              placeholder="O que a professora explicou, o que você entendeu, o que ficou em dúvida…"
              className="ruled-paper min-h-32 flex-1 border-rule bg-paper-raised"
            />
            <div className="flex h-6 items-center justify-between">
              <span className="text-xs text-sage">
                {saved ? "Anotação salva." : draft !== item.notes ? "Alterações não salvas." : ""}
              </span>
              {draft !== item.notes ? (
                <Button variant="outline" size="sm" onClick={save}>
                  Salvar
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function MaterialPreview({ item, tall = false }: { item: MaterialItem; tall?: boolean }) {
  if (item.fileType === "application/pdf") {
    return (
      <object
        data={item.dataUrl}
        type="application/pdf"
        className={tall ? "h-[70vh] w-full" : "h-72 w-full"}
        aria-label={`PDF: ${item.title}`}
      >
        {/* Alguns navegadores não embutem PDF — a alternativa é abrir em aba. */}
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <FileText className="size-8 text-ink-faint" />
          <p className="text-sm text-ink-muted">
            Este navegador não mostra o PDF aqui dentro.
          </p>
          <a
            href={item.dataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brass underline decoration-brass/30 underline-offset-4"
          >
            Abrir {item.fileName} em nova aba
          </a>
        </div>
      </object>
    );
  }

  return (
    <div className={tall ? "relative h-[70vh] w-full" : "relative h-72 w-full"}>
      {/* Data URL local: `unoptimized` porque não há o que o otimizador faça aqui. */}
      <Image
        src={item.dataUrl}
        alt={item.title}
        fill
        unoptimized
        sizes="(max-width: 1024px) 100vw, 55vw"
        className={tall ? "object-contain" : "object-cover"}
      />
    </div>
  );
}

/* ==========================================================================
   Adicionar material
   ========================================================================== */

function AddMaterialModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: MaterialItem) => void;
}) {
  const [file, setFile] = React.useState<PreparedFile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [date, setDate] = React.useState(dayKey);
  const [notes, setNotes] = React.useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setBusy(true);
    setError(null);
    try {
      const prepared = await prepareFile(picked);
      setFile(prepared);
      // Sugere o nome do arquivo como título, sem a extensão.
      if (!title) setTitle(prepared.fileName.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(
        err instanceof FileRejected ? err.message : "Não foi possível preparar este arquivo.",
      );
      setFile(null);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (!file || !title.trim()) return;
    onAdd({
      id: uid(),
      title: title.trim(),
      subject: subject.trim(),
      date,
      notes: notes.trim(),
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      dataUrl: file.dataUrl,
      createdAt: Date.now(),
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Adicionar material"
      description="Imagem (JPG, PNG, WEBP) ou PDF. Imagens são reduzidas automaticamente para caber no navegador."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="brass" onClick={submit} disabled={!file || !title.trim() || busy}>
            Salvar material
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Seleção de arquivo */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rule-strong bg-paper-sunken/50 px-6 py-8 text-center transition-colors hover:border-brass-soft hover:bg-brass-wash">
          <Upload className="size-5 text-brass" />
          <span className="text-sm font-medium text-ink">
            {busy
              ? "Preparando…"
              : file
                ? file.fileName
                : "Escolher imagem ou PDF"}
          </span>
          <span className="text-xs text-ink-faint">
            {file
              ? `${formatBytes(file.fileSize)} depois do processamento`
              : "JPG · PNG · WEBP · PDF"}
          </span>
          <input
            type="file"
            accept={ACCEPT_ATTR}
            onChange={onPick}
            className="sr-only"
            disabled={busy}
          />
        </label>

        {error ? (
          <Callout title="Arquivo não aceito" tone="brass" icon={<AlertTriangle />}>
            {error}
          </Callout>
        ) : null}

        <Field label="Título">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Exercícios de leitura — clave de sol"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assunto">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex.: Escalas maiores"
            />
          </Field>
          <Field label="Data da aula">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Observações" hint="Você pode editar isso depois, direto no cartão.">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="O que foi explicado nesta aula…"
          />
        </Field>
      </div>
    </Modal>
  );
}
