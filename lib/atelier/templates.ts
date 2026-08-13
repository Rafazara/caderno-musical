import { MAJOR_FORMULA, SCALES, buildMajorScale } from "@/lib/music/scales";
import { noteName } from "@/lib/music/notes";
import type { AtelierBoard, AtelierElement } from "@/lib/atelier/types";
import { uid } from "@/lib/utils";

function board(title: string, elements: AtelierElement[]): AtelierBoard {
  const now = Date.now();
  return { id: uid(), title, elements, createdAt: now, updatedAt: now };
}

export function lessonSummaryTemplate(): AtelierBoard {
  return board("Resumo de aula", [
    { id: uid(), type: "text", style: "title", text: "Resumo de aula", x: 70, y: 55, width: 390, height: 70 },
    { id: uid(), type: "text", style: "body", text: "Tema · data · objetivo da aula", x: 72, y: 125, width: 420, height: 55 },
    { id: uid(), type: "staff", x: 70, y: 210, width: 560, height: 165, notes: [] },
    { id: uid(), type: "card", preset: "natural", x: 700, y: 205, width: 285, height: 120 },
    { id: uid(), type: "text", style: "body", text: "Ideias principais\n\n• O que entendi\n• O que preciso revisar\n• Exemplo importante", x: 70, y: 430, width: 430, height: 180 },
    { id: uid(), type: "text", style: "body", text: "Anotações livres…", x: 570, y: 430, width: 420, height: 180 },
  ]);
}

export function majorScaleTemplate(scaleId: string): AtelierBoard {
  const entry = SCALES.find((scale) => scale.id === scaleId) ?? SCALES[0];
  const scale = buildMajorScale(entry.tonic, true);
  return board(`Estudo · ${entry.label}`, [
    { id: uid(), type: "text", style: "title", text: entry.label, x: 65, y: 48, width: 430, height: 70 },
    { id: uid(), type: "staff", x: 65, y: 155, width: 720, height: 190, notes: scale.map((note, index) => ({ id: uid(), note, x: 0.16 + index * 0.1 })) },
    { id: uid(), type: "text", style: "label", text: scale.map(noteName).join("  ·  "), x: 90, y: 355, width: 670, height: 55 },
    { id: uid(), type: "card", preset: "major", x: 820, y: 155, width: 250, height: 120 },
    { id: uid(), type: "text", style: "body", text: `Fórmula: ${MAJOR_FORMULA.map((step) => step === "S" ? "ST" : "T").join(" – ")}`, x: 820, y: 300, width: 250, height: 65 },
    { id: uid(), type: "text", style: "body", text: "Anotações\n\nObserve os acidentes, os semitons e a posição de cada grau…", x: 65, y: 445, width: 1000, height: 165 },
  ]);
}
