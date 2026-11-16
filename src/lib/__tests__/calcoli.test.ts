import { describe, expect, it } from "vitest";
import { dividiArrotondando, percentualeDi, somma } from "../denaro";
import {
  margine,
  prezzoClienteUnitario,
  prezzoDaRicarico,
  ricaricoDaPrezzo,
  totaleRiga,
  totaliCliente,
} from "../prezzi";
import { statoBudget, totaleAPreventivo } from "../budget";
import { importoAcconto, situazioneAcconti } from "../acconti";
import { raggruppa, ricavoProgetto } from "../margini";

describe("aritmetica intera", () => {
  it("arrotonda al mezzo lontano da zero", () => {
    expect(dividiArrotondando(5, 2)).toBe(3);
    expect(dividiArrotondando(-5, 2)).toBe(-3);
    expect(dividiArrotondando(4, 3)).toBe(1);
    expect(dividiArrotondando(0, 7)).toBe(0);
  });

  it("rifiuta numeri non interi e la divisione per zero", () => {
    expect(() => dividiArrotondando(1.5, 2)).toThrow(RangeError);
    expect(() => dividiArrotondando(1, 0)).toThrow(RangeError);
    expect(() => somma([1, 0.1])).toThrow(RangeError);
  });

  it("applica percentuali in punti base", () => {
    expect(percentualeDi(10_000, 2200)).toBe(2200);
    expect(percentualeDi(1, 5000)).toBe(1); // 0,5 cent → 1
  });
});

describe("prezzi", () => {
  it("calcola il prezzo cliente dal ricarico", () => {
    expect(prezzoDaRicarico(10_000, 3500)).toBe(13_500);
    expect(prezzoDaRicarico(385_000, 3500)).toBe(519_750);
    expect(prezzoDaRicarico(999, 3333)).toBe(1332); // 1331,9667 → 1332
    expect(prezzoDaRicarico(10_000, 0)).toBe(10_000);
  });

  it("non accetta costi negativi", () => {
    expect(() => prezzoDaRicarico(-1, 3500)).toThrow();
  });

  it("ricava il ricarico da un prezzo scritto a mano", () => {
    expect(ricaricoDaPrezzo(10_000, 13_500)).toBe(3500);
    expect(ricaricoDaPrezzo(10_000, 9_000)).toBe(-1000);
    expect(ricaricoDaPrezzo(0, 5_000)).toBeNull();
  });

  it("calcola il totale di riga con quantità decimali", () => {
    expect(totaleRiga(13_500, 200)).toBe(27_000); // 2 pz
    expect(totaleRiga(8_060, 1_860)).toBe(149_916); // 18,60 mq × 80,60 €
    expect(totaleRiga(333, 150)).toBe(500); // 499,5 → 500
  });

  it("calcola margine e percentuale sul prezzo", () => {
    expect(margine(10_000, 13_500)).toEqual({ importo: 3_500, percentuale: 2593 });
    expect(margine(10_000, 0)).toEqual({ importo: -10_000, percentuale: null });
  });

  it("aggiunge l'IVA al 22% solo nei totali cliente", () => {
    expect(totaliCliente(100_000)).toEqual({ imponibile: 100_000, iva: 22_000, totale: 122_000 });
    expect(totaliCliente(1)).toEqual({ imponibile: 1, iva: 0, totale: 1 });
    expect(totaliCliente(3)).toEqual({ imponibile: 3, iva: 1, totale: 4 });
  });

  it("usa il prezzo manuale quando c'è", () => {
    expect(prezzoClienteUnitario({ costoNetto: 10_000, ricarico: 3500, prezzoManuale: null })).toBe(13_500);
    expect(prezzoClienteUnitario({ costoNetto: 10_000, ricarico: 3500, prezzoManuale: 15_000 })).toBe(15_000);
  });
});

