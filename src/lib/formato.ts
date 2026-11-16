import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Cent, Centesimi, PuntiBase } from "./denaro";

/** Spazio unificatore: tiene "1.234,56" e "€" sulla stessa riga. */
const NBSP = " ";

function raggruppaMigliaia(intero: number): string {
  return String(intero).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Numero intero scalato (es. centesimi) in testo italiano: 123456, 2 → "1.234,56". */
export function formatScalato(valore: number, decimali: number, opzioni?: { taglia_zeri?: boolean }): string {
  const segno = valore < 0 ? "−" : "";
  const assoluto = Math.abs(valore);
  const scala = 10 ** decimali;
  const intero = Math.floor(assoluto / scala);
  let parteDecimale = decimali > 0 ? String(assoluto % scala).padStart(decimali, "0") : "";
  if (opzioni?.taglia_zeri) parteDecimale = parteDecimale.replace(/0+$/, "");
  return `${segno}${raggruppaMigliaia(intero)}${parteDecimale ? `,${parteDecimale}` : ""}`;
}

/** 123456 → "1.234,56 €" */
export function formatEuro(cent: Cent): string {
  return `${formatScalato(cent, 2)}${NBSP}€`;
}

/** Importi grandi senza decimali, per cruscotti e intestazioni: 3200000 → "32.000 €". */
export function formatEuroArrotondato(cent: Cent): string {
  const euro = Math.round(cent / 100);
  return `${formatScalato(euro, 0)}${NBSP}€`;
}

/** 3500 → "35%", 3550 → "35,5%" */
export function formatPercentuale(pb: PuntiBase): string {
  return `${formatScalato(pb, 2, { taglia_zeri: true })}%`;
}

export type Unita = "pz" | "mq" | "ml";

/** 1450, "mq" → "14,5 mq"; 200, "pz" → "2 pz" */
export function formatQuantita(quantita: Centesimi, unita: Unita): string {
  return `${formatScalato(quantita, 2, { taglia_zeri: true })}${NBSP}${unita}`;
}

/** Data ISO (aaaa-mm-gg) in gg/mm/aaaa. */
export function formatData(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy", { locale: it });
}

/** Data ISO in forma estesa, per le intestazioni: "13 novembre 2026". */
export function formatDataEstesa(iso: string): string {
  return format(parseISO(iso), "d MMMM yyyy", { locale: it });
}

export interface Dimensioni {
  /** Tutte in millimetri, così i mezzi centimetri restano interi. */
  larghezza: number | null;
  profondita: number | null;
  altezza: number | null;
}

/** { 2600, 1000, 780 } → "L 260 × P 100 × H 78 cm" */
export function formatDimensioni(d: Dimensioni): string | null {
  const parti: string[] = [];
  if (d.larghezza !== null) parti.push(`L${NBSP}${formatScalato(d.larghezza, 1, { taglia_zeri: true })}`);
  if (d.profondita !== null) parti.push(`P${NBSP}${formatScalato(d.profondita, 1, { taglia_zeri: true })}`);
  if (d.altezza !== null) parti.push(`H${NBSP}${formatScalato(d.altezza, 1, { taglia_zeri: true })}`);
  if (parti.length === 0) return null;
  return `${parti.join(" × ")}${NBSP}cm`;
}

/**
 * Legge un numero scritto all'italiana e lo restituisce come intero scalato.
 * Accetta "1.234,56", "1234,5", "1234", "€ 1.234,56", "12,5%". Restituisce `null` se non è un numero
 * o se ha più decimali di quelli ammessi.
 */
export function leggiNumero(testo: string, decimali: number): number | null {
  const pulito = testo.replace(/[€%\s ]/g, "").replace(/^−/, "-");
  if (pulito === "" || pulito === "-") return null;
  const corrisponde = /^(-?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?$/.exec(pulito);
  if (!corrisponde) return null;
  const [, segno, interi = "", dec = ""] = corrisponde;
  if (dec.length > decimali) return null;
  const valore = Number(interi.replace(/\./g, "")) * 10 ** decimali + Number(dec.padEnd(decimali, "0") || "0");
  if (!Number.isSafeInteger(valore)) return null;
  return segno === "-" ? -valore : valore;
}

/** "1.234,56" → 123456 */
export function leggiImporto(testo: string): Cent | null {
  return leggiNumero(testo, 2);
}

/** "35" → 3500, "12,5" → 1250 */
export function leggiPercentuale(testo: string): PuntiBase | null {
  return leggiNumero(testo, 2);
}
