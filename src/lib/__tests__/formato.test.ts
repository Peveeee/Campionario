import { describe, expect, it } from "vitest";
import {
  formatData,
  formatDataEstesa,
  formatDimensioni,
  formatEuro,
  formatEuroArrotondato,
  formatPercentuale,
  formatQuantita,
  leggiImporto,
  leggiPercentuale,
} from "../formato";

const nbsp = " ";

describe("formattazione italiana", () => {
  it("formatta gli euro come 1.234,56 €", () => {
    expect(formatEuro(123_456)).toBe(`1.234,56${nbsp}€`);
    expect(formatEuro(5)).toBe(`0,05${nbsp}€`);
    expect(formatEuro(100_000_000)).toBe(`1.000.000,00${nbsp}€`);
    expect(formatEuro(-123_456)).toBe(`−1.234,56${nbsp}€`);
    expect(formatEuroArrotondato(3_200_049)).toBe(`32.000${nbsp}€`);
  });

  it("formatta percentuali e quantità senza zeri inutili", () => {
    expect(formatPercentuale(3500)).toBe("35%");
    expect(formatPercentuale(3550)).toBe("35,5%");
    expect(formatPercentuale(2593)).toBe("25,93%");
    expect(formatQuantita(1450, "mq")).toBe(`14,5${nbsp}mq`);
    expect(formatQuantita(200, "pz")).toBe(`2${nbsp}pz`);
  });

  it("formatta le date in gg/mm/aaaa", () => {
    expect(formatData("2026-03-02")).toBe("02/03/2026");
    expect(formatDataEstesa("2026-11-13")).toBe("13 novembre 2026");
  });

  it("formatta le dimensioni in centimetri", () => {
    expect(formatDimensioni({ larghezza: 2600, profondita: 1000, altezza: 785 })).toBe(
      `L${nbsp}260 × P${nbsp}100 × H${nbsp}78,5${nbsp}cm`,
    );
    expect(formatDimensioni({ larghezza: null, profondita: null, altezza: 2800 })).toBe(`H${nbsp}280${nbsp}cm`);
    expect(formatDimensioni({ larghezza: null, profondita: null, altezza: null })).toBeNull();
  });

  it("legge importi scritti all'italiana", () => {
    expect(leggiImporto("1.234,56")).toBe(123_456);
    expect(leggiImporto("1234,5")).toBe(123_450);
    expect(leggiImporto("€ 1.234")).toBe(123_400);
    expect(leggiImporto(" 0,05 ")).toBe(5);
    expect(leggiImporto("-12,00")).toBe(-1_200);
  });

  it("rifiuta testo che non è un importo valido", () => {
    expect(leggiImporto("")).toBeNull();
    expect(leggiImporto("abc")).toBeNull();
    expect(leggiImporto("1,234")).toBeNull(); // tre decimali
    expect(leggiImporto("1.23,00")).toBeNull(); // migliaia malformate
    expect(leggiImporto("1.234.5")).toBeNull();
  });

  it("legge percentuali in punti base", () => {
    expect(leggiPercentuale("35")).toBe(3500);
    expect(leggiPercentuale("12,5%")).toBe(1250);
  });
});
