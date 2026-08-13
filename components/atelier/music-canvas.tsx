"use client";

import * as React from "react";
import { Copy, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCIDENTAL_SIGN, ledgerSlots, noteAtSlot, noteName, slotOf } from "@/lib/music/notes";
import { TEACHING_CARDS, type AtelierBoard, type AtelierElement, type AtelierTool, type StaffElement } from "@/lib/atelier/types";
import { cn, uid } from "@/lib/utils";

export const CANVAS_W = 1100;
export const CANVAS_H = 680;
const MIN_SIZE = 54;
const SNAP = 12;
type ChangeOptions = { record?: boolean; previous?: AtelierBoard };
type Gesture =
  | { kind: "move"; pointerId: number; start: { x: number; y: number }; initial: AtelierBoard; ids: string[] }
  | { kind: "resize"; pointerId: number; start: { x: number; y: number }; initial: AtelierBoard; id: string }
  | { kind: "note"; pointerId: number; initial: AtelierBoard; staffId: string; noteId: string }
  | { kind: "pan"; pointerId: number; start: { x: number; y: number }; origin: { x: number; y: number } };

export function MusicCanvas({ board, tool, snap, onChange }: { board: AtelierBoard; tool: AtelierTool; snap: boolean; onChange: (board: AtelierBoard, options?: ChangeOptions) => void }) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = React.useState(false);
  const gesture = React.useRef<Gesture | null>(null);
  const boardRef = React.useRef(board);
  React.useEffect(() => { boardRef.current = board; }, [board]);

  const changed = React.useCallback((elements: AtelierElement[], options?: ChangeOptions) => {
    onChange({ ...boardRef.current, elements, updatedAt: Date.now() }, options);
  }, [onChange]);

  const removeSelected = React.useCallback(() => {
    if (!selected.length) return;
    changed(boardRef.current.elements.filter((element) => !selected.includes(element.id)), { previous: boardRef.current });
    setSelected([]);
  }, [changed, selected]);

  const duplicateSelected = React.useCallback(() => {
    if (!selected.length) return;
    const copies = boardRef.current.elements.filter((element) => selected.includes(element.id)).map((element) => ({ ...element, id: uid(), x: element.x + 24, y: element.y + 24 }));
    changed([...boardRef.current.elements, ...copies], { previous: boardRef.current });
    setSelected(copies.map((element) => element.id));
  }, [changed, selected]);

  React.useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.code === "Space" && !editing) { event.preventDefault(); setSpaceDown(true); }
      if (editing) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selected.length) { event.preventDefault(); removeSelected(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && selected.length) { event.preventDefault(); duplicateSelected(); }
    }
    const keyUp = (event: KeyboardEvent) => { if (event.code === "Space") setSpaceDown(false); };
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
    return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); };
  }, [duplicateSelected, removeSelected, selected.length]);

  function point(event: React.PointerEvent, root: HTMLElement) {
    const rect = root.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
  }
  function snapped(value: number) { return snap ? Math.round(value / SNAP) * SNAP : value; }
  function addAt(x: number, y: number) {
    let element: AtelierElement | null = null;
    if (tool === "staff") element = { id: uid(), type: "staff", x, y, width: 430, height: 140, notes: [] };
    if (tool === "text") element = { id: uid(), type: "text", x, y, width: 240, height: 80, text: "Escreva sua observação", style: "body" };
    if (tool === "rectangle" || tool === "circle") element = { id: uid(), type: tool, x, y, width: 180, height: 100 };
    if (tool === "arrow") element = { id: uid(), type: "arrow", x, y, width: 180, height: 70 };
    if (element) { changed([...board.elements, element], { previous: board }); setSelected([element.id]); }
  }
  function canvasDown(event: React.PointerEvent<HTMLDivElement>) {
    const isPaper = event.target === event.currentTarget;
    if ((tool === "pan" || spaceDown || event.button === 1) && isPaper) {
      event.preventDefault(); gesture.current = { kind: "pan", pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: pan }; event.currentTarget.setPointerCapture(event.pointerId); return;
    }
    if (!isPaper) return;
    if (tool === "select") { setSelected([]); return; }
    if (tool === "note" || tool === "pan") return;
    const at = point(event, event.currentTarget);
    addAt(snapped(at.x), snapped(at.y));
  }
  function elementDown(event: React.PointerEvent, element: AtelierElement) {
    if (tool !== "select" || spaceDown) return;
    event.stopPropagation();
    const ids = event.shiftKey ? (selected.includes(element.id) ? selected.filter((id) => id !== element.id) : [...selected, element.id]) : (selected.includes(element.id) ? selected : [element.id]);
    setSelected(ids);
    const root = (event.currentTarget as HTMLElement).closest("[data-canvas]") as HTMLElement;
    gesture.current = { kind: "move", pointerId: event.pointerId, start: point(event, root), initial: structuredClone(boardRef.current), ids };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function resizeDown(event: React.PointerEvent, element: AtelierElement) {
    event.preventDefault(); event.stopPropagation();
    const root = (event.currentTarget as HTMLElement).closest("[data-canvas]") as HTMLElement;
    gesture.current = { kind: "resize", pointerId: event.pointerId, start: point(event, root), initial: structuredClone(boardRef.current), id: element.id };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function pointerMove(event: React.PointerEvent) {
    const current = gesture.current; if (!current || current.pointerId !== event.pointerId) return;
    if (current.kind === "pan") { setPan({ x: current.origin.x + event.clientX - current.start.x, y: current.origin.y + event.clientY - current.start.y }); return; }
    const root = (event.currentTarget as HTMLElement).closest("[data-canvas]") as HTMLElement;
    const at = point(event, root);
    if (current.kind === "move") {
      const dx = at.x - current.start.x; const dy = at.y - current.start.y;
      changed(current.initial.elements.map((element) => current.ids.includes(element.id) ? { ...element, x: Math.max(0, snapped(element.x + dx)), y: Math.max(0, snapped(element.y + dy)) } : element), { record: false });
    }
    if (current.kind === "resize") {
      changed(current.initial.elements.map((element) => element.id === current.id ? { ...element, width: Math.max(MIN_SIZE, snapped(element.width + at.x - current.start.x)), height: Math.max(MIN_SIZE, snapped(element.height + at.y - current.start.y)) } : element), { record: false });
    }
  }
  function pointerUp(event: React.PointerEvent) {
    const current = gesture.current; if (!current || current.pointerId !== event.pointerId) return;
    if (current.kind !== "pan") onChange(boardRef.current, { previous: current.initial });
    gesture.current = null;
  }
  function noteDown(event: React.PointerEvent, staff: StaffElement, noteId: string) {
    if (tool !== "select") return;
    event.preventDefault(); event.stopPropagation(); setSelected([staff.id]);
    gesture.current = { kind: "note", pointerId: event.pointerId, initial: structuredClone(boardRef.current), staffId: staff.id, noteId };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function noteMove(event: React.PointerEvent, staff: StaffElement) {
    const current = gesture.current; if (!current || current.kind !== "note" || current.pointerId !== event.pointerId) return;
    const rect = (event.currentTarget as HTMLElement).closest("[data-staff]")!.getBoundingClientRect();
    const x = Math.max(0.12, Math.min(0.94, (event.clientX - rect.left) / rect.width));
    const slot = slotFromY((event.clientY - rect.top) / rect.height);
    changed(boardRef.current.elements.map((element) => element.id === staff.id && element.type === "staff" ? { ...element, notes: element.notes.map((entry, index) => noteEntryId(entry, index, staff.id) === current.noteId ? { ...entry, id: current.noteId, x, note: noteAtSlot(slot) } : entry).sort((a, b) => a.x - b.x) } : element), { record: false });
  }
  function addNote(event: React.PointerEvent, staff: StaffElement) {
    if (tool !== "note") return;
    event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect();
    const entry = { id: uid(), note: noteAtSlot(slotFromY((event.clientY - rect.top) / rect.height)), x: Math.max(0.12, Math.min(0.94, (event.clientX - rect.left) / rect.width)) };
    changed(board.elements.map((element) => element.id === staff.id && element.type === "staff" ? { ...element, notes: [...element.notes, entry].sort((a, b) => a.x - b.x) } : element), { previous: board });
  }

  return <div className="relative overflow-hidden rounded-xl border border-rule bg-paper-sunken/30">
    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-lg border border-rule bg-paper-raised/95 p-1 shadow-page backdrop-blur"><Button size="icon" variant="ghost" onClick={() => setZoom((value) => Math.max(.5, value - .1))} aria-label="Diminuir zoom"><Minus /></Button><span className="tabular w-12 text-center text-xs text-ink-muted">{Math.round(zoom * 100)}%</span><Button size="icon" variant="ghost" onClick={() => setZoom((value) => Math.min(2, value + .1))} aria-label="Aumentar zoom"><Plus /></Button></div>
    <div className={cn("relative h-[min(68vh,680px)] min-h-[34rem] overflow-hidden", (tool === "pan" || spaceDown) ? "cursor-grab active:cursor-grabbing" : "cursor-default")}>
      <div data-canvas className="atelier-canvas absolute left-0 top-0 h-[680px] w-[1100px] origin-top-left bg-paper-raised touch-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} onPointerDown={canvasDown} onPointerMove={pointerMove} onPointerUp={pointerUp} role="application" aria-label="Quadro musical">
        {board.elements.map((element) => <div key={element.id} style={{ left: element.x, top: element.y, width: element.width, height: element.height }} className={cn("group absolute", selected.includes(element.id) && "outline outline-1 outline-offset-2 outline-ink-muted")} onPointerDown={(event) => elementDown(event, element)} onPointerMove={pointerMove} onPointerUp={pointerUp}>
          <CanvasElement element={element} tool={tool} onAddNote={addNote} onNoteDown={noteDown} onNoteMove={noteMove} onNoteUp={pointerUp} onText={(text) => changed(board.elements.map((item) => item.id === element.id ? { ...item, text } as AtelierElement : item), { previous: board })} />
          {selected.length === 1 && selected[0] === element.id ? <button type="button" className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-full border border-ink-muted bg-paper-raised shadow-page" onPointerDown={(event) => resizeDown(event, element)} onPointerMove={pointerMove} onPointerUp={pointerUp} aria-label="Redimensionar elemento" /> : null}
        </div>)}
        {board.elements.length === 0 ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center"><div><p className="display text-xl font-semibold text-ink-muted">Seu quadro começa em branco.</p><p className="mt-2 text-sm text-ink-faint">Escolha uma ferramenta e toque no papel.</p></div></div> : null}
      </div>
    </div>
    {selected.length ? <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-rule bg-paper-raised/95 p-1 shadow-lift"><span className="px-2 text-xs text-ink-faint">{selected.length > 1 ? `${selected.length} itens` : "Selecionado"}</span><Button size="icon" variant="ghost" aria-label="Duplicar seleção" onClick={duplicateSelected}><Copy /></Button><Button size="icon" variant="ghost" aria-label="Apagar seleção" onClick={removeSelected}><Trash2 /></Button></div> : null}
  </div>;
}

function slotFromY(y: number) { return Math.max(-2, Math.min(10, Math.round((.70 - y) / .061))); }
function noteEntryId(entry: StaffElement["notes"][number], index: number, staffId: string) { return entry.id ?? `${staffId}-legacy-${index}`; }

function CanvasElement({ element, tool, onAddNote, onNoteDown, onNoteMove, onNoteUp, onText }: { element: AtelierElement; tool: AtelierTool; onAddNote: (event: React.PointerEvent, staff: StaffElement) => void; onNoteDown: (event: React.PointerEvent, staff: StaffElement, noteId: string) => void; onNoteMove: (event: React.PointerEvent, staff: StaffElement) => void; onNoteUp: (event: React.PointerEvent) => void; onText: (text: string) => void }) {
  if (element.type === "staff") return <AtelierStaff staff={element} tool={tool} onAddNote={onAddNote} onNoteDown={onNoteDown} onNoteMove={onNoteMove} onNoteUp={onNoteUp} />;
  if (element.type === "text") return <textarea value={element.text} onChange={(event) => onText(event.target.value)} className={cn("h-full w-full resize-none border-0 bg-transparent p-2 text-ink outline-none", element.style === "title" ? "display text-2xl font-semibold" : element.style === "label" ? "text-center text-sm font-medium" : "text-sm leading-relaxed")} aria-label="Texto do quadro" />;
  if (element.type === "card") { const card = TEACHING_CARDS[element.preset]; return <div className="h-full overflow-hidden rounded-xl border border-rule bg-paper-sunken/55 p-4"><p className="display font-semibold text-ink">{card.title}</p><p className="mt-2 text-sm text-ink-soft">{card.body}</p></div>; }
  if (element.type === "arrow") return <svg viewBox="0 0 180 70" preserveAspectRatio="none" className="h-full w-full" aria-label="Seta"><defs><marker id={`arrow-${element.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="var(--ink-muted)" /></marker></defs><line x1="8" y1="60" x2="168" y2="10" stroke="var(--ink-muted)" strokeWidth="3" markerEnd={`url(#arrow-${element.id})`} /></svg>;
  return <div className={cn("h-full border border-ink-faint/70 bg-paper-sunken/40", element.type === "circle" ? "rounded-full" : "rounded-xl")} />;
}

function AtelierStaff({ staff, tool, onAddNote, onNoteDown, onNoteMove, onNoteUp }: { staff: StaffElement; tool: AtelierTool; onAddNote: (event: React.PointerEvent, staff: StaffElement) => void; onNoteDown: (event: React.PointerEvent, staff: StaffElement, id: string) => void; onNoteMove: (event: React.PointerEvent, staff: StaffElement) => void; onNoteUp: (event: React.PointerEvent) => void }) {
  const lineY = (slot: number) => 78 - slot * 7;
  return <svg data-staff viewBox="0 0 500 116" preserveAspectRatio="none" className={cn("h-full w-full rounded-lg bg-paper-raised", tool === "note" && "cursor-crosshair")} onPointerDown={(event) => onAddNote(event, staff)} aria-label="Pentagrama editável">
    {[22, 36, 50, 64, 78].map((y) => <line key={y} x1="4" x2="496" y1={y} y2={y} stroke="var(--rule-strong)" strokeWidth="1.3" />)}
    <text x="12" y="83" fontSize="72" fontFamily="serif" fill="var(--ink)">𝄞</text>
    {staff.notes.map((entry, index) => { const slot = slotOf(entry.note); const x = entry.x * 500; const y = lineY(slot); const id = noteEntryId(entry, index, staff.id); return <g key={id} className={tool === "select" ? "cursor-move" : ""} onPointerDown={(event) => onNoteDown(event, staff, id)} onPointerMove={(event) => onNoteMove(event, staff)} onPointerUp={onNoteUp}>
      {ledgerSlots(slot).map((ledger) => <line key={ledger} x1={x - 14} x2={x + 14} y1={lineY(ledger)} y2={lineY(ledger)} stroke="var(--ink-muted)" strokeWidth="1.2" />)}
      {entry.note.accidental ? <text x={x - 13} y={y + 5} textAnchor="end" fontSize="19" fill="var(--ink)">{ACCIDENTAL_SIGN[entry.note.accidental]}</text> : null}
      <ellipse cx={x} cy={y} rx="9" ry="6.2" fill="var(--ink)" transform={`rotate(-20 ${x} ${y})`} />
      <text x={x} y="110" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-muted)">{noteName(entry.note)}</text>
    </g>; })}
  </svg>;
}
