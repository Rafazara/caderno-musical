"use client";
import * as React from "react";
import {
  Ear,
  Eye,
  EyeOff,
  RotateCcw,
  Speaker,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Keyboard } from "@/components/music/keyboard";
import { Staff } from "@/components/music/staff";
import { ProfessorActions } from "@/components/pedagogy/professor-actions";
import { TeachingBlock, Memory, Deeper } from "@/components/pedagogy/blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/prose";
import {
  DEFAULT_AUDIO_PROFILE,
  audioEngine,
  frequencyOf,
  playNote,
  playNoteLine,
} from "@/lib/music/audio";
import {
  randomExercise,
  recentSkillAccuracy,
  type EarExercise,
  type EarSkill,
} from "@/lib/ear/training";
import {
  note,
  noteName,
  noteId,
  parseNoteId,
  semitonesBetween,
  type Note,
} from "@/lib/music/notes";
import { buildMajorScale, SCALES } from "@/lib/music/scales";
import { useStudy, useTrackTopic } from "@/lib/study/provider";
import { usePersistentState } from "@/lib/storage/use-persistent-state";
import {
  auditoryDifficulties,
  buildFocusedReview,
} from "@/lib/ear/review";
import { cn } from "@/lib/utils";

type Mode = "map" | EarSkill | "scales";
const EAR_PREFS = { introduced: false, volume: 0.62, muted: false };
const NATURALS = [
  note("C"),
  note("D"),
  note("E"),
  note("F"),
  note("G"),
  note("A"),
  note("B"),
  note("C", 0, 5),
];
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "map", label: "Conhecer o som", hint: "Nota, pauta, teclado e som." },
  {
    id: "pitch-direction",
    label: "Grave ou agudo",
    hint: "Compare duas alturas.",
  },
  {
    id: "melody",
    label: "Movimento melódico",
    hint: "Perceba o caminho da melodia.",
  },
  {
    id: "relative-note",
    label: "Nota com referência",
    hint: "Reconheça em relação ao Dó.",
  },
  { id: "step", label: "Tom ou semitom", hint: "Ouça a distância." },
  {
    id: "scales",
    label: "Escutas de escalas",
    hint: "Acompanhe escalas maiores.",
  },
];
const SKILL_LABEL: Record<EarSkill, string> = {
  "pitch-direction": "Grave ou agudo",
  melody: "Movimento melódico",
  "relative-note": "Nota com referência",
  step: "Tom ou semitom",
};

export function EarStudio() {
  useTrackTopic("/ouvido-musical", "Ouvido Musical");
  const { state } = useStudy();
  const { value: preferences, set: setPreferences } = usePersistentState(
    "caderno-musical:ear-preferences",
    EAR_PREFS,
  );
  const [mode, setMode] = React.useState<Mode>("map");
  const { volume, muted } = preferences;
  const playerState = React.useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.snapshot,
    () => "idle" as const,
  );
  React.useEffect(() => {
    audioEngine.configure(volume, muted);
  }, [volume, muted]);
  React.useEffect(() => {
    const visibility = () => void audioEngine.handleVisibility(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      audioEngine.stop();
    };
  }, []);
  if (!preferences.introduced)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 py-10">
        <Ear className="size-8 text-brass" />
        <SectionHeading
          eyebrow="Antes de começar"
          title="Você não precisa adivinhar notas no ar."
          description="Vamos criar referências e treinar comparações. O objetivo é perceber relações entre sons — não simular ouvido absoluto."
        />
        <TeachingBlock label="Como vamos aprender">
          <p>
            Ouça, compare, veja a representação e então tente reconhecer. A
            referência continua disponível sempre que você precisar.
          </p>
        </TeachingBlock>
        <Memory items={["Ouvido relativo nasce da relação entre dois sons."]} />
        <Button
          variant="brass"
          size="lg"
          onClick={() => {
            setPreferences((current) => ({ ...current, introduced: true }));
          }}
        >
          Começar a ouvir
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Aprender & praticar"
        title="Ouvido Musical"
        description="Treine a relação entre o que você vê, entende e escuta."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setPreferences((current) => ({
                ...current,
                muted: !current.muted,
              }))
            }
            aria-label={muted ? "Ativar som" : "Silenciar"}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={volume}
            onChange={(e) =>
              setPreferences((current) => ({
                ...current,
                volume: Number(e.target.value),
              }))
            }
            className="w-24 accent-[var(--brass)]"
          />
        </div>
      </SectionHeading>
      <section>
        <p className="type-label text-brass">Trilha de escuta</p>
        <div className="mt-3 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((item, index) => {
            const practiced =
              item.id !== "map" && item.id !== "scales"
                ? recentSkillAccuracy(state.attempts, item.id).total
                : 0;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={cn(
                  "bg-paper p-4 text-left hover:bg-paper-raised",
                  mode === item.id && "shadow-[inset_3px_0_var(--brass)]",
                )}
              >
                <span className="type-technical text-[.625rem] text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                  {practiced ? ` · ${practiced} escutas` : ""}
                </span>
                <strong className="display mt-1 block">{item.label}</strong>
                <small className="mt-1 block text-ink-muted">{item.hint}</small>
              </button>
            );
          })}
        </div>
      </section>
      {playerState === "unavailable" ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 border-y border-rule py-3 text-sm"
        >
          <span>Toque para ativar o áudio.</span>
          <Button onClick={() => void audioEngine.unlock()}>
            Ativar áudio
          </Button>
        </div>
      ) : null}
      {mode === "map" ? (
        <SoundMap />
      ) : mode === "scales" ? (
        <ScaleListening />
      ) : (
        <EarSession key={mode} skill={mode} />
      )}
      <FocusedReview />
    </div>
  );
}

