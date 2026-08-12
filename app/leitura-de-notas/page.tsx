import type { Metadata } from "next";
import { ReadingPractice } from "./reading-practice";

export const metadata: Metadata = {
  title: "Leitura de notas",
  description:
    "Exercícios de leitura de notas no pentagrama em clave de sol, com correção explicada.",
};

export default function Page() {
  return <ReadingPractice />;
}
