/**
 * Aritmetica intera per importi e percentuali.
 *
 * Convenzioni usate in tutta l'app:
 * - importi in centesimi di euro (`Cent`), sempre interi, IVA esclusa;
 * - percentuali in punti base (`PuntiBase`): 3500 = 35,00%;
 * - quantità in centesimi di unità (`Centesimi`): 1450 = 14,50 mq; 200 = 2 pz.
 *
 * Nessun float entra mai in un calcolo monetario: le divisioni passano tutte
 * da `dividiArrotondando`, che arrotonda al mezzo lontano da zero.
 */

export type Cent = number;
export type PuntiBase = number;
export type Centesimi = number;

export const CENTO_PERCENTO: PuntiBase = 10_000;

export function verificaIntero(valore: number, nome = "valore"): void {
  if (!Number.isSafeInteger(valore)) {
    throw new RangeError(`${nome} deve essere un intero, ricevuto ${valore}`);
  }
}

/** Divisione intera con arrotondamento al mezzo lontano da zero (2,5 → 3; −2,5 → −3). */
export function dividiArrotondando(numeratore: number, denominatore: number): number {
  verificaIntero(numeratore, "numeratore");
  verificaIntero(denominatore, "denominatore");
  if (denominatore === 0) throw new RangeError("Divisione per zero");
  const segno = Math.sign(numeratore) * Math.sign(denominatore);
  const a = Math.abs(numeratore);
  const b = Math.abs(denominatore);
  const risultato = Math.floor((2 * a + b) / (2 * b));
  if (!Number.isSafeInteger(2 * a + b)) {
    throw new RangeError("Importo fuori dall'intervallo gestibile");
  }
  return segno === 0 ? 0 : segno * risultato;
}

/** Applica una percentuale in punti base a un importo: 10.000 cent × 22% = 2.200 cent. */
export function percentualeDi(importo: Cent, percentuale: PuntiBase): Cent {
  verificaIntero(importo, "importo");
  verificaIntero(percentuale, "percentuale");
  return dividiArrotondando(importo * percentuale, CENTO_PERCENTO);
}

export function somma(valori: Iterable<number>): number {
  let totale = 0;
  for (const v of valori) {
    verificaIntero(v);
    totale += v;
  }
  return totale;
}
