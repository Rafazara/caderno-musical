import { MODULE_HREF, MODULE_LABEL, type ModuleId } from "@/lib/storage/types";
import type { PlannerInput, ReasonCode, SessionPhase, StudyCandidate, StudyFocus, StudyPlan } from "./types";

export const FOCUS_LABEL: Record<StudyFocus, string> = { balanced: "Equilibrado", free: "Livre", lesson: "Próxima aula", review: "Revisões", reading: "Leitura", theory: "Teoria", ear: "Ouvido", rhythm: "Ritmo", harmony: "Harmonia" };
export const REASON_TEXT: Record<ReasonCode, string> = {
  UPCOMING_LESSON: "Prepara a próxima aula enquanto ela está próxima.", RECURRING_ERROR: "Esse ponto voltou a pedir atenção.",
  DUE_REVIEW: "Uma revisão curta agora ajuda a fixar.", CURRENT_CONCEPT: "Retoma exatamente de onde você parou.",
  NEXT_PATH_STEP: "É um próximo passo coerente no seu percurso.", MAINTENANCE: "Mantém outra habilidade musical ativa.", USER_FOCUS: "Respeita o foco que você escolheu.",
};
const FOCUS_MODULES: Record<StudyFocus, ModuleId[]> = { balanced: [], free: [], lesson: [], review: [], reading: ["leitura"], theory: ["escalas", "intervalos"], ear: ["ouvido", "intervalos-musicais"], rhythm: ["ritmo"], harmony: ["acordes", "harmonia"] };
const MAINTENANCE: ModuleId[] = ["leitura", "ritmo", "ouvido", "escalas", "acordes", "harmonia", "intervalos-musicais", "intervalos"];
const PHASES: SessionPhase[] = ["warmup", "focus", "consolidate", "vary", "vary", "close", "close"];
const DURATIONS: Record<number, number[]> = { 15: [3, 8, 4], 30: [5, 9, 6, 5, 5], 45: [5, 12, 8, 7, 7, 6], 60: [6, 15, 10, 9, 8, 7, 5] };

