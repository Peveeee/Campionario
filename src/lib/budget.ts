import { CENTO_PERCENTO, dividiArrotondando, somma, type Cent, type PuntiBase } from "./denaro";
import { totaleRiga } from "./prezzi";
import type { StatoApprovazione } from "@/dominio/tipi";

/**
 * Gli articoli rifiutati non pesano sul budget: sono proposte scartate.
 * Proposti, approvati e da rivedere sì, perché rappresentano la spesa prevista.
 */
export const STATI_A_BUDGET: readonly StatoApprovazione[] = ["proposto", "approvato", "da_rivedere"];

/** Soglia oltre la quale il budget è "quasi esaurito": 90%. */
export const SOGLIA_ATTENZIONE: PuntiBase = 9000;

export interface RigaBudget {
  stato: StatoApprovazione;
  prezzoClienteUnitario: Cent;
  quantita: number;
}

export function totaleAPreventivo(righe: readonly RigaBudget[]): Cent {
  return somma(
    righe
      .filter((r) => STATI_A_BUDGET.includes(r.stato))
      .map((r) => totaleRiga(r.prezzoClienteUnitario, r.quantita)),
  );
}

export type StatoBudget =
  | { tipo: "senza_budget"; totale: Cent }
  | { tipo: "entro"; totale: Cent; budget: Cent; residuo: Cent; utilizzo: PuntiBase }
  | { tipo: "attenzione"; totale: Cent; budget: Cent; residuo: Cent; utilizzo: PuntiBase }
  | { tipo: "superato"; totale: Cent; budget: Cent; eccedenza: Cent; utilizzo: PuntiBase };

export function statoBudget(totale: Cent, budget: Cent | null): StatoBudget {
  if (budget === null || budget <= 0) return { tipo: "senza_budget", totale };
  const utilizzo = dividiArrotondando(totale * CENTO_PERCENTO, budget);
  if (totale > budget) {
    return { tipo: "superato", totale, budget, eccedenza: totale - budget, utilizzo };
  }
  const residuo = budget - totale;
  if (utilizzo >= SOGLIA_ATTENZIONE) {
    return { tipo: "attenzione", totale, budget, residuo, utilizzo };
  }
  return { tipo: "entro", totale, budget, residuo, utilizzo };
}
