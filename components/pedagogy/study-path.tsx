"use client";
import Link from "next/link";
import { STUDY_PATH } from "@/lib/pedagogy/path";
import { moduleState } from "@/lib/pedagogy/mastery";
import { useStudy } from "@/lib/study/provider";
const LISTENING = [
  "Conhecer o som",
  "Grave / agudo",
  "Movimento",
  "Nota com referência",
  "Tom / semitom",
  "Escalas",
];
export function StudyPath() {
  const { state } = useStudy();
  return (
    <section className="border-y border-rule py-6">
      <p className="type-label text-brass">Seu caminho</p>
      <ol className="mt-5 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {STUDY_PATH.map((step, index) => {
          const moduleId =
            step.id === "leitura"
              ? "leitura"
              : step.id === "intervalos"
                ? "intervalos"
                : ["C", "G", "D", "F", "escala-maior"].includes(step.id)
                  ? "escalas"
                  : null;
          const status = moduleId
            ? moduleState(state, moduleId)
            : state.lastTopic?.href === step.href
              ? "seen"
              : "not-started";
          return (
            <li key={step.id} className="bg-paper px-3 py-3">
              <Link href={step.href} className="group flex items-start gap-3">
                <span className="type-technical text-[.625rem] text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong className="display block text-sm text-ink group-hover:text-brass">
                    {step.label}
                  </strong>
                  <small className="mt-1 block text-[.625rem] text-ink-faint">
                    {
                      {
                        "not-started": "não iniciado",
                        seen: "visto",
                        practicing: "praticando",
                        consolidating: "consolidando",
                      }[status]
                    }
                  </small>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="mt-6">
        <p className="type-label text-ink-faint">Trilha paralela · Ouvir</p>
        <Link
          href="/ouvido-musical"
          className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-muted hover:text-brass"
        >
          {LISTENING.map((label, index) => (
            <span key={label}>
              {index + 1}. {label}
            </span>
          ))}
        </Link>
      </div>
    </section>
  );
}
