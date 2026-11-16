"use client";

import { useMemo } from "react";
import type { Archivio, Id } from "@/dominio/tipi";
import { leggiProgetti, type Sessione } from "./accesso";
import { modificaAnnullabile, useArchivio, useSessione } from "./store";

/** Dentro l'area dello studio la sessione c'è sempre: il layout la garantisce. */
export function useSessioneAttiva(): Sessione {
  return useSessione() as Sessione;
}

export function useProgetto(id: Id) {
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  return useMemo(
    () => leggiProgetti(archivio, sessione).find((p) => p.progetto.id === id) ?? null,
    [archivio, sessione, id],
  );
}

/** Esegue un'azione con la sessione corrente e offre "Annulla". */
export function useAzione() {
  const sessione = useSessioneAttiva();
  return (messaggio: string, azione: (a: Archivio, s: Sessione) => Archivio) =>
    modificaAnnullabile(messaggio, (a) => azione(a, sessione));
}
