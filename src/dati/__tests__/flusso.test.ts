import { describe, expect, it } from "vitest";
import { creaArchivioDiEsempio } from "../seed";
import type { Sessione } from "../accesso";
import {
  aggiornaPrezzoDalCosto,
  avanzaOrdine,
  creaOrdiniDaApprovati,
  modificaArticolo,
  rispostaCliente,
} from "../azioni";
import { vistaCliente } from "../cliente";

const designer: Sessione = { utenteId: "u-tommaso", studioId: "studio-varesi", ruolo: "designer" };
const titolare: Sessione = { utenteId: "u-giulia", studioId: "studio-varesi", ruolo: "titolare" };
const TOKEN = "fx7k2m9qv4rt8wz3";
const CHIAVI_RISERVATE = /costo|ricarico|margine/i;

describe("flusso di approvazione del cliente", () => {
  it("il cliente approva un articolo dal link", () => {
    const a = rispostaCliente(creaArchivioDiEsempio(), TOKEN, "a03", "approvato", null);
    const art = a.articoli.find((x) => x.id === "a03");
    expect(art?.stato).toBe("approvato");
    expect(art?.versioneApprovata).toBe(1);
    expect(a.costiArticoli.find((c) => c.articoloId === "a03")?.costoAllApprovazione).toBe(134_000);
  });

  it("il cliente chiede modifiche con un commento", () => {
    const a = rispostaCliente(creaArchivioDiEsempio(), TOKEN, "a03", "modifiche", "Si può avere in blu?");
    const art = a.articoli.find((x) => x.id === "a03");
    expect(art?.stato).toBe("da_rivedere");
    expect(art?.notaCliente).toBe("Si può avere in blu?");
  });

  it("un link non può toccare articoli di un altro progetto", () => {
    expect(() => rispostaCliente(creaArchivioDiEsempio(), TOKEN, "a16", "approvato", null)).toThrow();
    expect(() => rispostaCliente(creaArchivioDiEsempio(), "token-inventato", "a03", "approvato", null)).toThrow();
  });

  it("la vista cliente non contiene costi né ricarichi", () => {
    const v = vistaCliente(creaArchivioDiEsempio(), TOKEN);
    expect(v.ok).toBe(true);
    expect(JSON.stringify(v).match(CHIAVI_RISERVATE)).toBeNull();
  });

  it("nasconde fornitore e codice finché l'articolo non è ordinato", () => {
    const v = vistaCliente(creaArchivioDiEsempio(), TOKEN);
    if (!v.ok) throw new Error(v.motivo);
    const articoli = v.stanze.flatMap((s) => s.articoli);
    expect(articoli.find((a) => a.id === "a03")?.fornitore).toBeNull(); // proposto
    expect(articoli.find((a) => a.id === "a01")?.codice).toBe("LMB-AR3"); // già ordinato
  });
});

describe("varianti", () => {
  it("modificare un articolo approvato lo rimette da rivedere con una nuova versione", () => {
    const a = modificaArticolo(creaArchivioDiEsempio(), designer, "a12", { quantita: 2_000 });
    const art = a.articoli.find((x) => x.id === "a12");
    expect(art?.stato).toBe("da_rivedere");
    expect(art?.versione).toBe(2);
    expect(art?.versioneApprovata).toBe(1);
    const v = vistaCliente(a, TOKEN);
    if (!v.ok) throw new Error(v.motivo);
    const diff = v.stanze.flatMap((s) => s.articoli).find((x) => x.id === "a12")?.differenze;
    expect(diff).toEqual([{ campo: "quantita", prima: 1_860, dopo: 2_000, unita: "mq" }]);
  });

  it("la variante della lampada mostra la finitura prima e dopo", () => {
    const v = vistaCliente(creaArchivioDiEsempio(), TOKEN);
    if (!v.ok) throw new Error(v.motivo);
    const diff = v.stanze.flatMap((s) => s.articoli).find((x) => x.id === "a05")?.differenze;
    expect(diff?.[0]).toMatchObject({ campo: "finitura", prima: "Ottone satinato", dopo: "Ottone brunito" });
  });

  it("riapprovare chiude la variante", () => {
    const a = rispostaCliente(creaArchivioDiEsempio(), TOKEN, "a05", "approvato", null);
    const art = a.articoli.find((x) => x.id === "a05");
    expect(art?.versioneApprovata).toBe(2);
    const v = vistaCliente(a, TOKEN);
    if (!v.ok) throw new Error(v.motivo);
    expect(v.stanze.flatMap((s) => s.articoli).find((x) => x.id === "a05")?.differenze).toBeNull();
  });

  it("un costo cambiato dopo l'approvazione non tocca il prezzo finché il titolare non decide", () => {
    const base = creaArchivioDiEsempio();
    const prima = base.articoli.find((x) => x.id === "a04")?.prezzoClienteUnitario;
    expect(prima).toBe(137_200);
    const a = aggiornaPrezzoDalCosto(base, titolare, "a04");
    const art = a.articoli.find((x) => x.id === "a04");
    expect(art?.prezzoClienteUnitario).toBe(148_400);
    expect(art?.stato).toBe("da_rivedere");
    expect(() => aggiornaPrezzoDalCosto(base, designer, "a04")).toThrow();
  });
});

describe("ordini", () => {
  it("raggruppa per fornitore gli approvati non ancora ordinati", () => {
    const a = creaOrdiniDaApprovati(creaArchivioDiEsempio(), designer, "pr-ferraris");
    const nuovi = a.ordini.filter((o) => o.stato === "bozza");
    expect(nuovi.map((o) => o.fornitoreId).sort()).toEqual(["f-luce", "f-valsecchia"]);
  });

  it("inviando l'ordine calcola la consegna dai tempi del fornitore", () => {
    let a = creaOrdiniDaApprovati(creaArchivioDiEsempio(), designer, "pr-ferraris");
    const bozza = a.ordini.find((o) => o.fornitoreId === "f-luce")!;
    a = avanzaOrdine(a, designer, bozza.id);
    const inviato = a.ordini.find((o) => o.id === bozza.id)!;
    expect(inviato.stato).toBe("inviato");
    const giorni = (Date.parse(inviato.consegnaPrevista!) - Date.parse(inviato.dataInvio!)) / 86_400_000;
    expect(giorni).toBe(35);
  });
});
