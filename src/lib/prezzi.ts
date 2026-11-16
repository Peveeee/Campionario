import {
  CENTO_PERCENTO,
  dividiArrotondando,
  percentualeDi,
  verificaIntero,
  type Cent,
  type Centesimi,
  type PuntiBase,
} from "./denaro";

/** Aliquota IVA ordinaria: i prezzi sono sempre IVA esclusa, l'IVA compare solo nei totali cliente. */
export const ALIQUOTA_IVA: PuntiBase = 2200;

/** Prezzo cliente unitario dal costo netto e dal ricarico: 100,00 € + 35% = 135,00 €. */
export function prezzoDaRicarico(costoNetto: Cent, ricarico: PuntiBase): Cent {
  verificaIntero(costoNetto, "costo netto");
  verificaIntero(ricarico, "ricarico");
  if (costoNetto < 0) throw new RangeError("Il costo netto non può essere negativo");
  return dividiArrotondando(costoNetto * (CENTO_PERCENTO + ricarico), CENTO_PERCENTO);
}

/** Ricarico implicito di un prezzo impostato a mano. `null` se il costo è zero. */
export function ricaricoDaPrezzo(costoNetto: Cent, prezzo: Cent): PuntiBase | null {
  verificaIntero(costoNetto, "costo netto");
  verificaIntero(prezzo, "prezzo");
  if (costoNetto === 0) return null;
  return dividiArrotondando((prezzo - costoNetto) * CENTO_PERCENTO, costoNetto);
}

/** Totale di riga: prezzo unitario × quantità (in centesimi di unità), arrotondato al centesimo. */
export function totaleRiga(prezzoUnitario: Cent, quantita: Centesimi): Cent {
  verificaIntero(prezzoUnitario, "prezzo unitario");
  verificaIntero(quantita, "quantità");
  if (quantita < 0) throw new RangeError("La quantità non può essere negativa");
  return dividiArrotondando(prezzoUnitario * quantita, 100);
}

export interface Margine {
  importo: Cent;
  /** Margine sul prezzo di vendita, in punti base. `null` se il prezzo è zero. */
  percentuale: PuntiBase | null;
}

export function margine(costo: Cent, prezzo: Cent): Margine {
  verificaIntero(costo, "costo");
  verificaIntero(prezzo, "prezzo");
  const importo = prezzo - costo;
  return {
    importo,
    percentuale: prezzo === 0 ? null : dividiArrotondando(importo * CENTO_PERCENTO, prezzo),
  };
}

export interface TotaliCliente {
  imponibile: Cent;
  iva: Cent;
  totale: Cent;
}

export function totaliCliente(imponibile: Cent, aliquota: PuntiBase = ALIQUOTA_IVA): TotaliCliente {
  const iva = percentualeDi(imponibile, aliquota);
  return { imponibile, iva, totale: imponibile + iva };
}

/**
 * Prezzo cliente unitario in vigore: quello calcolato dal ricarico,
 * oppure quello scritto a mano dal designer se presente.
 */
export function prezzoClienteUnitario(input: {
  costoNetto: Cent;
  ricarico: PuntiBase;
  prezzoManuale: Cent | null;
}): Cent {
  if (input.prezzoManuale !== null) {
    verificaIntero(input.prezzoManuale, "prezzo manuale");
    return input.prezzoManuale;
  }
  return prezzoDaRicarico(input.costoNetto, input.ricarico);
}
