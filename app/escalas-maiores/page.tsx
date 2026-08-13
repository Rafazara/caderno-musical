import type { Metadata } from "next";
import { ScalesStudio } from "./scales-studio";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Escalas maiores",
  description:
    "Entender e praticar a escala maior: a fórmula Tom-Tom-Semitom-Tom-Tom-Tom-Semitom aplicada a Dó, Sol, Ré e Fá maior.",
};

export default function Page() {
  return <><ScalesStudio /><aside className="mt-10 border-t border-rule pt-6"><p className="type-label text-brass">Conexão harmônica</p><p className="mt-2 text-sm text-ink-muted">Use as notas reais de uma escala para construir tríades sobre seus graus.</p><Link href="/acordes?scale=C" className="mt-3 inline-block text-sm font-medium text-brass">Construir acordes nesta escala →</Link></aside></>;
}
