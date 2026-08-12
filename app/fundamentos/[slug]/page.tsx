import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, NotebookPen, Quote } from "lucide-react";
import { FundamentalVisualView } from "@/components/content/fundamental-visual";
import { RichText } from "@/components/content/rich-text";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/prose";
import { findFundamental, FUNDAMENTALS } from "@/lib/content/fundamentals";

export function generateStaticParams() {
  return FUNDAMENTALS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(
  props: PageProps<"/fundamentos/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = findFundamental(slug);
  if (!item) return { title: "Fundamento não encontrado" };
  return { title: item.title, description: item.summary };
}

export default async function Page(props: PageProps<"/fundamentos/[slug]">) {
  const { slug } = await props.params;
  const item = findFundamental(slug);
  if (!item) notFound();

  const related = item.related
    .map((s) => findFundamental(s))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <article className="flex flex-col gap-8">
      <div>
        <Link
          href="/fundamentos"
          className="mb-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-muted transition-colors hover:text-brass"
        >
          <ArrowLeft className="size-3.5" />
          Fundamentos
        </Link>
        <SectionHeading eyebrow="Fundamento" title={item.title} />
      </div>

      {/* A definição em uma frase, antes de qualquer desenvolvimento. */}
      <div className="notebook-margin rounded-r-lg bg-brass-wash/60 py-4 pr-5 pl-5">
        <Quote className="mb-2 size-4 text-brass" />
        <p className="display text-[1.0625rem] leading-relaxed font-medium text-balance text-ink">
          {item.definition}
        </p>
      </div>

      {/* Apoio visual antes do texto: a figura carrega parte da explicação. */}
      {item.visual ? (
        <Card>
          <CardContent className="pt-6">
            <FundamentalVisualView visual={item.visual} />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex max-w-[68ch] flex-col gap-4 text-[0.9375rem] leading-[1.75] text-ink-soft">
        {item.body.map((paragraph, i) => (
          <p key={i}>
            <RichText>{paragraph}</RichText>
          </p>
        ))}
      </div>

      {/* Ponte para a prática — ler sem responder não fixa. */}
      {item.practice ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brass-soft/30 bg-brass-wash px-5 py-4">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">
            Entendeu a ideia? Agora responda algumas questões — é o que faz o conteúdo ficar.
          </p>
          <Link href={item.practice.href} className={buttonClass({ variant: "brass" })}>
            {item.practice.label}
            <ArrowRight />
          </Link>
        </div>
      ) : null}

      {/* Ver também */}
      {related.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Ver também
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/fundamentos/${r.slug}`}
                className="group flex items-start justify-between gap-3 rounded-lg border border-rule bg-paper-raised p-4 transition-colors hover:border-brass-soft hover:bg-brass-wash"
              >
                <span className="min-w-0">
                  <span className="display block text-sm font-semibold text-ink">{r.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                    {r.summary}
                  </span>
                </span>
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brass" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="border-t border-rule pt-6">
        <Link
          href={`/caderno?assunto=${encodeURIComponent(item.subject)}&topico=${item.slug}`}
          className={buttonClass({ variant: "outline" })}
        >
          <NotebookPen />
          Anotar sobre isto no meu caderno
        </Link>
      </div>
    </article>
  );
}
