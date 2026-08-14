"use client";
import * as React from "react";
import { Copy, Focus, LocateFixed, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import {
  ACCIDENTAL_SIGN,
  ledgerSlots,
  noteAtSlot,
  noteName,
  slotOf,
} from "@/lib/music/notes";
import {
  TEACHING_CARDS,
  type ArrowElement,
  type AtelierBoard,
  type AtelierElement,
  type AtelierTool,
  type StaffElement,
  type ShapeElement,
  type TextElement,
} from "@/lib/atelier/types";
import { cn, uid } from "@/lib/utils";
export const CANVAS_W = 1800,
  CANVAS_H = 1100;
const MIN_SIZE = 36,
  SNAP = 12;
type ChangeOptions = { record?: boolean; previous?: AtelierBoard };
type XY = { x: number; y: number };
type Gesture =
  | { kind: "pan"; pointerId: number; screen: XY; origin: XY }
  | {
      kind: "move";
      pointerId: number;
      at: XY;
      initial: AtelierBoard;
      ids: string[];
    }
  | {
      kind: "resize";
      pointerId: number;
      at: XY;
      initial: AtelierBoard;
      id: string;
    }
  | {
      kind: "endpoint";
      pointerId: number;
      initial: AtelierBoard;
      id: string;
      which: "start" | "end";
    }
  | {
      kind: "note";
      pointerId: number;
      initial: AtelierBoard;
      staffId: string;
      noteId: string;
    }
  | {
      kind: "create";
      pointerId: number;
      at: XY;
      initial: AtelierBoard;
      id: string;
    }
  | { kind: "marquee"; pointerId: number; at: XY; additive: boolean };
export function MusicCanvas({
  board,
  tool,
  snap,
  onChange,
}: {
  board: AtelierBoard;
  tool: AtelierTool;
  snap: boolean;
  onChange: (board: AtelierBoard, options?: ChangeOptions) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]),
    [zoom, setZoom] = React.useState(1),
    [pan, setPan] = React.useState({ x: 0, y: 0 }),
    [space, setSpace] = React.useState(false),
    [marquee, setMarquee] = React.useState<{ a: XY; b: XY } | null>(null);
  const gesture = React.useRef<Gesture | null>(null),
    viewport = React.useRef<HTMLDivElement | null>(null),
    boardRef = React.useRef(board);
  React.useEffect(() => {
    boardRef.current = board;
  }, [board]);
  const changed = React.useCallback(
    (elements: AtelierElement[], options?: ChangeOptions) =>
      onChange(
        { ...boardRef.current, elements, updatedAt: Date.now() },
        options,
      ),
    [onChange],
  );
  const remove = React.useCallback(() => {
    if (!selected.length) return;
    changed(
      boardRef.current.elements.filter((e) => !selected.includes(e.id)),
      { previous: boardRef.current },
    );
    setSelected([]);
  }, [changed, selected]);
  const duplicate = React.useCallback(() => {
    const copies = boardRef.current.elements
      .filter((e) => selected.includes(e.id))
      .map((e) => ({ ...e, id: uid(), x: e.x + 24, y: e.y + 24 }));
    if (!copies.length) return;
    changed([...boardRef.current.elements, ...copies], {
      previous: boardRef.current,
    });
    setSelected(copies.map((e) => e.id));
  }, [changed, selected]);
  React.useEffect(() => {
    function down(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null,
        editing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (e.code === "Space" && !editing) {
        e.preventDefault();
        setSpace(true);
      }
      if (editing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selected.length) {
        e.preventDefault();
        remove();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
      }
    }
    function up(e: KeyboardEvent) {
      if (e.code === "Space") setSpace(false);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [duplicate, remove, selected.length]);
  function at(e: React.PointerEvent, root: HTMLElement) {
    const r = root.getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
  }
  function grid(n: number) {
    return snap ? Math.round(n / SNAP) * SNAP : n;
  }
  function capture(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function canvasDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const p = at(e, e.currentTarget);
    if (tool === "pan" || space || e.button === 1) {
      gesture.current = {
        kind: "pan",
        pointerId: e.pointerId,
        screen: { x: e.clientX, y: e.clientY },
        origin: pan,
      };
      capture(e);
      return;
    }
    if (tool === "select") {
      if (!e.shiftKey) setSelected([]);
      gesture.current = {
        kind: "marquee",
        pointerId: e.pointerId,
        at: p,
        additive: e.shiftKey,
      };
      setMarquee({ a: p, b: p });
      capture(e);
      return;
    }
    if (tool === "note" || tool === "card") return;
    if (tool === "text") {
      const element: TextElement = {
        id: uid(),
        type: "text",
        x: grid(p.x),
        y: grid(p.y),
        width: 260,
        height: 84,
        text: "Escreva sua observação",
        style: "body",
      };
      changed([...boardRef.current.elements, element], {
        previous: boardRef.current,
      });
      setSelected([element.id]);
      return;
    }
    const id = uid();
    let element: AtelierElement;
    if (tool === "staff")
      element = {
        id,
        type: "staff",
        x: p.x,
        y: p.y,
        width: 1,
        height: 1,
        notes: [],
        clef: "treble",
        spacing: 14,
        showLedger: true,
      };
    else if (tool === "arrow" || tool === "line")
      element = {
        id,
        type: tool,
        x: p.x,
        y: p.y,
        width: 1,
        height: 1,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        strokeWidth: 1,
        arrowhead: tool === "arrow",
      };
    else
      element = {
        id,
        type: tool as "rectangle" | "circle",
        x: p.x,
        y: p.y,
        width: 1,
        height: 1,
        strokeWidth: 1,
        fill: "soft",
      };
    changed([...boardRef.current.elements, element], {
      previous: boardRef.current,
      record: false,
    });
    setSelected([id]);
    gesture.current = {
      kind: "create",
      pointerId: e.pointerId,
      at: p,
      initial: structuredClone(boardRef.current),
      id,
    };
    capture(e);
  }
  function elementDown(e: React.PointerEvent, element: AtelierElement) {
    if (space || tool === "pan") return;
    if (tool === "note" && element.type === "staff") return;
    e.stopPropagation();
    const ids = e.shiftKey
      ? selected.includes(element.id)
        ? selected.filter((id) => id !== element.id)
        : [...selected, element.id]
      : selected.includes(element.id)
        ? selected
        : [element.id];
    setSelected(ids);
    gesture.current = {
      kind: "move",
      pointerId: e.pointerId,
      at: at(
        e,
        (e.currentTarget as HTMLElement).closest(
          "[data-canvas]",
        ) as HTMLElement,
      ),
      initial: structuredClone(boardRef.current),
      ids,
    };
    capture(e);
  }
  function resizeDown(e: React.PointerEvent, element: AtelierElement) {
    e.preventDefault();
    e.stopPropagation();
    gesture.current = {
      kind: "resize",
      pointerId: e.pointerId,
      at: at(
        e,
        (e.currentTarget as HTMLElement).closest(
          "[data-canvas]",
        ) as HTMLElement,
      ),
      initial: structuredClone(boardRef.current),
      id: element.id,
    };
    capture(e);
  }
  function endpointDown(
    e: React.PointerEvent,
    element: ArrowElement,
    which: "start" | "end",
  ) {
    e.preventDefault();
    e.stopPropagation();
    gesture.current = {
      kind: "endpoint",
      pointerId: e.pointerId,
      initial: structuredClone(boardRef.current),
      id: element.id,
      which,
    };
    capture(e);
  }
  function move(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.kind === "pan") {
      setPan({
        x: g.origin.x + e.clientX - g.screen.x,
        y: g.origin.y + e.clientY - g.screen.y,
      });
      return;
    }
    const root = (e.currentTarget as HTMLElement).closest(
        "[data-canvas]",
      ) as HTMLElement,
      p = at(e, root);
    if (g.kind === "marquee") {
      setMarquee({ a: g.at, b: p });
      const box = rect(g.at, p),
        hits = boardRef.current.elements
          .filter((el) => intersects(box, el))
          .map((el) => el.id);
      setSelected(g.additive ? [...new Set([...selected, ...hits])] : hits);
      return;
    }
    if (g.kind === "create") {
      const box = rect(g.at, p);
      changed(
        boardRef.current.elements.map((el) =>
          el.id === g.id ? {
            ...el,
            x: grid(box.x), y: grid(box.y),
            width: Math.max(1, grid(box.width)), height: Math.max(1, grid(box.height)),
            ...((el.type === "arrow" || el.type === "line") ? {
              start: { x: p.x >= g.at.x ? 0 : 1, y: p.y >= g.at.y ? 0 : 1 },
              end: { x: p.x >= g.at.x ? 1 : 0, y: p.y >= g.at.y ? 1 : 0 },
            } : {}),
          } as AtelierElement : el,
        ),
        { record: false },
      );
      return;
    }
    if (g.kind === "move") {
      const dx = p.x - g.at.x,
        dy = p.y - g.at.y;
      changed(
        g.initial.elements.map((el) =>
          g.ids.includes(el.id)
            ? { ...el, x: grid(el.x + dx), y: grid(el.y + dy) }
            : el,
        ),
        { record: false },
      );
      return;
    }
    if (g.kind === "resize") {
      changed(
        g.initial.elements.map((el) =>
          el.id === g.id
            ? {
                ...el,
                width: Math.max(MIN_SIZE, grid(el.width + p.x - g.at.x)),
                height: Math.max(MIN_SIZE, grid(el.height + p.y - g.at.y)),
              }
            : el,
        ),
        { record: false },
      );
      return;
    }
    if (g.kind === "endpoint") {
      const original = g.initial.elements.find((el) => el.id === g.id);
      if (!original || (original.type !== "arrow" && original.type !== "line"))
        return;
      const next = {
        x: (p.x - original.x) / original.width,
        y: (p.y - original.y) / original.height,
      };
      changed(
        g.initial.elements.map((el) =>
          el.id === g.id && (el.type === "arrow" || el.type === "line")
            ? { ...el, [g.which]: next }
            : el,
        ),
        { record: false },
      );
    }
  }
  function up(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.kind === "create") {
      const created = boardRef.current.elements.find((el) => el.id === g.id);
      if (created && (created.width < MIN_SIZE || created.height < MIN_SIZE)) {
        const defaults =
          created.type === "staff"
            ? { width: 460, height: 150 }
            : created.type === "arrow" || created.type === "line"
              ? { width: 220, height: 100 }
              : { width: 180, height: 110 };
        changed(
          boardRef.current.elements.map((el) =>
            el.id === g.id ? { ...el, ...defaults } : el,
          ),
          { record: false },
        );
      }
    }
    if (g.kind !== "pan" && g.kind !== "marquee")
      onChange(boardRef.current, {
        previous: "initial" in g ? g.initial : board,
      });
    gesture.current = null;
    setMarquee(null);
  }
  function noteDown(
    e: React.PointerEvent,
    staff: StaffElement,
    noteId: string,
  ) {
    if (tool !== "select") return;
    e.stopPropagation();
    setSelected([staff.id]);
    gesture.current = {
      kind: "note",
      pointerId: e.pointerId,
      initial: structuredClone(boardRef.current),
      staffId: staff.id,
      noteId,
    };
    capture(e);
  }
  function noteMove(e: React.PointerEvent, staff: StaffElement) {
    const g = gesture.current;
    if (!g || g.kind !== "note" || g.pointerId !== e.pointerId) return;
    const r = (e.currentTarget as HTMLElement)
        .closest("[data-staff]")!
        .getBoundingClientRect(),
      x = Math.max(0.12, Math.min(0.94, (e.clientX - r.left) / r.width)),
      slot = slotFromY((e.clientY - r.top) / r.height);
    changed(
      boardRef.current.elements.map((el) =>
        el.id === staff.id && el.type === "staff"
          ? {
              ...el,
              notes: el.notes
                .map((n, i) =>
                  noteId(n, i, staff.id) === g.noteId
                    ? { ...n, id: g.noteId, x, note: noteAtSlot(slot) }
                    : n,
                )
                .sort((a, b) => a.x - b.x),
            }
          : el,
      ),
      { record: false },
    );
  }
  function addNote(e: React.PointerEvent, staff: StaffElement) {
    if (tool !== "note") return;
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect(),
      entry = {
        id: uid(),
        note: noteAtSlot(slotFromY((e.clientY - r.top) / r.height)),
        x: Math.max(0.12, Math.min(0.94, (e.clientX - r.left) / r.width)),
      };
    changed(
      boardRef.current.elements.map((el) =>
        el.id === staff.id && el.type === "staff"
          ? { ...el, notes: [...el.notes, entry].sort((a, b) => a.x - b.x) }
          : el,
      ),
      { previous: boardRef.current },
    );
  }
  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  function fit() {
    const v = viewport.current;
    if (!v || !board.elements.length) {
      reset();
      return;
    }
    const left = Math.min(...board.elements.map((e) => e.x)),
      top = Math.min(...board.elements.map((e) => e.y)),
      right = Math.max(...board.elements.map((e) => e.x + e.width)),
      bottom = Math.max(...board.elements.map((e) => e.y + e.height)),
      z = Math.max(
        0.35,
        Math.min(
          1.4,
          Math.min(
            (v.clientWidth - 144) / (right - left),
            (v.clientHeight - 144) / (bottom - top),
          ),
        ),
      );
    setZoom(z);
    setPan({
      x: (v.clientWidth - (right - left) * z) / 2 - left * z,
      y: (v.clientHeight - (bottom - top) * z) / 2 - top * z,
    });
  }
  function wheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey)
      setZoom((z) => Math.max(0.35, Math.min(2.5, z - e.deltaY * 0.0015)));
    else setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
  }
  const single =
    selected.length === 1
      ? board.elements.find((e) => e.id === selected[0])
      : undefined;
  function patchSelected(patch: Partial<AtelierElement>) {
    if (!single) return;
    changed(
      boardRef.current.elements.map((e) =>
        e.id === single.id ? ({ ...e, ...patch } as AtelierElement) : e,
      ),
      { previous: boardRef.current },
    );
  }
  return (
    <div className="atelier-shell relative overflow-hidden rounded-xl border border-[var(--atelier-border)] bg-[var(--atelier-paper)] shadow-page">
      <ViewControls zoom={zoom} setZoom={setZoom} fit={fit} reset={reset} />
      <div
        ref={viewport}
        onWheel={wheel}
        className={cn(
          "relative h-[min(76vh,900px)] min-h-[36rem] overflow-hidden",
          tool === "pan" || space
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default",
        )}
      >
        <div
          data-canvas
          onPointerDown={canvasDown}
          onPointerMove={move}
          onPointerUp={up}
          className="atelier-canvas absolute left-0 top-0 h-[1100px] w-[1800px] origin-top-left touch-none"
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          }}
          role="application"
          aria-label="Quadro musical"
        >
          {board.elements.map((element) => (
            <div
              key={element.id}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
              }}
              className={cn(
                "group absolute",
                selected.includes(element.id) && "atelier-selection",
              )}
              onPointerDown={(e) => elementDown(e, element)}
              onPointerMove={move}
              onPointerUp={up}
            >
              <CanvasElement
                element={element}
                tool={tool}
                onAddNote={addNote}
                onNoteDown={noteDown}
                onNoteMove={noteMove}
                onNoteUp={up}
                onText={(text) => patchText(element.id, text)}
              />
              {selected.length === 1 &&
              selected[0] === element.id &&
              (element.type === "arrow" || element.type === "line") ? (
                <>
                  {(["start", "end"] as const).map((which) => {
                    const p =
                      element[which] ??
                      (which === "start" ? { x: 0, y: 0 } : { x: 1, y: 1 });
                    return (
                      <button
                        key={which}
                        type="button"
                        style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                        className="atelier-handle absolute size-4 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full"
                        onPointerDown={(e) => endpointDown(e, element, which)}
                        onPointerMove={move}
                        onPointerUp={up}
                        aria-label={`Mover ${which === "start" ? "início" : "fim"}`}
                      />
                    );
                  })}
                </>
              ) : null}
              {selected.length === 1 &&
              selected[0] === element.id &&
              element.type !== "arrow" &&
              element.type !== "line" ? (
                <button
                  type="button"
                  className="atelier-handle absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-full"
                  onPointerDown={(e) => resizeDown(e, element)}
                  onPointerMove={move}
                  onPointerUp={up}
                  aria-label="Redimensionar elemento"
                />
              ) : null}
            </div>
          ))}
          {marquee ? (
            <div
              className="atelier-marquee pointer-events-none absolute"
              style={rectStyle(rect(marquee.a, marquee.b))}
            />
          ) : null}
        </div>
      </div>
      <Inspector element={single} snap={snap} patch={patchSelected} />
      {selected.length ? (
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center rounded-lg border border-[var(--atelier-border)] bg-[var(--atelier-panel)] p-1 shadow-lift">
          <span className="px-2 text-xs text-ink-faint">
            {selected.length > 1 ? `${selected.length} itens` : "Selecionado"}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={duplicate}
            aria-label="Duplicar seleção"
          >
            <Copy />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={remove}
            aria-label="Apagar seleção"
          >
            <Trash2 />
          </Button>
        </div>
      ) : null}
    </div>
  );
  function patchText(id: string, text: string) {
    changed(
      boardRef.current.elements.map((e) =>
        e.id === id && e.type === "text" ? { ...e, text } : e,
      ),
      { previous: boardRef.current },
    );
  }
}
function ViewControls({
  zoom,
  setZoom,
  fit,
  reset,
}: {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  fit: () => void;
  reset: () => void;
}) {
  return (
    <div className="absolute right-3 top-3 z-30 flex items-center rounded-md border border-[var(--atelier-border)] bg-[var(--atelier-panel)] p-1 shadow-page">
      <Button
        size="icon"
        variant="ghost"
        onClick={fit}
        aria-label="Ajustar ao conteúdo"
      >
        <Focus />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={reset}
        aria-label="Restaurar visualização"
      >
        <LocateFixed />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))}
        aria-label="Diminuir zoom"
      >
        <Minus />
      </Button>
      <button onClick={() => setZoom(1)} className="w-12 text-xs tabular-nums">
        {Math.round(zoom * 100)}%
      </button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
        aria-label="Aumentar zoom"
      >
        <Plus />
      </Button>
    </div>
  );
}
function Inspector({
  element,
  snap,
  patch,
}: {
  element?: AtelierElement;
  snap: boolean;
  patch: (p: Partial<AtelierElement>) => void;
}) {
  return (
    <aside className="absolute bottom-3 right-3 z-20 w-56 rounded-lg border border-[var(--atelier-border)] bg-[var(--atelier-panel)] p-3 shadow-lift">
      <p className="type-label text-[var(--atelier-accent)]">
        {element ? element.type : "Quadro"}
      </p>
      {!element ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Arraste no vazio para selecionar.{" "}
          {snap ? "Ajuste leve ativo." : "Movimento livre."} Espaço + arrastar
          move o quadro.
        </p>
      ) : null}
      {element?.type === "text" ? (
        <>
          <Input
            className="mt-2"
            value={element.text}
            onChange={(e) =>
              patch({ text: e.target.value } as Partial<TextElement>)
            }
            aria-label="Conteúdo do texto"
          />
          <Select
            className="mt-2"
            value={element.align ?? "left"}
            onChange={(e) =>
              patch({ align: e.target.value } as Partial<TextElement>)
            }
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </Select>
        </>
      ) : null}
      {element?.type === "staff" ? (
        <>
          <Select
            className="mt-2"
            value={element.clef ?? "treble"}
            onChange={(e) =>
              patch({ clef: e.target.value } as Partial<StaffElement>)
            }
          >
            <option value="treble">Clave de Sol</option>
            <option value="bass">Clave de Fá</option>
          </Select>
          <Select className="mt-2" value={element.spacing ?? 14} onChange={(e) => patch({ spacing: Number(e.target.value) } as Partial<StaffElement>)} aria-label="Espaçamento do pentagrama"><option value="11">Compacto</option><option value="14">Regular</option><option value="17">Amplo</option></Select>
          <label className="mt-2 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={element.showLedger ?? true}
              onChange={(e) =>
                patch({ showLedger: e.target.checked } as Partial<StaffElement>)
              }
            />
            Linhas auxiliares
          </label>
        </>
      ) : null}
      {element && (element.type === "arrow" || element.type === "line") ? (
        <>
          <Select
            className="mt-2"
            value={element.strokeWidth ?? 1}
            onChange={(e) =>
              patch({ strokeWidth: Number(e.target.value) as 1 | 2 })
            }
          >
            <option value="1">Traço leve</option>
            <option value="2">Traço médio</option>
          </Select>
          {element.type === "arrow" ? (
            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={element.arrowhead ?? true}
                onChange={(e) => patch({ arrowhead: e.target.checked })}
              />
              Ponta de seta
            </label>
          ) : null}
        </>
      ) : null}
      {element &&
      (element.type === "rectangle" || element.type === "circle") ? (
        <>
          <Select
            className="mt-2"
            value={element.fill ?? "soft"}
            onChange={(e) =>
              patch({ fill: e.target.value } as Partial<AtelierElement>)
            }
          >
            <option value="soft">Preenchimento suave</option>
            <option value="none">Sem preenchimento</option>
          </Select>
        </>
      ) : null}
    </aside>
  );
}
function CanvasElement({
  element,
  tool,
  onAddNote,
  onNoteDown,
  onNoteMove,
  onNoteUp,
  onText,
}: {
  element: AtelierElement;
  tool: AtelierTool;
  onAddNote: (e: React.PointerEvent, s: StaffElement) => void;
  onNoteDown: (e: React.PointerEvent, s: StaffElement, id: string) => void;
  onNoteMove: (e: React.PointerEvent, s: StaffElement) => void;
  onNoteUp: (e: React.PointerEvent) => void;
  onText: (text: string) => void;
}) {
  if (element.type === "staff")
    return (
      <AtelierStaff
        staff={element}
        tool={tool}
        onAddNote={onAddNote}
        onNoteDown={onNoteDown}
        onNoteMove={onNoteMove}
        onNoteUp={onNoteUp}
      />
    );
  if (element.type === "text")
    return (
      <textarea
        value={element.text}
        onChange={(e) => onText(e.target.value)}
        style={{ textAlign: element.align ?? "left" }}
        className={cn(
          "h-full w-full resize-none border-0 bg-transparent p-2 text-[var(--atelier-ink)] outline-none",
          element.style === "title"
            ? "display text-2xl font-semibold"
            : element.style === "label"
              ? "text-sm font-medium"
              : "text-sm leading-relaxed",
        )}
        aria-label="Texto do quadro"
      />
    );
  if (element.type === "card") {
    const card = TEACHING_CARDS[element.preset];
    return (
      <div className="h-full overflow-hidden rounded-xl border border-[var(--atelier-border)] bg-[var(--atelier-soft)] p-4">
        <p className="display font-semibold">{card.title}</p>
        <p className="mt-2 text-sm text-ink-soft">{card.body}</p>
      </div>
    );
  }
  if (element.type === "arrow" || element.type === "line") {
    const start = element.start ?? { x: 0, y: 0 },
      end = element.end ?? { x: 1, y: 1 },
      marker = element.type === "arrow" && (element.arrowhead ?? true);
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <marker
            id={`tip-${element.id}`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8Z" fill="var(--atelier-line)" />
          </marker>
        </defs>
        <line
          x1={start.x * 100}
          y1={start.y * 100}
          x2={end.x * 100}
          y2={end.y * 100}
          stroke="var(--atelier-line)"
          vectorEffect="non-scaling-stroke"
          strokeWidth={(element.strokeWidth ?? 1) * 2}
          markerEnd={marker ? `url(#tip-${element.id})` : undefined}
        />
      </svg>
    );
  }
  const shape = element as ShapeElement;
  return (
    <div
      className={cn(
        "h-full border bg-[var(--atelier-soft)]",
        shape.fill === "none" && "bg-transparent",
        shape.type === "circle" ? "rounded-full" : "rounded-lg",
      )}
      style={{
        borderColor: "var(--atelier-line)",
        borderWidth: shape.strokeWidth ?? 1,
      }}
    />
  );
}
function AtelierStaff({
  staff,
  tool,
  onAddNote,
  onNoteDown,
  onNoteMove,
  onNoteUp,
}: {
  staff: StaffElement;
  tool: AtelierTool;
  onAddNote: (e: React.PointerEvent, s: StaffElement) => void;
  onNoteDown: (e: React.PointerEvent, s: StaffElement, id: string) => void;
  onNoteMove: (e: React.PointerEvent, s: StaffElement) => void;
  onNoteUp: (e: React.PointerEvent) => void;
}) {
  const spacing = staff.spacing ?? 14;
  const bottom = 50 + spacing * 2;
  const y = (slot: number) => bottom - slot * (spacing / 2);
  return (
    <svg
      data-staff
      viewBox="0 0 500 116"
      preserveAspectRatio="none"
      className={cn(
        "h-full w-full rounded-lg bg-[var(--atelier-paper)]",
        tool === "note" && "cursor-crosshair",
      )}
      onPointerDown={(e) => onAddNote(e, staff)}
    >
      {[-2, -1, 0, 1, 2].map((offset) => 50 + offset * spacing).map((value) => (
        <line
          key={value}
          x1="4"
          x2="496"
          y1={value}
          y2={value}
          stroke="var(--atelier-staff)"
          strokeWidth="1.3"
        />
      ))}
      <text
        x="12"
        y={staff.clef === "bass" ? 72 : 83}
        fontSize={staff.clef === "bass" ? 54 : 72}
        fontFamily="serif"
        fill="var(--atelier-ink)"
      >
        {staff.clef === "bass" ? "𝄢" : "𝄞"}
      </text>
      {staff.notes.map((entry, index) => {
        const slot = slotOf(entry.note),
          x = entry.x * 500,
          cy = y(slot),
          id = noteId(entry, index, staff.id);
        return (
          <g
            key={id}
            className={tool === "select" ? "cursor-move" : ""}
            onPointerDown={(e) => onNoteDown(e, staff, id)}
            onPointerMove={(e) => onNoteMove(e, staff)}
            onPointerUp={onNoteUp}
          >
            {(staff.showLedger ?? true)
              ? ledgerSlots(slot).map((l) => (
                  <line
                    key={l}
                    x1={x - 14}
                    x2={x + 14}
                    y1={y(l)}
                    y2={y(l)}
                    stroke="var(--atelier-staff)"
                    strokeWidth="1.2"
                  />
                ))
              : null}
            {entry.note.accidental ? (
              <text
                x={x - 13}
                y={cy + 5}
                textAnchor="end"
                fontSize="19"
                fill="var(--atelier-ink)"
              >
                {ACCIDENTAL_SIGN[entry.note.accidental]}
              </text>
            ) : null}
            <ellipse
              cx={x}
              cy={cy}
              rx="9"
              ry="6.2"
              fill="var(--atelier-ink)"
              transform={`rotate(-20 ${x} ${cy})`}
            />
            <text
              x={x}
              y="110"
              textAnchor="middle"
              fontSize="11"
              fill="var(--atelier-line)"
            >
              {noteName(entry.note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function rect(a: XY, b: XY) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}
function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: AtelierElement,
) {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}
function rectStyle(r: ReturnType<typeof rect>) {
  return { left: r.x, top: r.y, width: r.width, height: r.height };
}
function slotFromY(y: number) {
  return Math.max(-2, Math.min(10, Math.round((0.7 - y) / 0.061)));
}
function noteId(
  entry: StaffElement["notes"][number],
  index: number,
  staffId: string,
) {
  return entry.id ?? `${staffId}-legacy-${index}`;
}
