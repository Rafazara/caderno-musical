import type { Metadata } from "next";
import { AtelierStudio } from "@/components/atelier/atelier-studio";

export const metadata: Metadata = { title: "Ateliê de Partitura", description: "Quadros visuais para estudar e explicar teoria musical." };
export default function Page() { return <AtelierStudio />; }
