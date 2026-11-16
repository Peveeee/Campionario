/**
 * Azioni che modificano l'archivio. Sono funzioni pure (archivio in, archivio out),
 * così si testano senza interfaccia e, con il backend, diventano funzioni del database.
 */
import { addWeeks, formatISO } from "date-fns";
import { importoAcconto, type RegolaAcconto } from "@/lib/acconti";
import { prezzoDaRicarico, totaleRiga } from "@/lib/prezzi";
import type {
  Archivio,
  Articolo,
  CampiVersionati,
  Id,
  StatoOrdine,
  VersioneArticolo,
} from "@/dominio/tipi";
import { STATI_ORDINE } from "@/dominio/tipi";
import { AccessoNegato, type Sessione } from "./accesso";

/** Campi la cui modifica, su un articolo approvato, richiede una nuova approvazione. */
export const CAMPI_VARIANTE: (keyof CampiVersionati)[] = [
  "nome",
  "fornitoreId",
  "codice",
  "finitura",
  "coloreCampione",
  "quantita",
  "unita",
  "prezzoClienteUnitario",
];

const oggi = () => formatISO(new Date(), { representation: "date" });
const adesso = () => new Date().toISOString();
const nuovoId = (prefisso: string) => `${prefisso}-${Math.random().toString(36).slice(2, 10)}`;

function campiDi(a: Articolo): CampiVersionati {
  const { nome, categoria, fornitoreId, codice, dimensioni, finitura, coloreCampione, fotoUrl, quantita, unita, prezzoClienteUnitario } = a;
  return { nome, categoria, fornitoreId, codice, dimensioni, finitura, coloreCampione, fotoUrl, quantita, unita, prezzoClienteUnitario };
}

function progettoDiArticolo(archivio: Archivio, articolo: Articolo): Id | null {
  return archivio.stanze.find((s) => s.id === articolo.stanzaId)?.progettoId ?? null;
}

export type ModificheArticolo = Partial<
  Pick<Articolo, "nome" | "codice" | "finitura" | "coloreCampione" | "quantita" | "unita" | "prezzoClienteUnitario" | "fornitoreId">
> & { costoNettoUnitario?: number; ricarico?: number };

/**
 * Modifica un articolo. Se era approvato e cambia un campo che il cliente ha visto,
 * torna "da rivedere" e nasce una nuova versione: il cliente dovrà riapprovarlo.
 */
export function modificaArticolo(archivio: Archivio, s: Sessione, id: Id, modifiche: ModificheArticolo): Archivio {
  const prima = archivio.articoli.find((a) => a.id === id && a.studioId === s.studioId);
  if (!prima) throw new AccessoNegato("Articolo non trovato");
  const costiPrima = archivio.costiArticoli.find((c) => c.articoloId === id);
  const { costoNettoUnitario, ricarico, ...pubblici } = modifiche;

  let dopo: Articolo = { ...prima, ...pubblici };
  if (pubblici.prezzoClienteUnitario !== undefined && pubblici.prezzoClienteUnitario !== prima.prezzoClienteUnitario) {
    dopo.prezzoManuale = true;
  }
  const nuoviCosti = costiPrima && {
    ...costiPrima,
    ...(costoNettoUnitario !== undefined ? { costoNettoUnitario } : {}),
    ...(ricarico !== undefined ? { ricarico } : {}),
  };
  if (nuoviCosti && !dopo.prezzoManuale && (costoNettoUnitario !== undefined || ricarico !== undefined)) {
    // Prima dell'approvazione il prezzo segue il ricarico; dopo, un cambio di costo non tocca il prezzo
    // finché il titolare non decide di aggiornarlo (vedi aggiornaPrezzoDalCosto).
    if (prima.stato !== "approvato") {
      dopo.prezzoClienteUnitario = prezzoDaRicarico(nuoviCosti.costoNettoUnitario, nuoviCosti.ricarico);
    }
  }

  const cambiati = CAMPI_VARIANTE.filter((k) => JSON.stringify(prima[k]) !== JSON.stringify(dopo[k]));
  const versioni = [...archivio.versioniArticoli];
  const registro = [...archivio.registro];

  if (cambiati.length > 0) {
    const eraApprovato = prima.stato === "approvato";
    dopo = {
      ...dopo,
      versione: prima.versione + 1,
      stato: eraApprovato ? "da_rivedere" : prima.stato === "rifiutato" ? "proposto" : prima.stato,
    };
    if (!versioni.some((v) => v.articoloId === id && v.versione === prima.versione)) {
      versioni.push(versione(prima, prima.versione, [], s));
    }
    versioni.push(versione(dopo, dopo.versione, cambiati, s));
    if (eraApprovato) {
      registro.unshift({
        id: nuovoId("r"),
        studioId: s.studioId,
        progettoId: progettoDiArticolo(archivio, prima),
        autore: { tipo: "utente", utenteId: s.utenteId },
        azione: "variante",
        dettaglio: `${prima.nome}: variante su un articolo approvato, serve una nuova approvazione`,
        creatoIl: adesso(),
      });
    }
  }

  return {
    ...archivio,
    articoli: archivio.articoli.map((a) => (a.id === id ? dopo : a)),
    costiArticoli: nuoviCosti ? archivio.costiArticoli.map((c) => (c.articoloId === id ? nuoviCosti : c)) : archivio.costiArticoli,
    versioniArticoli: versioni,
    registro,
  };
}

