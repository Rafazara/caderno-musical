export type EventType = "lesson" | "study" | "review";
export type EventStatus = "planned" | "completed" | "cancelled";
export type Understanding = "confused" | "partial" | "good" | "secure";
export type ResourceKind = "note" | "material" | "board" | "content";

export type ChecklistItem = { id: string; text: string; done: boolean };
export type ResourceRef = { kind: ResourceKind; id: string; label: string; href?: string };
export type Recurrence = { frequency: "weekly" | "biweekly"; seriesId: string; until: string | null } | null;
export type ReminderSettings = { inApp: boolean; offsets: number[]; email: boolean };

export type StudyEvent = {
  id: string;
  type: EventType;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  location: string;
  teacher: string;
  topic: string;
  note: string;
  status: EventStatus;
  recurrence: Recurrence;
  reminders: ReminderSettings;
  preparation: { review: string; questions: ChecklistItem[] };
  content: { subjects: string; notes: string; examples: string; exercises: string; concepts: string };
  reflection: { learned: string; difficult: string; practiceNext: string; questionsNext: string; understanding: Understanding | null; completedAt: number | null };
  homework: ChecklistItem[];
  resources: ResourceRef[];
  createdAt: number;
  updatedAt: number;
};

export const NO_EVENTS: StudyEvent[] = [];
export const EVENT_LABEL: Record<EventType, string> = { lesson: "Aula", study: "Estudo", review: "Revisão" };

/** Datas de formulário são locais; nunca passam por parsing UTC de `YYYY-MM-DD`. */
export function localDateTime(date: string, clock: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = clock.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function dateKey(date: Date) {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function expandRecurringEvent(base: StudyEvent, until: string | null): StudyEvent[] {
  if (!base.recurrence) return [base];
  const step = base.recurrence.frequency === "weekly" ? 7 : 14;
  const limit = until ? localDateTime(until, "23:59") : new Date(new Date(base.startAt).getTime() + 366 * 2 * 86400000);
  const duration = new Date(base.endAt).getTime() - new Date(base.startAt).getTime();
  const result: StudyEvent[] = [];
  for (let cursor = new Date(base.startAt), index = 0; cursor <= limit && index < 106; index += 1) {
    const start = new Date(cursor); const end = new Date(start.getTime() + duration);
    result.push({ ...base, id: index === 0 ? base.id : `${base.id}-${dateKey(start)}`, startAt: start.toISOString(), endAt: end.toISOString(), createdAt: base.createdAt, updatedAt: base.updatedAt });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + step, cursor.getHours(), cursor.getMinutes());
  }
  return result;
}

export function nextEvent(events: StudyEvent[], now = Date.now()) {
  return [...events].filter(e => e.status === "planned" && new Date(e.startAt).getTime() >= now).sort((a,b) => a.startAt.localeCompare(b.startAt))[0] ?? null;
}
