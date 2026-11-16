"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Illustrazione } from "@/components/campionario/illustrazione";
import { Avviso } from "@/components/ui/avviso";
import { BadgeStato } from "@/components/ui/badge";
import { IconaApprovato, IconaDaRivedere, IconaRifiutato } from "@/components/ui/icone";
import { Segmented } from "@/components/ui/segmented";
import { rispostaCliente, type EsitoCliente } from "@/dati/azioni";
import { vistaCliente, type ArticoloCliente, type Differenza } from "@/dati/cliente";
import { modificaAnnullabile, useArchivio } from "@/dati/store";
import { cn } from "@/lib/cn";
import { formatData, formatDimensioni, formatEuro, formatQuantita } from "@/lib/formato";

type Filtro = "da_decidere" | "tutto";

const daDecidere = (a: ArticoloCliente) => a.stato === "proposto" || (a.stato === "da_rivedere" && a.differenze !== null);

export default function VistaClientePagina() {
  const { token } = useParams<{ token: string }>();
  const archivio = useArchivio();
  const vista = useMemo(() => vistaCliente(archivio, token), [archivio, token]);
  const [filtro, setFiltro] = useState<Filtro>("da_decidere");

  if (!vista.ok) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="titolo-display text-3xl">Link non disponibile</p>
          <p className="mt-3 text-pietra-scura">{vista.motivo}</p>
        </div>
      </main>
    );
  }

  const tutti = vista.stanze.flatMap((s) => s.articoli);
  const mostrati = vista.stanze
    .map((s) => ({ ...s, articoli: filtro === "tutto" ? s.articoli : s.articoli.filter(daDecidere) }))
    .filter((s) => s.articoli.length > 0);

  return (
    <div className="min-h-dvh bg-carta pb-40">
      <header className="mx-auto max-w-xl px-5 pt-10 pb-6">
        <p className="titolo-display text-base text-pietra-scura">{vista.studio.nome}</p>
        <h1 className="titolo-display mt-6 text-5xl leading-none">{vista.progetto.nome}</h1>
        <p className="mt-3 text-pietra-scura">{vista.progetto.indirizzo}</p>
        <p className="mt-6 text-lg">
          {vista.daDecidere === 0
            ? `${vista.cliente}, avete risposto a tutte le proposte. Grazie.`
            : `${vista.cliente}, ${vista.daDecidere === 1 ? "c'è una scelta" : `ci sono ${vista.daDecidere} scelte`} da fare. Approvate quello che vi convince, o diteci cosa cambiare.`}
        </p>
      </header>

      <div className="sticky top-0 z-20 border-b border-linea bg-carta/95 backdrop-blur">
        <div className="mx-auto max-w-xl px-5 py-3">
          <Segmented<Filtro>
            etichetta="Mostra"
            opzioni={[
              { valore: "da_decidere", etichetta: "Da decidere", conteggio: tutti.filter(daDecidere).length },
              { valore: "tutto", etichetta: "Tutto", conteggio: tutti.length },
            ]}
            valore={filtro}
            onCambia={setFiltro}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
        </div>
      </div>

      <main className="mx-auto max-w-xl px-5">
        {mostrati.length === 0 && (
          <div className="py-16 text-center">
            <p className="titolo-display text-2xl">Niente da decidere</p>
            <p className="mt-2 text-pietra-scura">Quando lo studio vi proporrà altro, lo troverete qui.</p>
            <button type="button" onClick={() => setFiltro("tutto")} className="mt-4 text-avio underline underline-offset-4">
              Rivedi tutte le scelte
            </button>
          </div>
        )}
        {mostrati.map((s) => (
          <section key={s.codice} className="pt-10">
            <h2 className="titolo-display text-3xl">{s.nome}</h2>
            <ul className="mt-5 flex flex-col gap-10">
              {s.articoli.map((a) => (
                <li key={a.id}>
                  <SchedaCliente articolo={a} token={token} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-16 text-center text-xs text-pietra">
          Link riservato, valido fino al {formatData(vista.scadeIl)}. Prezzi IVA esclusa; l&apos;IVA al 22% compare nel totale.
        </p>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-carta/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <dl className="cifre mx-auto flex max-w-xl items-end justify-between gap-4 px-5 py-3 text-sm">
          <div>
            <dt className="text-pietra-scura">Approvato finora</dt>
            <dd>
              {formatEuro(vista.totali.imponibile)} <span className="text-pietra-scura">+ IVA {formatEuro(vista.totali.iva)}</span>
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-pietra-scura">Totale</dt>
            <dd className="text-xl font-medium">{formatEuro(vista.totali.totale)}</dd>
          </div>
        </dl>
      </footer>
      <Avviso />
    </div>
  );
}

function SchedaCliente({ articolo: a, token }: { articolo: ArticoloCliente; token: string }) {
  const [modo, setModo] = useState<"scelta" | "modifiche" | "rifiuta" | null>(null);
  const [commento, setCommento] = useState("");
  const decidibile = daDecidere(a);
  const mostraAzioni = decidibile || modo === "scelta" || modo === "modifiche" || modo === "rifiuta";
  const dimensioni = formatDimensioni(a.dimensioni);

  function rispondi(esito: EsitoCliente) {
    const messaggi: Record<EsitoCliente, string> = {
      approvato: `${a.nome}: approvato`,
      rifiutato: `${a.nome}: rifiutato`,
      modifiche: `Richiesta inviata allo studio`,
    };
    modificaAnnullabile(messaggi[esito], (archivio) => rispostaCliente(archivio, token, a.id, esito, commento || null));
    setModo(null);
    setCommento("");
  }

  return (
    <article>
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm" style={{ backgroundColor: `color-mix(in oklab, ${a.coloreCampione} 14%, #f7f7f5)` }}>
        {a.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.fotoUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <Illustrazione categoria={a.categoria} className="absolute inset-x-[28%] top-[10%] w-[44%] text-grafite/55" />
        )}
        <BadgeStato stato={a.stato} className="absolute top-3 left-3 shadow-etichetta" />
        <div className="absolute right-3 bottom-3 left-3 flex items-center gap-2.5 rounded-sm bg-carta py-1.5 pr-3 pl-1.5 shadow-etichetta">
          <span className="size-9 shrink-0 rounded-[2px] ring-1 ring-grafite/10 ring-inset" style={{ backgroundColor: a.coloreCampione }} />
          <span className="text-sm">{a.finitura}</span>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-medium">{a.nome}</h3>
          {(a.fornitore || a.codice) && (
            <p className="text-sm text-pietra-scura">
              {a.fornitore}
              {a.codice && <span className="ml-2 text-pietra">{a.codice}</span>}
            </p>
          )}
          {dimensioni && <p className="text-sm text-pietra-scura">{dimensioni}</p>}
        </div>
        <div className="cifre shrink-0 text-right">
          <p className="text-lg font-medium">{formatEuro(a.totale)}</p>
          <p className="text-sm text-pietra-scura">
            {formatQuantita(a.quantita, a.unita)} × {formatEuro(a.prezzoUnitario)}
          </p>
        </div>
      </div>

      {a.differenze && a.differenze.length > 0 && a.stato === "da_rivedere" && <Differenze differenze={a.differenze} />}

      {a.stato === "da_rivedere" && !a.differenze && (
        <p className="mt-4 rounded-md bg-ocra-velo px-4 py-3 text-sm text-ocra">
          Avete chiesto delle modifiche{a.notaCliente ? `: «${a.notaCliente}»` : ""}. Lo studio vi proporrà una nuova versione.
        </p>
      )}
      {a.stato === "rifiutato" && a.notaCliente && !mostraAzioni && (
        <p className="mt-4 text-sm text-pietra-scura italic">La vostra nota: «{a.notaCliente}»</p>
      )}

      {mostraAzioni ? (
        <div className="mt-5">
          {modo === "modifiche" || modo === "rifiuta" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                rispondi(modo === "rifiuta" ? "rifiutato" : "modifiche");
              }}
              className="flex flex-col gap-3"
            >
              <label htmlFor={`nota-${a.id}`} className="text-sm font-medium">
                {modo === "rifiuta" ? "Volete dirci perché? (facoltativo)" : "Cosa vorreste cambiare?"}
              </label>
              <textarea
                id={`nota-${a.id}`}
                autoFocus
                rows={3}
                value={commento}
                onChange={(e) => setCommento(e.target.value)}
                required={modo === "modifiche"}
                placeholder={modo === "rifiuta" ? "Per esempio: non ci convince il colore" : "Per esempio: si può avere in un tono più caldo?"}
                className="rounded-md border border-linea-forte px-3 py-2 text-base focus-visible:border-avio focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-avio/20"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={cn(
                    "h-12 flex-1 rounded-md font-medium text-carta",
                    modo === "rifiuta" ? "bg-mattone hover:bg-mattone/90" : "bg-avio hover:bg-avio-scuro",
                  )}
                >
                  {modo === "rifiuta" ? "Rifiuta" : "Invia la richiesta"}
                </button>
                <button type="button" onClick={() => setModo(decidibile ? null : "scelta")} className="h-12 rounded-md px-4 text-pietra-scura hover:bg-nebbia">
                  Indietro
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => rispondi("approvato")}
                className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-md bg-bosco font-medium text-carta hover:bg-bosco/90"
              >
                <IconaApprovato dimensione={18} />
                Approva
              </button>
              <button
                type="button"
                onClick={() => setModo("modifiche")}
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-linea-forte px-3 text-grafite hover:bg-nebbia"
              >
                <IconaDaRivedere dimensione={16} />
                Chiedi modifiche
              </button>
              <button
                type="button"
                onClick={() => setModo("rifiuta")}
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-linea-forte px-3 text-mattone hover:bg-mattone-velo"
              >
                <IconaRifiutato dimensione={16} />
                Rifiuta
              </button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => setModo("scelta")} className="mt-3 text-sm text-pietra-scura underline underline-offset-4 hover:text-grafite">
          Cambia la risposta
        </button>
      )}
    </article>
  );
}

const ETICHETTA_DIFFERENZA: Record<Differenza["campo"], string> = {
  nome: "Prodotto",
  finitura: "Finitura",
  quantita: "Quantità",
  prezzo: "Prezzo unitario",
  fornitore: "Fornitore",
};

function Differenze({ differenze }: { differenze: Differenza[] }) {
  const valore = (d: Differenza, v: string | number, quale: "prima" | "dopo") => {
    if (d.campo === "prezzo") return formatEuro(Number(v));
    if (d.campo === "quantita") return formatQuantita(Number(v), d.unita ?? "pz");
    if (d.campo === "finitura" && d.colori) {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="size-5 rounded-[2px] ring-1 ring-grafite/10 ring-inset" style={{ backgroundColor: d.colori[quale] }} />
          {v}
        </span>
      );
    }
    return String(v);
  };
  return (
    <div className="mt-4 rounded-md border border-ocra/30 bg-ocra-velo/60 p-4">
      <p className="text-sm font-medium text-ocra">Cosa è cambiato rispetto a quanto avevate approvato</p>
      <dl className="mt-3 flex flex-col gap-2.5 text-sm">
        {differenze.map((d) => (
          <div key={d.campo} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-2">
            <dt className="text-pietra-scura">{ETICHETTA_DIFFERENZA[d.campo]}</dt>
            <dd className="cifre flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-pietra-scura line-through decoration-pietra/60">{valore(d, d.prima, "prima")}</span>
              <span aria-hidden="true" className="text-pietra">→</span>
              <span className="sr-only">diventa</span>
              <span className="font-medium">{valore(d, d.dopo, "dopo")}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
