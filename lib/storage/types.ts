/** Formas persistidas em localStorage. Mudanças aqui exigem bump de STORE_VERSION. */

export type ModuleId = "leitura" | "escalas" | "intervalos";

export const MODULE_LABEL: Record<ModuleId, string> = {
  leitura: "Leitura de notas",
  escalas: "Escalas maiores",
  intervalos: "Tom e semitom",
};

export const MODULE_HREF: Record<ModuleId, string> = {
  leitura: "/leitura-de-notas",
  escalas: "/escalas-maiores",
  intervalos: "/tom-e-semitom",
};

/** Uma resposta dada. É o registro bruto de onde todo o progresso é derivado. */
export type Attempt = {
  id: string;
  ts: number;
  module: ModuleId;
  /** Chave do item praticado — permite reconstruir a questão depois. */
  itemKey: string;
  correct: boolean;
  given: string;
  expected: string;
};

/**
 * Índice de erros. Um item sai da revisão depois de `MASTERY_STREAK` acertos
 * seguidos — repetição espaçada simples, sem precisar de algoritmo pesado.
 */
export type ErrorItem = {
  itemKey: string;
  module: ModuleId;
  /** Texto legível para listar na revisão. */
  prompt: string;
  expected: string;
  misses: number;
  /** Acertos consecutivos desde o último erro. */
  streak: number;
  lastMissTs: number;
  lastSeenTs: number;
};

export const MASTERY_STREAK = 2;

export type StudyState = {
  attempts: Attempt[];
  errors: Record<string, ErrorItem>;
  /** Dias (AAAA-MM-DD) em que houve pelo menos uma resposta. */
  studyDays: string[];
  longestStreak: number;
  lastTopic: { href: string; label: string; ts: number } | null;
  /** Ids de escalas já praticadas. */
  scalesPracticed: string[];
};

export const emptyStudyState = (): StudyState => ({
  attempts: [],
  errors: {},
  studyDays: [],
  longestStreak: 0,
  lastTopic: null,
  scalesPracticed: [],
});

/**
 * Instância única do estado vazio, para servir de `initial` estável ao
 * `usePersistentState` — recriar o objeto a cada renderização faria o snapshot
 * mudar de identidade sem motivo.
 */
export const EMPTY_STUDY_STATE: StudyState = emptyStudyState();

/** Listas vazias compartilhadas, pelo mesmo motivo. */
export const NO_NOTES: NotebookNote[] = [];
export const NO_MATERIAL: MaterialItem[] = [];

/** Teto do histórico — mantém o localStorage enxuto sem perder as estatísticas úteis. */
export const MAX_ATTEMPTS = 1500;

/* -------------------------------------------------------------------------- */

export type NotebookNote = {
  id: string;
  title: string;
  subject: string;
  body: string;
  /** Etiquetas livres. */
  tags: string[];
  /** Slugs de fundamentos ou ids de módulo relacionados. */
  links: string[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
};

export type MaterialItem = {
  id: string;
  title: string;
  subject: string;
  /** Data da aula, AAAA-MM-DD. */
  date: string;
  notes: string;
  fileName: string;
  fileType: string;
  /** Tamanho do data URL em bytes, para mostrar o consumo. */
  fileSize: number;
  /** Conteúdo em data URL (base64). */
  dataUrl: string;
  createdAt: number;
  /** Ausente em registros antigos; nesse caso `createdAt` é o fallback. */
  updatedAt?: number;
};
