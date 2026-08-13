"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Cloud, CloudOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { useAuth } from "@/lib/auth/provider";
import { createClient } from "@/lib/supabase/client";
import { KEYS } from "@/lib/storage/local";
import { getLocalUpdatedAt, peek, subscribe, write } from "@/lib/storage/store";
import { EMPTY_BOARDS, type AtelierBoard } from "@/lib/atelier/types";
import { EMPTY_STUDY_STATE, NO_MATERIAL, NO_NOTES, type MaterialItem, type StudyState } from "@/lib/storage/types";
import { NO_EVENTS, type StudyEvent } from "@/lib/agenda/types";

export type SyncStatus = "local" | "syncing" | "synced" | "offline" | "error";
type SyncContextValue = { status: SyncStatus; syncNow: () => Promise<void> };
const SyncContext = React.createContext<SyncContextValue>({ status: "local", syncNow: async () => undefined });
const BUCKET = "study-materials";

type RemoteNote = { id: string; title: string; subject: string; body: string; tags: string[]; links: string[]; pinned: boolean; created_at: string; updated_at: string };
type RemoteBoard = { id: string; title: string; content: AtelierBoard["elements"]; created_at: string; updated_at: string };
type RemoteMaterial = { id: string; title: string; subject: string; notes: string; study_date: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number; created_at: string; updated_at: string };
type RemoteStudy = { content: StudyState; updated_at: string };
type RemoteEvent = { content: StudyEvent; updated_at: string };

const time = (iso: string) => new Date(iso).getTime();
const iso = (ms: number) => new Date(ms || Date.now()).toISOString();
const migrationKey = (userId: string) => `caderno-musical:cloud-migrated:${userId}`;

function mergeById<T extends { id: string }>(local: T[], remote: T[], updated: (item: T) => number) {
  const merged = new Map(remote.map((item) => [item.id, item]));
  for (const item of local) {
    const other = merged.get(item.id);
    if (!other || updated(item) >= updated(other)) merged.set(item.id, item);
  }
  return [...merged.values()];
}

function dataUrlToBlob(dataUrl: string) {
  return fetch(dataUrl).then((response) => response.blob());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function safeName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "arquivo";
}

async function expect<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

async function pullAll(client: SupabaseClient, userId: string) {
  const [studyRows, noteRows, boardRows, materialRows, eventRows] = await Promise.all([
    expect(client.from("study_states").select("content,updated_at").eq("user_id", userId)),
    expect(client.from("notebook_notes").select("id,title,subject,body,tags,links,pinned,created_at,updated_at").eq("user_id", userId)),
    expect(client.from("atelier_boards").select("id,title,content,created_at,updated_at").eq("user_id", userId)),
    expect(client.from("study_materials").select("id,title,subject,notes,study_date,storage_path,file_name,mime_type,size_bytes,created_at,updated_at").eq("user_id", userId)),
    expect(client.from("study_events").select("content,updated_at").eq("user_id", userId)),
  ]);
  const materials = await Promise.all((materialRows as RemoteMaterial[]).map(async (row) => {
    const blob = await expect(client.storage.from(BUCKET).download(row.storage_path));
    if (!blob) throw new Error(`Arquivo remoto ausente: ${row.file_name}`);
    return { id: row.id, title: row.title, subject: row.subject, date: row.study_date, notes: row.notes, fileName: row.file_name, fileType: row.mime_type, fileSize: Number(row.size_bytes), dataUrl: await blobToDataUrl(blob), createdAt: time(row.created_at), updatedAt: time(row.updated_at) } satisfies MaterialItem;
  }));
  return {
    study: (studyRows as RemoteStudy[])[0] ?? null,
    notes: (noteRows as RemoteNote[]).map((row) => ({ id: row.id, title: row.title, subject: row.subject, body: row.body, tags: row.tags, links: row.links, pinned: row.pinned, createdAt: time(row.created_at), updatedAt: time(row.updated_at) })),
    boards: (boardRows as RemoteBoard[]).map((row) => ({ id: row.id, title: row.title, elements: row.content, createdAt: time(row.created_at), updatedAt: time(row.updated_at) })),
    materials,
    events: (eventRows as RemoteEvent[]).map((row) => ({ ...row.content, updatedAt: time(row.updated_at) })),
  };
}

