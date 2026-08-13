"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Circle, Copy, Files, Grid2X2Check, Hand, HelpCircle, LayoutTemplate, MousePointer2, Music2, Plus, RectangleHorizontal, Redo2, StickyNote, TextCursorInput, Trash2, TrendingUp, Undo2 } from "lucide-react";
import { MusicCanvas } from "@/components/atelier/music-canvas";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/overlay";
import { SectionHeading } from "@/components/ui/prose";
import { lessonSummaryTemplate, majorScaleTemplate, rhythmStudyTemplate } from "@/lib/atelier/templates";
import { EMPTY_BOARDS, TEACHING_CARDS, type AtelierBoard, type AtelierTool, type TeachingCardId } from "@/lib/atelier/types";
import { SCALES } from "@/lib/music/scales";
import { KEYS } from "@/lib/storage/local";
import { usePersistentState } from "@/lib/storage/use-persistent-state";
import { useTrackTopic } from "@/lib/study/provider";
import { cn, formatRelative, uid } from "@/lib/utils";

const HISTORY_LIMIT = 40;
const TOOLS: Array<{ id: AtelierTool; label: string; icon: React.ComponentType<{ className?: string }>; key?: string }> = [
  { id: "select", label: "Selecionar", icon: MousePointer2, key: "V" }, { id: "pan", label: "Mover quadro", icon: Hand, key: "H" }, { id: "text", label: "Texto", icon: TextCursorInput, key: "T" }, { id: "staff", label: "Pentagrama", icon: Music2, key: "P" }, { id: "note", label: "Nota", icon: StickyNote, key: "N" }, { id: "arrow", label: "Seta", icon: TrendingUp }, { id: "rectangle", label: "Retângulo", icon: RectangleHorizontal }, { id: "circle", label: "Círculo", icon: Circle },
];
function timestamp() { return Date.now(); }
function newBoard(): AtelierBoard { const now = timestamp(); return { id: uid(), title: "Novo estudo visual", elements: [], createdAt: now, updatedAt: now }; }

