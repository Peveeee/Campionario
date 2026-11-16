"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconaAttenzione } from "@/components/ui/icone";
import { leggiArticoliConCosti } from "@/dati/accesso";
import { aggiornaPrezzoDalCosto, mantieniPrezzoApprovato } from "@/dati/azioni";
import { useAzione, useProgetto, useSessioneAttiva } from "@/dati/hooks";
import { mostraAvviso, useArchivio } from "@/dati/store";
import { ETICHETTA_CATEGORIA } from "@/dominio/etichette";
import type { Categoria } from "@/dominio/tipi";
import { raggruppa, ricavoProgetto, type Gruppo, type RigaEconomica } from "@/lib/margini";
import { formatEuro, formatPercentuale, formatScalato } from "@/lib/formato";
import { margine, prezzoDaRicarico } from "@/lib/prezzi";
import { cn } from "@/lib/cn";

export default function Riepilogo() {
  const { id } = useParams<{ id: string }>();
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const azione = useAzione();
  const voce = useProgetto(id);
  if (!voce) return null;

  if (sessione.ruolo !== "titolare") {
    return (
      <div className="max-w-lg">
        <p className="text-lg">Il riepilogo economico è riservato al titolare dello studio.</p>
        <p className="mt-2 text-pietra-scura">Costi, ricarichi e margini non arrivano nemmeno al tuo browser: sono protetti nel database.</p>
      </div>
    );
  }

  const idStanze = new Set(voce.stanze.map((s) => s.stanza.id));
  const articoli = leggiArticoliConCosti(archivio, sessione).filter((a) => idStanze.has(a.stanzaId));
  const approvati = articoli.filter((a) => a.stato === "approvato" || (a.stato === "da_rivedere" && a.versioneApprovata !== null));
  const nomeStanza = new Map(voce.stanze.map((s) => [s.stanza.id, `${s.stanza.codice} ${s.stanza.nome}`]));
  const righe = (chiave: (a: (typeof approvati)[number]) => string): RigaEconomica[] =>
    approvati
      .filter((a) => a.stato === "approvato")
      .map((a) => ({ chiave: chiave(a), costoUnitario: a.costi.costoNettoUnitario, prezzoUnitario: a.prezzoClienteUnitario, quantita: a.quantita }));

  const perStanza = raggruppa(righe((a) => nomeStanza.get(a.stanzaId) ?? a.stanzaId));
  const perCategoria = raggruppa(righe((a) => ETICHETTA_CATEGORIA[a.categoria as Categoria]));
  const ricavo = ricavoProgetto(voce.progetto.parcella, righe(() => "tutto"));
  const costiCambiati = articoli.filter(
    (a) => a.stato === "approvato" && a.costi.costoAllApprovazione !== null && a.costi.costoAllApprovazione !== a.costi.costoNettoUnitario,
  );

  async function copiaCsv() {
    const intestazione = "Stanza;Costo;Prezzo;Margine;Margine %";
    const corpo = perStanza.map((g) =>
      [g.chiave, formatScalato(g.costo, 2), formatScalato(g.prezzo, 2), formatScalato(g.margine.importo, 2), g.margine.percentuale !== null ? formatScalato(g.margine.percentuale, 2) : ""].join(";"),
    );
    try {
      await navigator.clipboard.writeText([intestazione, ...corpo].join("\n"));
      mostraAvviso("Riepilogo copiato in formato CSV: incollalo in Excel");
    } catch {
      mostraAvviso("Copia non riuscita in questo browser");
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-linea py-6 lg:grid-cols-5">
        <Cifra etichetta="Parcella" valore={formatEuro(ricavo.parcella)} />
        <Cifra etichetta="Forniture approvate" valore={formatEuro(ricavo.prezzoForniture)} nota="prezzo al cliente" />
        <Cifra etichetta="Costo forniture" valore={formatEuro(ricavo.costoForniture)} />
        <Cifra
          etichetta="Margine forniture"
          valore={formatEuro(ricavo.margineForniture.importo)}
          nota={ricavo.margineForniture.percentuale !== null ? formatPercentuale(Math.round(ricavo.margineForniture.percentuale / 10) * 10) : undefined}
        />
        <Cifra etichetta="Ricavo del progetto" valore={formatEuro(ricavo.ricavoTotale)} nota="parcella + margine" forte />
      </dl>

      {costiCambiati.length > 0 && (
        <section aria-labelledby="avvisi-costi">
          <h2 id="avvisi-costi" className="flex items-center gap-2 text-lg font-medium text-prugna">
            <IconaAttenzione dimensione={18} />
            {costiCambiati.length === 1 ? "Un costo è cambiato dopo l'approvazione" : `${costiCambiati.length} costi sono cambiati dopo l'approvazione`}
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {costiCambiati.map((a) => {
              const prima = margine(a.costi.costoAllApprovazione!, a.prezzoClienteUnitario);
              const ora = margine(a.costi.costoNettoUnitario, a.prezzoClienteUnitario);
              const nuovoPrezzo = prezzoDaRicarico(a.costi.costoNettoUnitario, a.costi.ricarico);
              return (
                <li key={a.id} className="rounded-md border border-prugna/25 bg-prugna-velo/40 p-5">
                  <p className="font-medium">{a.nome}</p>
                  <p className="cifre mt-1 text-pietra-scura">
                    Il costo è passato da {formatEuro(a.costi.costoAllApprovazione!)} a {formatEuro(a.costi.costoNettoUnitario)}. Con il prezzo
                    approvato di {formatEuro(a.prezzoClienteUnitario)} il margine scende da{" "}
                    {formatPercentuale(Math.round((prima.percentuale ?? 0) / 10) * 10)} a{" "}
                    <span className="font-medium text-prugna">{formatPercentuale(Math.round((ora.percentuale ?? 0) / 10) * 10)}</span>.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      misura="sm"
                      onClick={() => azione("Prezzo aggiornato: il cliente dovrà riapprovarlo", (x, s) => aggiornaPrezzoDalCosto(x, s, a.id))}
                    >
                      Porta il prezzo a {formatEuro(nuovoPrezzo)} e chiedi riapprovazione
                    </Button>
                    <Button misura="sm" variante="secondario" onClick={() => azione("Prezzo mantenuto", (x, s) => mantieniPrezzoApprovato(x, s, a.id))}>
                      Mantieni il prezzo
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-12 xl:grid-cols-2">
        <Tabella titolo="Per stanza" gruppi={perStanza} />
        <Tabella titolo="Per categoria" gruppi={perCategoria} />
      </div>

      <div>
        <Button variante="secondario" onClick={copiaCsv}>
          Copia il riepilogo in CSV
        </Button>
        <p className="mt-2 text-sm text-pietra-scura">Solo articoli approvati, importi IVA esclusa.</p>
      </div>
    </div>
  );
}

function Cifra({ etichetta, valore, nota, forte }: { etichetta: string; valore: string; nota?: string; forte?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-pietra-scura">{etichetta}</dt>
      <dd className={cn("cifre mt-1 text-xl", forte && "font-medium")}>{valore}</dd>
      {nota && <dd className="text-xs text-pietra-scura">{nota}</dd>}
    </div>
  );
}

function Tabella({ titolo, gruppi }: { titolo: string; gruppi: Gruppo[] }) {
  return (
    <section>
      <h2 className="text-lg font-medium">{titolo}</h2>
      {gruppi.length === 0 ? (
        <p className="mt-2 text-pietra-scura">Nessun articolo approvato.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="cifre w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b border-linea-forte text-left text-pietra-scura">
                <th className="py-2 font-normal" />
                <th className="py-2 text-right font-normal">Costo</th>
                <th className="py-2 text-right font-normal">Prezzo</th>
                <th className="py-2 text-right font-normal">Margine</th>
                <th className="w-16 py-2 text-right font-normal">%</th>
              </tr>
            </thead>
            <tbody>
              {gruppi.map((g) => (
                <tr key={g.chiave} className="border-b border-linea">
                  <td className="py-2.5 pr-3">{g.chiave}</td>
                  <td className="py-2.5 text-right text-pietra-scura">{formatEuro(g.costo)}</td>
                  <td className="py-2.5 text-right">{formatEuro(g.prezzo)}</td>
                  <td className="py-2.5 text-right font-medium">{formatEuro(g.margine.importo)}</td>
                  <td className="py-2.5 text-right text-pietra-scura">
                    {g.margine.percentuale !== null ? formatPercentuale(Math.round(g.margine.percentuale / 10) * 10) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
