import type { ModuleId } from "@/lib/storage/types";

export type StudyFocus = "balanced" | "free" | "lesson" | "review" | "reading" | "theory" | "ear" | "rhythm" | "harmony";
export type ReasonCode = "UPCOMING_LESSON" | "RECURRING_ERROR" | "DUE_REVIEW" | "CURRENT_CONCEPT" | "NEXT_PATH_STEP" | "MAINTENANCE" | "USER_FOCUS";
export type SessionPhase = "warmup" | "focus" | "consolidate" | "vary" | "close";
export type BlockStatus = "pending" | "completed" | "skipped";

export type PlannerLesson = { id: string; title: string; startAt: string; topic: string; preparation: string; questions: string[]; homework: string[]; resourceLabels: string[] };
export type PlannerInput = {
  now: number;
  targetMinutes: number;
  focus: StudyFocus;
  lastTopic: { href: string; label: string; ts: number } | null;
  errors: Array<{ itemKey: string; module: ModuleId; prompt: string; expected: string; misses: number; lastMissTs: number }>;
  recentModules: ModuleId[];
  nextLesson?: PlannerLesson | null;
  resourceCounts?: { notes: number; materials: number; boards: number };
};

export type StudyCandidate = {
  id: string; title: string; module: ModuleId | "agenda" | "reflection"; concept: string;
  action: string; route: string; defaultMinutes: number; minMinutes: number; maxMinutes: number;
  modality: "read" | "write" | "listen" | "perform" | "reflect"; family: string;
  priority: number; evidence: string; reasonCode: ReasonCode; source: string;
};
export type StudyPlanBlock = StudyCandidate & { blockId: string; minutes: number; phase: SessionPhase; status: BlockStatus };
export type StudyPlan = { id: string; createdAt: number; targetMinutes: number; focus: StudyFocus; blocks: StudyPlanBlock[]; alternatives: StudyCandidate[] };

export type ActiveStudySession = StudyPlan & { startedAt: number; currentIndex: number; pausedAt: number | null; accumulatedPauseMs: number; attemptStartIndex: number; expiresAt: number };
export type StudySessionRecord = {
  id: string; startedAt: number; endedAt: number; plannedMinutes: number; studiedMinutes: number; focus: StudyFocus;
  blocks: StudyPlanBlock[]; completedBlocks: number; skippedBlocks: number; attempts: number; correctAttempts: number;
  reflection?: string; takeToLesson?: string; endedEarly: boolean;
};
