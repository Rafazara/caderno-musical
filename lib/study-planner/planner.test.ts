import assert from "node:assert/strict";
import test from "node:test";
import { createStudyPlan, isResumableSession, planMinutes } from "./planner";
import type { PlannerInput } from "./types";

const NOW = new Date("2026-08-14T12:00:00Z").getTime();
function input(partial: Partial<PlannerInput> = {}): PlannerInput {
  return { now: NOW, targetMinutes: 30, focus: "balanced", lastTopic: null, errors: [], recentModules: [], resourceCounts: { notes: 0, materials: 0, boards: 0 }, ...partial };
}

test("A: primeiro uso gera sessão coerente, diversa e com o tempo solicitado", () => {
  const plan = createStudyPlan(input());
  assert.equal(planMinutes(plan), 30);
  assert.equal(plan.blocks.length, 5);
  assert.ok(new Set(plan.blocks.map((block) => block.family)).size >= 4);
  assert.ok(plan.blocks.every((block) => block.minutes >= 3));
});

test("B: erro recorrente tem precedência sobre manutenção", () => {
  const plan = createStudyPlan(input({ errors: [{ itemKey: "clave:C4", module: "leitura", prompt: "Dó central", expected: "Dó", misses: 4, lastMissTs: NOW - 1000 }] }));
  assert.equal(plan.blocks[0].reasonCode, "RECURRING_ERROR");
});

test("C: aula próxima entra cedo e expõe evidência da Agenda", () => {
  const plan = createStudyPlan(input({ nextLesson: { id: "aula-1", title: "Aula de sábado", startAt: new Date(NOW + 24*60*60*1000).toISOString(), topic: "Escalas", preparation: "Rever Dó maior", questions: [], homework: [], resourceLabels: [] } }));
  assert.equal(plan.blocks[0].reasonCode, "UPCOMING_LESSON");
  assert.match(plan.blocks[0].evidence, /Aula de sábado/);
});

test("D: foco explícito tem precedência e não elimina variedade", () => {
  const plan = createStudyPlan(input({ focus: "ear", targetMinutes: 45 }));
  assert.equal(plan.blocks[0].reasonCode, "USER_FOCUS");
  assert.ok(plan.blocks.some((block) => block.module !== "ouvido" && block.module !== "intervalos-musicais"));
});

test("E: duração de 15 minutos usa três blocos sem fragmentos de um minuto", () => {
  const plan = createStudyPlan(input({ targetMinutes: 15 }));
  assert.deepEqual(plan.blocks.map((block) => block.minutes), [3,8,4]);
});

test("F: mesma entrada produz seleção e ordenação determinísticas", () => {
  const data = input({ focus: "rhythm", errors: [{ itemKey: "pulse:4", module: "ritmo", prompt: "Pulsação", expected: "4", misses: 2, lastMissTs: NOW }] });
  assert.deepEqual(createStudyPlan(data), createStudyPlan(data));
});

test("sessão ativa só é retomada dentro da janela de persistência", () => {
  assert.equal(isResumableSession({ expiresAt: NOW + 1 }, NOW), true);
  assert.equal(isResumableSession({ expiresAt: NOW }, NOW), false);
  assert.equal(isResumableSession(null, NOW), false);
});

test("duração personalizada é arredondada para cinco minutos e limitada", () => {
  assert.equal(createStudyPlan(input({ targetMinutes: 37 })).targetMinutes, 35);
  assert.equal(createStudyPlan(input({ targetMinutes: 500 })).targetMinutes, 120);
});
