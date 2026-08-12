import type { Metadata } from "next";
import { ReviewStudio } from "./review-studio";

export const metadata: Metadata = {
  title: "Revisar erros",
  description: "Praticar somente os exercícios que você errou, por tipo de conteúdo.",
};

export default function Page() {
  return <ReviewStudio />;
}
