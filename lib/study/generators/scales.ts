/**
 * Exercícios de escalas maiores.
 *
 * Quatro tipos, todos derivados da mesma fórmula:
 *
 *   `escala:{id}:{grau}`  completar a nota que falta na escala
 *   `formula:{grau}`      a distância entre dois graus consecutivos
 *   `armadura:{id}`       quantas notas a escala altera
 *   `alterada:{id}`       qual nota é alterada
 *   `tonica:{id}`         reconhecer a escala a partir das suas notas
 *
 * A ordenação das notas tem interface própria (arrastar/clicar em sequência) e
 * vive em `components/study/scale-order.tsx`, fora do runner de alternativas.
 */

import type { StripSlot } from "@/components/music/scale-strip";
import {
  ACCIDENTAL_SIGN,
  LETTERS,
  LETTER_PT,
  type Accidental,
  type Letter,
  noteName,
} from "@/lib/music/notes";
import {
  buildMajorScale,
  DEGREE_NAME,
  DEGREE_ROMAN,
  explainDegree,
  findScale,
  keySignature,
  MAJOR_FORMULA,
  type ScaleEntry,
  SCALES,
  STEP_LABEL,
} from "@/lib/music/scales";
import type { Question, Rehydrator } from "@/lib/study/question";
import { sampleMany, shuffle } from "@/lib/utils";

export const SCALE_SESSION_SIZE = 10;

/* --------------------------------------------------------------------------
   1. Completar a escala
   -------------------------------------------------------------------------- */

/** Nome de nota com letra e alteração arbitrárias — para montar alternativas. */
function name(letter: Letter, accidental: Accidental) {
  return LETTER_PT[letter] + ACCIDENTAL_SIGN[accidental];
}

/**
 * Alternativas plausíveis para a nota que falta.
 *
 * As distratoras não são aleatórias: incluem sempre a versão natural da mesma
 * letra quando a resposta é alterada — que é justamente o erro que o exercício
 * quer expor — e as letras vizinhas.
 */
function completionOptions(answerLetter: Letter, answerAcc: Accidental): string[] {
  const answer = name(answerLetter, answerAcc);
  const idx = LETTERS.indexOf(answerLetter);
  const candidates: string[] = [];

  // O erro clássico: esquecer a alteração (ou inventar uma).
  candidates.push(answerAcc === 0 ? name(answerLetter, 1) : name(answerLetter, 0));

  // Letras vizinhas, naturais.
  candidates.push(name(LETTERS[(idx + 1) % 7], 0));
  candidates.push(name(LETTERS[(idx + 6) % 7], 0));
  // Uma reserva, caso alguma coincida com a resposta.
  candidates.push(name(LETTERS[(idx + 2) % 7], 0));
  candidates.push(name(LETTERS[(idx + 5) % 7], 0));

  const distractors: string[] = [];
  for (const c of candidates) {
    if (c !== answer && !distractors.includes(c)) distractors.push(c);
    if (distractors.length === 3) break;
  }

  return shuffle([answer, ...distractors]);
}

function completionQuestion(entry: ScaleEntry, degree: number): Question {
  const scale = buildMajorScale(entry.tonic, true);
  const target = scale[degree];
  const answer = noteName(target);

  const slots: StripSlot[] = scale.map((n, i) => ({
    name: i === degree ? null : noteName(n),
    state: i === degree ? "target" : i < degree ? "default" : "muted",
  }));

  return {
    key: `escala:${entry.id}:${degree}`,
    module: "escalas",
    prompt: `Qual nota completa o grau ${degree === 7 ? "I (oitava)" : DEGREE_ROMAN[degree]} de ${entry.label}?`,
    itemLabel: `${entry.label} · grau ${degree === 7 ? "VIII" : DEGREE_ROMAN[degree]}`,
    options: completionOptions(target.letter, target.accidental),
    answer,
    visual: {
      kind: "scale",
      slots,
      caption: `Os números entre as notas são a fórmula: 1 = tom, ½ = semitom.`,
    },
    explain: (given) => ({
      headline: given === answer ? `É ${answer}.` : `Era ${answer}, não ${given}.`,
      reason: explainDegree(entry, degree),
      tip:
        target.accidental !== 0
          ? `Toda escala maior usa cada letra uma única vez. Como a letra já estava definida (${LETTER_PT[target.letter]}), só restava ajustar a alteração para a distância fechar.`
          : `Uma escala maior nunca repete nem pula letras: ${scale
              .slice(0, 7)
              .map((n) => LETTER_PT[n.letter])
              .join(" · ")}. Descoberta a letra, resta checar se ela precisa de alteração.`,
    }),
  };
}

/* --------------------------------------------------------------------------
   2. A fórmula
   -------------------------------------------------------------------------- */

