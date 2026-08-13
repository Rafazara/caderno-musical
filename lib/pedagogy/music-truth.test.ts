import test from "node:test";
import assert from "node:assert/strict";
import { semitonesBetween } from "@/lib/music/intervals";
import { note, noteAtSlot, noteName, slotOf } from "@/lib/music/notes";
import { buildMajorScale, MAJOR_FORMULA, SCALES } from "@/lib/music/scales";
import { deservesReview, isSolid, recurringConfusions } from "@/lib/pedagogy/mastery";

test("distâncias naturais usadas nas explicações", () => {
  assert.equal(semitonesBetween(note("E",0,4),note("F",0,4)),1);
  assert.equal(semitonesBetween(note("B",0,4),note("C",0,5)),1);
  assert.equal(semitonesBetween(note("C",0,4),note("D",0,4)),2);
});

test("linhas e espaços da clave de Sol seguem a sequência diatônica", () => {
  assert.equal(noteName(noteAtSlot(0)), "Mi");
  assert.equal(noteName(noteAtSlot(2)), "Sol");
  assert.equal(noteName(noteAtSlot(8)), "Fá");
  assert.equal(slotOf(note("G",0,4)), 2);
});

test("domínio pedagógico exige amostra suficiente", () => {
  assert.equal(isSolid({total:7,accuracy:100}), false);
  assert.equal(isSolid({total:8,accuracy:80}), true);
  assert.equal(deservesReview({total:2,accuracy:0},false), false);
  assert.equal(deservesReview({total:3,accuracy:60},false), true);
  assert.equal(deservesReview({total:1,accuracy:100},true), true);
});

test("confusão recorrente só aparece com evidência suficiente", () => {
  const base = { module: "leitura" as const, itemKey: "E:0:4", correct: false, expected: "Mi", given: "Sol" };
  const attempts = Array.from({ length: 3 }, (_, index) => ({ ...base, id: String(index), ts: index }));
  assert.deepEqual(recurringConfusions(attempts), [{ expected: "Mi", given: "Sol", count: 3 }]);
  assert.equal(recurringConfusions(attempts.slice(0, 2)).length, 0);
});

test("alterações das escalas maiores são derivadas do domínio musical", () => {
  const names=(id:string)=>buildMajorScale(SCALES.find(s=>s.id===id)!.tonic).map(noteName);
  assert.ok(names("G").includes("Fá♯"));
  assert.ok(names("D").includes("Fá♯")); assert.ok(names("D").includes("Dó♯"));
  assert.ok(names("F").includes("Si♭"));
});

test("fórmula maior permanece estável", () => {
  assert.deepEqual([...MAJOR_FORMULA],["T","T","S","T","T","T","S"]);
});
