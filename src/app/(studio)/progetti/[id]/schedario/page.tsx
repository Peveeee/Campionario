"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SchedaCampione } from "@/components/campionario/scheda-campione";
import { BarraBudget } from "@/components/progetto/barra-budget";
import { BadgeStato } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Campo, CampoNumero, Input } from "@/components/ui/input";
import { Pannello } from "@/components/ui/pannello";
import { Segmented } from "@/components/ui/segmented";
import { leggiArticoli, leggiArticoliConCosti } from "@/dati/accesso";
import { aggiungiDaLibreria, CAMPI_VARIANTE, duplicaArticolo, modificaArticolo, type ModificheArticolo } from "@/dati/azioni";
import { useAzione, useProgetto, useSessioneAttiva } from "@/dati/hooks";
import { useArchivio } from "@/dati/store";
import { ETICHETTA_CATEGORIA } from "@/dominio/etichette";
import { CATEGORIE, type Articolo, type Categoria, type Id, type StatoApprovazione } from "@/dominio/tipi";
import { formatData, formatEuro, formatPercentuale, formatQuantita } from "@/lib/formato";
import { margine, prezzoDaRicarico, totaleRiga } from "@/lib/prezzi";

type FiltroStato = StatoApprovazione | "tutti";

export default function Schedario() {
  const { id } = useParams<{ id: string }>();
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const voce = useProgetto(id);
  const [filtro, setFiltro] = useState<FiltroStato>("tutti");
  const [categoria, setCategoria] = useState<Categoria | "tutte">("tutte");
  const [aperto, setAperto] = useState<Id | null>(null);
  const [libreriaPer, setLibreriaPer] = useState<Id | null>(null);

  const articoli = useMemo(() => leggiArticoli(archivio, sessione), [archivio, sessione]);
  const fornitori = useMemo(() => new Map(archivio.fornitori.map((f) => [f.id, f])), [archivio]);
  if (!voce) return null;

  const idStanze = new Set(voce.stanze.map((s) => s.stanza.id));
  const delProgetto = articoli.filter((a) => idStanze.has(a.stanzaId));
  const conta = (s: StatoApprovazione) => delProgetto.filter((a) => a.stato === s).length;
  const passa = (a: Articolo) => (filtro === "tutti" || a.stato === filtro) && (categoria === "tutte" || a.categoria === categoria);

  const opzioni = [
    { valore: "tutti" as const, etichetta: "Tutti", conteggio: delProgetto.length },
    { valore: "proposto" as const, etichetta: "Proposti", conteggio: conta("proposto") },
    { valore: "approvato" as const, etichetta: "Approvati", conteggio: conta("approvato") },
    { valore: "da_rivedere" as const, etichetta: "Da rivedere", conteggio: conta("da_rivedere") },
    { valore: "rifiutato" as const, etichetta: "Rifiutati", conteggio: conta("rifiutato") },
  ];

  const visibili = voce.stanze.map((s) => ({ ...s, articoli: delProgetto.filter((a) => a.stanzaId === s.stanza.id && passa(a)) }));
  const nessuno = visibili.every((s) => s.articoli.length === 0);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented<FiltroStato> etichetta="Filtra per stato" opzioni={opzioni} valore={filtro} onCambia={setFiltro} />
        </div>
        <label className="flex items-center gap-2 text-sm text-pietra-scura">
          Categoria
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria | "tutte")}
            className="h-9 rounded-md border border-linea-forte bg-carta px-2 text-sm text-grafite"
          >
            <option value="tutte">Tutte</option>
            {CATEGORIE.map((c) => (
              <option key={c} value={c}>
                {ETICHETTA_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nessuno && (
        <div className="mt-12 flex flex-col items-start gap-3 border-t border-linea pt-8">
          <p className="text-lg">Nessun articolo corrisponde ai filtri.</p>
          <Button variante="secondario" onClick={() => { setFiltro("tutti"); setCategoria("tutte"); }}>
            Mostra tutti gli articoli
          </Button>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-16">
        {visibili.map(({ stanza, budget, articoli: daMostrare }) =>
          daMostrare.length === 0 && filtro !== "tutti" ? null : (
            <section key={stanza.id} aria-labelledby={`stanza-${stanza.id}`}>
              <div className="flex flex-col gap-4 border-b border-linea pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="cifre text-sm font-medium tracking-wide text-pietra-scura">{stanza.codice}</p>
                  <h2 id={`stanza-${stanza.id}`} className="titolo-display text-3xl">
                    {stanza.nome}
                  </h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:w-[30rem]">
                  <div className="flex-1">
                    <BarraBudget stato={budget} />
                  </div>
                  <Button variante="secondario" misura="sm" onClick={() => setLibreriaPer(stanza.id)}>
                    Aggiungi dalla libreria
                  </Button>
                </div>
              </div>

              {daMostrare.length === 0 ? (
                <p className="mt-6 text-pietra-scura">Nessun articolo in questa stanza. Aggiungine uno dalla libreria.</p>
              ) : (
                <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
                  {daMostrare.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setAperto(a.id)}
                        className="block w-full rounded-sm text-left transition-opacity hover:opacity-90"
                        aria-label={`Apri ${a.nome}`}
                      >
                        <SchedaCampione articolo={a} fornitore={fornitori.get(a.fornitoreId)} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ),
        )}
      </div>

      {aperto && (
        <PannelloArticolo key={aperto} id={aperto} onChiudi={() => setAperto(null)} />
      )}
      {libreriaPer && <PannelloLibreria stanzaId={libreriaPer} onChiudi={() => setLibreriaPer(null)} />}
    </div>
  );
}

function PannelloArticolo({ id, onChiudi }: { id: Id; onChiudi: () => void }) {
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const azione = useAzione();
  const titolare = sessione.ruolo === "titolare";
  const articolo = leggiArticoli(archivio, sessione).find((a) => a.id === id);
  const conCosti = titolare ? leggiArticoliConCosti(archivio, sessione).find((a) => a.id === id) : undefined;

  const [nome, setNome] = useState(articolo?.nome ?? "");
  const [finitura, setFinitura] = useState(articolo?.finitura ?? "");
  const [colore, setColore] = useState(articolo?.coloreCampione ?? "#cccccc");
  const [quantita, setQuantita] = useState<number | null>(articolo?.quantita ?? null);
  const [prezzo, setPrezzo] = useState<number | null>(articolo?.prezzoClienteUnitario ?? null);
  const [costo, setCosto] = useState<number | null>(conCosti?.costi.costoNettoUnitario ?? null);
  const [ricarico, setRicarico] = useState<number | null>(conCosti?.costi.ricarico ?? null);

  if (!articolo) return null;
  const fornitore = archivio.fornitori.find((f) => f.id === articolo.fornitoreId);
  const versioni = archivio.versioniArticoli.filter((v) => v.articoloId === id).sort((a, b) => b.versione - a.versione);

  const modifiche: ModificheArticolo = {};
  if (nome.trim() && nome !== articolo.nome) modifiche.nome = nome.trim();
  if (finitura.trim() && finitura !== articolo.finitura) modifiche.finitura = finitura.trim();
  if (colore !== articolo.coloreCampione) modifiche.coloreCampione = colore;
  if (quantita !== null && quantita > 0 && quantita !== articolo.quantita) modifiche.quantita = quantita;
  if (prezzo !== null && prezzo >= 0 && prezzo !== articolo.prezzoClienteUnitario) modifiche.prezzoClienteUnitario = prezzo;
  if (costo !== null && costo >= 0 && costo !== conCosti?.costi.costoNettoUnitario) modifiche.costoNettoUnitario = costo;
  if (titolare && ricarico !== null && ricarico !== conCosti?.costi.ricarico) modifiche.ricarico = ricarico;
  const cambiaVariante = CAMPI_VARIANTE.some((k) => k in modifiche) && articolo.stato === "approvato";
  const niente = Object.keys(modifiche).length === 0;

  const prezzoProposto = titolare && costo !== null && ricarico !== null ? prezzoDaRicarico(costo, ricarico) : null;
  const m = titolare && costo !== null && prezzo !== null ? margine(costo, prezzo) : null;

  function salva() {
    azione(cambiaVariante ? "Variante salvata: il cliente dovrà riapprovarla" : "Modifiche salvate", (a, s) =>
      modificaArticolo(a, s, id, modifiche),
    );
    onChiudi();
  }

  return (
    <Pannello
      aperto
      onChiudi={onChiudi}
      titolo={articolo.nome}
      sottotitolo={
        <span className="flex flex-wrap items-center gap-2">
          <BadgeStato stato={articolo.stato} />
          <span>{fornitore?.ragioneSociale}</span>
          <span className="text-pietra">{articolo.codice}</span>
        </span>
      }
      piede={
        <>
          <Button onClick={salva} disabled={niente}>
            {cambiaVariante ? "Salva e chiedi riapprovazione" : "Salva modifiche"}
          </Button>
          <Button
            variante="secondario"
            onClick={() => {
              azione("Articolo duplicato", (a, s) => duplicaArticolo(a, s, id));
              onChiudi();
            }}
          >
            Duplica
          </Button>
          <Button variante="quieto" onClick={onChiudi}>
            Chiudi
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {articolo.notaCliente && (
          <div className="border-l-2 border-mattone/50 bg-mattone-velo/50 py-2 pr-3 pl-3">
            <p className="text-xs text-pietra-scura">Nota del cliente</p>
            <p className="mt-0.5 italic">{articolo.notaCliente}</p>
          </div>
        )}
        {articolo.stato === "approvato" && (
          <p className="rounded-md bg-ocra-velo px-3 py-2 text-sm text-ocra">
            Il cliente ha già approvato questo articolo. Se cambi nome, finitura, quantità o prezzo, gli chiederemo di
            riapprovarlo e vedrà cosa è cambiato.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Campo etichetta="Nome">{(p) => <Input {...p} value={nome} onChange={(e) => setNome(e.target.value)} />}</Campo>
          </div>
          <Campo etichetta="Finitura">{(p) => <Input {...p} value={finitura} onChange={(e) => setFinitura(e.target.value)} />}</Campo>
          <Campo etichetta="Colore del campione">
            {(p) => (
              <div className="flex h-10 items-center gap-3">
                <input
                  {...p}
                  type="color"
                  value={colore}
                  onChange={(e) => setColore(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-linea-forte bg-carta p-1"
                />
                <span className="cifre text-sm text-pietra-scura uppercase">{colore}</span>
              </div>
            )}
          </Campo>
          <Campo etichetta="Quantità">
            {(p) => <CampoNumero {...p} valore={quantita} suffisso={articolo.unita} onCambia={(v) => setQuantita(v)} />}
          </Campo>
          <Campo etichetta="Prezzo cliente unitario" aiuto="IVA esclusa">
            {(p) => <CampoNumero {...p} valore={prezzo} suffisso="€" onCambia={(v) => setPrezzo(v)} />}
          </Campo>
        </div>

        <section className="rounded-md border border-linea p-4">
          <h3 className="text-sm font-medium">Costo</h3>
          {titolare ? (
            <>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Campo etichetta="Costo netto unitario">
                  {(p) => <CampoNumero {...p} valore={costo} suffisso="€" onCambia={(v) => setCosto(v)} />}
                </Campo>
                <Campo etichetta="Ricarico">
                  {(p) => <CampoNumero {...p} valore={ricarico} suffisso="%" onCambia={(v) => setRicarico(v)} />}
                </Campo>
              </div>
              <dl className="cifre mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-pietra-scura">Prezzo dal ricarico</dt>
                  <dd className="mt-0.5 flex items-center gap-2">
                    {prezzoProposto !== null ? formatEuro(prezzoProposto) : "—"}
                    {prezzoProposto !== null && prezzoProposto !== prezzo && (
                      <button type="button" className="text-avio underline underline-offset-2" onClick={() => setPrezzo(prezzoProposto)}>
                        Usa
                      </button>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-pietra-scura">Margine sulla riga</dt>
                  <dd className={`mt-0.5 ${m && m.importo < 0 ? "text-mattone" : ""}`}>
                    {m && quantita !== null
                      ? `${formatEuro(totaleRiga(m.importo, quantita))}${m.percentuale !== null ? ` (${formatPercentuale(Math.round(m.percentuale / 10) * 10)})` : ""}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="mt-3">
              <Campo
                etichetta="Nuovo costo netto unitario"
                aiuto="Costi e margini sono riservati al titolare: puoi inserire il costo, ma dopo il salvataggio non lo vedrai più."
              >
                {(p) => <CampoNumero {...p} valore={costo} suffisso="€" placeholder="Lascia vuoto per non cambiarlo" onCambia={(v) => setCosto(v)} />}
              </Campo>
            </div>
          )}
        </section>

        {versioni.length > 0 && (
          <section>
            <h3 className="text-sm font-medium">Storico delle versioni</h3>
            <ol className="mt-3 flex flex-col gap-3 border-l border-linea pl-4">
              {versioni.map((v) => {
                const autore = v.autore.tipo === "utente" ? archivio.utenti.find((u) => u.id === (v.autore as { utenteId: string }).utenteId)?.nome : "Cliente";
                return (
                  <li key={v.id} className="text-sm">
                    <p>
                      <span className="font-medium">Versione {v.versione}</span>
                      {articolo.versioneApprovata === v.versione && <span className="ml-2 text-bosco">approvata dal cliente</span>}
                    </p>
                    <p className="text-pietra-scura">
                      {formatData(v.creatoIl.slice(0, 10))}, {autore}
                      {v.campiCambiati.length > 0 && <> — cambiati: {v.campiCambiati.map(nomeCampo).filter((x, i, arr) => arr.indexOf(x) === i).join(", ")}</>}
                    </p>
                    <p className="text-pietra-scura">
                      {v.campi.finitura}, {formatQuantita(v.campi.quantita, v.campi.unita)} × {formatEuro(v.campi.prezzoClienteUnitario)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </Pannello>
  );
}

function nomeCampo(k: string): string {
  return (
    {
      nome: "nome",
      finitura: "finitura",
      coloreCampione: "finitura",
      quantita: "quantità",
      unita: "unità",
      prezzoClienteUnitario: "prezzo",
      fornitoreId: "fornitore",
      codice: "codice",
    } as Record<string, string>
  )[k] ?? k;
}

function PannelloLibreria({ stanzaId, onChiudi }: { stanzaId: Id; onChiudi: () => void }) {
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const azione = useAzione();
  const [cerca, setCerca] = useState("");
  const stanza = archivio.stanze.find((s) => s.id === stanzaId);
  const fornitori = new Map(archivio.fornitori.map((f) => [f.id, f.ragioneSociale]));
  const costi = new Map(archivio.costiProdotti.map((c) => [c.prodottoId, c]));
  const q = cerca.trim().toLowerCase();
  const prodotti = archivio.prodotti.filter(
    (p) =>
      p.studioId === sessione.studioId &&
      (!q ||
        p.nome.toLowerCase().includes(q) ||
        ETICHETTA_CATEGORIA[p.categoria].toLowerCase().includes(q) ||
        (fornitori.get(p.fornitoreId) ?? "").toLowerCase().includes(q)),
  );

  return (
    <Pannello aperto onChiudi={onChiudi} titolo="Libreria dello studio" sottotitolo={`Aggiungi a ${stanza?.nome ?? "stanza"}`}>
      <Input
        autoFocus
        type="search"
        placeholder="Cerca per nome, categoria o fornitore"
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
        aria-label="Cerca nella libreria"
      />
      {prodotti.length === 0 ? (
        <p className="mt-6 text-pietra-scura">Nessun prodotto trovato per «{cerca}».</p>
      ) : (
        <ul className="mt-4 divide-y divide-linea">
          {prodotti.map((p) => {
            const c = costi.get(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <span className="size-10 shrink-0 rounded-[2px] ring-1 ring-grafite/10 ring-inset" style={{ backgroundColor: p.coloreCampione }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.nome}</p>
                  <p className="truncate text-sm text-pietra-scura">
                    {fornitori.get(p.fornitoreId)}, {p.finitura}
                  </p>
                </div>
                {c && <span className="cifre text-sm text-pietra-scura">{formatEuro(prezzoDaRicarico(c.costoNetto, c.ricaricoPredefinito))}</span>}
                <Button
                  misura="sm"
                  variante="secondario"
                  onClick={() => {
                    azione(`${p.nome} aggiunto a ${stanza?.nome}`, (a, s) => aggiungiDaLibreria(a, s, stanzaId, p.id));
                    onChiudi();
                  }}
                >
                  Aggiungi
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Pannello>
  );
}
