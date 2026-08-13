import type { Note } from "@/lib/music/notes";

export type Point = { x: number; y: number };
export type AtelierTool = "select" | "pan" | "text" | "staff" | "note" | "arrow" | "rectangle" | "circle";

type ElementBase = { id: string; x: number; y: number; width: number; height: number };
export type StaffElement = ElementBase & { type: "staff"; notes: Array<{ id?: string; note: Note; x: number }> };
export type TextElement = ElementBase & { type: "text"; text: string; style: "title" | "body" | "label" };
export type ShapeElement = ElementBase & { type: "rectangle" | "circle" };
export type ArrowElement = ElementBase & { type: "arrow" };
export type CardElement = ElementBase & { type: "card"; preset: TeachingCardId };
export type AtelierElement = StaffElement | TextElement | ShapeElement | ArrowElement | CardElement;

export type AtelierBoard = { id: string; title: string; elements: AtelierElement[]; createdAt: number; updatedAt: number };

export const TEACHING_CARDS = {
  major: { title: "Regra da escala maior", body: "T · T · ST · T · T · T · ST" },
  natural: { title: "Semitons naturais", body: "Mi ↔ Fá  ·  Si ↔ Dó" },
  treble: { title: "Clave de Sol", body: "A segunda linha representa Sol." },
  degrees: { title: "Graus da escala", body: "I · II · III · IV · V · VI · VII · I" },
} as const;
export type TeachingCardId = keyof typeof TEACHING_CARDS;

export const EMPTY_BOARDS: AtelierBoard[] = [];
