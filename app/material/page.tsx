import type { Metadata } from "next";
import { MaterialLibrary } from "./material-library";

export const metadata: Metadata = {
  title: "Material da professora",
  description:
    "Guardar, visualizar e anotar as imagens e PDFs passados em aula, tudo salvo neste navegador.",
};

export default function Page() {
  return <MaterialLibrary />;
}