export function AtelierStudio() {
  useTrackTopic("/atelie-de-partitura", "Ateliê de Partitura");
  const { value: boards, set: setBoards, ready } = usePersistentState<AtelierBoard[]>(KEYS.atelier, EMPTY_BOARDS);
  const [activeId, setActiveIdState] = React.useState<string | null>(null);
  const [tool, setTool] = React.useState<AtelierTool>("select");
  const [snap, setSnap] = React.useState(true);
  const [cardsOpen, setCardsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [scaleId, setScaleId] = React.useState(SCALES[0].id);
  const [confirmDelete, setConfirmDelete] = React.useState<AtelierBoard | null>(null);
  const [past, setPast] = React.useState<AtelierBoard[]>([]);
  const [future, setFuture] = React.useState<AtelierBoard[]>([]);
  const active = boards.find((board) => board.id === activeId) ?? null;

  function setActiveId(id: string | null) { setActiveIdState(id); setPast([]); setFuture([]); setTool("select"); }
  const persist = React.useCallback((board: AtelierBoard) => setBoards((current) => current.map((item) => item.id === board.id ? board : item)), [setBoards]);
  const changeBoard = React.useCallback((next: AtelierBoard, options?: { record?: boolean; previous?: AtelierBoard }) => {
    const shouldRecord = options?.record !== false;
    if (shouldRecord) {
      const previous = options?.previous ?? boards.find((item) => item.id === next.id);
      if (previous && JSON.stringify(previous.elements) !== JSON.stringify(next.elements)) setPast((items) => [...items, previous].slice(-HISTORY_LIMIT));
      setFuture([]);
    }
    persist(next);
  }, [boards, persist]);
  const undo = React.useCallback(() => {
    if (!active || !past.length) return;
    const previous = past[past.length - 1]; setPast((items) => items.slice(0, -1)); setFuture((items) => [active, ...items].slice(0, HISTORY_LIMIT)); persist(previous);
  }, [active, past, persist]);
  const redo = React.useCallback(() => {
    if (!active || !future.length) return;
    const next = future[0]; setFuture((items) => items.slice(1)); setPast((items) => [...items, active].slice(-HISTORY_LIMIT)); persist(next);
  }, [active, future, persist]);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (editing) return;
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if (!command && !event.altKey && !event.shiftKey) {
        const found = TOOLS.find((item) => item.key?.toLowerCase() === event.key.toLowerCase());
        if (found) setTool(found.id);
      }
    }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo]);

  function insertBoard(board: AtelierBoard) { setBoards((items) => [board, ...items]); setActiveId(board.id); setTemplateOpen(false); }
  function create() { insertBoard(newBoard()); }
  function duplicate(board: AtelierBoard) { const now = timestamp(); const copy = { ...board, id: uid(), title: `${board.title} — cópia`, createdAt: now, updatedAt: now, elements: board.elements.map((element) => ({ ...element, id: uid() })) }; setBoards((items) => [copy, ...items]); setActiveId(copy.id); }
  function addCard(preset: TeachingCardId) { if (!active) return; changeBoard({ ...active, updatedAt: timestamp(), elements: [...active.elements, { id: uid(), type: "card", preset, x: 90 + active.elements.length * 12, y: 80 + active.elements.length * 12, width: 270, height: 115 }] }, { previous: active }); setTool("select"); }

  if (!ready) return <Card className="flex h-72 items-center justify-center"><p className="text-sm text-ink-faint">Abrindo o ateliê…</p></Card>;
  if (!active) return <div className="flex flex-col gap-8"><SectionHeading eyebrow="Meu caderno" title="Ateliê de Partitura" description="Uma mesa visual para montar pautas, organizar ideias e reconstruir explicações musicais." /><div className="flex flex-wrap gap-2"><Button variant="brass" onClick={create}><Plus /> Quadro em branco</Button><Button onClick={() => setTemplateOpen(true)}><LayoutTemplate /> Usar template</Button><Link href="/caderno" className={buttonClass({ variant: "ghost" })}>Ver anotações <ArrowRight /></Link></div>{boards.length === 0 ? <div className="rounded-xl bg-paper-sunken/35 px-6 py-16 text-center"><Music2 className="mx-auto size-6 text-ink-muted" /><p className="display mt-4 text-xl font-semibold">Uma mesa pronta para o próximo estudo.</p><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">Comece livremente ou use um modelo para resumir uma aula ou explorar uma escala.</p></div> : <div className="grid gap-3 sm:grid-cols-2">{boards.map((board) => <Card key={board.id} className="group cursor-pointer transition hover:border-rule-strong hover:bg-paper-raised" onClick={() => setActiveId(board.id)}><CardContent className="pt-5"><div className="flex items-start justify-between gap-3"><div><p className="display font-semibold text-ink">{board.title}</p><p className="mt-1 text-xs text-ink-faint">{board.elements.length} elementos · {formatRelative(board.updatedAt)}</p></div><Files className="size-4 text-ink-faint" /></div><div className="mt-5 flex gap-1 border-t border-rule pt-3"><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); duplicate(board); }}><Copy /> Duplicar</Button><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); setConfirmDelete(board); }}><Trash2 /> Apagar</Button></div></CardContent></Card>)}</div>}<TemplateModal open={templateOpen} scaleId={scaleId} onScale={setScaleId} onClose={() => setTemplateOpen(false)} onLesson={() => insertBoard(lessonSummaryTemplate())} onScaleTemplate={() => insertBoard(majorScaleTemplate(scaleId))} onRhythm={() => insertBoard(rhythmStudyTemplate())} /><DeleteModal board={confirmDelete} onClose={() => setConfirmDelete(null)} onDelete={() => { if (confirmDelete) setBoards((items) => items.filter((board) => board.id !== confirmDelete.id)); setConfirmDelete(null); }} /></div>;

  return <div className="flex flex-col gap-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1"><button className="text-xs text-ink-faint hover:text-ink" onClick={() => setActiveId(null)}>← Todos os quadros</button><Input value={active.title} onChange={(event) => persist({ ...active, title: event.target.value, updatedAt: timestamp() })} className="display mt-1 h-auto border-0 bg-transparent px-0 py-0 text-2xl font-semibold shadow-none focus-visible:outline-none" aria-label="Nome do quadro" /></div><p className="text-xs text-ink-faint">Salvo automaticamente</p></div>
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-rule bg-paper-raised p-1.5" role="toolbar" aria-label="Ferramentas do quadro"><div className="flex items-center border-r border-rule pr-1"><Button variant="ghost" size="icon" disabled={!past.length} onClick={undo} aria-label="Desfazer"><Undo2 /></Button><Button variant="ghost" size="icon" disabled={!future.length} onClick={redo} aria-label="Refazer"><Redo2 /></Button></div>{TOOLS.map(({ id, label, icon: Icon, key }) => <button key={id} type="button" title={`${label}${key ? ` · ${key}` : ""}`} aria-pressed={tool === id} onClick={() => setTool(id)} className={cn("flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition-colors", tool === id ? "bg-ink text-paper" : "text-ink-muted hover:bg-paper-sunken hover:text-ink")}><Icon className="size-4" /><span className="hidden xl:inline">{label}</span></button>)}<div className="ml-auto flex items-center gap-1 border-l border-rule pl-1"><Button variant={snap ? "outline" : "ghost"} size="sm" onClick={() => setSnap((value) => !value)} aria-pressed={snap}><Grid2X2Check /> Ajustar</Button><Button variant="ghost" size="sm" onClick={() => setCardsOpen((value) => !value)}><StickyNote /> Cartões</Button><Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)} aria-label="Ver atalhos"><HelpCircle /></Button></div></div>
    {cardsOpen ? <div className="animate-rise grid gap-2 rounded-xl bg-paper-sunken/45 p-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(TEACHING_CARDS).map(([id, card]) => <button key={id} onClick={() => addCard(id as TeachingCardId)} className="rounded-lg border border-rule bg-paper-raised p-3 text-left transition hover:border-rule-strong"><span className="display text-sm font-semibold">{card.title}</span><span className="mt-1 block text-xs text-ink-muted">{card.body}</span></button>)}</div> : null}
    <MusicCanvas board={active} tool={tool} snap={snap} onChange={changeBoard} />
    <div className="flex flex-wrap justify-between gap-2 text-[0.6875rem] text-ink-faint"><span>{snap ? "Alinhamento leve ativo" : "Movimento livre"}</span><span className="hidden sm:inline">Espaço + arrastar move o quadro · Shift seleciona vários · Ctrl+D duplica</span></div>
    <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
  </div>;
}

function TemplateModal({ open, scaleId, onScale, onClose, onLesson, onScaleTemplate, onRhythm }: { open: boolean; scaleId: string; onScale: (id: string) => void; onClose: () => void; onLesson: () => void; onScaleTemplate: () => void; onRhythm: () => void }) { return <Modal open={open} onClose={onClose} title="Começar com um template" description="Estruturas iniciais editáveis — tudo pode ser movido, alterado ou apagado." size="lg"><div className="grid gap-4 sm:grid-cols-2"><button onClick={onLesson} className="rounded-xl border border-rule bg-paper-raised p-5 text-left transition hover:border-rule-strong hover:bg-paper-sunken/40"><LayoutTemplate className="size-5 text-ink-muted" /><p className="display mt-4 font-semibold">Resumo de aula</p><p className="mt-2 text-sm leading-relaxed text-ink-muted">Título, pauta, lembrete e espaços organizados para registrar uma aula.</p></button><button onClick={onRhythm} className="rounded-xl border border-rule bg-paper-raised p-5 text-left transition hover:border-rule-strong hover:bg-paper-sunken/40"><Music2 className="size-5 text-ink-muted" /><p className="display mt-4 font-semibold">Estudo de ritmo</p><p className="mt-2 text-sm leading-relaxed text-ink-muted">Pulsação, compasso 4/4 e espaço para reconstruir padrões.</p></button><div className="rounded-xl border border-rule bg-paper-raised p-5 sm:col-span-2"><Music2 className="size-5 text-ink-muted" /><p className="display mt-4 font-semibold">Escala maior</p><p className="mt-2 text-sm leading-relaxed text-ink-muted">Pauta, notas, fórmula e anotações derivados da tonalidade.</p><Select value={scaleId} onChange={(event) => onScale(event.target.value)} className="mt-4">{SCALES.map((scale) => <option key={scale.id} value={scale.id}>{scale.label}</option>)}</Select><Button variant="brass" className="mt-3 w-full" onClick={onScaleTemplate}>Criar estudo da escala</Button></div></div></Modal>; }
function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) { const shortcuts = [["Ctrl Z", "Desfazer"], ["Ctrl Shift Z", "Refazer"], ["Ctrl D", "Duplicar seleção"], ["Delete", "Apagar seleção"], ["Shift + clique", "Selecionar vários"], ["Espaço + arrastar", "Mover quadro"], ["V / H / T / P / N", "Ferramentas principais"]]; return <Modal open={open} onClose={onClose} title="Atalhos do ateliê"><dl className="divide-y divide-rule">{shortcuts.map(([key, action]) => <div key={key} className="flex items-center justify-between gap-4 py-2.5"><dt className="text-sm text-ink-muted">{action}</dt><dd><kbd className="rounded border border-rule bg-paper-sunken px-2 py-1 text-xs text-ink-soft">{key}</kbd></dd></div>)}</dl></Modal>; }
function DeleteModal({ board, onClose, onDelete }: { board: AtelierBoard | null; onClose: () => void; onDelete: () => void }) { return <Modal open={board !== null} onClose={onClose} title="Apagar quadro?" description={board ? `“${board.title}” será removido deste navegador.` : undefined} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="solid" onClick={onDelete}><Trash2 /> Apagar</Button></>}/>; }
