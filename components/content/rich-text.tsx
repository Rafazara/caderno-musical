import * as React from "react";

/**
 * Ênfase inline no conteúdo didático.
 *
 * O texto dos fundamentos usa `**negrito**` e `*itálico*`. Um interpretador de
 * markdown completo seria peso desnecessário para duas marcações — este
 * tokenizador resolve as duas e nada mais.
 */
export function RichText({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <em key={i} className="font-medium text-brass not-italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return part;
      })}
    </>
  );
}