async function pushAll(client: SupabaseClient, userId: string) {
  const study = peek(KEYS.study, EMPTY_STUDY_STATE);
  const notes = peek(KEYS.notebook, NO_NOTES);
  const boards = peek(KEYS.atelier, EMPTY_BOARDS);
  const materials = peek(KEYS.material, NO_MATERIAL);
  const events = peek(KEYS.agenda, NO_EVENTS);
  await expect(client.from("study_states").upsert({ user_id: userId, schema_version: 1, content: study, updated_at: iso(getLocalUpdatedAt(KEYS.study)) }));
  await syncRows(client, "notebook_notes", userId, notes.map((note) => ({ id: note.id, user_id: userId, title: note.title, subject: note.subject, body: note.body, tags: note.tags, links: note.links, pinned: note.pinned, created_at: iso(note.createdAt), updated_at: iso(note.updatedAt) })));
  await syncRows(client, "atelier_boards", userId, boards.map((board) => ({ id: board.id, user_id: userId, title: board.title, schema_version: 1, content: board.elements, created_at: iso(board.createdAt), updated_at: iso(board.updatedAt) })));
  await syncRows(client, "study_events", userId, events.map((event) => ({ id: event.id, user_id: userId, type: event.type, title: event.title, start_at: event.startAt, end_at: event.endAt, status: event.status, schema_version: 1, content: event, created_at: iso(event.createdAt), updated_at: iso(event.updatedAt) })));

  const remoteMaterials = await expect(client.from("study_materials").select("id,storage_path").eq("user_id", userId)) as Array<{ id: string; storage_path: string }>;
  const currentIds = new Set(materials.map((item) => item.id));
  const removed = remoteMaterials.filter((row) => !currentIds.has(row.id));
  if (removed.length) {
    await expect(client.storage.from(BUCKET).remove(removed.map((row) => row.storage_path)));
    await expect(client.from("study_materials").delete().eq("user_id", userId).in("id", removed.map((row) => row.id)));
  }
  for (const item of materials) {
    const path = `${userId}/${item.id}/${safeName(item.fileName)}`;
    const existing = remoteMaterials.find((row) => row.id === item.id);
    if (!existing || existing.storage_path !== path) {
      const blob = await dataUrlToBlob(item.dataUrl);
      await expect(client.storage.from(BUCKET).upload(path, blob, { contentType: item.fileType, upsert: true }));
    }
    await expect(client.from("study_materials").upsert({ id: item.id, user_id: userId, title: item.title, subject: item.subject, notes: item.notes, study_date: item.date, storage_path: path, file_name: item.fileName, mime_type: item.fileType, size_bytes: item.fileSize, created_at: iso(item.createdAt), updated_at: iso(item.updatedAt ?? item.createdAt) }));
  }
}

async function syncRows(client: SupabaseClient, table: string, userId: string, rows: Array<{ id: string } & Record<string, unknown>>) {
  const remote = await expect(client.from(table).select("id").eq("user_id", userId)) as Array<{ id: string }>;
  if (rows.length) await expect(client.from(table).upsert(rows));
  const ids = new Set(rows.map((row) => row.id));
  const deleted = remote.filter((row) => !ids.has(row.id)).map((row) => row.id);
  if (deleted.length) await expect(client.from(table).delete().eq("user_id", userId).in("id", deleted));
}

async function verifyCloud(client: SupabaseClient, userId: string) {
  const expected = {
    notes: peek(KEYS.notebook, NO_NOTES).length,
    boards: peek(KEYS.atelier, EMPTY_BOARDS).length,
    materials: peek(KEYS.material, NO_MATERIAL).length,
    events: peek(KEYS.agenda, NO_EVENTS).length,
  };
  const [study, notes, boards, materials, events] = await Promise.all([
    expect(client.from("study_states").select("user_id").eq("user_id", userId)),
    expect(client.from("notebook_notes").select("id", { count: "exact" }).eq("user_id", userId)),
    expect(client.from("atelier_boards").select("id", { count: "exact" }).eq("user_id", userId)),
    expect(client.from("study_materials").select("id", { count: "exact" }).eq("user_id", userId)),
    expect(client.from("study_events").select("id", { count: "exact" }).eq("user_id", userId)),
  ]);
  if ((study as Array<unknown>).length !== 1 || (notes as Array<unknown>).length !== expected.notes || (boards as Array<unknown>).length !== expected.boards || (materials as Array<unknown>).length !== expected.materials || (events as Array<unknown>).length !== expected.events) {
    throw new Error("A verificação da cópia remota não conferiu.");
  }
}

