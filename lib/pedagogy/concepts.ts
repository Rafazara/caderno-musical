import { classify, semitonesBetween } from "@/lib/music/intervals";
import { note, noteName } from "@/lib/music/notes";
import { buildMajorScale, MAJOR_FORMULA, type ScaleEntry } from "@/lib/music/scales";
import type { PedagogicalConcept } from "./types";

const mi=note("E",0,4), fa=note("F",0,4);
export const naturalSemitone: PedagogicalConcept = {
  id:"natural-semitones", title:"Semitons naturais",
  essential:`Mi–Fá e Si–Dó são os dois pares de notas naturais separados por ${semitonesBetween(mi,fa)} semitom. No teclado, não existe tecla preta entre eles.`,
  deeper:"Semitom é uma distância sonora, não uma regra sobre nomes. Notas com letras diferentes podem estar a um ou dois semitons.",
  commonMistake:{claim:"Se as letras são diferentes, existe um tom entre elas.",correction:"Mi e Fá têm nomes diferentes, mas são teclas vizinhas: a distância é um semitom."},
  memory:["Mi–Fá","Si–Dó"], observe:"Não existe tecla preta entre Mi e Fá, nem entre Si e Dó.", connection:"Esta relação determina onde aparecem os semitons dentro de uma escala maior.", relatedPractice:"/tom-e-semitom",
};
export function majorScaleConcept(entry:ScaleEntry):PedagogicalConcept {
  const scale=buildMajorScale(entry.tonic,true); const altered=scale.filter(n=>n.accidental!==0).map(noteName);
  return { id:`major-${entry.id}`,title:entry.label,essential:`Aplique ${MAJOR_FORMULA.map(s=>s==='S'?'ST':'T').join('–')} a partir de ${noteName(entry.tonic)}. O resultado é ${scale.map(noteName).join(' – ')}.`,deeper:entry.insight,commonMistake:altered.length?{claim:`Usar ${altered.map(name=>name.replace('♯','').replace('♭','')).join(' e ')} sem alteração.`,correction:`A fórmula exige ${altered.join(' e ')} para manter as distâncias corretas.`}:undefined,memory:[MAJOR_FORMULA.map(s=>s==='S'?'ST':'T').join('–')],observe:altered.length?`As alterações ${altered.join(', ')} não são decorativas: corrigem uma distância pedida pela fórmula.`:"Os semitons naturais já ocupam exatamente os lugares pedidos pela fórmula.",connection:"A mesma fórmula constrói todas as tonalidades maiores e explica suas armaduras.",prerequisites:["Tom e semitom","Fórmula da escala maior"],relatedPractice:"/escalas-maiores"};
}
export function whyAltered(entry:ScaleEntry) {
  const scale=buildMajorScale(entry.tonic,true); const lines=[] as string[];
  for(let i=1;i<scale.length;i++) lines.push(`${noteName(scale[i-1])} → ${noteName(scale[i])} = ${classify(scale[i-1],scale[i])==='tom'?'T':'ST'}`);
  return lines;
}
export const PEDAGOGY_PATHS = { scales:["O que é uma escala","Tom e semitom","Fórmula da escala maior","Dó maior","Sol maior","Prática"] } as const;
