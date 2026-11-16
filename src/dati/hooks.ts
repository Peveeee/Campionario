"use client";

import { useMemo } from "react";
import type { Archivio, Id } from "@/dominio/tipi";
import { leggiProgetti, type Sessione } from "./accesso";
import { useSessioneStudio } from "./sessione-studio";
import { modificaAnnullabile, useArchivio } from "./store";

/**
 * Sessione per le schermate che leggono ancora l'archivio nel browser.
 * Utente e ruolo sono quelli veri; lo studio è quello di esempio del prototipo
 * finché la Fase 2 non porta progetti, stanze e articoli su Supabase.
 */
const STUDIO_PROTOTIPO = "studio-varesi";

export function useSessioneAttiva(): Sessione {
  const { utente } = useSessioneStudio();
  return useMemo(() => ({ utenteId: utente.id, studioId: STUDIO_PROTOTIPO, ruolo: utente.ruolo }), [utente]);
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