function SoundMap() {
  const [index, setIndex] = React.useState(0);
  const current = NATURALS[index];
  return (
    <Card>
      <CardContent className="grid gap-7 pt-6 lg:grid-cols-2">
        <div>
          <p className="type-label text-brass">Mapa sonoro</p>
          <h2 className="display mt-2 text-3xl font-semibold">
            {noteName(current)}
            {current.octave}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {noteId(current)} · associe o nome, a posição e a tecla ao som.
          </p>
          <Staff
            notes={[
              {
                note: current,
                state: "query",
                label: `${noteName(current)}${current.octave}`,
              },
            ]}
          />
          <Keyboard marks={[{ note: current, badge: noteName(current) }]} />
          <div className="mt-4 flex justify-between">
            <Button
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              ← {index ? noteName(NATURALS[index - 1]) : "Anterior"}
            </Button>
            <Button variant="brass" onClick={() => playNote(current)}>
              <Speaker /> Ouvir
            </Button>
            <Button
              disabled={index === NATURALS.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              {index < NATURALS.length - 1
                ? noteName(NATURALS[index + 1])
                : "Próxima"}{" "}
              →
            </Button>
          </div>
        </div>
        <div>
          <p className="type-label text-ink-faint">Teclado auditivo</p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4">
            {NATURALS.map((item, i) => (
              <button
                key={noteId(item)}
                onClick={() => {
                  setIndex(i);
                  playNote(item);
                }}
                className={cn(
                  "min-h-14 border border-rule bg-paper-raised text-sm hover:border-brass",
                  i === index && "border-brass bg-brass-wash font-semibold",
                )}
              >
                {noteName(item)}
                <small className="block text-ink-faint">{item.octave}</small>
              </button>
            ))}
          </div>
          <Deeper>
            <p>
              {noteName(current)}
              {current.octave}: {frequencyOf(current).toFixed(2)} Hz. Todas as
              frequências derivam de Lá4 = 440 Hz em temperamento igual.
            </p>
          </Deeper>
        </div>
      </CardContent>
    </Card>
  );
}

function EarSession({
  skill,
  plan,
  focusedLabel,
  allowEnd = false,
}: {
  skill: EarSkill;
  plan?: EarExercise[];
  focusedLabel?: string;
  allowEnd?: boolean;
}) {
  const { state, record } = useStudy();
  const [size, setSize] = React.useState<5 | 10 | 0>(5);
  const [count, setCount] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [exercise, setExercise] = React.useState(
    () => plan?.[0] ?? randomExercise(skill, state.attempts),
  );
  const [given, setGiven] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [replays, setReplays] = React.useState(0);
  const [ended, setEnded] = React.useState(false);
  const [results, setResults] = React.useState<
    Array<{
      skill: EarSkill;
      correct: boolean;
      given: string;
      expected: string;
    }>
  >([]);
  const done =
    ended || (plan ? count >= plan.length : size !== 0 && count >= size);
  function hear() {
    playNoteLine(exercise.notes);
    setReplays((r) => r + 1);
  }
  function answer(value: string) {
    if (given) return;
    const ok = value === exercise.answer;
    setGiven(value);
    setCorrect((c) => c + (ok ? 1 : 0));
    setCount((c) => c + 1);
    record({
      module: "ouvido",
      itemKey: exercise.key,
      prompt: `${SKILL_LABEL[skill]} · ${exercise.notes.map((n) => noteName(n)).join(" → ")}`,
      correct: ok,
      given: displayAnswer(value),
      expected: displayAnswer(exercise.answer),
    });
    setResults((items) => [
      ...items,
      {
        skill: exercise.skill,
        correct: ok,
        given: displayAnswer(value),
        expected: displayAnswer(exercise.answer),
      },
    ]);
  }
  function next() {
    setExercise(plan?.[count] ?? randomExercise(skill, state.attempts));
    setGiven(null);
    setRevealed(false);
    setReplays(0);
  }
  function changeSize(value: 5 | 10 | 0) {
    setSize(value);
    setCount(0);
    setCorrect(0);
    setGiven(null);
    setRevealed(false);
    setReplays(0);
    setExercise(randomExercise(skill, state.attempts));
  }
  function keyAnswer(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      event.code === "Space" &&
      !["INPUT", "BUTTON", "TEXTAREA"].includes(target.tagName)
    ) {
      event.preventDefault();
      hear();
      return;
    }
    const index = Number(event.key) - 1;
    if (!given && index >= 0 && index < exercise.options.length) {
      event.preventDefault();
      answer(exercise.options[index]);
    }
  }
  if (done)
    return (
      <SessionSummary
        results={results}
        correct={correct}
        count={count}
        label={focusedLabel ?? SKILL_LABEL[skill]}
        onRestart={() => {
          setCount(0);
          setCorrect(0);
          setResults([]);
          setEnded(false);
          setExercise(plan?.[0] ?? randomExercise(skill, state.attempts));
          setGiven(null);
        }}
      />
    );
  return (
    <Card tabIndex={0} onKeyDown={keyAnswer}>
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="type-label text-brass">
              {focusedLabel ?? SKILL_LABEL[exercise.skill]}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {promptFor(exercise.skill)}
            </p>
          </div>
          {!plan ? (
            <div className="flex gap-1">
              {([5, 10, 0] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => changeSize(value)}
                  className={cn(
                    "min-h-9 px-3 text-xs",
                    size === value ? "bg-ink text-paper" : "text-ink-muted",
                  )}
                >
                  {value === 5 ? "Rápida" : value === 10 ? "Normal" : "Livre"}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {exercise.skill === "relative-note" ? (
          <div className="rounded-lg bg-brass-wash p-3">
            <p className="text-xs text-ink-muted">Referência permanente</p>
            <Button variant="ghost" onClick={() => playNote(exercise.notes[0])}>
              <Speaker /> Ouvir Dó4
            </Button>
          </div>
        ) : null}
        <div className="flex justify-center">
          <Button variant="brass" size="lg" onClick={hear}>
            <Speaker /> {replays ? "Ouvir novamente" : "Ouvir exercício"}
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {exercise.options.map((option) => (
            <button
              key={option}
              disabled={Boolean(given)}
              onClick={() => answer(option)}
              className={cn(
                "min-h-14 border border-rule px-4 text-sm hover:border-brass",
                given && option === exercise.answer
                  ? "border-sage bg-sage-wash"
                  : given === option
                    ? "border-clay bg-clay-wash"
                    : "bg-paper-raised",
              )}
            >
              {displayAnswer(option)}{" "}
              <span className="ml-1 text-[.625rem] text-ink-faint">
                {exercise.options.indexOf(option) + 1}
              </span>
            </button>
          ))}
        </div>
        {given ? (
          <Feedback
            exercise={exercise}
            given={given}
            revealed={revealed}
            onReveal={() => setRevealed((v) => !v)}
            onReplay={hear}
          />
        ) : null}
        {given ? (
          <div className="flex justify-end">
            <Button variant="brass" onClick={next}>
              Próxima escuta
            </Button>
          </div>
        ) : null}
        <p className="text-center text-xs text-ink-faint">
          {count} escutas · {correct} corretas · repetição livre ({replays}) ·
          Espaço para ouvir novamente
        </p>
        {((!plan && size === 0) || allowEnd) && count > 0 ? (
          <Button variant="outline" onClick={() => setEnded(true)}>
            Encerrar sessão livre
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FocusedReview() {
  const { state } = useStudy();
  const [size, setSize] = React.useState<5 | 10 | 0>(5);
  const [round, setRound] = React.useState(0);
  const [plan,setPlan]=React.useState<EarExercise[]|null>(null);
  const difficulties = auditoryDifficulties(state.errors);
  return (
    <section
      id="minhas-dificuldades"
      className="scroll-mt-8 border-t border-rule pt-8"
    >
      <p className="type-label text-brass">Revisão focada</p>
      <h2 className="display mt-2 text-2xl font-semibold">
        Minhas dificuldades auditivas
      </h2>
      {!difficulties.length && !plan ? (
        <p className="mt-3 text-sm text-ink-muted">
          Nenhuma dificuldade auditiva possui evidência ativa na fila. Novos
          erros podem trazê-la de volta.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-lg bg-brass-wash p-4">
            <p className="text-sm font-semibold">Hoje vamos revisar</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {difficulties.map((item) => (
                <li
                  key={item.skill}
                  className="border border-brass/25 bg-paper px-3 py-1 text-xs"
                >
                  {item.label} · {item.misses}{" "}
                  {item.misses === 1 ? "erro" : "erros"}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">
              Cada erro origina exemplos da mesma família; o par exato não é
              repetido continuamente.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {([5, 10, 0] as const).map((value) => (
              <Button
                key={value}
                variant={size === value ? "brass" : "outline"}
                onClick={() => {
                  setSize(value);
                  setRound((value) => value + 1);
                  setPlan(buildFocusedReview(state.errors,value||50));
                }}
              >
                {value === 5
                  ? "Revisão rápida"
                  : value === 10
                    ? "Revisão normal"
                    : "Revisão livre"}
              </Button>
            ))}
          </div>
          {plan?.length ? (
            <div className="mt-5">
              <EarSession
                key={`${size}-${round}`}
                skill={plan[0].skill}
                plan={plan}
                focusedLabel="Minhas dificuldades"
                allowEnd={size === 0}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function SessionSummary({
  results,
  correct,
  count,
  label,
  onRestart,
}: {
  results: Array<{
    skill: EarSkill;
    correct: boolean;
    given: string;
    expected: string;
  }>;
  correct: number;
  count: number;
  label: string;
  onRestart: () => void;
}) {
  const grouped = new Map<EarSkill, typeof results>();
  for (const result of results) grouped.set(result.skill, [...(grouped.get(result.skill) ?? []), result]);
  const groups = [...grouped.entries()];
  const strongest = groups
    .map(([skill, items]) => ({
      skill,
      items,
      accuracy: Math.round(
        (items.filter((item) => item.correct).length / items.length) * 100,
      ),
    }))
    .filter((item) => item.items.length >= 3 && item.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy)[0];
  const review = groups
    .map(([skill, items]) => ({
      skill,
      items,
      misses: items.filter((item) => !item.correct).length,
    }))
    .filter((item) => item.misses >= 2)
    .sort((a, b) => b.misses - a.misses)[0];
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-8">
        <div>
          <p className="type-label text-brass">Sessão concluída</p>
          <h2 className="display mt-2 text-3xl font-semibold">
            {correct} de {count} corretas
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {label} · somente dados desta sessão.
          </p>
        </div>
        {strongest ? (
          <div>
            <p className="type-label text-sage">Ficou mais consistente</p>
            <p className="mt-1 text-sm">
              {SKILL_LABEL[strongest.skill]} · {strongest.accuracy}% nesta
              sessão.
            </p>
          </div>
        ) : null}
        {review ? (
          <div>
            <p className="type-label text-clay">Merece outra escuta</p>
            <p className="mt-1 text-sm">
              {SKILL_LABEL[review.skill]} · {review.misses} erros em{" "}
              {review.items.length} comparações.
            </p>
          </div>
        ) : null}
        {review ? (
          <ProfessorActions
            title={`${SKILL_LABEL[review.skill]} pelo ouvido`}
            question={`Tenho dificuldade em perceber ${SKILL_LABEL[review.skill]} pelo ouvido.`}
            noteBody={`O que observei sobre ${SKILL_LABEL[review.skill]}:\n\nUma referência musical:\n`}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="brass" onClick={onRestart}>
            Nova sessão
          </Button>
          {review ? (
            <a
              href="#minhas-dificuldades"
              className="inline-flex min-h-10 items-center border border-rule px-4 text-sm"
            >
              Fazer revisão curta
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Feedback({
  exercise,
  given,
  revealed,
  onReveal,
  onReplay,
}: {
  exercise: EarExercise;
  given: string;
  revealed: boolean;
  onReveal: () => void;
  onReplay: () => void;
}) {
  const ok = given === exercise.answer;
  const distance =
    exercise.notes.length === 2
      ? semitonesBetween(exercise.notes[0], exercise.notes[1])
      : null;
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        ok ? "border-sage/40 bg-sage-wash" : "border-clay/40 bg-clay-wash",
      )}
    >
      <p className="font-semibold">
        {ok
          ? "Correto."
          : `Você respondeu ${displayAnswer(given)}. A resposta é ${displayAnswer(exercise.answer)}.`}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {distance !== null
          ? `${exercise.notes.map((n) => `${noteName(n)}${n.octave}`).join(" → ")} · ${distance} ${distance === 1 ? "semitom" : "semitons"}.`
          : exercise.notes.map((n) => noteName(n)).join(" → ")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onReplay}>
          <RotateCcw /> Ouvir novamente
        </Button>
        <Button variant="ghost" size="sm" onClick={onReveal}>
          {revealed ? <EyeOff /> : <Eye />}
          {revealed ? "Ocultar" : "Ver pauta e teclado"}
        </Button>
      </div>
      {revealed ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Staff
            notes={exercise.notes.map((n) => ({ note: n, label: noteName(n) }))}
          />
          <Keyboard
            marks={exercise.notes.map((n, i) => ({
              note: n,
              badge: String(i + 1),
              tone: i ? "b" : "a",
            }))}
            markSemitoneGaps={exercise.skill === "step"}
          />
        </div>
      ) : null}
      {!ok && exercise.skill === "step" ? (
        <>
          {exercise.answer === "Semitom" ? (
            <AudioCompare base={note("E")} first={note("F")} second={note("F", 1)} />
          ) : (
            <AudioCompare base={note("C")} first={note("C", 1)} second={note("D")} />
          )}
          <ProfessorActions
            title="Percebendo tom e semitom"
            question="Como perceber melhor a diferença entre tom e semitom pelo ouvido?"
            noteBody="Mi–Fá e Si–Dó são semitons naturais. Minha percepção:"
          />
        </>
      ) : null}
    </div>
  );
}

function AudioCompare({
  base,
  first,
  second,
}: {
  base: Note;
  first: Note;
  second: Note;
}) {
  return (
    <details className="mt-4 border-t border-rule pt-3" onKeyDown={(event)=>{if(event.key.toLowerCase()==='a')playNoteLine([base,first]);if(event.key.toLowerCase()==='b')playNoteLine([base,second]);}}>
      <summary className="cursor-pointer text-sm font-medium">
        Comparar duas distâncias
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => playNoteLine([base, first])}>
          Ouvir A · {noteName(base)}–{noteName(first)}
        </Button>
        <Button onClick={() => playNoteLine([base, second])}>
          Ouvir B · {noteName(base)}–{noteName(second)}
        </Button>
        <Button
          variant="outline"
          onClick={() => playNoteLine([base, first, base, second], 0.55)}
        >
          Alternar A/B
        </Button>
      </div>
      <p className="mt-2 text-[.625rem] text-ink-faint">Atalhos A e B · uma reprodução substitui a anterior.</p>
    </details>
  );
}

function ScaleListening() {
  const [scaleId, setScaleId] = React.useState("C");
  const [hidden, setHidden] = React.useState(false);
  const [active, setActive] = React.useState<number | null>(null);
  const visualTimers = React.useRef<number[]>([]);
  React.useEffect(() => () => visualTimers.current.forEach(clearTimeout), []);
  const entry = SCALES.find((s) => s.id === scaleId)!;
  const ascending = buildMajorScale(entry.tonic, true);
  const descending = [...ascending].reverse();
  function play(kind: "up" | "down" | "both") {
    const sequence =
      kind === "up"
        ? ascending
        : kind === "down"
          ? descending
          : [...ascending, ...descending.slice(1)];
    const gap = DEFAULT_AUDIO_PROFILE.gaps.scale;
    playNoteLine(sequence, gap);
    visualTimers.current.forEach(clearTimeout);
    visualTimers.current = [];
    sequence.forEach((current, index) =>
      visualTimers.current.push(
        window.setTimeout(
          () =>
            setActive(
              ascending.findIndex((item) => noteId(item) === noteId(current)),
            ),
          index * gap * 1000,
        ),
      ),
    );
    visualTimers.current.push(
      window.setTimeout(() => setActive(null), sequence.length * gap * 1000 + 300),
    );
    return;
  }
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-label text-brass">Escuta guiada de escala</p>
            <h2 className="display mt-2 text-2xl font-semibold">
              {entry.label}
            </h2>
          </div>
          <div className="flex gap-2">
            {SCALES.map((scale) => (
              <button
                key={scale.id}
                onClick={() => setScaleId(scale.id)}
                className={cn(
                  "min-h-9 border px-3 text-sm",
                  scale.id === scaleId
                    ? "border-ink bg-ink text-paper"
                    : "border-rule",
                )}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
        {!hidden ? (
          <>
            <Staff
              notes={ascending.map((n, index) => ({
                note: n,
                label: noteName(n),
                state:
                  active === null
                    ? "default"
                    : active === index
                      ? "query"
                      : "muted",
              }))}
              minNotes={8}
            />
            <Keyboard
              marks={
                active === null
                  ? ascending.map((n, i) => ({ note: n, badge: String(i + 1) }))
                  : [
                      {
                        note: ascending[active],
                        badge: noteName(ascending[active]),
                      },
                    ]
              }
            />
            <p className="text-center text-sm text-ink-muted">
              {ascending.map(noteName).join(" → ")}
            </p>
          </>
        ) : (
          <div className="flex min-h-52 items-center justify-center border-y border-rule text-center">
            <p className="display text-xl">
              Só ouvir
              <br />
              <span className="text-sm font-normal text-ink-muted">
                A representação fica disponível depois.
              </span>
            </p>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => play("up")}>
            <Speaker /> Ascendente
          </Button>
          <Button onClick={() => play("down")}>
            <Speaker /> Descendente
          </Button>
          <Button variant="brass" onClick={() => play("both")}>
            <Speaker /> Subir e descer
          </Button>
          <Button variant="ghost" onClick={() => setHidden((v) => !v)}>
            {hidden ? <Eye /> : <EyeOff />}
            {hidden ? "Revelar" : "Só ouvir"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function displayAnswer(value: string) {
  const parsed = parseNoteId(value);
  return parsed ? noteName(parsed) : value;
}
function promptFor(skill: EarSkill) {
  return skill === "pitch-direction"
    ? "A segunda nota ficou mais grave, igual ou mais aguda?"
    : skill === "melody"
      ? "A melodia subiu, desceu, permaneceu ou mudou de direção?"
      : skill === "relative-note"
        ? "Qual nota você ouviu em relação ao Dó?"
        : "Essa distância é tom ou semitom?";
}
