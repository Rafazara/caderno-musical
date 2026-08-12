/**
 * Conteúdo didático dos fundamentos.
 *
 * Texto separado dos componentes de propósito: é o material que mais vai
 * crescer e ser reescrito, e mantê-lo como dados permite listar, buscar e
 * ligar tópicos entre si sem tocar em JSX.
 *
 * `visual` diz ao componente qual apoio gráfico desenhar — o texto nunca
 * carrega a explicação sozinho quando existe uma figura que resolve melhor.
 */

export type FundamentalVisual =
  | "staff-anatomy"
  | "clef"
  | "scale-formula"
  | "keyboard-semitones"
  | "circle"
  | "note-values"
  | null;

export type Fundamental = {
  slug: string;
  title: string;
  /** Frase de uma linha, usada no índice. */
  summary: string;
  /** Assunto curto, usado ao criar uma anotação a partir do tópico. */
  subject: string;
  /** Definição curta, em destaque no topo do tópico. */
  definition: string;
  /** Parágrafos do corpo. */
  body: string[];
  visual: FundamentalVisual;
  /** Slugs relacionados — alimenta o "ver também". */
  related: string[];
  /** Link para praticar o assunto, quando existe exercício. */
  practice?: { href: string; label: string };
};

export const FUNDAMENTALS: Fundamental[] = [
  {
    slug: "partitura",
    title: "O que é partitura",
    subject: "Leitura de notas",
    summary: "O sistema de escrita da música — e o que exatamente ele registra.",
    definition:
      "Partitura é a música escrita: um sistema que registra quais notas tocar, quando tocar e por quanto tempo.",
    body: [
      "Uma partitura funciona como um texto: você lê da esquerda para a direita, e a posição de cada símbolo carrega significado. A diferença é que ela registra duas informações ao mesmo tempo. A **posição vertical** diz *qual* nota é — quanto mais alto na página, mais aguda. A **posição horizontal** e o desenho da nota dizem *quando* e por *quanto tempo*.",
      "É por isso que ler partitura não é decorar símbolos soltos: é aprender a interpretar um par de coordenadas. Na V1 deste caderno, o foco está inteiramente na coordenada vertical — a altura das notas. A duração vem depois.",
      "Vale saber desde já que a partitura é uma referência, não uma gravação. Ela não fixa tudo: dinâmica, articulação e interpretação ficam em boa parte por conta de quem toca.",
    ],
    visual: "staff-anatomy",
    related: ["pentagrama", "clave"],
  },
  {
    slug: "pentagrama",
    title: "O que é pentagrama",
    subject: "Leitura de notas",
    summary: "As cinco linhas onde as notas moram, e por que são cinco.",
    definition:
      "Pentagrama (ou pauta) é o conjunto de cinco linhas paralelas sobre o qual as notas são escritas.",
    body: [
      "As notas ocupam **as linhas e os espaços entre elas**. Isso dá nove posições dentro da pauta: cinco linhas e quatro espaços. Cada posição, subindo, é a nota seguinte da sequência — sem pular nenhuma.",
      "As linhas são contadas **de baixo para cima**: a linha de baixo é a 1ª, a de cima é a 5ª. Os espaços seguem a mesma lógica. Essa contagem parece um detalhe, mas é a origem de metade das confusões de quem começa.",
      "Quando uma nota é mais grave ou mais aguda do que a pauta alcança, ela é escrita fora dela, apoiada em **linhas suplementares** — pequenos traços que estendem a pauta só para aquela nota. O dó central é o exemplo mais comum na clave de sol.",
      "Cinco linhas não é um número arbitrário: é o máximo que o olho reconhece de relance, sem contar. Com seis ou mais, a leitura fica lenta.",
    ],
    visual: "staff-anatomy",
    related: ["partitura", "clave", "leitura"],
    practice: { href: "/leitura-de-notas", label: "Praticar leitura de notas" },
  },
  {
    slug: "clave",
    title: "O que é clave",
    subject: "Leitura de notas",
    summary: "O símbolo que decide o nome de cada linha da pauta.",
    definition:
      "Clave é o símbolo no início da pauta que define qual nota corresponde a cada linha.",
    body: [
      "Sem clave, a pauta é apenas cinco linhas vazias — não há como saber que nota é qual. A clave é a chave de leitura: ela fixa uma nota de referência numa linha específica, e todas as outras se deduzem a partir dela.",
      "A **clave de sol** (ou clave de G) é a mais usada para instrumentos e vozes de região aguda. O nome não é decorativo: a espiral do símbolo se enrola exatamente na **2ª linha**, e essa linha é o *Sol*. Achando o Sol, você conta para cima e para baixo e encontra o resto.",
      "Existem outras claves — a de fá, para regiões graves, e as de dó, usadas por instrumentos de região média. Cada uma desloca a referência, o que faz a *mesma* posição na pauta significar notas diferentes. Nesta V1 trabalhamos apenas com a clave de sol.",
      "Na clave de sol, a pauta vai do **Mi** (1ª linha) ao **Fá** (5ª linha). Repare na simetria: começa e termina em notas vizinhas de nome, Mi e Fá.",
    ],
    visual: "clef",
    related: ["pentagrama", "leitura"],
    practice: { href: "/leitura-de-notas", label: "Praticar leitura de notas" },
  },
  {
    slug: "tom-semitom",
    title: "O que é tom e semitom",
    subject: "Tom e semitom",
    summary: "As duas unidades de distância que medem toda a música ocidental.",
    definition:
      "Semitom é a menor distância entre duas notas no sistema ocidental. Tom são dois semitons.",
    body: [
      "No piano, um **semitom** é a distância entre duas teclas imediatamente vizinhas, sem pular nenhuma — não importa se são brancas ou pretas. Um **tom** pula uma tecla. No violão, semitom é uma casa e tom são duas.",
      "O detalhe que muda tudo: entre as sete notas naturais, as distâncias **não são todas iguais**. Cinco pares vizinhos formam tom, mas dois formam semitom — *Mi para Fá* e *Si para Dó*. São exatamente os dois lugares do teclado onde duas teclas brancas se tocam sem preta no meio.",
      "Decorar essas duas exceções resolve o assunto. Toda outra vizinhança de notas naturais é um tom, porque tem uma tecla preta no caminho.",
      "Tom e semitom não são curiosidade teórica: são a régua com que as escalas são construídas. A escala maior é definida por uma sequência específica dessas duas distâncias — e nada mais.",
    ],
    visual: "keyboard-semitones",
    related: ["escala-maior", "escala"],
    practice: { href: "/tom-e-semitom", label: "Praticar tom e semitom" },
  },
  {
    slug: "escala",
    title: "O que é escala",
    subject: "Escalas maiores",
    summary: "Uma sequência ordenada de notas — e o alfabeto de uma tonalidade.",
    definition:
      "Escala é uma sequência de notas em ordem de altura, dentro de uma oitava, que serve de base para uma tonalidade.",
    body: [
      "Se você toca notas subindo, uma por uma, sem pular nem repetir, você está tocando uma escala. Mas o que faz uma escala ser *aquela* escala não é a ordem — é **quais notas entram e quais ficam de fora**.",
      "É útil pensar na escala como o alfabeto de um trecho de música. Ela define o conjunto de notas disponíveis, e é desse conjunto que saem as melodias e os acordes que soam coerentes juntos. Sair da escala não é proibido, mas é uma decisão perceptível.",
      "Uma escala se descreve por dois elementos: a **tônica**, que é a nota de partida e dá nome à escala, e o **padrão de distâncias** entre as notas. O mesmo padrão aplicado a tônicas diferentes gera escalas diferentes com o mesmo caráter.",
      "A palavra *oitava* aparece porque a oitava nota da sequência é a repetição da primeira, mais aguda — o ciclo se fecha e recomeça.",
    ],
    visual: "scale-formula",
    related: ["escala-maior", "tom-semitom"],
    practice: { href: "/escalas-maiores", label: "Praticar escalas maiores" },
  },
  {
    slug: "escala-maior",
    title: "O que é escala maior",
    subject: "Escalas maiores",
    summary: "A fórmula T-T-S-T-T-T-S e como ela constrói qualquer tonalidade.",
    definition:
      "Escala maior é a escala de sete notas construída pelo padrão Tom · Tom · Semitom · Tom · Tom · Tom · Semitom.",
    body: [
      "É a escala mais familiar da música ocidental — a do som *dó-ré-mi-fá-sol-lá-si-dó*. O que a define não são essas notas, e sim as **distâncias** entre elas. Aplicando o mesmo padrão a partir de qualquer nota, você obtém uma escala maior daquela tonalidade.",
      "A fórmula tem sete passos, do grau I até a oitava. Os dois semitons caem sempre nos mesmos pontos: entre o **3º e o 4º grau**, e entre o **7º e o 8º**. Decorando só a posição desses dois semitons, você reconstrói a fórmula inteira.",
      "Para construir na prática: escolha a tônica, escreva as sete letras em ordem a partir dela (sem repetir e sem pular), e depois confira cada distância contra a fórmula. Onde a distância não fechar, a nota recebe um sustenido ou um bemol. As alterações que sobram são a **armadura de clave** daquela tonalidade.",
      "Dó maior é a única escala maior sem nenhuma alteração, e isso não é coincidência: os dois semitons naturais do teclado (Mi–Fá e Si–Dó) caem justamente onde a fórmula pede semitom. Em qualquer outra tonalidade esse alinhamento se desfaz — e é aí que os sustenidos e bemóis entram.",
    ],
    visual: "scale-formula",
    related: ["escala", "tom-semitom", "ciclo-de-quintas"],
    practice: { href: "/escalas-maiores", label: "Praticar escalas maiores" },
  },
  {
    slug: "ciclo-de-quintas",
    title: "O que é o ciclo de quintas",
    subject: "Ciclo de quintas",
    summary: "O mapa que organiza as tonalidades por proximidade.",
    definition:
      "O ciclo de quintas é um arranjo circular das doze tonalidades, em que cada passo sobe uma quinta e acrescenta uma alteração à armadura.",
    body: [
      "Comece no Dó maior, que não tem alteração nenhuma. Suba uma **quinta** — cinco notas acima, ou seja, o Sol — e você chega numa escala com um sustenido. Suba outra quinta, no Ré, e são dois sustenidos. Cada passo no sentido horário acrescenta exatamente um sustenido.",
      "Andando no sentido contrário, cada passo desce uma quinta e acrescenta um **bemol**: de Dó para Fá (um bemol), de Fá para Si♭ (dois), e assim por diante. Depois de doze passos você volta ao ponto de partida — daí o nome ciclo.",
      "Para que serve, na prática: o ciclo mostra **quais tonalidades são vizinhas**. Tonalidades próximas no círculo compartilham quase todas as notas, e é por isso que a música transita entre elas com naturalidade. Tonalidades opostas soam distantes justamente porque têm poucas notas em comum.",
      "Ele também é a maneira mais rápida de lembrar armaduras. Os sustenidos sempre aparecem na ordem **Fá · Dó · Sol · Ré · Lá · Mi · Si** — que é o próprio ciclo — e os bemóis na ordem inversa.",
      "As quatro escalas desta V1 são vizinhas no ciclo: Dó no centro, Sol e Ré avançando pelos sustenidos, Fá pelo lado dos bemóis. Não é uma seleção aleatória — é o começo natural do mapa.",
    ],
    visual: "circle",
    related: ["escala-maior", "escala"],
    practice: { href: "/escalas-maiores", label: "Praticar escalas maiores" },
  },
  {
    slug: "leitura",
    title: "Como ler notas na clave de sol",
    subject: "Leitura de notas",
    summary: "As duas frases que resolvem a maior parte da leitura.",
    definition:
      "Na clave de sol, as cinco linhas são Mi · Sol · Si · Ré · Fá e os quatro espaços são Fá · Lá · Dó · Mi, sempre de baixo para cima.",
    body: [
      "Existem dois caminhos para identificar uma nota, e vale treinar os dois. O primeiro é **reconhecimento direto**: você olha a posição e já sabe o nome, sem contar. É o que torna a leitura fluente, e só vem com repetição.",
      "O segundo é **contar a partir de uma referência**. A melhor referência é o Sol, na 2ª linha, porque a própria clave aponta para ele. Da referência você sobe ou desce, uma posição por nota, até chegar onde está a cabeça de nota.",
      "Comece pelas linhas, que são cinco e formam a frase *Mi-Sol-Si-Ré-Fá*. Depois os espaços, *Fá-Lá-Dó-Mi*. Note que os espaços preenchem exatamente os vãos: entre Mi (1ª linha) e Sol (2ª linha) está o Fá.",
      "As notas fora da pauta pedem atenção extra. O **dó central** fica abaixo da 1ª linha, na sua própria linha suplementar — é a nota que faz a ponte entre a clave de sol e a clave de fá, e por isso vive na fronteira.",
    ],
    visual: "staff-anatomy",
    related: ["clave", "pentagrama"],
    practice: { href: "/leitura-de-notas", label: "Praticar leitura de notas" },
  },
];

export function findFundamental(slug: string): Fundamental | undefined {
  return FUNDAMENTALS.find((f) => f.slug === slug);
}