function formulaQuestion(degree: number): Question {
  // `degree` é 1-based: 1 significa "do grau I para o grau II".
  const stepKind = MAJOR_FORMULA[degree - 1];
  const answer = STEP_LABEL[stepKind];
  const from = DEGREE_ROMAN[degree - 1];
  const to = degree === 7 ? "I (oitava)" : DEGREE_ROMAN[degree];

  const semitonePositions = MAJOR_FORMULA.map((s, i) => (s === "S" ? i + 1 : 0)).filter(Boolean);

  return {
    key: `formula:${degree}`,
    module: "escalas",
    prompt: `Na escala maior, qual é a distância do grau ${from} para o grau ${to}?`,
    itemLabel: `Fórmula · ${from} → ${to}`,
    options: ["Tom", "Semitom"],
    answer,
    visual: { kind: "formula" },
    explain: (given) => ({
      headline:
        given === answer
          ? `Do ${from} para o ${to} é ${answer.toLowerCase()}.`
          : `Era ${answer.toLowerCase()}, não ${given.toLowerCase()}.`,
      reason: `A fórmula da escala maior é Tom · Tom · Semitom · Tom · Tom · Tom · Semitom. O passo ${degree}º da sequência é ${answer.toLowerCase()}.`,
      tip: `Os semitons ficam sempre nas posições ${semitonePositions.join(" e ")}: entre III–IV e entre VII–I. Todo o resto é tom. Decorando onde caem os dois semitons, você reconstrói a fórmula inteira.`,
    }),
  };
}

/* --------------------------------------------------------------------------
   3. Armadura: quantas alterações
   -------------------------------------------------------------------------- */

const COUNT_WORDS = ["Nenhuma", "Uma", "Duas", "Três"];

function signatureQuestion(entry: ScaleEntry): Question {
  const sig = keySignature(entry.tonic);
  const answer = COUNT_WORDS[Math.min(sig.count, 3)];

  return {
    key: `armadura:${entry.id}`,
    module: "escalas",
    prompt: `Quantas notas ${entry.label} altera?`,
    itemLabel: `${entry.label} · nº de alterações`,
    options: COUNT_WORDS,
    answer,
    visual: {
      kind: "scale",
      slots: buildMajorScale(entry.tonic, true).map((n) => ({
        name: noteName(n),
        state: n.accidental !== 0 ? "target" : "muted",
      })),
      caption: "As notas em destaque são as que a escala altera.",
    },
    explain: (given) => ({
      headline:
        given === answer
          ? `${entry.label} altera ${answer.toLowerCase()} ${sig.count === 1 ? "nota" : "notas"}.`
          : `Era ${answer.toLowerCase()}, não ${given.toLowerCase()}.`,
      reason:
        sig.count === 0
          ? "Dó maior é a única escala maior formada só por notas naturais — nenhuma alteração. É por isso que ela é o ponto de partida do ciclo de quintas."
          : `${entry.label} altera ${sig.names.join(" e ")}. ${entry.insight}`,
      tip:
        sig.count === 0
          ? "No teclado, Dó maior é só teclas brancas. Qualquer outra escala maior precisa de pelo menos uma preta."
          : `Os sustenidos sempre aparecem nesta ordem: Fá · Dó · Sol · Ré · Lá · Mi · Si. Os bemóis, na ordem inversa: Si · Mi · Lá · Ré · Sol · Dó · Fá.`,
    }),
  };
}

/* --------------------------------------------------------------------------
   4. Qual nota é alterada
   -------------------------------------------------------------------------- */

/** Notas alteradas que NÃO pertencem à escala — distratoras seguras. */
function alteredDistractors(entry: ScaleEntry): string[] {
  const inScale = new Set(buildMajorScale(entry.tonic).map(noteName));
  const pool: string[] = [];
  for (const letter of LETTERS) {
    for (const acc of [1, -1] as Accidental[]) {
      const candidate = name(letter, acc);
      if (!inScale.has(candidate)) pool.push(candidate);
    }
  }
  return shuffle(pool);
}

function alteredNoteQuestion(entry: ScaleEntry): Question {
  const sig = keySignature(entry.tonic);
  const scale = buildMajorScale(entry.tonic);
  const altered = scale.filter((n) => n.accidental !== 0).map(noteName);
  const answer = altered[0];

  return {
    key: `alterada:${entry.id}`,
    module: "escalas",
    prompt: `Qual destas notas aparece alterada em ${entry.label}?`,
    itemLabel: `${entry.label} · nota alterada`,
    options: shuffle([answer, ...alteredDistractors(entry).slice(0, 3)]),
    answer,
    visual: {
      kind: "scale",
      slots: scale.map((n) => ({
        name: n.accidental !== 0 ? "?" : noteName(n),
        state: n.accidental !== 0 ? "blank" : "muted",
      })),
      caption: `${entry.label}, com as alterações escondidas.`,
    },
    explain: (given) => ({
      headline: given === answer ? `Sim, ${answer}.` : `Era ${answer}, não ${given}.`,
      reason: `${entry.insight}${altered.length > 1 ? ` A escala completa altera ${sig.names.join(" e ")}.` : ""}`,
      tip: `Para checar: escreva as sete letras a partir da tônica (${scale
        .map((n) => LETTER_PT[n.letter])
        .join(" · ")}) e confira cada distância contra a fórmula. A letra que não fecha é a que precisa de alteração.`,
    }),
  };
}

