"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { nextEvent, NO_EVENTS } from "@/lib/agenda/types";
import { KEYS } from "@/lib/storage/local";
import { usePersistentState } from "@/lib/storage/use-persistent-state";

const when = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
export function NextLesson() {
  const { value: events, ready } = usePersistentState(KEYS.agenda, NO_EVENTS);
  if (!ready) return null;
  const event = nextEvent(events);
  if (!event) return <section className="border-y border-rule py-5 sm:flex sm:items-center sm:justify-between"><div><p className="type-label text-ink-faint">Agenda</p><p className="display mt-2 text-lg font-semibold">Nenhuma aula planejada.</p></div><Link href="/agenda" className={buttonClass({variant:"ghost",size:"sm"})}>Abrir agenda <ArrowRight/></Link></section>;
  return <section className="border-y border-rule py-5"><div className="flex items-start gap-4"><CalendarDays className="mt-1 size-4 text-brass"/><div className="min-w-0 flex-1"><p className="type-label text-brass">Próxima aula</p><p className="display mt-2 text-xl font-semibold">{event.title}</p><p className="mt-1 text-sm capitalize text-ink-muted">{when.format(new Date(event.startAt))}{event.topic?` · ${event.topic}`:""}</p>{event.preparation.review?<p className="mt-3 text-sm text-ink-soft"><span className="text-ink-faint">Antes da aula: </span>{event.preparation.review}</p>:null}</div><Link href="/agenda" className={buttonClass({variant:"ghost",size:"sm"})}>Preparar <ArrowRight/></Link></div></section>;
}
