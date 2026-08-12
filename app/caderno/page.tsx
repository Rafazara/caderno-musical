import type { Metadata } from "next";
import { Suspense } from "react";
import { Notebook } from "./notebook";

export const metadata: Metadata = {
  title: "Meu caderno",
  description:
    "Anotações pessoais de teoria musical, com etiquetas e ligação com os tópicos estudados.",
};

export default function Page() {
  // `useSearchParams` no cliente precisa de um limite de Suspense para que a
  // página continue podendo ser pré-renderizada estaticamente.
  return (
    <Suspense fallback={null}>
      <Notebook />
    </Suspense>
  );
}