/* --------------------------------------------------------------------------
   5. Reconhecer a escala
   -------------------------------------------------------------------------- */

function tonicQuestion(entry: ScaleEntry): Question {
  const scale = buildMajorScale(entry.tonic, true);

  return {
    key: `tonica:${entry.id}`,
    module: "escalas",
    prompt: "Estas notas formam qual escala maior?",
    itemLabel: `Reconhecer ${entry.label}`,
    options: shuffle(SCALES.map((s) => s.label)),
    answer: entry.label,
    visual: {
      kind: "scale",
      slots: scale.map((n) => ({ name: noteName(n), state: "default" as const })),
      caption: "Repare na primeira nota e nas alterações.",
    },
    explain: (given) => ({
      headline: given === entry.label ? `É ${entry.label}.` : `Era ${entry.label}, não ${given}.`,
      reason: `A escala começa e termina em ${noteName(entry.tonic)}, e é a tônica que dá nome à escala. ${entry.insight}`,
      tip: "Dois sinais rápidos: qual é a primeira nota, e quais alterações aparecem. Sem alteração é Dó maior; um sustenido (Fá♯) é Sol maior; dois (Fá♯ e Dó♯) é Ré maior; um bemol (Si♭) é Fá maior.",
    }),
  };
}

/* --------------------------------------------------------------------------
   Montagem da sessão
   -------------------------------------------------------------------------- */

/**
 * Mistura os tipos numa proporção fixa: a maior parte de "completar a escala",
 * que é a habilidade central, e o restante distribuído entre fórmula, armadura
 * e reconhecimento, para o estudo não virar mecânico.
 */
export function buildScaleSession(
  scaleIds: string[],
  size = SCALE_SESSION_SIZE,
): Question[] {
  const entries = scaleIds
    .map((id) => findScale(id))
    .filter((e): e is ScaleEntry => Boolean(e));

  if (entries.length === 0) return [];

  const completions = entries.flatMap((entry) =>
    Array.from({ length: 7 }, (_, i) => () => completionQuestion(entry, i + 1)),
  );

  const others: Array<() => Question> = [
    ...Array.from({ length: 7 }, (_, i) => () => formulaQuestion(i + 1)),
    ...entries.map((entry) => () => signatureQuestion(entry)),
    ...entries
      .filter((entry) => keySignature(entry.tonic).count > 0)
      .map((entry) => () => alteredNoteQuestion(entry)),
    ...entries.map((entry) => () => tonicQuestion(entry)),
  ];

  const completionCount = Math.max(1, Math.round(size * 0.6));
  const picked = [
    ...sampleMany(completions, completionCount),
    ...sampleMany(others, size - completionCount),
  ];

  return shuffle(picked).map((make) => make());
}

export const rehydrateScale: Rehydrator = (key) => {
  const parts = key.split(":");

  if (parts[0] === "escala" && parts.length === 3) {
    const entry = findScale(parts[1]);
    const degree = Number(parts[2]);
    if (entry && Number.isInteger(degree) && degree >= 1 && degree <= 7) {
      return completionQuestion(entry, degree);
    }
    return null;
  }

  if (parts[0] === "formula" && parts.length === 2) {
    const degree = Number(parts[1]);
    return Number.isInteger(degree) && degree >= 1 && degree <= 7
      ? formulaQuestion(degree)
      : null;
  }

  if (parts[0] === "armadura" && parts.length === 2) {
    const entry = findScale(parts[1]);
    return entry ? signatureQuestion(entry) : null;
  }

  if (parts[0] === "alterada" && parts.length === 2) {
    const entry = findScale(parts[1]);
    return entry && keySignature(entry.tonic).count > 0 ? alteredNoteQuestion(entry) : null;
  }

  if (parts[0] === "tonica" && parts.length === 2) {
    const entry = findScale(parts[1]);
    return entry ? tonicQuestion(entry) : null;
  }

  return null;
};

/** Nome legível de um grau, para as estatísticas. */
export function degreeLabel(degree: number): string {
  return degree === 7 ? "oitava" : `${DEGREE_ROMAN[degree]} (${DEGREE_NAME[degree]})`;
}
