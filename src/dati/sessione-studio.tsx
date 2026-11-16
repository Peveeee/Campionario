"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Ruolo } from "@/dominio/tipi";

/** Chi ha fatto l'accesso e in quale studio, letto da Supabase nel layout dello studio. */
export interface SessioneStudio {
  utente: { id: string; nome: string; email: string; ruolo: Ruolo };
  studio: { id: string; nome: string };
}

const Contesto = createContext<SessioneStudio | null>(null);

export function SessioneStudioProvider({ valore, children }: { valore: SessioneStudio; children: ReactNode }) {
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

/** Dentro l'area dello studio c'è sempre: il layout la garantisce. */
export function useSessioneStudio(): SessioneStudio {
  const valore = useContext(Contesto);
  if (!valore) throw new Error("useSessioneStudio va usato dentro l'area dello studio");
  return valore;
}