function hasLocalData() {
  const study = peek(KEYS.study, EMPTY_STUDY_STATE);
  return study.attempts.length > 0 || study.studyDays.length > 0 || peek(KEYS.notebook, NO_NOTES).length > 0 || peek(KEYS.atelier, EMPTY_BOARDS).length > 0 || peek(KEYS.material, NO_MATERIAL).length > 0 || peek(KEYS.agenda, NO_EVENTS).length > 0;
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const client = React.useMemo(() => createClient(), []);
  const [status, setStatus] = React.useState<SyncStatus>("local");
  const [migrationOpen, setMigrationOpen] = React.useState(false);
  const initialized = React.useRef(false);
  const applying = React.useRef(false);

  const synchronize = React.useCallback(async () => {
    if (!client || !user || !initialized.current || !navigator.onLine) {
      if (user && !navigator.onLine) setStatus("offline");
      return;
    }
    setStatus("syncing");
    try {
      await pushAll(client, user.id);
      setStatus("synced");
    } catch {
      setStatus(navigator.onLine ? "error" : "offline");
    }
  }, [client, user]);

  React.useEffect(() => {
    initialized.current = false;
    queueMicrotask(() => setMigrationOpen(false));
    if (!client || !user) {
      queueMicrotask(() => setStatus("local"));
      return;
    }
    let active = true;
    const start = async () => {
      if (!window.localStorage.getItem(migrationKey(user.id)) && hasLocalData()) {
        if (active) setMigrationOpen(true);
        return;
      }
      setStatus("syncing");
      try {
        const remote = await pullAll(client, user.id);
        if (!active) return;
        applying.current = true;
        const remoteStudyAt = remote.study ? time(remote.study.updated_at) : 0;
        const remoteNotesAt = Math.max(0, ...remote.notes.map((item) => item.updatedAt));
        const remoteBoardsAt = Math.max(0, ...remote.boards.map((item) => item.updatedAt));
        const remoteMaterialsAt = Math.max(0, ...remote.materials.map((item) => item.updatedAt ?? item.createdAt));
        const remoteEventsAt = Math.max(0, ...remote.events.map((item) => item.updatedAt));
        const localWins = {
          study: getLocalUpdatedAt(KEYS.study) > remoteStudyAt,
          notes: getLocalUpdatedAt(KEYS.notebook) > remoteNotesAt,
          boards: getLocalUpdatedAt(KEYS.atelier) > remoteBoardsAt,
          materials: getLocalUpdatedAt(KEYS.material) > remoteMaterialsAt,
          events: getLocalUpdatedAt(KEYS.agenda) > remoteEventsAt,
        };
        if (!localWins.study && remote.study) write(KEYS.study, remote.study.content, remoteStudyAt);
        if (!localWins.notes) write(KEYS.notebook, remote.notes, remoteNotesAt);
        if (!localWins.boards) write(KEYS.atelier, remote.boards, remoteBoardsAt);
        if (!localWins.materials) write(KEYS.material, remote.materials, remoteMaterialsAt);
        if (!localWins.events) write(KEYS.agenda, remote.events, remoteEventsAt);
        applying.current = false;
        initialized.current = true;
        window.localStorage.setItem(migrationKey(user.id), "1");
        if (Object.values(localWins).some(Boolean)) await pushAll(client, user.id);
        setStatus("synced");
      } catch { if (active) setStatus(navigator.onLine ? "error" : "offline"); }
    };
    void start();
    return () => { active = false; };
  }, [client, user]);

  React.useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    return subscribe(() => {
      if (!initialized.current || applying.current) return;
      setStatus("syncing");
      clearTimeout(timer);
      timer = setTimeout(() => void synchronize(), 1200);
    });
  }, [synchronize, user]);

  async function migrate() {
    if (!client || !user) return;
    setMigrationOpen(false);
    setStatus("syncing");
    try {
      const remote = await pullAll(client, user.id);
      applying.current = true;
      const localNotes = peek(KEYS.notebook, NO_NOTES);
      const localBoards = peek(KEYS.atelier, EMPTY_BOARDS);
      const localMaterials = peek(KEYS.material, NO_MATERIAL);
      const localEvents = peek(KEYS.agenda, NO_EVENTS);
      const notes = mergeById(localNotes, remote.notes, (item) => item.updatedAt);
      const boards = mergeById(localBoards, remote.boards, (item) => item.updatedAt);
      const materials = mergeById(localMaterials, remote.materials, (item) => item.updatedAt ?? item.createdAt);
      const events = mergeById(localEvents, remote.events, (item) => item.updatedAt);
      write(KEYS.notebook, notes);
      write(KEYS.atelier, boards);
      write(KEYS.material, materials);
      write(KEYS.agenda, events);
      if (remote.study && time(remote.study.updated_at) > getLocalUpdatedAt(KEYS.study)) write(KEYS.study, remote.study.content, time(remote.study.updated_at));
      applying.current = false;
      initialized.current = true;
      await pushAll(client, user.id);
      await verifyCloud(client, user.id);
      window.localStorage.setItem(migrationKey(user.id), "1");
      setStatus("synced");
    } catch { applying.current = false; setStatus(navigator.onLine ? "error" : "offline"); setMigrationOpen(true); }
  }

  return (
    <SyncContext.Provider value={{ status, syncNow: synchronize }}>
      {children}
      <Modal open={migrationOpen} onClose={() => setMigrationOpen(false)} title="Levar este caderno para a nuvem?" description="Encontramos estudos salvos neste navegador.">
        <div className="flex flex-col gap-5 text-sm leading-relaxed text-ink-muted">
          <p>Vamos combinar estes dados com sua conta, preservando notas, progresso, quadros e materiais. Nada será apagado do navegador.</p>
          <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setMigrationOpen(false)}>Agora não</Button><Button variant="brass" onClick={() => void migrate()}><Cloud /> Sincronizar caderno</Button></div>
        </div>
      </Modal>
    </SyncContext.Provider>
  );
}

export function useCloudSync() { return React.useContext(SyncContext); }

export const SYNC_LABEL: Record<SyncStatus, { text: string; icon: typeof Cloud }> = {
  local: { text: "Salvo localmente", icon: CloudOff }, syncing: { text: "Sincronizando…", icon: LoaderCircle }, synced: { text: "Sincronizado", icon: Cloud }, offline: { text: "Offline · salvo localmente", icon: CloudOff }, error: { text: "Nuvem indisponível", icon: CloudOff },
};
