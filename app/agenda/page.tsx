import type { Metadata } from "next";
import { AgendaStudio } from "./agenda-studio";
export const metadata: Metadata = { title: "Agenda", description: "Aulas, preparação e diário de aprendizado musical." };
export default function Page() { return <AgendaStudio />; }