function base(module: ModuleId, reasonCode: ReasonCode, priority: number, suffix = "base"): StudyCandidate {
  const listening = module === "ouvido" || module === "intervalos-musicais";
  return { id: `${module}:${suffix}`, title: MODULE_LABEL[module], module, concept: MODULE_LABEL[module], action: listening ? "Ouça, responda e confira o movimento sonoro." : "Faça uma prática curta e registre o que ainda pede atenção.", route: MODULE_HREF[module], defaultMinutes: 7, minMinutes: 3, maxMinutes: 15, modality: listening ? "listen" : module === "ritmo" ? "perform" : "read", family: module, priority, evidence: "Variedade e continuidade do estudo", reasonCode, source: "percurso" };
}
function normalizeTarget(value: number) { return Math.max(10, Math.min(120, Math.round(value / 5) * 5)); }
function durations(target: number) {
  const preset = DURATIONS[target]; if (preset) return preset;
  const count = target < 25 ? 3 : target < 40 ? 5 : target < 55 ? 6 : 7;
  const each = Math.floor(target / count); const result = Array(count).fill(each) as number[];
  for (let i = 0; i < target - each * count; i += 1) result[i] += 1;
  return result.map((n) => Math.max(3, n));
}
export function buildCandidates(input: PlannerInput): StudyCandidate[] {
  const candidates: StudyCandidate[] = [];
  if (input.nextLesson) {
    const hours = (new Date(input.nextLesson.startAt).getTime() - input.now) / 3_600_000;
    if (hours >= 0 && hours <= 168) candidates.push({ id: `lesson:${input.nextLesson.id}`, title: `Preparar: ${input.nextLesson.title}`, module: "agenda", concept: input.nextLesson.topic || "Próxima aula", action: input.nextLesson.preparation || input.nextLesson.homework[0] || input.nextLesson.questions[0] || "Revise o tema e anote uma pergunta para a aula.", route: "/agenda", defaultMinutes: 8, minMinutes: 5, maxMinutes: 15, modality: "write", family: "lesson", priority: 80 + (input.focus === "lesson" ? 100 : 0), evidence: `${input.nextLesson.title} acontece em breve`, reasonCode: input.focus === "lesson" ? "USER_FOCUS" : "UPCOMING_LESSON", source: "agenda" });
  }
  [...input.errors].sort((a,b) => b.misses-a.misses || b.lastMissTs-a.lastMissTs || a.itemKey.localeCompare(b.itemKey)).slice(0, 4).forEach((error) => candidates.push({ ...base(error.module, input.focus === "review" ? "USER_FOCUS" : error.misses >= 3 ? "RECURRING_ERROR" : "DUE_REVIEW", (input.focus === "review" ? 100 : 0) + (error.misses >= 3 ? 72 : 56), `review:${error.itemKey}`), title: `Revisar: ${error.prompt}`, concept: error.prompt, action: `Refaça o item e explique por que a resposta esperada é ${error.expected}.`, route: "/revisar", evidence: `${error.misses} ${error.misses === 1 ? "erro registrado" : "erros registrados"}`, source: "revisão" }));
  if (input.lastTopic) {
    const currentModule = (Object.keys(MODULE_HREF) as ModuleId[]).find((key) => MODULE_HREF[key] === input.lastTopic?.href);
    if (currentModule) candidates.push({ ...base(currentModule, "CURRENT_CONCEPT", 46, "current"), title: `Continuar: ${input.lastTopic.label}`, route: input.lastTopic.href, evidence: "Seu último assunto estudado", source: "progresso" });
  }
  FOCUS_MODULES[input.focus].forEach((module, index) => candidates.push({ ...base(module, "USER_FOCUS", 100-index, "focus"), evidence: `Foco escolhido: ${FOCUS_LABEL[input.focus]}`, source: "preferência" }));
  const resources = input.resourceCounts;
  if (resources && resources.notes + resources.materials + resources.boards > 0) {
    const kind = resources.materials ? "material" : resources.notes ? "anotação" : "quadro";
    const route = resources.materials ? "/material" : resources.notes ? "/caderno" : "/atelie-de-partitura";
    candidates.push({ id: "resources:recent", title: `Retomar ${kind} de estudo`, module: "reflection", concept: "Conectar prática e registro", action: `Abra um ${kind} real e escreva uma conclusão curta a partir dele.`, route, defaultMinutes: 6, minMinutes: 4, maxMinutes: 10, modality: "write", family: "resources", priority: 38, evidence: `${resources.notes} notas, ${resources.materials} materiais e ${resources.boards} quadros disponíveis`, reasonCode: "CURRENT_CONCEPT", source: kind });
  }
  MAINTENANCE.forEach((module, index) => { if (!candidates.some((c) => c.module === module && c.reasonCode === "USER_FOCUS")) { const recentlyUsed = input.recentModules.slice(-6).includes(module); candidates.push(base(module, index === 0 ? "NEXT_PATH_STEP" : "MAINTENANCE", 34-index-(recentlyUsed ? 12 : 0), "maintenance")); } });
  return candidates.sort((a,b) => b.priority-a.priority || a.id.localeCompare(b.id));
}
export function createStudyPlan(input: PlannerInput): StudyPlan {
  const target = normalizeTarget(input.targetMinutes); const slots = durations(target); const candidates = buildCandidates({ ...input, targetMinutes: target });
  const selected: StudyCandidate[] = [];
  for (const candidate of candidates) {
    if (selected.length >= slots.length) break;
    const repeats = selected.filter((item) => item.family === candidate.family).length;
    const last = selected[selected.length - 1];
    if ((repeats && input.focus === "balanced") || (last?.modality === "listen" && candidate.modality === "listen")) continue;
    selected.push(candidate);
  }
  for (const candidate of candidates) { if (selected.length >= slots.length) break; if (!selected.some((item) => item.id === candidate.id)) selected.push(candidate); }
  const id = `session-${input.now}-${input.focus}-${target}`;
  return { id, createdAt: input.now, targetMinutes: target, focus: input.focus, blocks: selected.map((candidate,index) => ({ ...candidate, blockId: `${id}-b${index+1}`, minutes: Math.min(candidate.maxMinutes, Math.max(candidate.minMinutes, slots[index])), phase: PHASES[Math.min(index, PHASES.length-1)], status: "pending" })), alternatives: candidates.filter((candidate) => !selected.some((item) => item.id === candidate.id)).slice(0, 8) };
}
export function planMinutes(plan: Pick<StudyPlan, "blocks">) { return plan.blocks.reduce((sum, block) => sum + block.minutes, 0); }
export function isResumableSession(session: { expiresAt: number } | null | undefined, now: number) { return Boolean(session && session.expiresAt > now); }
