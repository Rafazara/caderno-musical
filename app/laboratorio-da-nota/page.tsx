import type { Metadata } from "next";
import { NoteLaboratory } from "@/components/music/note-laboratory";
import { SectionHeading } from "@/components/ui/prose";

export const metadata: Metadata = { title: "Laboratório da nota", description: "Explore a relação entre nota, pentagrama, teclado e som." };

export default function Page() {
  return <div className="flex flex-col gap-8"><SectionHeading eyebrow="Explorar" title="Laboratório da nota" description="Uma nota por todos os ângulos: escrita, nome, posição, tecla e altura sonora." /><NoteLaboratory /></div>;
}
