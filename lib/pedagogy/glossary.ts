import { findFundamental } from "@/lib/content/fundamentals";
export type GlossaryEntry = {
  term: string;
  definition: string;
  fundamental?: string;
};
const entries: Array<[string, string?, string?]> = [
  ["campo harmônico","campo-harmonico"],["grau harmônico","campo-harmonico","Acorde construído sobre um grau da escala."],["numeral romano","campo-harmonico","Símbolo que indica grau e qualidade do acorde dentro da tonalidade."],["função tônica","campo-harmonico","Comportamento associado ao centro tonal e estabilidade estrutural."],["função dominante","campo-harmonico","Comportamento de forte direção para a região tônica."],["função predominante","campo-harmonico","Área que frequentemente prepara a dominante."],["progressão harmônica","campo-harmonico","Sequência de acordes ao longo do tempo."],
  ["acorde","acordes","Conjunto de notas organizado por relações harmônicas."],["tríade","acordes"],["fundamental","acordes","Nota que dá nome ao acorde."],["terça do acorde","acordes","Nota a uma terça da fundamental; distingue as tríades maior e menor estudadas."],["quinta do acorde","acordes","Nota a uma quinta da fundamental."],["tríade maior","acordes","Fundamental, terça maior e quinta justa."],["tríade menor","acordes","Fundamental, terça menor e quinta justa."],["tríade diminuta","acordes","Fundamental, terça menor e quinta diminuta."],["tríade aumentada","acordes","Fundamental, terça maior e quinta aumentada."],["posição fundamental","acordes","Disposição em que a fundamental é a nota mais grave."],["primeira inversão","acordes","Disposição em que a terça está no baixo."],["segunda inversão","acordes","Disposição em que a quinta está no baixo."],["arpejo","acordes","Notas de um acorde tocadas sucessivamente."],["cifra","acordes","Símbolo internacional abreviado de um acorde."],
  ["ritmo", "pulsacao", "Organização de sons e silêncios em relação à pulsação."],
  ["pulsação", "pulsacao"], ["tempo", "pulsacao", "Uma pulsação contada dentro do compasso."], ["BPM", "pulsacao", "Quantidade de pulsações por minuto."],
  ["figura musical", "figuras-musicais"], ["semibreve", "figuras-musicais", "Quatro tempos no contexto 4/4 apresentado."], ["mínima", "figuras-musicais", "Dois tempos no contexto 4/4 apresentado."], ["semínima", "figuras-musicais", "Uma pulsação no contexto 4/4 apresentado."], ["colcheia", "figuras-musicais", "Metade de uma pulsação no contexto apresentado."],
  ["pausa", "figuras-musicais", "Silêncio organizado que ocupa duração musical."], ["compasso", "compasso"], ["barra de compasso", "compasso", "Linha que separa grupos de pulsações."], ["fórmula de compasso", "compasso", "Números que indicam quantidade e unidade de referência."], ["subdivisão", "figuras-musicais", "Divisão regular de uma pulsação."],
  ["intervalo", "intervalo"],
  ["intervalo melódico", "intervalo", "Duas notas ouvidas sucessivamente."],
  ["intervalo harmônico", "intervalo", "Duas notas ouvidas simultaneamente."],
  [
    "qualidade",
    "intervalo",
    "Classificação maior, menor ou justa derivada da grafia e dos semitons.",
  ],
  ["intervalo maior", "intervalo", "Forma maior de uma segunda ou terça."],
  [
    "intervalo menor",
    "intervalo",
    "Forma um semitom menor que o intervalo maior correspondente.",
  ],
  [
    "intervalo justo",
    "intervalo",
    "Qualidade usada para uníssono, quarta, quinta e oitava.",
  ],
  [
    "enarmonia",
    undefined,
    "Grafias diferentes que produzem a mesma altura no temperamento igual.",
  ],
  ["partitura", "partitura"],
  ["pentagrama", "pentagrama"],
  ["clave", "clave"],
  ["clave de Sol", "clave"],
  ["nota", undefined, "Um som musical identificado por altura e nome."],
  [
    "altura",
    undefined,
    "A qualidade que distingue sons graves de sons agudos.",
  ],
  ["tom", "tom-semitom"],
  ["semitom", "tom-semitom"],
  ["acidente", undefined, "Sinal que altera a altura escrita de uma nota."],
  ["sustenido", undefined, "Acidente que eleva uma nota em um semitom."],
  ["bemol", undefined, "Acidente que abaixa uma nota em um semitom."],
  ["escala", "escala"],
  ["tônica", "escala", "A nota de referência que dá nome e centro à escala."],
  ["grau", "escala", "A posição de uma nota dentro de uma escala."],
  ["dominante", undefined, "O quinto grau de uma escala."],
  ["ciclo de quintas", "ciclo-de-quintas"],
];
export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries(
  entries.map(([term, slug, fallback]) => {
    const fundamental = slug ? findFundamental(slug) : undefined;
    return [
      term.toLocaleLowerCase("pt-BR"),
      {
        term,
        definition: fallback ?? fundamental?.definition ?? "",
        fundamental: slug,
      },
    ];
  }),
);
export function glossaryEntry(term: string) {
  return GLOSSARY[term.toLocaleLowerCase("pt-BR")];
}
