export type Representation = "theory" | "keyboard" | "staff" | "sound";
export type PedagogicalConcept = {
  id: string; title: string; essential: string; deeper?: string;
  commonMistake?: { claim: string; correction: string };
  memory?: string[]; observe?: string; connection?: string;
  prerequisites?: string[]; relatedPractice: string;
};
