"use client";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/prose";
import { DEFAULT_AUDIO_PROFILE, audioEngine, playNote, playNoteLine } from "@/lib/music/audio";
import { note } from "@/lib/music/notes";
import { buildMajorScale } from "@/lib/music/scales";
const NOTES=[note('C'),note('E'),note('G'),note('A'),note('C',0,5)];
export function AudioQa(){return <div className="flex flex-col gap-8"><SectionHeading eyebrow="Development only" title="Audio QA" description="Ferramenta interna para audição humana; não faz parte da navegação do produto."/><section><p className="type-label text-brass">Notas isoladas</p><div className="mt-3 flex flex-wrap gap-2">{NOTES.map(item=><Button key={`${item.letter}${item.octave}`} onClick={()=>playNote(item)}>{item.letter}{item.octave}</Button>)}</div></section><section><p className="type-label text-brass">Relações</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>playNoteLine([note('C'),note('D')])}>Tom · C–D</Button><Button onClick={()=>playNoteLine([note('E'),note('F')])}>Semitom · E–F</Button><Button onClick={()=>playNoteLine(NOTES)} >Sequência</Button><Button onClick={()=>playNoteLine(buildMajorScale(note('C'),true),DEFAULT_AUDIO_PROFILE.gaps.scale)}>Escala</Button><Button variant="outline" onClick={()=>audioEngine.stop()}>Parar</Button></div></section><pre className="overflow-x-auto border-y border-rule py-4 text-xs text-ink-muted">{JSON.stringify(DEFAULT_AUDIO_PROFILE,null,2)}</pre></div>}
