import type { Metadata } from "next";
import { IntervalPractice } from "./interval-practice";

export const metadata: Metadata = {
  title: "Tom e semitom",
  description:
    "Praticar a distância entre notas com apoio visual do teclado: onde há tom e onde há semitom.",
};

export default function Page() {
  return <IntervalPractice />;
}
