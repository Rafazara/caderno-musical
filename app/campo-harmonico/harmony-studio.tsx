"use client";
import * as React from "react";
import { Play } from "lucide-react";
import { Keyboard } from "@/components/music/keyboard";
import { Staff } from "@/components/music/staff";
import {
  CommonMistake,
  Deeper,
  Memory,
  TeachingBlock,
} from "@/components/pedagogy/blocks";
import { ProfessorActions } from "@/components/pedagogy/professor-actions";
import { PracticeRunner } from "@/components/study/practice-runner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { SectionHeading } from "@/components/ui/prose";
import { playChord, playChordProgression } from "@/lib/music/audio";
import {
  buildMajorKeyHarmony,
  buildProgression,
  PROGRESSION_DEFINITIONS,
} from "@/lib/music/harmony";
import { note, noteName, type Note } from "@/lib/music/notes";
import { buildHarmonySession } from "@/lib/study/generators/harmony";
import { useStudy, useTrackTopic } from "@/lib/study/provider";
import { harmonyStudyTemplate } from "@/lib/atelier/templates";
import { EMPTY_BOARDS } from "@/lib/atelier/types";
import { KEYS as STORAGE_KEYS } from "@/lib/storage/local";
import { peek, write } from "@/lib/storage/store";
const KEYS = [
  { id: "C", label: "Dó maior", tonic: note("C") },
  { id: "G", label: "Sol maior", tonic: note("G") },
  { id: "D", label: "Ré maior", tonic: note("D") },
  { id: "F", label: "Fá maior", tonic: note("F") },
];
export function HarmonyStudio() {
  useTrackTopic("/campo-harmonico", "Campo Harmônico Maior");
  const [key, setKey] = React.useState("C"),
    [selected, setSelected] = React.useState(0);
  const tonic = KEYS.find((k) => k.id === key)?.tonic ?? note("C"),
    harmony = buildMajorKeyHarmony(tonic),
    degree = harmony.degrees[selected];
  return (
    <div className="flex flex-col gap-12">
      <SectionHeading
        eyebrow="Escala → relações"
        title="Campo Harmônico Maior"
        description="Sobre cada grau da escala, empilhamos terças usando somente suas notas. As sete tríades surgem como consequência — não como uma tabela para decorar."
      />
      <section>
        <TeachingBlock label="Conexão">
          Você já aprendeu escala, graus, intervalos e tríades. O campo
          harmônico junta essas quatro ideias.
        </TeachingBlock>
        <label className="mt-6 block max-w-xs text-sm">
          Explorar tonalidade
          <Select
            className="mt-2"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setSelected(0);
            }}
          >
            {KEYS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        </label>
        <p className="mt-6 type-label text-ink-faint">Escala</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {harmony.scale.map((n, i) => (
            <span
              key={i}
              className={`border px-3 py-2 text-sm ${degree.triad.pitches.some((p) => p.letter === n.letter && p.accidental === n.accidental) ? "border-brass bg-brass-wash font-semibold" : "border-rule"}`}
            >
              {noteName(n)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          No grau {degree.roman}, selecionamos {noteName(degree.triad.root)},
          pulamos uma nota, {noteName(degree.triad.third)}, pulamos outra,{" "}
          {noteName(degree.triad.fifth)}: terças diatônicas empilhadas.
        </p>
      </section>
      <DegreeExplorer
        harmony={harmony}
        selected={selected}
        onSelect={setSelected}
      />
      <Functions />
      <Progressions harmony={harmony} />
      <EarFunction harmony={harmony} />
      <Practice />
      <ProfessorActions
        title={`Campo harmônico de ${harmony.name}`}
        question="Por que V tende a resolver em I?"
        noteBody={`${harmony.degrees.map((d) => `${d.roman} — ${d.triad.symbol}`).join("\n")}\n\nMinha anotação:`}
      />
      <HarmonyAtelierAction tonic={tonic} />
    </div>
  );
}

function HarmonyAtelierAction({ tonic }: { tonic: Note }) {
  const [message, setMessage] = React.useState("");
  function create() {
    const boards = peek(STORAGE_KEYS.atelier, EMPTY_BOARDS);
    write(STORAGE_KEYS.atelier, [harmonyStudyTemplate(tonic), ...boards]);
    setMessage("Estudo criado no Ateliê.");
  }
  return <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={create}>Criar estudo no Ateliê</Button>{message ? <span role="status" className="text-xs text-sage">{message}</span> : null}</div>;
}
function DegreeExplorer({
  harmony,
  selected,
  onSelect,
}: {
  harmony: ReturnType<typeof buildMajorKeyHarmony>;
  selected: number;
  onSelect: (n: number) => void;
}) {
  const item = harmony.degrees[selected];
  return (
    <section className="border-y border-rule py-9">
      <p className="type-label text-brass">Empilhe terças</p>
      <h2 className="display mt-2 text-2xl font-semibold">Escala → acordes</h2>
      <div className="mt-5 grid grid-cols-7 gap-px bg-rule">
        {harmony.degrees.map((d, i) => (
          <button
            key={d.degree}
            onClick={() => onSelect(i)}
            className={`min-w-0 p-2 text-center sm:p-4 ${i === selected ? "bg-brass-wash" : "bg-paper-raised hover:bg-paper-sunken"}`}
          >
            <b className="display block text-lg">{d.roman}</b>
            <span className="mt-1 block truncate text-xs">
              {d.triad.symbol}
            </span>
          </button>
        ))}
      </div>
      <Card className="mt-5">
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="display text-3xl font-semibold">
                {item.roman} · {item.triad.name}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Grau da escala: {noteName(item.scaleNote)} · acorde:{" "}
                {item.triad.symbol} ·{" "}
                {item.triad.pitches.map(noteName).join(" – ")}
              </p>
            </div>
            <Button
              variant="brass"
              onClick={() => playChord(item.triad.pitches)}
            >
              <Play />
              Ouvir
            </Button>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Staff
              notes={item.triad.pitches.map((n) => ({
                note: n,
                label: noteName(n),
              }))}
              minNotes={3}
            />
            <Keyboard
              marks={item.triad.pitches.map((n, i) => ({
                note: n,
                badge: ["F", "3", "5"][i],
              }))}
            />
          </div>
        </CardContent>
      </Card>
      <TeachingBlock label="Cifra × numeral">
        {item.triad.symbol} diz qual acorde é. {item.roman} descreve sua posição
        dentro de {harmony.name}. Em outra tonalidade, o mesmo numeral
        representa outro acorde.
      </TeachingBlock>
      <Memory
        items={[
          "Maiúsculo = maior",
          "minúsculo = menor",
          "° = diminuto",
          "I · ii · iii · IV · V · vi · vii°",
        ]}
      />
      <CommonMistake
        claim="I significa sempre Dó e V significa sempre Sol."
        correction={`I é o primeiro grau da tonalidade atual. Em ${harmony.name}, I = ${harmony.degrees[0].triad.symbol} e V = ${harmony.degrees[4].triad.symbol}.`}
      />
    </section>
  );
}
function Functions() {
  return (
    <section>
      <p className="type-label text-brass">Funções tonais</p>
      <h2 className="display mt-2 text-2xl font-semibold">
        Um modelo inicial de movimento
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Função descreve comportamento contextual na tonalidade, não uma emoção
        ou propriedade absoluta do acorde isolado.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <b>Tônica</b>
            <p className="mt-2 text-sm">
              I, e muitas vezes vi: centro e área de estabilidade.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <b>Predominante</b>
            <p className="mt-2 text-sm">
              ii e IV: preparação ou afastamento. “Subdominante” e
              “predominante” não são idênticos em toda teoria.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <b>Dominante</b>
            <p className="mt-2 text-sm">
              V e, no modelo inicial, vii°: direção forte para I.
            </p>
          </CardContent>
        </Card>
      </div>
      <Deeper>
        O iii é funcionalmente mais ambíguo e não recebe aqui uma categoria
        rígida. O mesmo acorde pode cumprir funções diferentes conforme a
        tonalidade e o contexto.
      </Deeper>
    </section>
  );
}
function Progressions({
  harmony,
}: {
  harmony: ReturnType<typeof buildMajorKeyHarmony>;
}) {
  const [id, setId] = React.useState("I-IV-V-I");
  const progression = buildProgression(harmony, id, 0.9);
  return (
    <section className="border-y border-rule py-9">
      <p className="type-label text-brass">Ao longo do tempo</p>
      <h2 className="display mt-2 text-2xl font-semibold">
        Explorar progressão
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Uma progressão é uma sequência de acordes. Os numerais preservam as
        relações quando mudamos de tonalidade.
      </p>
      <Select
        className="mt-5 max-w-sm"
        value={id}
        onChange={(e) => setId(e.target.value)}
      >
        {PROGRESSION_DEFINITIONS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id} · {p.label}
          </option>
        ))}
      </Select>
      <div className="mt-5 flex flex-wrap gap-2">
        {progression.events.map((e, i) => (
          <div
            key={i}
            className="min-w-24 border border-rule bg-paper-raised p-4 text-center"
          >
            <b className="display text-xl">{progression.romanNumerals[i]}</b>
            <span className="mt-1 block text-sm">{e.chord.symbol}</span>
            <span className="mt-1 block text-[.65rem] text-ink-faint">
              {e.chord.pitches.map(noteName).join(" · ")}
            </span>
          </div>
        ))}
      </div>
      <Button
        variant="brass"
        className="mt-4"
        onClick={() =>
          playChordProgression(
            progression.events.map((e) => ({
              notes: e.chord.pitches,
              start: e.start,
              duration: e.duration,
            })),
          )
        }
      >
        <Play />
        Ouvir progressão
      </Button>
      <TeachingBlock label="Ouça o caminho">
        I estabelece o centro; IV prepara; V direciona; I retorna. A relação V →
        I é central na harmonia tonal, embora não seja a única possibilidade.
      </TeachingBlock>
    </section>
  );
}
function EarFunction({
  harmony,
}: {
  harmony: ReturnType<typeof buildMajorKeyHarmony>;
}) {
  const { record } = useStudy();
  const [answer, setAnswer] = React.useState<string | null>(null);
  const tonic = harmony.degrees[0].triad,
    dominant = harmony.degrees[4].triad,
    predominant = harmony.degrees[3].triad;
  function playPair(first: typeof tonic) {
    playChordProgression([
      { notes: first.pitches, start: 0, duration: 0.8 },
      { notes: tonic.pitches, start: 0.9, duration: 0.8 },
    ]);
  }
  function choose(given: string) {
    if (answer) return;
    setAnswer(given);
    record({
      module: "harmonia",
      itemKey: `harmony:ear-function:${harmony.tonic.letter}4:5`,
      prompt: "Qual exemplo apresenta dominante → tônica?",
      correct: given === "B",
      given,
      expected: "B",
    });
  }
  return (
    <section>
      <p className="type-label text-brass">Percepção funcional</p>
      <h2 className="display mt-2 text-2xl font-semibold">IV → I ou V → I?</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Primeiro ouça o centro tonal. Depois compare as relações no mesmo
        contexto.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => playChord(tonic.pitches)}>Referência I</Button>
        <Button onClick={() => playPair(predominant)}>Ouvir A</Button>
        <Button onClick={() => playPair(dominant)}>Ouvir B</Button>
      </div>
      <p className="mt-4 text-sm font-medium">
        Qual exemplo apresenta dominante → tônica?
      </p>
      <div className="mt-2 flex gap-2">
        <Button disabled={Boolean(answer)} onClick={() => choose("A")}>
          A
        </Button>
        <Button disabled={Boolean(answer)} onClick={() => choose("B")}>
          B
        </Button>
      </div>
      {answer ? (
        <p className="mt-3 text-sm">
          B: {dominant.symbol} → {tonic.symbol}, ou V → I. A era IV → I.
        </p>
      ) : null}
    </section>
  );
}
function Practice() {
  const [size, setSize] = React.useState(5);
  return (
    <section>
      <div className="flex justify-between">
        <h2 className="display text-2xl font-semibold">Praticar relações</h2>
        <div className="flex gap-2">
          <Button
            variant={size === 5 ? "brass" : "outline"}
            onClick={() => setSize(5)}
          >
            Rápida
          </Button>
          <Button
            variant={size === 10 ? "brass" : "outline"}
            onClick={() => setSize(10)}
          >
            Normal
          </Button>
        </div>
      </div>
      <div className="mt-5">
        <PracticeRunner
          key={size}
          contextLabel="Campo Harmônico"
          build={() => buildHarmonySession(size)}
        />
      </div>
    </section>
  );
}
