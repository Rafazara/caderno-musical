import type { Metadata } from "next";
import { StudySessionStudio } from "./study-session-studio";

export const metadata: Metadata = { title: "Sessão de estudo", description: "Planeje e conduza uma sessão de estudo musical com intenção." };
export default function Page() { return <StudySessionStudio />; }
