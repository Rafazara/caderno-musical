import type { Metadata } from "next";
import { ScalesStudio } from "./scales-studio";

export const metadata: Metadata = {
  title: "Escalas maiores",
  description:
    "Entender e praticar a escala maior: a fórmula Tom-Tom-Semitom-Tom-Tom-Tom-Semitom aplicada a Dó, Sol, Ré e Fá maior.",
};

export default function Page() {
  return <ScalesStudio />;
}
