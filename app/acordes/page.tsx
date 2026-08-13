import type { Metadata } from "next";import { ChordStudio } from "./chord-studio";
export const metadata:Metadata={title:"Acordes · Caderno Musical",description:"Construa, veja e ouça tríades maiores e menores."};
export default function Page(){return <ChordStudio/>;}
