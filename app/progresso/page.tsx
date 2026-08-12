import type { Metadata } from "next";
import { ProgressView } from "./progress-view";

export const metadata: Metadata = {
  title: "Progresso",
  description:
    "Exercícios feitos, taxa de acerto, erros por categoria e frequência de estudo.",
};

export default function Page() {
  return <ProgressView />;
}
