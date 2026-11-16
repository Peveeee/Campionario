import { somma, type Cent } from "./denaro";
import { margine, totaleRiga, type Margine } from "./prezzi";

/** Una riga del riepilogo economico: solo articoli approvati, con costo e prezzo unitari. */
export interface RigaEconomica {
  chiave: string;
  costoUnitario: Cent;
  prezzoUnitario: Cent;
  quantita: number;
}

export interface Gruppo {
  chiave: string;
  costo: Cent;
  prezzo: Cent;
  margine: Margine;
}

export function raggruppa(righe: readonly RigaEconomica[]): Gruppo[] {
  const mappa = new Map<string, { costo: Cent; prezzo: Cent }>();
  for (const r of righe) {
    const g = mappa.get(r.chiave) ?? { costo: 0, prezzo: 0 };
    g.costo += totaleRiga(r.costoUnitario, r.quantita);
    g.prezzo += totaleRiga(r.prezzoUnitario, r.quantita);
    mappa.set(r.chiave, g);
  }
  return [...mappa].map(([chiave, g]) => ({ chiave, ...g, margine: margine(g.costo, g.prezzo) }));
}

export interface RicavoProgetto {
  parcella: Cent;
  costoForniture: Cent;
  prezzoForniture: Cent;
  margineForniture: Margine;
  /** Parcella + margine sulle forniture. */
  ricavoTotale: Cent;
}

export function ricavoProgetto(parcella: Cent, righe: readonly RigaEconomica[]): RicavoProgetto {
  const costoForniture = somma(righe.map((r) => totaleRiga(r.costoUnitario, r.quantita)));
  const prezzoForniture = somma(righe.map((r) => totaleRiga(r.prezzoUnitario, r.quantita)));
  const m = margine(costoForniture, prezzoForniture);
  return {
    parcella,
    costoForniture,
    prezzoForniture,
    margineForniture: m,
    ricavoTotale: parcella + m.importo,
  };
}
