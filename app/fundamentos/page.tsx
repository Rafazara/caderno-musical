import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { CircleOfFifths } from "@/components/music/circle-of-fifths";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout, SectionHeading } from "@/components/ui/prose";
import { FUNDAMENTALS } from "@/lib/content/fundamentals";
import { SCALES } from "@/lib/music/scales";

export const metadata: Metadata = {
  title: "Fundamentos",
  description:
    "Explicações curtas e visuais de partitura, pentagrama, clave, escala, tom, semitom e ciclo de quintas.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Consultar"
        title="Fundamentos"
        description="Os conceitos que sustentam tudo o resto, explicados de forma curta e com apoio visual. Feito para consulta rápida — volte quantas vezes precisar."
      />

      {/* Índice de tópicos */}
      <div className="grid gap-3 sm:grid-cols-2">
        {FUNDAMENTALS.map((item) => (
          <Link
            key={item.slug}
            href={`/fundamentos/${item.slug}`}
            className="group flex flex-col rounded-xl border border-rule bg-paper-raised p-5 shadow-page transition-all duration-200 hover:-translate-y-0.5 hover:border-brass-soft hover:shadow-lift"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="display text-[1.0625rem] font-semibold text-balance text-ink">
                {item.title}
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brass" />
            </span>
            <span className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
              {item.summary}
            </span>
          </Link>
        ))}
      </div>

      {/* O ciclo de quintas ganha destaque na entrada por ser o mapa geral. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-brass" />
            O mapa das tonalidades
          </CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            O ciclo de quintas mostra como as tonalidades se relacionam. As quatro em destaque são
            as desta etapa.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-8">
          <CircleOfFifths highlight={SCALES.map((s) => s.id)} className="shrink-0" />
          <div className="flex flex-col gap-3">
            <Callout title="Sentido horário: sustenidos" tone="brass">
              Cada passo sobe uma quinta e acrescenta um sustenido. Dó (nenhum) → Sol (1) → Ré (2) →
              Lá (3)…
            </Callout>
            <Callout title="Sentido anti-horário: bemóis" tone="slate">
              Cada passo desce uma quinta e acrescenta um bemol. Dó (nenhum) → Fá (1) → Si♭ (2) →
              Mi♭ (3)…
            </Callout>
            <Link
              href="/fundamentos/ciclo-de-quintas"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brass underline decoration-brass/30 underline-offset-4 transition-colors hover:decoration-brass"
            >
              Ler sobre o ciclo de quintas
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
