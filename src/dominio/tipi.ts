/**
 * Modello di dominio. Rispecchia lo schema Postgres previsto per la fase con il backend:
 * ogni entità ha `studioId`, e i costi stanno in strutture separate (`CostiArticolo`,
 * `CostiProdotto`) così che, con Supabase, le policy RLS li possano negare per riga.
 *
 * Unità: importi in centesimi, percentuali in punti base, quantità in centesimi di unità,
 * dimensioni in millimetri, date come stringhe ISO (aaaa-mm-gg o timestamp completo).
 */
import type { Cent, Centesimi, PuntiBase } from "@/lib/denaro";
import type { Dimensioni, Unita } from "@/lib/formato";

export type Id = string;

export type Ruolo = "titolare" | "designer";

export const FASI = ["concept", "progetto", "forniture", "cantiere", "chiuso"] as const;
export type Fase = (typeof FASI)[number];

export const CATEGORIE = ["arredo", "illuminazione", "rivestimenti", "tessili", "sanitari", "complementi"] as const;
export type Categoria = (typeof CATEGORIE)[number];

export const STATI_APPROVAZIONE = ["proposto", "approvato", "rifiutato", "da_rivedere"] as const;
export type StatoApprovazione = (typeof STATI_APPROVAZIONE)[number];

export const STATI_ORDINE = ["bozza", "inviato", "confermato", "in_produzione", "spedito", "consegnato"] as const;
export type StatoOrdine = (typeof STATI_ORDINE)[number];

export interface Studio {
  id: Id;
  nome: string;
  citta: string;
  partitaIva: string;
}

export interface Utente {
  id: Id;
  studioId: Id;
  nome: string;
  email: string;
  ruolo: Ruolo;
}

export interface Cliente {
  id: Id;
  studioId: Id;
  nome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  codiceFiscaleOPartitaIva: string;
}

export interface Fornitore {
  id: Id;
  studioId: Id;
  ragioneSociale: string;
  referente: string;
  email: string;
  telefono: string;
  settimaneConsegna: number;
  condizioniPagamento: string;
}

export interface Progetto {
  id: Id;
  studioId: Id;
  clienteId: Id;
  nome: string;
  indirizzoCantiere: string;
  fase: Fase;
  parcella: Cent;
  budget: Cent | null;
  nascondiFornitori: boolean;
  dataInizio: string;
  dataFinePrevista: string | null;
}

export interface Stanza {
  id: Id;
  studioId: Id;
  progettoId: Id;
  nome: string;
  codice: string;
  budget: Cent | null;
  posizione: number;
}

/** Campi descrittivi comuni a prodotto di libreria e articolo. */
export interface SchedaProdotto {
  nome: string;
  categoria: Categoria;
  fornitoreId: Id;
  codice: string;
  dimensioni: Dimensioni;
  finitura: string;
  /** Colore rappresentativo della finitura, per il campione nella scheda. */
  coloreCampione: string;
  fotoUrl: string | null;
  link: string | null;
  unita: Unita;
}

export interface Prodotto extends SchedaProdotto {
  id: Id;
  studioId: Id;
}

export interface CostiProdotto {
  prodottoId: Id;
  studioId: Id;
  costoNetto: Cent;
  ricaricoPredefinito: PuntiBase;
}

export interface Articolo extends SchedaProdotto {
  id: Id;
  studioId: Id;
  stanzaId: Id;
  prodottoId: Id | null;
  quantita: Centesimi;
  /** Prezzo al cliente per unità, IVA esclusa. Visibile a designer e cliente. */
  prezzoClienteUnitario: Cent;
  /** Vero se il prezzo è stato scritto a mano e non segue più il ricarico. */
  prezzoManuale: boolean;
  stato: StatoApprovazione;
  notaCliente: string | null;
  versione: number;
  versioneApprovata: number | null;
  posizione: number;
}

/** Solo titolare. Il designer può scriverli ma non rileggerli. */
export interface CostiArticolo {
  articoloId: Id;
  studioId: Id;
  costoNettoUnitario: Cent;
  ricarico: PuntiBase;
  /** Costo unitario fotografato al momento dell'ultima approvazione del cliente. */
  costoAllApprovazione: Cent | null;
}

/** Fotografia dei campi pubblici di un articolo a una certa versione. */
export type CampiVersionati = Pick<
  Articolo,
  | "nome"
  | "categoria"
  | "fornitoreId"
  | "codice"
  | "dimensioni"
  | "finitura"
  | "coloreCampione"
  | "fotoUrl"
  | "quantita"
  | "unita"
  | "prezzoClienteUnitario"
>;

export interface VersioneArticolo {
  id: Id;
  studioId: Id;
  articoloId: Id;
  versione: number;
  campi: CampiVersionati;
  campiCambiati: (keyof CampiVersionati)[];
  autore: { tipo: "utente"; utenteId: Id } | { tipo: "cliente"; linkId: Id };
  creatoIl: string;
}

export interface Ordine {
  id: Id;
  studioId: Id;
  progettoId: Id;
  fornitoreId: Id;
  numero: string;
  stato: StatoOrdine;
  dataInvio: string | null;
  consegnaPrevista: string | null;
  accontoFornitore: Cent;
}

export interface RigaOrdine {
  id: Id;
  studioId: Id;
  ordineId: Id;
  articoloId: Id;
  quantita: Centesimi;
  costoUnitario: Cent;
}

export interface AccontoCliente {
  id: Id;
  studioId: Id;
  progettoId: Id;
  ordineId: Id | null;
  regola: { tipo: "importo"; importo: Cent } | { tipo: "percentuale"; percentuale: PuntiBase };
  importo: Cent;
  stato: "richiesto" | "incassato";
  dataRichiesta: string;
  dataIncasso: string | null;
}

export interface LinkCliente {
  id: Id;
  studioId: Id;
  progettoId: Id;
  token: string;
  scadeIl: string;
  revocatoIl: string | null;
  creatoDa: Id;
  creatoIl: string;
}

export interface VoceRegistro {
  id: Id;
  studioId: Id;
  progettoId: Id | null;
  autore: { tipo: "utente"; utenteId: Id } | { tipo: "cliente"; linkId: Id };
  azione: string;
  dettaglio: string;
  creatoIl: string;
}

/** L'intero archivio dello studio, come lo terrebbe il database. */
export interface Archivio {
  studi: Studio[];
  utenti: Utente[];
  clienti: Cliente[];
  fornitori: Fornitore[];
  progetti: Progetto[];
  stanze: Stanza[];
  prodotti: Prodotto[];
  costiProdotti: CostiProdotto[];
  articoli: Articolo[];
  costiArticoli: CostiArticolo[];
  versioniArticoli: VersioneArticolo[];
  ordini: Ordine[];
  righeOrdine: RigaOrdine[];
  accontiClienti: AccontoCliente[];
  linkClienti: LinkCliente[];
  registro: VoceRegistro[];
}
