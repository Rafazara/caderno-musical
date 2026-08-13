import {
  BookMarked,
  BookOpen,
  CircleDot,
  Home,
  Library,
  FlaskConical,
  Palette,
  LineChart,
  Music4,
  Layers3,
  Ear,
  NotebookPen,
  RotateCcw,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Frase curta usada nos cartões da home. */
  blurb: string;
  icon: LucideIcon;
};

export type NavGroup = { title: string | null; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    title: null,
    items: [
      {
        href: "/",
        label: "Início",
        blurb: "Onde você parou e o que praticar hoje.",
        icon: Home,
      },
    ],
  },
  {
    title: "Aprender & praticar",
    items: [
      {
        href: "/leitura-de-notas",
        label: "Leitura de notas",
        blurb: "Reconhecer notas no pentagrama, em clave de sol.",
        icon: Music4,
      },
      {
        href: "/escalas-maiores",
        label: "Escalas maiores",
        blurb: "Construir a escala a partir da fórmula, sem decorar.",
        icon: CircleDot,
      },
      {
        href: "/tom-e-semitom",
        label: "Tom e semitom",
        blurb: "Medir distâncias entre notas com apoio do teclado.",
        icon: BookMarked,
      },
      {
        href: "/ritmo", label: "Ritmo", blurb: "Sentir pulsação, entender durações e organizar compassos.", icon: CircleDot,
      },
      {
        href: "/intervalos",
        label: "Intervalos",
        blurb: "Compreender, construir, visualizar e ouvir relações entre notas.",
        icon: Music4,
      },
      { href: "/acordes", label: "Acordes", blurb: "Construir, visualizar e ouvir tríades maiores e menores.", icon: Layers3 },
      { href: "/campo-harmonico", label: "Campo Harmônico", blurb: "Derivar acordes da escala e compreender funções tonais.", icon: Layers3 },
      {
        href: "/ouvido-musical",
        label: "Ouvido Musical",
        blurb: "Relacionar sons, notas, movimentos e distâncias.",
        icon: Ear,
      },
      {
        href: "/revisar",
        label: "Revisar erros",
        blurb: "Praticar somente o que você errou.",
        icon: RotateCcw,
      },
    ],
  },
  {
    title: "Explorar & registrar",
    items: [
      {
        href: "/agenda",
        label: "Agenda",
        blurb: "Aulas, preparação e sua jornada de aprendizado.",
        icon: CalendarDays,
      },
      {
        href: "/laboratorio-da-nota",
        label: "Laboratório da nota",
        blurb: "Conectar pentagrama, teclado, nome e som.",
        icon: FlaskConical,
      },
      {
        href: "/atelie-de-partitura",
        label: "Ateliê de Partitura",
        blurb: "Criar quadros visuais com pautas, notas e explicações.",
        icon: Palette,
      },
      {
        href: "/fundamentos",
        label: "Fundamentos",
        blurb: "Partitura, clave, escala, tom, ciclo de quintas.",
        icon: BookOpen,
      },
      {
        href: "/material",
        label: "Material da professora",
        blurb: "Suas imagens e PDFs de aula, com anotações.",
        icon: Library,
      },
      {
        href: "/caderno",
        label: "Meu caderno",
        blurb: "Anotações pessoais ligadas aos tópicos.",
        icon: NotebookPen,
      },
      {
        href: "/progresso",
        label: "Progresso",
        blurb: "Acertos, erros por categoria e frequência.",
        icon: LineChart,
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);

export function findNavItem(href: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.href === href);
}