function versione(a: Articolo, n: number, campiCambiati: (keyof CampiVersionati)[], s: Sessione): VersioneArticolo {
  return {
    id: nuovoId("v"),
    studioId: a.studioId,
    articoloId: a.id,
    versione: n,
    campi: campiDi(a),
    campiCambiati,
    autore: { tipo: "utente", utenteId: s.utenteId },
    creatoIl: adesso(),
  };
}

export function duplicaArticolo(archivio: Archivio, s: Sessione, id: Id): Archivio {
  const a = archivio.articoli.find((x) => x.id === id && x.studioId === s.studioId);
  const c = archivio.costiArticoli.find((x) => x.articoloId === id);
  if (!a || !c) throw new AccessoNegato("Articolo non trovato");
  const nuovo: Articolo = {
    ...a,
    id: nuovoId("a"),
    nome: `${a.nome} (copia)`,
    stato: "proposto",
    notaCliente: null,
    versione: 1,
    versioneApprovata: null,
    posizione: a.posizione + 0.5,
  };
  return {
    ...archivio,
    articoli: [...archivio.articoli, nuovo],
    costiArticoli: [...archivio.costiArticoli, { ...c, articoloId: nuovo.id, costoAllApprovazione: null }],
  };
}

/** Solo titolare: riallinea il prezzo cliente al costo attuale. L'articolo torna da riapprovare. */
export function aggiornaPrezzoDalCosto(archivio: Archivio, s: Sessione, id: Id): Archivio {
  if (s.ruolo !== "titolare") throw new AccessoNegato("Solo il titolare può aggiornare i prezzi dai costi");
  const c = archivio.costiArticoli.find((x) => x.articoloId === id);
  if (!c) throw new AccessoNegato("Articolo non trovato");
  const nuovo = prezzoDaRicarico(c.costoNettoUnitario, c.ricarico);
  const conPrezzo = modificaArticolo(archivio, s, id, { prezzoClienteUnitario: nuovo });
  return {
    ...conPrezzo,
    articoli: conPrezzo.articoli.map((a) => (a.id === id ? { ...a, prezzoManuale: false } : a)),
  };
}

/* ——— Cliente ——— */

export type EsitoCliente = "approvato" | "rifiutato" | "modifiche";

export function trovaLinkValido(archivio: Archivio, token: string) {
  const link = archivio.linkClienti.find((l) => l.token === token);
  if (!link) return { link: null, motivo: "Questo link non esiste. Chiedi allo studio di inviartene uno nuovo." } as const;
  if (link.revocatoIl) return { link: null, motivo: "Lo studio ha disattivato questo link. Chiedi di riceverne uno nuovo." } as const;
  if (link.scadeIl < oggi()) return { link: null, motivo: "Questo link è scaduto. Chiedi allo studio di rinnovarlo." } as const;
  return { link, motivo: null } as const;
}

/** Risposta del cliente dal link riservato: non serve alcuna sessione, solo un token valido. */
export function rispostaCliente(
  archivio: Archivio,
  token: string,
  articoloId: Id,
  esito: EsitoCliente,
  commento: string | null,
): Archivio {
  const { link } = trovaLinkValido(archivio, token);
  if (!link) throw new AccessoNegato("Link non valido");
  const articolo = archivio.articoli.find((a) => a.id === articoloId);
  if (!articolo || progettoDiArticolo(archivio, articolo) !== link.progettoId) {
    throw new AccessoNegato("Articolo non trovato");
  }
  const stato = esito === "modifiche" ? "da_rivedere" : esito;
  const costi = archivio.costiArticoli.find((c) => c.articoloId === articoloId);
  return {
    ...archivio,
    articoli: archivio.articoli.map((a) =>
      a.id === articoloId
        ? {
            ...a,
            stato,
            notaCliente: commento?.trim() || (esito === "approvato" ? null : a.notaCliente),
            versioneApprovata: esito === "approvato" ? a.versione : a.versioneApprovata,
          }
        : a,
    ),
    costiArticoli:
      esito === "approvato" && costi
        ? archivio.costiArticoli.map((c) =>
            c.articoloId === articoloId ? { ...c, costoAllApprovazione: c.costoNettoUnitario } : c,
          )
        : archivio.costiArticoli,
    registro: [
      {
        id: nuovoId("r"),
        studioId: link.studioId,
        progettoId: link.progettoId,
        autore: { tipo: "cliente", linkId: link.id },
        azione: esito,
        dettaglio: `${articolo.nome}: ${esito === "approvato" ? "approvato" : esito === "rifiutato" ? "rifiutato" : "richieste modifiche"}${commento ? ` («${commento.trim()}»)` : ""}`,
        creatoIl: adesso(),
      },
      ...archivio.registro,
    ],
  };
}

