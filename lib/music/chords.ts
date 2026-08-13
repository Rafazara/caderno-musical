import { constructInterval } from "@/lib/music/intervals";
import { ACCIDENTAL_SIGN, LETTER_PT, LETTERS, note, noteName, pitch, step, type Accidental, type Note } from "@/lib/music/notes";

export type TriadQuality = "major" | "minor" | "diminished" | "augmented";
export type TriadInversion = "root" | "first" | "second";
export type Triad = { root: Note; third: Note; fifth: Note; quality: TriadQuality; inversion: TriadInversion; pitches: Note[]; symbol: string; name: string; intervals: readonly [string, string]; stackedThirds: readonly [string, string] };
export type ChordEvent = { chord: Triad; duration: number; start: number };

export const TRIAD_QUALITIES: Record<TriadQuality,{ label:string; thirdSemitones:number; fifthSemitones:number; intervals:readonly [string,string]; stackedThirds:readonly [string,string]; suffix:string }> = {
  major:{label:"maior",thirdSemitones:4,fifthSemitones:7,intervals:["M3","P5"],stackedThirds:["M3","m3"],suffix:""},
  minor:{label:"menor",thirdSemitones:3,fifthSemitones:7,intervals:["m3","P5"],stackedThirds:["m3","M3"],suffix:"m"},
  diminished:{label:"diminuta",thirdSemitones:3,fifthSemitones:6,intervals:["m3","d5"],stackedThirds:["m3","m3"],suffix:"°"},
  augmented:{label:"aumentada",thirdSemitones:4,fifthSemitones:8,intervals:["M3","A5"],stackedThirds:["M3","M3"],suffix:"+"},
};
const INVERSION_LABEL:Record<TriadInversion,string>={root:"posição fundamental",first:"primeira inversão",second:"segunda inversão"};

function diatonicAt(root:Note, distance:number, semitones:number){const targetStep=step(root)+distance;const letter=LETTERS[((targetStep%7)+7)%7];const octave=4+Math.floor(targetStep/7);const natural=note(letter,0,octave);const accidental=(pitch(root)+semitones-pitch(natural)) as Accidental;if(accidental < -2 || accidental > 2)throw new Error("Grafia da tríade exige acidente fora do escopo atual.");return note(letter,accidental,octave);}
function internationalName(n:Note){return `${n.letter}${ACCIDENTAL_SIGN[n.accidental].replaceAll("♯","#").replaceAll("♭","b")}`;}
function raiseOctave(n:Note){return {...n,octave:n.octave+1};}
export function chordSymbol(root:Note,quality:TriadQuality){return `${internationalName(root)}${TRIAD_QUALITIES[quality].suffix}`;}
export function buildTriad(root:Note,quality:TriadQuality="major",inversion:TriadInversion="root"):Triad{const definition=TRIAD_QUALITIES[quality];const third=quality==="major"||quality==="augmented"?constructInterval(root,"M3"):constructInterval(root,"m3");const fifth=definition.fifthSemitones===7?constructInterval(root,"P5"):diatonicAt(root,4,definition.fifthSemitones);const pitches=inversion==="root"?[root,third,fifth]:inversion==="first"?[third,fifth,raiseOctave(root)]:[fifth,raiseOctave(root),raiseOctave(third)];return{root,third,fifth,quality,inversion,pitches,symbol:chordSymbol(root,quality),name:`${LETTER_PT[root.letter]}${ACCIDENTAL_SIGN[root.accidental]} ${definition.label}`,intervals:definition.intervals,stackedThirds:definition.stackedThirds};}
export function identifyTriad(notes:Note[]){if(notes.length!==3)return null;for(const root of notes){for(const quality of Object.keys(TRIAD_QUALITIES) as TriadQuality[]){const triad=buildTriad(root,quality);if(triad.pitches.every(wanted=>notes.some(n=>((pitch(n)-pitch(wanted))%12+12)%12===0)))return triad;}}return null;}
export function buildDiatonicTriad(scale:Note[],degree:number):Triad{if(scale.length<7||degree<1||degree>7)throw new Error("Grau diatônico inválido.");const source=scale.slice(0,7);const root=source[degree-1];const pick=(offset:number)=>{const index=degree-1+offset;const n=source[index%7];return index>=7?raiseOctave(n):n;};const notes=[root,pick(2),pick(4)];const third=pitch(notes[1])-pitch(notes[0]),fifth=pitch(notes[2])-pitch(notes[0]);const quality=(Object.keys(TRIAD_QUALITIES) as TriadQuality[]).find(q=>TRIAD_QUALITIES[q].thirdSemitones===third&&TRIAD_QUALITIES[q].fifthSemitones===fifth);if(!quality)throw new Error("A escala não forma uma tríade suportada neste grau.");return{...buildTriad(root,quality),third:notes[1],fifth:notes[2],pitches:notes};}
export function triadNoteNames(triad:Triad){return triad.pitches.map(noteName);}
export function inversionLabel(value:TriadInversion){return INVERSION_LABEL[value];}
