import { CENTO_PERCENTO, percentualeDi, somma, verificaIntero, type Cent, type PuntiBase } from "./denaro";

export type RegolaAcconto =
  | { tipo: "importo"; importo: Cent }
  | { tipo: "percentuale"; percentuale: PuntiBase };

/** Importo di una richiesta di acconto, calcolato su una base (totale ordine o progetto, IVA esclusa). */
export function importoAcconto(regola: RegolaAcconto, base: Cent): Cent {
  verificaIntero(base, "base");
  if (regola.tipo === "importo") {
    verificaIntero(regola.importo, "importo");
    if (regola.importo < 0) throw new RangeError("L'acconto non può essere negativo");
    return regola.importo;
  }
  verificaIntero(regola.percentuale, "percentuale");
  if (regola.percentuale < 0 || regola.percentuale > CENTO_PERCENTO) {
    throw new RangeError("La percentuale dell'acconto deve essere tra 0% e 100%");
  }
  return percentualeDi(base, regola.percentuale);
}

export interface AccontoRegistrato {
  importo: Cent;
  stato: "richiesto" | "incassato";
}

export interface SituazioneAcconti {
  richiesto: Cent;
  incassato: Cent;
  daIncassare: Cent;
  /** Quanto del totale non è ancora stato chiesto al cliente. Negativo se si è chiesto troppo. */
  ancoraDaRichiedere: Cent;
}

export function situazioneAcconti(acconti: readonly AccontoRegistrato[], totale: Cent): SituazioneAcconti {
  const richiesto = somma(acconti.map((a) => a.importo));
  const incassato = somma(acconti.filter((a) => a.stato === "incassato").map((a) => a.importo));
  return {
    richiesto,
    incassato,
    daIncassare: richiesto - incassato,
    ancoraDaRichiedere: totale - richiesto,
  };
}