export function creaLinkCliente(archivio: Archivio, s: Sessione, progettoId: Id, giorni = 30): Archivio {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
  const scade = formatISO(addWeeks(new Date(), Math.ceil(giorni / 7)), { representation: "date" });
  return {
    ...archivio,
    linkClienti: [
      ...archivio.linkClienti.map((l) => (l.progettoId === progettoId && !l.revocatoIl ? { ...l, revocatoIl: adesso() } : l)),
      { id: nuovoId("link"), studioId: s.studioId, progettoId, token, scadeIl: scade, revocatoIl: null, creatoDa: s.utenteId, creatoIl: adesso() },
    ],
  };
}

export function revocaLink(archivio: Archivio, s: Sessione, linkId: Id): Archivio {
  return {
    ...archivio,
    linkClienti: archivio.linkClienti.map((l) => (l.id === linkId && l.studioId === s.studioId ? { ...l, revocatoIl: adesso() } : l)),
  };
}

/* ——— Ordini ——— */

/** Raggruppa per fornitore gli articoli approvati non ancora in un ordine, creando ordini in bozza. */
export function creaOrdiniDaApprovati(archivio: Archivio, s: Sessione, progettoId: Id): Archivio {
  const idStanze = new Set(archivio.stanze.filter((st) => st.progettoId === progettoId).map((st) => st.id));
  const giaOrdinati = new Set(archivio.righeOrdine.map((r) => r.articoloId));
  const daOrdinare = archivio.articoli.filter(
    (a) => idStanze.has(a.stanzaId) && a.stato === "approvato" && !giaOrdinati.has(a.id),
  );
  const perFornitore = new Map<Id, Articolo[]>();
  for (const a of daOrdinare) perFornitore.set(a.fornitoreId, [...(perFornitore.get(a.fornitoreId) ?? []), a]);

  let progressivo = archivio.ordini.length;
  const ordini = [...archivio.ordini];
  const righe = [...archivio.righeOrdine];
  for (const [fornitoreId, articoli] of perFornitore) {
    // Se esiste già una bozza per questo fornitore, aggiungiamo lì.
    let ordine = ordini.find((o) => o.progettoId === progettoId && o.fornitoreId === fornitoreId && o.stato === "bozza");
    if (!ordine) {
      progressivo += 1;
      ordine = {
        id: nuovoId("o"),
        studioId: s.studioId,
        progettoId,
        fornitoreId,
        numero: `${new Date().getFullYear()}-${String(progressivo).padStart(3, "0")}`,
        stato: "bozza",
        dataInvio: null,
        consegnaPrevista: null,
        accontoFornitore: 0,
      };
      ordini.push(ordine);
    }
    for (const a of articoli) {
      const c = archivio.costiArticoli.find((x) => x.articoloId === a.id);
      righe.push({ id: nuovoId("ro"), studioId: s.studioId, ordineId: ordine.id, articoloId: a.id, quantita: a.quantita, costoUnitario: c?.costoNettoUnitario ?? 0 });
    }
  }
  return { ...archivio, ordini, righeOrdine: righe };
}

export function avanzaOrdine(archivio: Archivio, s: Sessione, ordineId: Id): Archivio {
  const ordine = archivio.ordini.find((o) => o.id === ordineId && o.studioId === s.studioId);
  if (!ordine) throw new AccessoNegato("Ordine non trovato");
  const i = STATI_ORDINE.indexOf(ordine.stato);
  const prossimo: StatoOrdine | undefined = STATI_ORDINE[i + 1];
  if (!prossimo) return archivio;
  const fornitore = archivio.fornitori.find((f) => f.id === ordine.fornitoreId);
  const aggiornato = {
    ...ordine,
    stato: prossimo,
    ...(prossimo === "inviato"
      ? {
          dataInvio: oggi(),
          consegnaPrevista: formatISO(addWeeks(new Date(), fornitore?.settimaneConsegna ?? 6), { representation: "date" }),
        }
      : {}),
  };
  return { ...archivio, ordini: archivio.ordini.map((o) => (o.id === ordineId ? aggiornato : o)) };
}

