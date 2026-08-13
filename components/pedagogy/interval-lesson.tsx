"use client";
import * as React from "react";
import { Speaker } from "lucide-react";
import { Keyboard } from "@/components/music/keyboard";
import { Staff } from "@/components/music/staff";
import { Button } from "@/components/ui/button";
import { CommonMistake, ConceptChallenge, Connection, Deeper, Memory, TeachingBlock } from "./blocks";
import { ProfessorActions } from "./professor-actions";
import { playNote, playNoteLine } from "@/lib/music/audio";
import { note } from "@/lib/music/notes";
import { naturalSemitone } from "@/lib/pedagogy/concepts";

export function IntervalLesson() { const [way,setWay]=React.useState(0);const mi=note('E',0,4),fa=note('F',0,4);const ways=[<p key="t">{naturalSemitone.essential}</p>,<Keyboard key="k" marks={[{note:mi,tone:'a'},{note:fa,tone:'a'}]} markSemitoneGaps/>,<Staff key="p" notes={[{note:mi,label:'Mi'},{note:fa,label:'Fá'}]} ariaLabel="Mi e Fá na pauta"/>,<div key="s" className="flex flex-wrap gap-2"><Button onClick={()=>playNote(mi)}><Speaker/> Ouvir Mi</Button><Button onClick={()=>playNote(fa)}><Speaker/> Ouvir Fá</Button><Button onClick={()=>playNoteLine([mi,fa])}><Speaker/> Ouvir Mi → Fá</Button></div>];return <section className="flex flex-col gap-7 border-y border-rule py-7"><div><p className="type-label text-brass">Professor Mode · Entenda</p><h2 className="display mt-2 text-2xl font-semibold">Mi → Fá</h2><div className="mt-4 text-sm leading-7 text-ink-soft">{ways[way]}</div><Button variant="ghost" size="sm" className="mt-3" onClick={()=>setWay(v=>(v+1)%ways.length)}>Explique de outro jeito · {['teoria','teclado','pauta','som'][(way+1)%4]}</Button></div><TeachingBlock label="Observe">{naturalSemitone.observe}</TeachingBlock>{naturalSemitone.commonMistake?<CommonMistake {...naturalSemitone.commonMistake}/>:null}<Memory items={naturalSemitone.memory??[]}/><Connection>{naturalSemitone.connection}</Connection><ConceptChallenge question="Qual destes pares também forma um semitom natural?" options={['Dó–Ré','Mi–Fá','Sol–Lá']} answer="Mi–Fá" explanation="São teclas brancas vizinhas, sem uma tecla preta entre elas."/><Deeper>{naturalSemitone.deeper}</Deeper><ProfessorActions title="Semitons naturais" question="Por que Mi–Fá e Si–Dó são semitons naturais?" noteBody="Mi–Fá · Si–Dó\nNão existe tecla preta entre cada par."/></section>; }
