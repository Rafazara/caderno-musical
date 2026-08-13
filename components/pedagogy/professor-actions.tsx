"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarPlus, NotebookPen, Palette } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { majorScaleTemplate } from "@/lib/atelier/templates";
import { EMPTY_BOARDS } from "@/lib/atelier/types";
import { nextEvent, NO_EVENTS } from "@/lib/agenda/types";
import { KEYS } from "@/lib/storage/local";
import { peek, write } from "@/lib/storage/store";
import { NO_NOTES } from "@/lib/storage/types";
import { uid } from "@/lib/utils";

export function ProfessorActions({title,question,noteBody,scaleId}:{title:string;question:string;noteBody:string;scaleId?:string}) {
  const [message,setMessage]=React.useState<string|null>(null);
  function ask(){const events=peek(KEYS.agenda,NO_EVENTS);const lesson=nextEvent(events.filter(e=>e.type==='lesson'));if(!lesson){localStorage.setItem('caderno-musical:pending-question',question);setMessage('Ainda não há uma próxima aula. A dúvida ficou guardada para sua Agenda.');return;}write(KEYS.agenda,events.map(e=>e.id===lesson.id?{...e,preparation:{...e.preparation,questions:[...e.preparation.questions,{id:uid(),text:question,done:false}]},updatedAt:Date.now()}:e));setMessage('Adicionado à sua próxima aula.');}
  function notebook(){const notes=peek(KEYS.notebook,NO_NOTES);const now=Date.now();write(KEYS.notebook,[...notes,{id:uid(),title,subject:title,body:`${noteBody}\n\nMinha anotação:\n`,tags:['professor-mode'],links:[],createdAt:now,updatedAt:now,pinned:false}]);setMessage('Guardado no seu Caderno.');}
  function atelier(){if(!scaleId)return;const boards=peek(KEYS.atelier,EMPTY_BOARDS);write(KEYS.atelier,[majorScaleTemplate(scaleId),...boards]);setMessage('Novo estudo criado no Ateliê.');}
  return <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4"><Button variant="ghost" size="sm" onClick={notebook}><NotebookPen/> Guardar no Caderno</Button><Button variant="ghost" size="sm" onClick={ask}><CalendarPlus/> Perguntar na próxima aula</Button>{scaleId?<Button variant="ghost" size="sm" onClick={atelier}><Palette/> Explorar no Ateliê</Button>:null}{message?<span role="status" className="w-full text-xs text-sage">{message}{message.includes('Agenda')?<Link href="/agenda" className={buttonClass({variant:'ghost',size:'sm',className:'ml-2'})}>Adicionar à Agenda</Link>:null}</span>:null}</div>;
}
