/**
 * Vista del cliente, raggiunta solo con il token del link riservato.
 * Restituisce esclusivamente campi pubblici: niente costi, ricarichi, margini, né id interni
 * oltre a quelli degli articoli. Con il backend diventa una funzione del database
 * (security definer) e il cliente non tocca mai le tabelle.
 */
import { totaleAPreventivo } from "@/lib/budget";
import { somma, type Cent } from "@/lib/denaro";
import type { Dimensioni, Unita } from "@/lib/formato";
import { totaleRiga, totaliCliente, type TotaliCliente } from "@/lib/prezzi";
import type { Archivio, Categoria, Id, StatoApprovazione } from "@/dominio/tipi";
import { articoliOrdinati, trovaLinkValido } from "./azioni";

export interface Differenza {
  campo: "nome" | "finitura" | "quantita" | "prezzo" | "fornitore";
  prima: string | number;
  dopo: string | number;
  /** Per finitura: i colori dei due campioni. */
  colori?: { prima: string; dopo: string };
  unita?: Unita;
}

export interface ArticoloCliente {
  id: Id;
  nome: string;
  categoria: Categoria;
  dimensioni: Dimensioni;
  finitura: string;
  coloreCampione: string;
  fotoUrl: string | null;
  quantita: number;
  unita: Unita;
  prezzoUnitario: Cent;
  totale: Cent;
  stato: StatoApprovazione;
  notaCliente: string | null;
  /** Nascosti finché l'articolo non è ordinato, se lo studio ha scelto così. */
  fornitore: string | null;
  codice: string | null;
  /** Cosa è cambiato rispetto alla versione approvata, se l'articolo è una variante. */
  differenze: Differenza[] | null;
}

export type VistaCliente =
  | { ok: false; motivo: string }
  | {
      ok: true;
      studio: { nome: string; citta: string };
      progetto: { nome: string; indirizzo: string };
      cliente: string;
      scadeIl: string;
      stanze: { nome: string; codice: string; articoli: ArticoloCliente[]; totale: Cent }[];
      totali: TotaliCliente;
      daDecidere: number;
    };

export function vistaCliente(archivio: Archivio, token: string): VistaCliente {
  const { link, motivo } = trovaLinkValido(archivio, token);
  if (!link) return { ok: false, motivo };

  const progetto = archivio.progetti.find((p) => p.id === link.progettoId);
  const studio = archivio.studi.find((s) => s.id === link.studioId);
  if (!progetto || !studio) return { ok: false, motivo: "Progetto non disponibile." };
  const cliente = archivio.clienti.find((c) => c.id === progetto.clienteId);
  const fornitori = new Map(archivio.fornitori.map((f) => [f.id, f.ragioneSociale]));
  const ordinati = articoliOrdinati(archivio);

  const stanze = archivio.stanze
    .filter((s) => s.progettoId === progetto.id)
    .sort((a, b) => a.posizione - b.posizione)
    .map((stanza) => {
      const articoli = archivio.articoli
        .filter((a) => a.stanzaId === stanza.id)
        .sort((a, b) => a.posizione - b.posizione)
        .map((a): ArticoloCliente => {
          const visibile = !progetto.nascondiFornitori || ordinati.has(a.id);
          let differenze: Differenza[] | null = null;
          if (a.versioneApprovata !== null && a.versioneApprovata !== a.versione) {
            const approvata = archivio.versioniArticoli.find(
              (v) => v.articoloId === a.id && v.versione === a.versioneApprovata,
            )?.campi;
            if (approvata) {
              differenze = [];
              if (approvata.nome !== a.nome) differenze.push({ campo: "nome", prima: approvata.nome, dopo: a.nome });
              if (approvata.finitura !== a.finitura || approvata.coloreCampione !== a.coloreCampione) {
                differenze.push({
                  campo: "finitura",
                  prima: approvata.finitura,
                  dopo: a.finitura,
                  colori: { prima: approvata.coloreCampione, dopo: a.coloreCampione },
                });
              }
              if (approvata.quantita !== a.quantita) {
                differenze.push({ campo: "quantita", prima: approvata.quantita, dopo: a.quantita, unita: a.unita });
              }
              if (approvata.prezzoClienteUnitario !== a.prezzoClienteUnitario) {
                differenze.push({ campo: "prezzo", prima: approvata.prezzoClienteUnitario, dopo: a.prezzoClienteUnitario });
              }
              if (visibile && approvata.fornitoreId !== a.fornitoreId) {
                differenze.push({
                  campo: "fornitore",
                  prima: fornitori.get(approvata.fornitoreId) ?? "",
                  dopo: fornitori.get(a.fornitoreId) ?? "",
                });
              }
            }
          }
          return {
            id: a.id,
            nome: a.nome,
            categoria: a.categoria,
            dimensioni: a.dimensioni,
            finitura: a.finitura,
            coloreCampione: a.coloreCampione,
            fotoUrl: a.fotoUrl,
            quantita: a.quantita,
            unita: a.unita,
            prezzoUnitario: a.prezzoClienteUnitario,
            totale: totaleRiga(a.prezzoClienteUnitario, a.quantita),
            stato: a.stato,
            notaCliente: a.notaCliente,
            fornitore: visibile ? (fornitori.get(a.fornitoreId) ?? null) : null,
            codice: visibile ? a.codice : null,
            differenze,
          };
        });
      return {
        nome: stanza.nome,
        codice: stanza.codice,
        articoli,
        totale: totaleAPreventivo(
          articoli.map((a) => ({ stato: a.stato, prezzoClienteUnitario: a.prezzoUnitario, quantita: a.quantita })),
        ),
      };
    });

  const approvato = somma(stanze.flatMap((s) => s.articoli.filter((a) => a.stato === "approvato").map((a) => a.totale)));
  return {
    ok: true,
    studio: { nome: studio.nome, citta: studio.citta },
    progetto: { nome: progetto.nome, indirizzo: progetto.indirizzoCantiere },
    cliente: cliente?.nome ?? "",
    scadeIl: link.scadeIl,
    stanze,
    totali: totaliCliente(approvato),
    daDecidere: stanze.flatMap((s) => s.articoli).filter((a) => a.stato === "proposto" || (a.stato === "da_rivedere" && a.differenze)).length,
  };
}
