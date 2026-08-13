"use client";
import { Speaker } from "lucide-react";
import { Keyboard } from "@/components/music/keyboard";
import { SingleNoteStaff } from "@/components/music/staff";
import { Button } from "@/components/ui/button";
import { playNote } from "@/lib/music/audio";
import { noteName, staffPosition, type Note } from "@/lib/music/notes";
export function NoteCompare({first,second}:{first:Note;second:Note}){return <div className="grid gap-5 border-t border-rule pt-5 sm:grid-cols-2">{[first,second].map((note,index)=><div key={`${note.letter}-${note.octave}-${index}`}><SingleNoteStaff note={note} emphasize state={index?'query':'default'}/><div className="mt-2 flex items-center justify-between"><p><strong className="display text-lg">{noteName(note)}{note.octave}</strong><span className="ml-2 text-xs text-ink-faint">{staffPosition(note).label}</span></p><Button variant="ghost" size="icon" onClick={()=>playNote(note)} aria-label={`Ouvir ${noteName(note)}`}><Speaker/></Button></div></div>)}<div className="sm:col-span-2"><Keyboard marks={[{note:first,tone:'a',badge:noteName(first)},{note:second,tone:'b',badge:noteName(second)}]}/></div></div>}
