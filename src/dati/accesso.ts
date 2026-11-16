/**
 * Livello di accesso ai dati, diviso per ruolo.
 *
 * Nel prototipo l'archivio vive nel browser, ma ogni lettura passa da qui e riceve la sessione:
 * è lo stesso contratto che avranno le policy RLS di Supabase.
 * - Ogni lettura è filtrata per `studioId` della sessione.
 * - Il titolare vede costi, ricarichi e margini.
 * - Il designer può scrivere costo e ricarico, ma non li rilegge: riceve solo il prezzo cliente.
 * - Il cliente (fase 3) non leggerà mai l'archivio: riceverà una vista dedicata dal link.
 */
import { totaleAPreventivo, statoBudget, type StatoBudget } from "@/lib/budget";
import type { Cent, PuntiBase } from "@/lib/denaro";
import { ricavoProgetto, type RicavoProgetto, type RigaEconomica } from "@/lib/margini";
import { prezzoDaRicarico, totaleRiga } from "@/lib/prezzi";
import { somma } from "@/lib/denaro";
import type {
  Archivio,
  Articolo,
  Cliente,
  CostiArticolo,
  Fase,
  Id,
  Progetto,
  Ruolo,
  Stanza,
} from "@/dominio/tipi";

export interface Sessione {
  utenteId: Id;
  studioId: Id;
  ruolo: Ruolo;
}

export class AccessoNegato extends Error {
  constructor(messaggio: string) {
    super(messaggio);
    this.name = "AccessoNegato";
  }
}

function delloStudio<T extends { studioId: Id }>(righe: readonly T[], s: Sessione): T[] {
  return righe.filter((r) => r.studioId === s.studioId);
}

/* ——— Articoli ——— */

export type ArticoloConCosti = Articolo & {
  costi: Pick<CostiArticolo, "costoNettoUnitario" | "ricarico" | "costoAllApprovazione">;
};

export function leggiArticoli(archivio: Archivio, s: Sessione, stanzaId?: Id): Articolo[] {
  return delloStudio(archivio.articoli, s)
    .filter((a) => stanzaId === undefined || a.stanzaId === stanzaId)
    .sort((a, b) => a.posizione - b.posizione)
    .map((a) => ({ ...a }));
}

/** Solo titolare: articoli con i rispettivi costi. */
export function leggiArticoliConCosti(archivio: Archivio, s: Sessione, stanzaId?: Id): ArticoloConCosti[] {
  if (s.ruolo !== "titolare") throw new AccessoNegato("Costi e ricarichi sono visibili solo al titolare");
  const costi = new Map(delloStudio(archivio.costiArticoli, s).map((c) => [c.articoloId, c]));
  return leggiArticoli(archivio, s, stanzaId).map((a) => {
    const c = costi.get(a.id);
    if (!c) throw new Error(`Costi mancanti per l'articolo ${a.id}`);
    return {
      ...a,
      costi: {
        costoNettoUnitario: c.costoNettoUnitario,
        ricarico: c.ricarico,
        costoAllApprovazione: c.costoAllApprovazione,
      },
    };
  });
}

/**
 * Titolare e designer possono impostare costo e ricarico. L'esito restituisce solo il prezzo
 * cliente risultante: il designer non rilegge mai il costo che ha scritto.
 */
export function impostaCosti(
  archivio: Archivio,
  s: Sessione,
  articoloId: Id,
  valori: { costoNettoUnitario: Cent; ricarico: PuntiBase },
): { archivio: Archivio; prezzoClienteUnitario: Cent } {
  const articolo = archivio.articoli.find((a) => a.id === articoloId && a.studioId === s.studioId);
  if (!articolo) throw new AccessoNegato("Articolo non trovato");
  const prezzo = articolo.prezzoManuale
    ? articolo.prezzoClienteUnitario
    : prezzoDaRicarico(valori.costoNettoUnitario, valori.ricarico);
  return {
    prezzoClienteUnitario: prezzo,
    archivio: {
      ...archivio,
      costiArticoli: archivio.costiArticoli.map((c) =>
        c.articoloId === articoloId ? { ...c, ...valori } : c,
      ),
      articoli: archivio.articoli.map((a) => (a.id === articoloId ? { ...a, prezzoClienteUnitario: prezzo } : a)),
    },
  };
}

/* ——— Progetti ——— */

export interface StanzaInElenco {
  stanza: Stanza;
  totale: Cent;
  budget: StatoBudget;
}

export interface ProgettoInElenco {
  progetto: Progetto;
  cliente: Cliente | null;
  articoli: number;
  approvati: number;
  inAttesa: number;
  rifiutati: number;
  /** Prezzo cliente degli articoli approvati, IVA esclusa. */
  valoreApprovato: Cent;
  stanze: StanzaInElenco[];
  stanzeFuoriBudget: number;
  budgetProgetto: StatoBudget;
  /** Presente solo per il titolare. */
  economia?: RicavoProgetto;
}

export function leggiProgetti(archivio: Archivio, s: Sessione, filtro?: { fase?: Fase }): ProgettoInElenco[] {
  const clienti = new Map(delloStudio(archivio.clienti, s).map((c) => [c.id, c]));
  const costi = new Map(delloStudio(archivio.costiArticoli, s).map((c) => [c.articoloId, c]));

  return delloStudio(archivio.progetti, s)
    .filter((p) => !filtro?.fase || p.fase === filtro.fase)
    .map((progetto) => {
      const stanze = delloStudio(archivio.stanze, s)
        .filter((st) => st.progettoId === progetto.id)
        .sort((a, b) => a.posizione - b.posizione);
      const idStanze = new Set(stanze.map((st) => st.id));
      const articoli = leggiArticoli(archivio, s).filter((a) => idStanze.has(a.stanzaId));
      const approvati = articoli.filter((a) => a.stato === "approvato");

      const stanzeInElenco = stanze.map((stanza) => {
        const totale = totaleAPreventivo(
          articoli
            .filter((a) => a.stanzaId === stanza.id)
            .map((a) => ({ stato: a.stato, prezzoClienteUnitario: a.prezzoClienteUnitario, quantita: a.quantita })),
        );
        return { stanza, totale, budget: statoBudget(totale, stanza.budget) };
      });

      const voce: ProgettoInElenco = {
        progetto,
        cliente: clienti.get(progetto.clienteId) ?? null,
        articoli: articoli.length,
        approvati: approvati.length,
        inAttesa: articoli.filter((a) => a.stato === "proposto" || a.stato === "da_rivedere").length,
        rifiutati: articoli.filter((a) => a.stato === "rifiutato").length,
        valoreApprovato: somma(approvati.map((a) => totaleRiga(a.prezzoClienteUnitario, a.quantita))),
        stanze: stanzeInElenco,
        stanzeFuoriBudget: stanzeInElenco.filter((st) => st.budget.tipo === "superato").length,
        budgetProgetto: statoBudget(somma(stanzeInElenco.map((st) => st.totale)), progetto.budget),
      };

      if (s.ruolo === "titolare") {
        const righe: RigaEconomica[] = approvati.map((a) => ({
          chiave: a.stanzaId,
          costoUnitario: costi.get(a.id)?.costoNettoUnitario ?? 0,
          prezzoUnitario: a.prezzoClienteUnitario,
          quantita: a.quantita,
        }));
        voce.economia = ricavoProgetto(progetto.parcella, righe);
      }
      return voce;
    });
}
