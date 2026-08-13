import { MAJOR_FORMULA, SCALES, buildMajorScale } from "@/lib/music/scales";
import { noteName } from "@/lib/music/notes";
import type { AtelierBoard, AtelierElement } from "@/lib/atelier/types";
import { uid } from "@/lib/utils";
import { constructInterval, intervalDefinition, type MusicalIntervalId } from "@/lib/music/intervals";
import { note } from "@/lib/music/notes";
import { buildTriad, triadNoteNames, type TriadQuality } from "@/lib/music/chords";
import { buildMajorKeyHarmony } from "@/lib/music/harmony";

function board(title: string, elements: AtelierElement[]): AtelierBoard {
  const now = Date.now();
  return { id: uid(), title, elements, createdAt: now, updatedAt: now };
}

export function lessonSummaryTemplate(): AtelierBoard {
  return board("Resumo de aula", [
    { id: uid(), type: "text", style: "title", text: "Resumo de aula", x: 70, y: 55, width: 390, height: 70 },
    { id: uid(), type: "text", style: "body", text: "Tema · data · objetivo da aula", x: 72, y: 125, width: 420, height: 55 },
    { id: uid(), type: "staff", x: 70, y: 210, width: 560, height: 165, notes: [] },
    { id: uid(), type: "card", preset: "natural", x: 700, y: 205, width: 285, height: 120 },
    { id: uid(), type: "text", style: "body", text: "Ideias principais\n\n• O que entendi\n• O que preciso revisar\n• Exemplo importante", x: 70, y: 430, width: 430, height: 180 },
    { id: uid(), type: "text", style: "body", text: "Anotações livres…", x: 570, y: 430, width: 420, height: 180 },
  ]);
}

export function majorScaleTemplate(scaleId: string): AtelierBoard {
  const entry = SCALES.find((scale) => scale.id === scaleId) ?? SCALES[0];
  const scale = buildMajorScale(entry.tonic, true);
  return board(`Estudo · ${entry.label}`, [
    { id: uid(), type: "text", style: "title", text: entry.label, x: 65, y: 48, width: 430, height: 70 },
    { id: uid(), type: "staff", x: 65, y: 155, width: 720, height: 190, notes: scale.map((note, index) => ({ id: uid(), note, x: 0.16 + index * 0.1 })) },
    { id: uid(), type: "text", style: "label", text: scale.map(noteName).join("  ·  "), x: 90, y: 355, width: 670, height: 55 },
    { id: uid(), type: "card", preset: "major", x: 820, y: 155, width: 250, height: 120 },
    { id: uid(), type: "text", style: "body", text: `Fórmula: ${MAJOR_FORMULA.map((step) => step === "S" ? "ST" : "T").join(" – ")}`, x: 820, y: 300, width: 250, height: 65 },
    { id: uid(), type: "text", style: "body", text: "Anotações\n\nObserve os acidentes, os semitons e a posição de cada grau…", x: 65, y: 445, width: 1000, height: 165 },
  ]);
}
export function intervalStudyTemplate(intervalId:MusicalIntervalId='M3'):AtelierBoard {const root=note('C');const target=constructInterval(root,intervalId);const definition=intervalDefinition(intervalId)!;return board(`Estudo · ${definition.name}`,[{id:uid(),type:'text',style:'title',text:definition.name,x:65,y:48,width:430,height:70},{id:uid(),type:'staff',x:65,y:155,width:720,height:190,notes:[root,target].map((value,index)=>({id:uid(),note:value,x:.32+index*.28}))},{id:uid(),type:'text',style:'label',text:`${noteName(root)} → ${noteName(target)} · ${definition.semitones} semitons`,x:90,y:355,width:670,height:55},{id:uid(),type:'text',style:'body',text:'Minha percepção:\n\nO que observo na pauta e no teclado…',x:65,y:445,width:1000,height:165}]);}
export function rhythmStudyTemplate():AtelierBoard{return board('Estudo de ritmo',[{id:uid(),type:'text',style:'title',text:'Ritmo · pulsação e duração',x:65,y:48,width:520,height:70},{id:uid(),type:'text',style:'label',text:'Compasso 4/4  ·  ♩  ♩  ♩  ♩',x:65,y:150,width:600,height:70},{id:uid(),type:'card',preset:'natural',x:735,y:135,width:300,height:120},{id:uid(),type:'text',style:'body',text:'Conte e bata palmas:\n\n1      2      3      4\n♩      ♩      ♩      ♩',x:65,y:260,width:600,height:170},{id:uid(),type:'text',style:'body',text:'Minhas observações:\n\nOnde mantenho a pulsação?\nOnde tendo a acelerar ou desacelerar?',x:65,y:485,width:970,height:160}]);}
export function chordStudyTemplate(root=note("C"),quality:TriadQuality="major"):AtelierBoard{const chord=buildTriad(root,quality);return board(`Estudo · ${chord.name}`,[{id:uid(),type:"text",style:"title",text:`${chord.name} · ${chord.symbol}`,x:65,y:48,width:540,height:70},{id:uid(),type:"staff",x:65,y:145,width:650,height:190,notes:chord.pitches.map((value,index)=>({id:uid(),note:value,x:.34+index*.035}))},{id:uid(),type:"text",style:"label",text:triadNoteNames(chord).join("  ·  "),x:90,y:350,width:600,height:55},{id:uid(),type:"text",style:"body",text:`Fundamental: ${noteName(chord.root)}\nTerça: ${noteName(chord.third)} · ${chord.intervals[0]}\nQuinta: ${noteName(chord.fifth)} · ${chord.intervals[1]}`,x:760,y:150,width:300,height:170},{id:uid(),type:"text",style:"body",text:"Minhas observações:\n\nComo percebo esta tríade?\nO que muda ao comparar maior e menor?",x:65,y:450,width:995,height:170}]);}
export function harmonyStudyTemplate(tonic=note("C")):AtelierBoard{const harmony=buildMajorKeyHarmony(tonic);return board(`Campo harmônico · ${harmony.name}`,[{id:uid(),type:"text",style:"title",text:`Campo harmônico de ${harmony.name}`,x:65,y:48,width:650,height:70},{id:uid(),type:"text",style:"label",text:harmony.scale.map(noteName).join("  ·  "),x:65,y:140,width:950,height:55},{id:uid(),type:"text",style:"body",text:harmony.degrees.map(item=>`${item.roman} — ${item.triad.symbol} — ${item.triad.pitches.map(noteName).join(" ")}`).join("\n"),x:65,y:225,width:610,height:310},{id:uid(),type:"text",style:"body",text:"Funções iniciais\n\nTônica: I / vi\nPredominante: ii / IV\nDominante: V / vii°\niii: contextual",x:730,y:225,width:330,height:240},{id:uid(),type:"text",style:"body",text:"Observações:\n\nO que percebo ao ouvir I → IV → V → I?",x:65,y:575,width:995,height:135}]);}
