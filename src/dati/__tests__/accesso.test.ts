import { describe, expect, it } from "vitest";
import { creaArchivioDiEsempio } from "../seed";
import {
  AccessoNegato,
  impostaCosti,
  leggiArticoli,
  leggiArticoliConCosti,
  leggiProgetti,
  type Sessione,
} from "../accesso";

const titolare: Sessione = { utenteId: "u-giulia", studioId: "studio-varesi", ruolo: "titolare" };
const designer: Sessione = { utenteId: "u-tommaso", studioId: "studio-varesi", ruolo: "designer" };
const altroStudio: Sessione = { utenteId: "u-x", studioId: "studio-altro", ruolo: "titolare" };

/** Chiavi che non devono mai comparire in ciò che riceve un designer. */
const CHIAVI_RISERVATE = /costo|ricarico|margine|economia|ricavo/i;

function chiaviRiservate(valore: unknown, percorso = ""): string[] {
  if (Array.isArray(valore)) return valore.flatMap((v, i) => chiaviRiservate(v, `${percorso}[${i}]`));
  if (valore && typeof valore === "object") {
    return Object.entries(valore).flatMap(([k, v]) => [
      ...(CHIAVI_RISERVATE.test(k) ? [`${percorso}.${k}`] : []),
      ...chiaviRiservate(v, `${percorso}.${k}`),
    ]);
  }
  return [];
}

describe("dati di esempio", () => {
  const a = creaArchivioDiEsempio();
  it("contengono le quantità richieste", () => {
    expect(a.progetti).toHaveLength(2);
    expect(a.stanze).toHaveLength(4);
    expect(a.articoli).toHaveLength(20);
    expect(a.fornitori).toHaveLength(5);
    expect(a.prodotti).toHaveLength(10);
    expect(a.costiArticoli).toHaveLength(20);
  });

  it("hanno solo importi interi", () => {
    for (const art of a.articoli) expect(Number.isSafeInteger(art.prezzoClienteUnitario)).toBe(true);
    for (const c of a.costiArticoli) expect(Number.isSafeInteger(c.costoNettoUnitario)).toBe(true);
  });
});

describe("accesso per ruolo", () => {
  const archivio = creaArchivioDiEsempio();

  it("il designer non riceve costi, ricarichi né margini", () => {
    expect(chiaviRiservate(leggiArticoli(archivio, designer))).toEqual([]);
    expect(chiaviRiservate(leggiProgetti(archivio, designer))).toEqual([]);
  });

  it("il designer non può leggere i costi neppure chiedendoli", () => {
    expect(() => leggiArticoliConCosti(archivio, designer)).toThrow(AccessoNegato);
  });

  it("il titolare vede costi e margini", () => {
    const articoli = leggiArticoliConCosti(archivio, titolare);
    expect(articoli[0]?.costi.costoNettoUnitario).toBe(385_000);
    const [ferraris] = leggiProgetti(archivio, titolare);
    expect(ferraris?.economia?.ricavoTotale).toBeGreaterThan(ferraris!.progetto.parcella);
  });

  it("il designer può impostare i costi ma riceve solo il prezzo cliente", () => {
    const esito = impostaCosti(archivio, designer, "a03", { costoNettoUnitario: 100_000, ricarico: 4000 });
    expect(esito.prezzoClienteUnitario).toBe(140_000);
    expect(chiaviRiservate({ prezzoClienteUnitario: esito.prezzoClienteUnitario })).toEqual([]);
    expect(esito.archivio.costiArticoli.find((c) => c.articoloId === "a03")?.costoNettoUnitario).toBe(100_000);
  });

  it("uno studio non vede i dati di un altro", () => {
    expect(leggiArticoli(archivio, altroStudio)).toEqual([]);
    expect(leggiProgetti(archivio, altroStudio)).toEqual([]);
    expect(() => impostaCosti(archivio, altroStudio, "a01", { costoNettoUnitario: 1, ricarico: 0 })).toThrow(
      AccessoNegato,
    );
  });

  it("segnala le stanze fuori budget", () => {
    const [ferraris] = leggiProgetti(archivio, designer);
    const bagno = ferraris?.stanze.find((s) => s.stanza.codice === "BAG1");
    expect(bagno?.budget.tipo).toBe("superato");
    expect(ferraris?.stanzeFuoriBudget).toBe(1);
  });
});