describe("budget", () => {
  const righe = [
    { stato: "approvato" as const, prezzoClienteUnitario: 100_000, quantita: 100 },
    { stato: "proposto" as const, prezzoClienteUnitario: 50_000, quantita: 200 },
    { stato: "da_rivedere" as const, prezzoClienteUnitario: 10_000, quantita: 100 },
    { stato: "rifiutato" as const, prezzoClienteUnitario: 900_000, quantita: 100 },
  ];

  it("esclude gli articoli rifiutati dal totale", () => {
    expect(totaleAPreventivo(righe)).toBe(210_000);
  });

  it("distingue entro, attenzione, superato e senza budget", () => {
    expect(statoBudget(210_000, null)).toEqual({ tipo: "senza_budget", totale: 210_000 });
    expect(statoBudget(100_000, 200_000)).toMatchObject({ tipo: "entro", residuo: 100_000, utilizzo: 5000 });
    expect(statoBudget(180_000, 200_000)).toMatchObject({ tipo: "attenzione", residuo: 20_000, utilizzo: 9000 });
    expect(statoBudget(200_000, 200_000)).toMatchObject({ tipo: "attenzione", residuo: 0 });
    expect(statoBudget(200_001, 200_000)).toMatchObject({ tipo: "superato", eccedenza: 1 });
  });
});

describe("acconti", () => {
  it("calcola acconti a importo e a percentuale", () => {
    expect(importoAcconto({ tipo: "importo", importo: 150_000 }, 1_000_000)).toBe(150_000);
    expect(importoAcconto({ tipo: "percentuale", percentuale: 3000 }, 1_234_567)).toBe(370_370);
  });

  it("rifiuta percentuali fuori intervallo e importi negativi", () => {
    expect(() => importoAcconto({ tipo: "percentuale", percentuale: 10_001 }, 100)).toThrow();
    expect(() => importoAcconto({ tipo: "importo", importo: -1 }, 100)).toThrow();
  });

  it("riassume richiesto, incassato e residuo", () => {
    const s = situazioneAcconti(
      [
        { importo: 300_000, stato: "incassato" },
        { importo: 200_000, stato: "richiesto" },
      ],
      1_000_000,
    );
    expect(s).toEqual({ richiesto: 500_000, incassato: 300_000, daIncassare: 200_000, ancoraDaRichiedere: 500_000 });
  });
});

describe("margini", () => {
  const righe = [
    { chiave: "SOG", costoUnitario: 10_000, prezzoUnitario: 13_500, quantita: 200 },
    { chiave: "SOG", costoUnitario: 5_000, prezzoUnitario: 7_000, quantita: 100 },
    { chiave: "BAG", costoUnitario: 6_200, prezzoUnitario: 8_060, quantita: 1_860 },
  ];

  it("raggruppa costo, prezzo e margine per chiave", () => {
    const [sog, bag] = raggruppa(righe);
    expect(sog).toMatchObject({ chiave: "SOG", costo: 25_000, prezzo: 34_000, margine: { importo: 9_000 } });
    expect(bag).toMatchObject({ chiave: "BAG", costo: 115_320, prezzo: 149_916 });
  });

  it("somma parcella e margine forniture nel ricavo del progetto", () => {
    const r = ricavoProgetto(1_850_000, righe);
    expect(r.margineForniture.importo).toBe(9_000 + 34_596);
    expect(r.ricavoTotale).toBe(1_850_000 + 43_596);
  });
});

import { inRitardo } from "../ordini";

describe("ordini in ritardo", () => {
  it("segnala solo gli ordini inviati con consegna passata e non consegnati", () => {
    expect(inRitardo({ stato: "in_produzione", consegnaPrevista: "2026-11-03" }, "2026-11-14")).toBe(true);
    expect(inRitardo({ stato: "consegnato", consegnaPrevista: "2026-11-03" }, "2026-11-14")).toBe(false);
    expect(inRitardo({ stato: "spedito", consegnaPrevista: "2026-11-14" }, "2026-11-14")).toBe(false);
    expect(inRitardo({ stato: "bozza", consegnaPrevista: null }, "2026-11-14")).toBe(false);
  });
});
