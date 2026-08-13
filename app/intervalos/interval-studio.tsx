"use client";
import * as React from "react";
import { Speaker } from "lucide-react";
import { Staff } from "@/components/music/staff";
import { Keyboard } from "@/components/music/keyboard";
import {
  TeachingBlock,
  CommonMistake,
  Connection,
  Deeper,
  Memory,
} from "@/components/pedagogy/blocks";
import { ProfessorActions } from "@/components/pedagogy/professor-actions";
import { PracticeRunner } from "@/components/study/practice-runner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { SectionHeading } from "@/components/ui/prose";
import {
  analyzeInterval,
  constructInterval,
  countIntervalLetters,
  MUSICAL_INTERVALS,
  type IntervalDirection,
  type MusicalIntervalId,
} from "@/lib/music/intervals";
import { playInterval } from "@/lib/music/audio";
import { note, noteId, noteName, parseNoteId } from "@/lib/music/notes";
import { buildMusicalIntervalSession } from "@/lib/study/generators/musical-intervals";
import { useStudy, useTrackTopic } from "@/lib/study/provider";

const ROOTS = [
  note("C"),
  note("D"),
  note("E"),
  note("F"),
  note("G"),
  note("A"),
  note("B"),
  note("C", 0, 5),
];
export function IntervalStudio() {
  useTrackTopic("/intervalos", "Intervalos");
  return (
    <div className="flex flex-col gap-10">
      <SectionHeading
        eyebrow="Teoria + percepção relativa"
        title="Intervalos"
        description="Um intervalo é a relação entre duas alturas: podemos contá-la pelas letras, medi-la em semitons, vê-la e ouvi-la."
      />
      <Learn />
      <Explorer />
      <Practice />
      <section className="border-t border-rule pt-8">
        <p className="type-label text-brass">Revisar</p>
        <h2 className="display mt-2 text-2xl font-semibold">
          Minhas dificuldades com intervalos
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Erros visuais e teóricos entram na fila geral; dificuldades auditivas
          continuam no ambiente de escuta.
        </p>
        <div className="mt-4 flex gap-2">
          <a
            href="/revisar"
            className="inline-flex min-h-10 items-center border border-rule px-4 text-sm"
          >
            Abrir revisão
          </a>
          <a
            href="/ouvido-musical#minhas-dificuldades"
            className="inline-flex min-h-10 items-center border border-rule px-4 text-sm"
          >
            Revisão auditiva
          </a>
        </div>
      </section>
    </div>
  );
}
function Learn() {
  const root = note("C"),
    target = note("G");
  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-6">
        <h2 className="display text-2xl font-semibold">Aprender</h2>
        <TeachingBlock label="Entenda">
          <p>
            O número e a qualidade respondem perguntas diferentes. Dó–Mi é uma{" "}
            <strong>terça</strong> porque contamos Dó, Ré e Mi. É{" "}
            <strong>maior</strong> porque mede quatro semitons.
          </p>
        </TeachingBlock>
        <Memory items={["Número = nomes de notas", "Qualidade = semitons"]} />
        <CommonMistake
          claim="4 semitons significa quarta."
          correction="Semitons medem a distância cromática. O número vem da contagem inclusiva das letras; quatro semitons formam uma terça maior."
        />
        <Connection>
          Escalas são feitas de relações intervalares: em Dó maior, Dó–Ré é 2ª
          maior, Dó–Mi é 3ª maior, Dó–Fá é 4ª justa e Dó–Sol é 5ª justa.
        </Connection>
        <Deeper>
          <p>
            Fá♯ e Sol♭ soam iguais neste temperamento, mas a grafia informa
            funções diatônicas distintas. Por isso a análise não usa apenas
            semitons.
          </p>
        </Deeper>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="type-label text-brass">Contando Dó → Sol</p>
          <Staff
            notes={[
              { note: root, label: "1" },
              { note: target, label: "5" },
            ]}
            minNotes={5}
          />
          <Keyboard
            marks={[
              { note: root, badge: "1" },
              { note: target, badge: "5", tone: "b" },
            ]}
          />
          <p className="mt-4 text-center text-sm">
            {countIntervalLetters(root, target).map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="mx-1 inline-block border-b border-rule px-1 py-2"
              >
                {name} {index + 1}
              </span>
            ))}
          </p>
          <p className="display mt-4 text-center text-xl font-semibold">
            Cinco nomes → quinta justa
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => listen(root, target, "melodicAscending")}
          >
            <Speaker /> Ouvir Dó → Sol
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
function Explorer() {
  const [rootId, setRootId] = React.useState("C4");
  const [id, setId] = React.useState<MusicalIntervalId>("M3");
  const [direction, setDirection] =
    React.useState<IntervalDirection>("ascending");
  const root = parseNoteId(rootId)!;
  const target = constructInterval(root, id, direction);
  const analyzed = analyzeInterval(root, target)!;
  return (
    <section className="border-y border-rule py-8">
      <p className="type-label text-brass">Explorar</p>
      <h2 className="display mt-2 text-2xl font-semibold">
        Construtor de intervalos
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Nota inicial">
          <Select
            value={rootId}
            onChange={(event) => setRootId(event.target.value)}
          >
            {ROOTS.map((item) => (
              <option key={noteId(item)} value={noteId(item)}>
                {noteName(item)}
                {item.octave}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Intervalo">
          <Select
            value={id}
            onChange={(event) => setId(event.target.value as MusicalIntervalId)}
          >
            {MUSICAL_INTERVALS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Direção">
          <Select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as IntervalDirection)
            }
          >
            <option value="ascending">Ascendente</option>
            <option value="descending">Descendente</option>
          </Select>
        </Field>
      </div>
      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <div>
          <Staff
            notes={[
              { note: root, label: noteName(root) },
              { note: target, label: noteName(target) },
            ]}
          />
          <Keyboard
            marks={[
              { note: root, badge: "1" },
              { note: target, badge: "2", tone: "b" },
            ]}
          />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="display text-3xl font-semibold">
            {noteName(root)}
            {root.octave} → {noteName(target)}
            {target.octave}
          </h3>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <Fact label="Número" value={`${analyzed.number}ª`} />
            <Fact
              label="Qualidade"
              value={
                analyzed.quality === "perfect"
                  ? "Justa"
                  : analyzed.quality === "major"
                    ? "Maior"
                    : "Menor"
              }
            />
            <Fact label="Semitons" value={analyzed.semitones} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="brass"
              onClick={() =>
                listen(
                  root,
                  target,
                  direction === "ascending"
                    ? "melodicAscending"
                    : "melodicDescending",
                )
              }
            >
              <Speaker /> Ouvir melódico
            </Button>
            <Button onClick={() => listen(root, target, "harmonic")}>
              <Speaker /> Ouvir harmônico
            </Button>
          </div>
          <ProfessorActions
            title={capitalize(analyzed.name)}
            question={`Como ouvir melhor ${analyzed.name}?`}
            noteBody={`${capitalize(analyzed.name)}\n${analyzed.semitones} semitons\nExemplo: ${noteName(root)} → ${noteName(target)}\n\nMinha percepção:`}
          />
        </div>
      </div>
    </section>
  );
}
function Practice() {
  const [size, setSize] = React.useState(5);
  return (
    <section>
      <p className="type-label text-brass">Praticar</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="display mt-2 text-2xl font-semibold">
          Identificar intervalos
        </h2>
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
          contextLabel="Intervalos"
          build={() => buildMusicalIntervalSession(size)}
        />
      </div>
      <EarIntervals />
    </section>
  );
}
function EarIntervals(){const{record}=useStudy();const pairs:[MusicalIntervalId,MusicalIntervalId][]=[['m2','M2'],['m3','M3'],['P4','P5'],['P5','P8']];const[phase,setPhase]=React.useState(0);const[given,setGiven]=React.useState<MusicalIntervalId|null>(null);const[answer,setAnswer]=React.useState<MusicalIntervalId>('m2');const root=note('C');const ids=pairs[phase];const target=constructInterval(root,answer);const definition=MUSICAL_INTERVALS.find(item=>item.id===answer)!;function newRound(nextPhase=phase){const nextIds=pairs[nextPhase];setAnswer(nextIds[Math.floor(Math.random()*nextIds.length)]);setGiven(null);}function respond(value:MusicalIntervalId){if(given)return;setGiven(value);record({module:'intervalos-musicais',itemKey:`interval:ear:${noteId(root)}:${noteId(target)}`,prompt:`Escuta melódica · ${definition.name}`,correct:value===answer,given:MUSICAL_INTERVALS.find(item=>item.id===value)!.shortName,expected:definition.shortName});}return <Card className="mt-7"><CardContent className="flex flex-col gap-5 pt-6"><div><p className="type-label text-brass">Percepção relativa</p><h3 className="display mt-2 text-xl font-semibold">Ouça antes de ver</h3><p className="mt-1 text-sm text-ink-muted">Compare primeiro pares próximos; a referência Dó4 permanece disponível.</p></div><div className="flex justify-center gap-2"><Button onClick={()=>playInterval({root,target:root,semitoneDistance:0,direction:'ascending',playbackMode:'melodicAscending'})}><Speaker/> Referência</Button><Button variant="brass" onClick={()=>listen(root,target,'melodicAscending')}><Speaker/> Ouvir intervalo</Button></div><div className="grid grid-cols-2 gap-2">{ids.map(id=>{const item=MUSICAL_INTERVALS.find(value=>value.id===id)!;return <button key={id} disabled={Boolean(given)} onClick={()=>respond(id)} className="min-h-14 border border-rule bg-paper-raised text-sm hover:border-brass">{item.name}</button>})}</div>{given?<div className="border-t border-rule pt-4"><p className="font-semibold">{given===answer?'Correto.':`A resposta era ${definition.name}.`}</p><p className="mt-1 text-sm text-ink-muted">{noteName(root)} → {noteName(target)} · {definition.semitones} semitons.</p><Staff notes={[{note:root,label:noteName(root)},{note:target,label:noteName(target)}]}/><div className="mt-3 flex justify-end"><Button onClick={()=>{const next=Math.min(pairs.length-1,phase+1);setPhase(next);newRound(next);}}>Próxima comparação</Button></div></div>:null}</CardContent></Card>}
function listen(
  root: ReturnType<typeof note>,
  target: ReturnType<typeof note>,
  playbackMode: "melodicAscending" | "melodicDescending" | "harmonic",
) {
  const analyzed = analyzeInterval(root, target);
  if (!analyzed) return;
  playInterval({
    root,
    target,
    semitoneDistance: analyzed.semitones,
    direction: analyzed.direction,
    playbackMode,
  });
}
function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l border-rule pl-3">
      <dt className="type-label text-ink-faint">{label}</dt>
      <dd className="display mt-2 text-lg font-semibold">{value}</dd>
    </div>
  );
}
const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
