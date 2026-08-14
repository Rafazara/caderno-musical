"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Check, Clock3, Pause, Play, RefreshCw, SkipForward, Square, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/prose";
import { NO_EVENTS, nextEvent } from "@/lib/agenda/types";
import { EMPTY_BOARDS } from "@/lib/atelier/types";
import { KEYS } from "@/lib/storage/local";
import { NO_MATERIAL, NO_NOTES } from "@/lib/storage/types";
import { usePersistentState } from "@/lib/storage/use-persistent-state";
import { createStudyPlan, FOCUS_LABEL, isResumableSession, planMinutes, REASON_TEXT } from "@/lib/study-planner/planner";
import type { ActiveStudySession, StudyFocus, StudyPlan, StudyPlanBlock, StudySessionRecord } from "@/lib/study-planner/types";
import { useStudy } from "@/lib/study/provider";

const DURATIONS = [15, 30, 45, 60];
const FOCUSES = Object.keys(FOCUS_LABEL) as StudyFocus[];
const PHASE_LABEL = { warmup: "Aquecer", focus: "Aprofundar", consolidate: "Consolidar", vary: "Variar", close: "Fechar" } as const;

function formatClock(seconds: number) { const minutes = Math.floor(seconds / 60); return `${String(minutes).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`; }

export function StudySessionStudio() {
  const { state, ready, updateState } = useStudy();
  const events = usePersistentState(KEYS.agenda, NO_EVENTS).value;
  const notes = usePersistentState(KEYS.notebook, NO_NOTES).value;
  const materials = usePersistentState(KEYS.material, NO_MATERIAL).value;
  const boards = usePersistentState(KEYS.atelier, EMPTY_BOARDS).value;
  const [duration, setDuration] = React.useState(30);
  const [customDuration, setCustomDuration] = React.useState(75);
  const [focus, setFocus] = React.useState<StudyFocus>("balanced");
  const [draft, setDraft] = React.useState<StudyPlan | null>(null);
  const [nowTick, setNowTick] = React.useState(() => Date.now());
  const [reflection, setReflection] = React.useState("");
  const [takeToLesson, setTakeToLesson] = React.useState("");

  const active = isResumableSession(state.activeStudySession, nowTick) ? state.activeStudySession! : null;
  const lesson = React.useMemo(() => nextEvent(events), [events]);
  const makePlan = React.useCallback(() => createStudyPlan({ now: Date.now(), targetMinutes: duration || customDuration, focus, lastTopic: state.lastTopic, errors: Object.values(state.errors), recentModules: state.attempts.slice(-20).map((a) => a.module), nextLesson: lesson ? { id: lesson.id, title: lesson.title, startAt: lesson.startAt, topic: lesson.topic, preparation: lesson.preparation.review, questions: lesson.preparation.questions.filter((q) => !q.done).map((q) => q.text), homework: lesson.homework.filter((q) => !q.done).map((q) => q.text), resourceLabels: lesson.resources.map((r) => r.label) } : null, resourceCounts: { notes: notes.length, materials: materials.length, boards: boards.length } }), [duration, customDuration, focus, state.lastTopic, state.errors, state.attempts, lesson, notes.length, materials.length, boards.length]);

  React.useEffect(() => { const timer = window.setInterval(() => setNowTick(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  React.useEffect(() => { if (ready && state.activeStudySession && state.activeStudySession.expiresAt <= Date.now()) updateState((prev) => ({ ...prev, activeStudySession: null })); }, [ready, state.activeStudySession, updateState]);

  function start(plan: StudyPlan) {
    const now = Date.now(); const session: ActiveStudySession = { ...plan, startedAt: now, currentIndex: 0, pausedAt: null, accumulatedPauseMs: 0, attemptStartIndex: state.attempts.length, expiresAt: now + 72 * 60 * 60 * 1000 };
    updateState((prev) => ({ ...prev, activeStudySession: session })); setDraft(null);
  }
  function updateActive(change: (session: ActiveStudySession) => ActiveStudySession) { updateState((prev) => prev.activeStudySession ? { ...prev, activeStudySession: change(prev.activeStudySession) } : prev); }
  function mark(status: "completed" | "skipped") {
    if (!active) return; const blocks = active.blocks.map((block,index) => index === active.currentIndex ? { ...block, status } : block);
    const next = active.currentIndex + 1; if (next >= blocks.length) finish({ ...active, blocks, currentIndex: next }, false); else updateActive((session) => ({ ...session, blocks, currentIndex: next }));
  }
  function finish(session = active, endedEarly = true) {
    if (!session) return; const now = Date.now(); const pause = session.accumulatedPauseMs + (session.pausedAt ? now-session.pausedAt : 0); const attempts = state.attempts.slice(session.attemptStartIndex);
    const record: StudySessionRecord = { id: session.id, startedAt: session.startedAt, endedAt: now, plannedMinutes: planMinutes(session), studiedMinutes: Math.max(1, Math.round((now-session.startedAt-pause)/60000)), focus: session.focus, blocks: session.blocks, completedBlocks: session.blocks.filter((b) => b.status === "completed").length, skippedBlocks: session.blocks.filter((b) => b.status === "skipped").length, attempts: attempts.length, correctAttempts: attempts.filter((a) => a.correct).length, reflection: reflection.trim() || undefined, takeToLesson: takeToLesson.trim() || undefined, endedEarly };
    updateState((prev) => ({ ...prev, activeStudySession: null, studySessions: [...(prev.studySessions ?? []), record].slice(-100) })); setReflection(""); setTakeToLesson("");
  }

  if (!ready) return <div className="flex flex-col gap-8"><SectionHeading eyebrow="Estudar" title="Sessão de estudo" /><Card className="h-56 animate-pulse bg-paper-sunken/50" /></div>;
  if (active) {
    const current = active.blocks[active.currentIndex]; const elapsed = Math.max(0, Math.floor((nowTick-active.startedAt-active.accumulatedPauseMs-(active.pausedAt ? nowTick-active.pausedAt : 0))/1000));
    return <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <SectionHeading eyebrow={`Bloco ${Math.min(active.currentIndex+1, active.blocks.length)} de ${active.blocks.length}`} title={current?.title ?? "Revisar a sessão"} description={current?.action ?? "Você chegou ao fim do plano."} />
      <div className="flex items-center justify-between border-y border-rule py-3 text-sm text-ink-muted"><span className="flex items-center gap-2"><Clock3 className="size-4" /> {formatClock(elapsed)}</span><span>{planMinutes(active)} min planejados · {active.blocks.filter((b) => b.status === "completed").length} concluídos</span></div>
      {current ? <Card className="overflow-hidden"><div className="h-1 bg-brass/60" /><CardHeader><p className="text-[0.625rem] font-semibold tracking-widest text-brass uppercase">{PHASE_LABEL[current.phase]} · {current.minutes} min</p><CardTitle className="text-2xl">{current.concept}</CardTitle><p className="text-sm leading-relaxed text-ink-muted">{REASON_TEXT[current.reasonCode]} <span className="text-ink-faint">{current.evidence}.</span></p></CardHeader><CardContent className="flex flex-wrap gap-2"><Link href={`${current.route}?sessionId=${active.id}&blockId=${current.blockId}`} className={buttonClass({ variant: "brass", size: "lg" })}>Abrir atividade <ArrowRight /></Link><Button size="lg" onClick={() => mark("completed")}><Check /> Concluir bloco</Button><Button variant="ghost" size="lg" onClick={() => mark("skipped")}><SkipForward /> Pular</Button></CardContent></Card> : null}
      <div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => updateActive((s) => s.pausedAt ? { ...s, accumulatedPauseMs: s.accumulatedPauseMs + Date.now()-s.pausedAt, pausedAt: null } : { ...s, pausedAt: Date.now() })}>{active.pausedAt ? <Play /> : <Pause />}{active.pausedAt ? "Continuar" : "Pausar"}</Button><Button variant="ghost" onClick={() => finish()}><Square /> Encerrar mais cedo</Button></div>
      <Card><CardHeader><CardTitle className="text-base">Nota de encerramento</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-ink-muted">O que ficou mais claro?<textarea value={reflection} onChange={(e) => setReflection(e.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-rule bg-paper p-3 text-sm text-ink outline-none focus:border-brass" /></label><label className="text-xs font-medium text-ink-muted">Levar para a próxima aula<textarea value={takeToLesson} onChange={(e) => setTakeToLesson(e.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-rule bg-paper p-3 text-sm text-ink outline-none focus:border-brass" /></label></CardContent></Card>
    </div>;
  }

  return <div className="flex flex-col gap-9">
    <SectionHeading eyebrow="Estudar agora" title="Sessão de estudo" description="Um roteiro transparente, montado com sua agenda, revisões e percurso. Você continua no controle." />
    {!draft ? <Card><CardHeader><CardTitle>Quanto tempo você tem hoje?</CardTitle></CardHeader><CardContent className="space-y-7"><div className="flex flex-wrap gap-2">{DURATIONS.map((value) => <Button key={value} variant={duration===value ? "brass" : "outline"} onClick={() => setDuration(value)}>{value} min</Button>)}<Button variant={duration===0 ? "brass" : "outline"} onClick={() => setDuration(0)}>Outro</Button>{duration===0 ? <input aria-label="Minutos personalizados" type="number" min={10} max={120} step={5} value={customDuration} onChange={(e) => setCustomDuration(Number(e.target.value))} className="h-10 w-24 rounded-lg border border-rule bg-paper px-3 text-sm" /> : null}</div><div><p className="mb-3 text-xs font-semibold tracking-wider text-ink-muted uppercase">Foco opcional</p><div className="flex flex-wrap gap-2">{FOCUSES.map((value) => <Button size="sm" key={value} variant={focus===value ? "brass" : "outline"} onClick={() => setFocus(value)}>{FOCUS_LABEL[value]}</Button>)}</div></div><Button size="lg" variant="brass" onClick={() => setDraft(makePlan())}>Montar minha sessão <ArrowRight /></Button></CardContent></Card> : <PlanEditor plan={draft} setPlan={setDraft} onStart={() => start(draft)} onRebuild={() => setDraft(makePlan())} />}
    {(state.studySessions ?? []).length ? <section><h2 className="mb-3 text-xs font-semibold tracking-wider text-ink-muted uppercase">Sessões recentes</h2><div className="divide-y divide-rule border-y border-rule">{[...(state.studySessions ?? [])].reverse().slice(0,5).map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span className="font-medium text-ink">{new Date(session.startedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {FOCUS_LABEL[session.focus]}</span><span className="text-ink-muted">{session.studiedMinutes} min · {session.completedBlocks} blocos · {session.attempts} respostas</span></div>)}</div></section> : null}
  </div>;
}

function PlanEditor({ plan, setPlan, onStart, onRebuild }: { plan: StudyPlan; setPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>; onStart: () => void; onRebuild: () => void }) {
  function updateBlocks(blocks: StudyPlanBlock[]) { setPlan({ ...plan, blocks }); }
  function move(index: number, direction: -1|1) { const blocks=[...plan.blocks]; const target=index+direction; if(target<0||target>=blocks.length)return; [blocks[index],blocks[target]]=[blocks[target],blocks[index]]; updateBlocks(blocks); }
  function swap(index: number) { const replacement=plan.alternatives[0]; if(!replacement)return; const old=plan.blocks[index]; updateBlocks(plan.blocks.map((block,i)=>i===index?{...replacement,blockId:old.blockId,minutes:old.minutes,phase:old.phase,status:"pending"}:block)); setPlan((current) => current ? { ...current, alternatives: [...current.alternatives.slice(1), old] } : current); }
  return <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold tracking-wider text-brass uppercase">Plano sugerido</p><CardTitle>{planMinutes(plan)} minutos · {FOCUS_LABEL[plan.focus]}</CardTitle></div><Button variant="ghost" onClick={onRebuild}><RefreshCw /> Refazer</Button></div></CardHeader><CardContent><ol className="divide-y divide-rule border-y border-rule">{plan.blocks.map((block,index)=><li key={block.blockId} className="grid gap-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className="flex size-8 items-center justify-center rounded-full bg-paper-sunken text-xs font-semibold text-ink-muted">{index+1}</span><div><p className="font-medium text-ink">{block.title}</p><p className="mt-1 text-sm text-ink-muted">{PHASE_LABEL[block.phase]} · {block.minutes} min · {REASON_TEXT[block.reasonCode]}</p></div><div className="flex items-center gap-1"><Button size="icon" variant="ghost" aria-label="Diminuir cinco minutos" onClick={()=>updateBlocks(plan.blocks.map((b,i)=>i===index?{...b,minutes:Math.max(b.minMinutes,b.minutes-5)}:b))}>−</Button><Button size="icon" variant="ghost" aria-label="Aumentar cinco minutos" onClick={()=>updateBlocks(plan.blocks.map((b,i)=>i===index?{...b,minutes:Math.min(b.maxMinutes,b.minutes+5)}:b))}>+</Button><Button size="icon" variant="ghost" aria-label="Subir" onClick={()=>move(index,-1)}><ArrowUp /></Button><Button size="icon" variant="ghost" aria-label="Descer" onClick={()=>move(index,1)}><ArrowDown /></Button><Button size="icon" variant="ghost" aria-label="Trocar atividade" disabled={!plan.alternatives.length} onClick={()=>swap(index)}><RefreshCw /></Button><Button size="icon" variant="ghost" aria-label="Remover" disabled={plan.blocks.length<=2} onClick={()=>updateBlocks(plan.blocks.filter((_,i)=>i!==index))}><X /></Button></div></li>)}</ol><div className="mt-6 flex flex-wrap items-center gap-3"><Button size="lg" variant="brass" onClick={onStart}><Play /> Iniciar sessão</Button><p className="text-xs text-ink-faint">Você pode ajustar, pular ou encerrar sem penalidade.</p></div></CardContent></Card>;
}