export function registraAccontoFornitore(archivio: Archivio, s: Sessione, ordineId: Id, importo: number): Archivio {
  return {
    ...archivio,
    ordini: archivio.ordini.map((o) => (o.id === ordineId && o.studioId === s.studioId ? { ...o, accontoFornitore: importo } : o)),
  };
}

/** Prezzo cliente totale (IVA esclusa) delle righe di un ordine. */
export function totaleClienteOrdine(archivio: Archivio, ordineId: Id): number {
  return archivio.righeOrdine
    .filter((r) => r.ordineId === ordineId)
    .reduce((t, r) => {
      const a = archivio.articoli.find((x) => x.id === r.articoloId);
      return t + (a ? totaleRiga(a.prezzoClienteUnitario, r.quantita) : 0);
    }, 0);
}

export function richiediAccontoCliente(
  archivio: Archivio,
  s: Sessione,
  progettoId: Id,
  ordineId: Id | null,
  regola: RegolaAcconto,
): Archivio {
  const base = ordineId ? totaleClienteOrdine(archivio, ordineId) : 0;
  const importo = importoAcconto(regola, base);
  return {
    ...archivio,
    accontiClienti: [
      ...archivio.accontiClienti,
      { id: nuovoId("ac"), studioId: s.studioId, progettoId, ordineId, regola, importo, stato: "richiesto", dataRichiesta: oggi(), dataIncasso: null },
    ],
  };
}

export function segnaAccontoIncassato(archivio: Archivio, s: Sessione, accontoId: Id): Archivio {
  return {
    ...archivio,
    accontiClienti: archivio.accontiClienti.map((a) =>
      a.id === accontoId && a.studioId === s.studioId ? { ...a, stato: "incassato", dataIncasso: oggi() } : a,
    ),
  };
}

/** Un articolo è "ordinato" quando la sua riga sta in un ordine già inviato al fornitore. */
export function articoliOrdinati(archivio: Archivio): Set<Id> {
  const inviati = new Set(archivio.ordini.filter((o) => o.stato !== "bozza").map((o) => o.id));
  return new Set(archivio.righeOrdine.filter((r) => inviati.has(r.ordineId)).map((r) => r.articoloId));
}

/** Aggiunge alla stanza un prodotto della libreria, con il suo costo e il ricarico predefinito. */
export function aggiungiDaLibreria(archivio: Archivio, s: Sessione, stanzaId: Id, prodottoId: Id): Archivio {
  const p = archivio.prodotti.find((x) => x.id === prodottoId && x.studioId === s.studioId);
  const c = archivio.costiProdotti.find((x) => x.prodottoId === prodottoId);
  if (!p || !c) throw new AccessoNegato("Prodotto non trovato");
  const posizione = Math.max(0, ...archivio.articoli.filter((a) => a.stanzaId === stanzaId).map((a) => a.posizione)) + 1;
  const id = nuovoId("a");
  const { id: _id, studioId: _s, ...scheda } = p;
  return {
    ...archivio,
    articoli: [
      ...archivio.articoli,
      {
        ...scheda,
        id,
        studioId: s.studioId,
        stanzaId,
        prodottoId,
        quantita: 100,
        prezzoClienteUnitario: prezzoDaRicarico(c.costoNetto, c.ricaricoPredefinito),
        prezzoManuale: false,
        stato: "proposto",
        notaCliente: null,
        versione: 1,
        versioneApprovata: null,
        posizione,
      },
    ],
    costiArticoli: [
      ...archivio.costiArticoli,
      { articoloId: id, studioId: s.studioId, costoNettoUnitario: c.costoNetto, ricarico: c.ricaricoPredefinito, costoAllApprovazione: null },
    ],
  };
}

/** Solo titolare: accetta il nuovo costo e mantiene il prezzo già approvato dal cliente. */
export function mantieniPrezzoApprovato(archivio: Archivio, s: Sessione, id: Id): Archivio {
  if (s.ruolo !== "titolare") throw new AccessoNegato("Solo il titolare può decidere sui margini");
  return {
    ...archivio,
    costiArticoli: archivio.costiArticoli.map((c) =>
      c.articoloId === id ? { ...c, costoAllApprovazione: c.costoNettoUnitario } : c,
    ),
  };
}
