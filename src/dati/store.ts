"use client";

/**
 * Archivio del prototipo, salvato nel browser (localStorage).
 * Quando arriverà Supabase, questo modulo sarà sostituito da chiamate al database:
 * le schermate usano solo gli hook esportati qui e le funzioni di `accesso.ts`.
 */
import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";
import type { Archivio, Ruolo, Utente } from "@/dominio/tipi";
import { creaArchivioDiEsempio } from "./seed";
import type { Sessione } from "./accesso";

const CHIAVE_ARCHIVIO = "campionario:archivio";
const CHIAVE_SESSIONE = "campionario:sessione";
/** Va incrementata quando cambia la forma dell'archivio: i dati salvati vengono rigenerati. */
const VERSIONE_ARCHIVIO = 2;

const busta = z.object({
  versione: z.literal(VERSIONE_ARCHIVIO),
  archivio: z
    .object({
      studi: z.array(z.unknown()),
      articoli: z.array(z.unknown()),
      costiArticoli: z.array(z.unknown()),
    })
    .passthrough(),
});

const sessioneSalvata = z.object({
  utenteId: z.string(),
  studioId: z.string(),
  ruolo: z.enum(["titolare", "designer"]),
});

type Ascoltatore = () => void;
const ascoltatori = new Set<Ascoltatore>();

let archivio: Archivio | null = null;
let sessione: Sessione | null | undefined;

function leggiLocale(chiave: string): unknown {
  try {
    const testo = window.localStorage.getItem(chiave);
    return testo ? JSON.parse(testo) : null;
  } catch {
    return null;
  }
}

function scriviLocale(chiave: string, valore: unknown): void {
  try {
    if (valore === null) window.localStorage.removeItem(chiave);
    else window.localStorage.setItem(chiave, JSON.stringify(valore));
  } catch {
    // Archiviazione non disponibile (navigazione privata, quota piena): si lavora in memoria.
  }
}

function caricaArchivio(): Archivio {
  if (archivio) return archivio;
  const salvato = busta.safeParse(leggiLocale(CHIAVE_ARCHIVIO));
  archivio = salvato.success ? (salvato.data.archivio as unknown as Archivio) : creaArchivioDiEsempio();
  return archivio;
}

function caricaSessione(): Sessione | null {
  if (sessione !== undefined) return sessione;
  const salvata = sessioneSalvata.safeParse(leggiLocale(CHIAVE_SESSIONE));
  sessione = salvata.success ? salvata.data : null;
  return sessione;
}

function notifica(): void {
  for (const a of ascoltatori) a();
}

function iscrivi(a: Ascoltatore): () => void {
  ascoltatori.add(a);
  const suStorage = (e: StorageEvent) => {
    // Sincronizza le schede aperte sullo stesso browser.
    if (e.key === CHIAVE_ARCHIVIO) archivio = null;
    if (e.key === CHIAVE_SESSIONE) sessione = undefined;
    if (e.key === CHIAVE_ARCHIVIO || e.key === CHIAVE_SESSIONE) a();
  };
  window.addEventListener("storage", suStorage);
  return () => {
    ascoltatori.delete(a);
    window.removeEventListener("storage", suStorage);
  };
}

/* ——— API ——— */

export function aggiornaArchivio(modifica: (a: Archivio) => Archivio): void {
  archivio = modifica(caricaArchivio());
  scriviLocale(CHIAVE_ARCHIVIO, { versione: VERSIONE_ARCHIVIO, archivio });
  notifica();
}

/* ——— Annulla ——— */

export interface Avviso {
  id: number;
  messaggio: string;
  annulla: (() => void) | null;
}

let avviso: Avviso | null = null;
let contatoreAvvisi = 0;
let timerAvviso: ReturnType<typeof setTimeout> | undefined;

export function mostraAvviso(messaggio: string, annulla: (() => void) | null = null): void {
  avviso = { id: ++contatoreAvvisi, messaggio, annulla };
  clearTimeout(timerAvviso);
  timerAvviso = setTimeout(() => {
    avviso = null;
    notifica();
  }, 6000);
  notifica();
}

export function chiudiAvviso(): void {
  avviso = null;
  notifica();
}

export function useAvviso(): Avviso | null {
  return useSyncExternalStore(iscrivi, () => avviso, () => null);
}

/**
 * Applica una modifica e mostra un avviso con "Annulla": niente finestre di conferma,
 * l'errore si recupera con un clic.
 */
export function modificaAnnullabile(messaggio: string, modifica: (a: Archivio) => Archivio): void {
  const prima = caricaArchivio();
  aggiornaArchivio(modifica);
  mostraAvviso(messaggio, () => {
    aggiornaArchivio(() => prima);
    mostraAvviso("Modifica annullata");
  });
}

export function ripristinaDatiDiEsempio(): void {
  archivio = creaArchivioDiEsempio();
  scriviLocale(CHIAVE_ARCHIVIO, null);
  notifica();
}

export function entraCome(utente: Utente): void {
  sessione = { utenteId: utente.id, studioId: utente.studioId, ruolo: utente.ruolo };
  scriviLocale(CHIAVE_SESSIONE, sessione);
  notifica();
}

export function esci(): void {
  sessione = null;
  scriviLocale(CHIAVE_SESSIONE, null);
  notifica();
}

const archivioServer = creaArchivioDiEsempio();

export function useArchivio(): Archivio {
  return useSyncExternalStore(iscrivi, caricaArchivio, () => archivioServer);
}

/** `undefined` finché il browser non ha letto la sessione, `null` se non si è entrati. */
export function useSessione(): Sessione | null | undefined {
  return useSyncExternalStore(iscrivi, caricaSessione, () => undefined);
}

export function useUtenteCorrente(): Utente | null {
  const s = useSessione();
  const a = useArchivio();
  if (!s) return null;
  return a.utenti.find((u) => u.id === s.utenteId) ?? null;
}

/** Cambia ruolo restando nello stesso studio: utile per provare cosa vede ciascuno. */
export function useCambioRuolo(): (ruolo: Ruolo) => void {
  const a = useArchivio();
  return useCallback(
    (ruolo: Ruolo) => {
      const utente = a.utenti.find((u) => u.ruolo === ruolo);
      if (utente) entraCome(utente);
    },
    [a],
  );
}
