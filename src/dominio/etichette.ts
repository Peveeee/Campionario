import type { Categoria, Fase, Ruolo, StatoApprovazione, StatoOrdine } from "./tipi";

export const ETICHETTA_STATO: Record<StatoApprovazione, string> = {
  proposto: "Proposto",
  approvato: "Approvato",
  rifiutato: "Rifiutato",
  da_rivedere: "Da rivedere",
};

export const ETICHETTA_FASE: Record<Fase, string> = {
  concept: "Concept",
  progetto: "Progetto",
  forniture: "Forniture",
  cantiere: "Cantiere",
  chiuso: "Chiuso",
};

export const ETICHETTA_CATEGORIA: Record<Categoria, string> = {
  arredo: "Arredo",
  illuminazione: "Illuminazione",
  rivestimenti: "Rivestimenti",
  tessili: "Tessili",
  sanitari: "Sanitari",
  complementi: "Complementi",
};

export const ETICHETTA_ORDINE: Record<StatoOrdine, string> = {
  bozza: "Bozza",
  inviato: "Inviato",
  confermato: "Confermato",
  in_produzione: "In produzione",
  spedito: "Spedito",
  consegnato: "Consegnato",
};

export const ETICHETTA_RUOLO: Record<Ruolo, string> = {
  titolare: "Titolare",
  designer: "Designer",
};
