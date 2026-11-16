"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, BadgeInRitardo } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Campo, CampoNumero } from "@/components/ui/input";
import { IconaApprovato } from "@/components/ui/icone";
import { Pannello } from "@/components/ui/pannello";
import {
  avanzaOrdine,
  creaOrdiniDaApprovati,
  richiediAccontoCliente,
  segnaAccontoIncassato,
  totaleClienteOrdine,
} from "@/dati/azioni";
import { useAzione, useProgetto, useSessioneAttiva } from "@/dati/hooks";
import { useArchivio } from "@/dati/store";
import { ETICHETTA_ORDINE } from "@/dominio/etichette";
import { STATI_ORDINE, type Id } from "@/dominio/tipi";
import { inRitardo } from "@/lib/ordini";
import { situazioneAcconti } from "@/lib/acconti";
import { cn } from "@/lib/cn";
import { formatData, formatDimensioni, formatEuro, formatPercentuale, formatQuantita } from "@/lib/formato";
import { totaleRiga, totaliCliente } from "@/lib/prezzi";


export default function Ordini() {
  const { id } = useParams<{ id: string }>();
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const azione = useAzione();
  const voce = useProgetto(id);
  const [anteprima, setAnteprima] = useState<Id | null>(null);
  const [ordineAcconto, setOrdineAcconto] = useState<Id | "">("");
  const [percentuale, setPercentuale] = useState<number | null>(3000);
  if (!voce) return null;

  const titolare = sessione.ruolo === "titolare";
  const idStanze = new Set(voce.stanze.map((s) => s.stanza.id));
  const giaOrdinati = new Set(archivio.righeOrdine.map((r) => r.articoloId));
  const daOrdinare = archivio.articoli.filter((a) => idStanze.has(a.stanzaId) && a.stato === "approvato" && !giaOrdinati.has(a.id));
  const ordini = archivio.ordini.filter((o) => o.progettoId === id).sort((a, b) => b.numero.localeCompare(a.numero));
  const acconti = archivio.accontiClienti.filter((a) => a.progettoId === id);
  const totaleOrdinato = ordini.reduce((t, o) => t + totaleClienteOrdine(archivio, o.id), 0);
  const situazione = situazioneAcconti(acconti, totaleOrdinato);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4 rounded-md bg-nebbia p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-medium">
            {daOrdinare.length === 0
              ? "Tutti gli articoli approvati sono già in un ordine"
              : `${daOrdinare.length} ${daOrdinare.length === 1 ? "articolo approvato è pronto" : "articoli approvati sono pronti"} da ordinare`}
          </h2>
          <p className="mt-1 text-pietra-scura">
            {daOrdinare.length === 0
              ? "Quando il cliente approva altri articoli, li trovi qui."
              : "Li raggruppiamo per fornitore in ordini in bozza, che puoi controllare prima dell'invio."}
          </p>
        </div>
        {daOrdinare.length > 0 && (
          <Button onClick={() => azione("Ordini in bozza creati", (a, s) => creaOrdiniDaApprovati(a, s, id))}>
            Crea gli ordini
          </Button>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium">Ordini ai fornitori</h2>
        {ordini.length === 0 ? (
          <p className="mt-2 text-pietra-scura">Ancora nessun ordine per questo progetto.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {ordini.map((o) => {
              const fornitore = archivio.fornitori.find((f) => f.id === o.fornitoreId);
              const righe = archivio.righeOrdine.filter((r) => r.ordineId === o.id);
              const costo = righe.reduce((t, r) => t + totaleRiga(r.costoUnitario, r.quantita), 0);
              const i = STATI_ORDINE.indexOf(o.stato);
              const prossimo = STATI_ORDINE[i + 1];
              return (
                <li key={o.id} className="rounded-md border border-linea p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="cifre text-sm text-pietra-scura">Ordine {o.numero}</p>
                      <h3 className="titolo-display text-2xl">{fornitore?.ragioneSociale}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {inRitardo(o) && <BadgeInRitardo />}
                      {o.stato === "consegnato" ? (
                        <Badge tono="bosco" icona={<IconaApprovato dimensione={12} />}>Consegnato</Badge>
                      ) : (
                        <Badge tono={o.stato === "bozza" ? "neutro" : "avio"}>{ETICHETTA_ORDINE[o.stato]}</Badge>
                      )}
                    </div>
                  </div>

                  <ol className="mt-5 grid grid-cols-6 gap-1" aria-label={`Avanzamento: ${ETICHETTA_ORDINE[o.stato]}`}>
                    {STATI_ORDINE.map((s, k) => (
                      <li key={s} className="flex flex-col gap-1.5">
                        <span className={cn("h-1 rounded-full", k <= i ? (k === i ? "bg-avio" : "bg-grafite/60") : "bg-linea")} />
                        <span className={cn("hidden text-xs sm:block", k === i ? "font-medium text-grafite" : "text-pietra-scura")}>
                          {ETICHETTA_ORDINE[s]}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <dl className="cifre mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-pietra-scura">Inviato</dt>
                      <dd>{o.dataInvio ? formatData(o.dataInvio) : "Non ancora"}</dd>
                    </div>
                    <div>
                      <dt className="text-pietra-scura">Consegna prevista</dt>
                      <dd className={inRitardo(o) ? "font-medium text-prugna" : undefined}>
                        {o.consegnaPrevista ? formatData(o.consegnaPrevista) : `${fornitore?.settimaneConsegna} settimane dall'invio`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-pietra-scura">Valore per il cliente</dt>
                      <dd>{formatEuro(totaleClienteOrdine(archivio, o.id))}</dd>
                    </div>
                    {titolare && (
                      <div>
                        <dt className="text-pietra-scura">Costo, acconto versato</dt>
                        <dd>
                          {formatEuro(costo)}, {formatEuro(o.accontoFornitore)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <ul className="mt-5 divide-y divide-linea border-t border-linea text-sm">
                    {righe.map((r) => {
                      const a = archivio.articoli.find((x) => x.id === r.articoloId);
                      return (
                        <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="flex items-center gap-2.5">
                            <span className="size-4 rounded-[2px] ring-1 ring-grafite/10 ring-inset" style={{ backgroundColor: a?.coloreCampione }} />
                            {a?.nome}
                            <span className="text-pietra-scura">{a?.finitura}</span>
                          </span>
                          <span className="cifre text-pietra-scura">{a && formatQuantita(r.quantita, a.unita)}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {prossimo && (
                      <Button
                        misura="sm"
                        onClick={() =>
                          azione(`Ordine ${o.numero}: ${ETICHETTA_ORDINE[prossimo].toLowerCase()}`, (a, s) => avanzaOrdine(a, s, o.id))
                        }
                      >
                        {o.stato === "bozza" ? "Segna come inviato" : `Segna come ${ETICHETTA_ORDINE[prossimo].toLowerCase()}`}
                      </Button>
                    )}
                    <Button misura="sm" variante="secondario" onClick={() => setAnteprima(o.id)}>
                      Anteprima PDF
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium">Acconti del cliente</h2>
        <dl className="cifre mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Dato etichetta="Richiesti" valore={formatEuro(situazione.richiesto)} />
          <Dato etichetta="Incassati" valore={formatEuro(situazione.incassato)} />
          <Dato etichetta="Da incassare" valore={formatEuro(situazione.daIncassare)} enfasi={situazione.daIncassare > 0} />
          <Dato etichetta="Ancora da richiedere" valore={formatEuro(Math.max(0, situazione.ancoraDaRichiedere))} />
        </dl>
        <p className="mt-2 text-sm text-pietra-scura">Importi IVA esclusa, calcolati sugli ordini di questo progetto.</p>

        {acconti.length > 0 && (
          <ul className="mt-4 divide-y divide-linea border-y border-linea">
            {acconti.map((ac) => {
              const ordine = ordini.find((o) => o.id === ac.ordineId);
              return (
                <li key={ac.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="cifre">
                      {formatEuro(ac.importo)}
                      {ac.regola.tipo === "percentuale" && (
                        <span className="ml-2 text-sm text-pietra-scura">{formatPercentuale(ac.regola.percentuale)} dell&apos;ordine</span>
                      )}
                    </p>
                    <p className="text-sm text-pietra-scura">
                      {ordine ? `Ordine ${ordine.numero}` : "Progetto"}, richiesto il {formatData(ac.dataRichiesta)}
                      {ac.dataIncasso && `, incassato il ${formatData(ac.dataIncasso)}`}
                    </p>
                  </div>
                  {ac.stato === "incassato" ? (
                    <Badge tono="bosco" icona={<IconaApprovato dimensione={12} />}>Incassato</Badge>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Badge tono="ocra">Richiesto</Badge>
                      <Button misura="sm" variante="secondario" onClick={() => azione("Acconto segnato come incassato", (a, s) => segnaAccontoIncassato(a, s, ac.id))}>
                        Segna incassato
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {ordini.length > 0 && (
          <form
            className="mt-6 flex flex-col gap-4 rounded-md border border-linea p-5 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ordineAcconto || percentuale === null) return;
              azione("Richiesta di acconto registrata", (a, s) =>
                richiediAccontoCliente(a, s, id, ordineAcconto, { tipo: "percentuale", percentuale }),
              );
            }}
          >
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
              Ordine
              <select
                value={ordineAcconto}
                onChange={(e) => setOrdineAcconto(e.target.value)}
                className="h-10 rounded-md border border-linea-forte bg-carta px-2 text-base font-normal"
                required
              >
                <option value="">Scegli un ordine</option>
                {ordini.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero}, {archivio.fornitori.find((f) => f.id === o.fornitoreId)?.ragioneSociale}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:w-36">
              <Campo etichetta="Percentuale">
                {(p) => <CampoNumero {...p} valore={percentuale} suffisso="%" onCambia={(v) => setPercentuale(v)} />}
              </Campo>
            </div>
            <Button type="submit" disabled={!ordineAcconto || percentuale === null || percentuale <= 0 || percentuale > 10_000}>
              Richiedi acconto
            </Button>
          </form>
        )}
      </section>

      {anteprima && <AnteprimaOrdine id={anteprima} onChiudi={() => setAnteprima(null)} />}
    </div>
  );
}

function Dato({ etichetta, valore, enfasi }: { etichetta: string; valore: string; enfasi?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-pietra-scura">{etichetta}</dt>
      <dd className={cn("text-xl", enfasi && "text-ocra")}>{valore}</dd>
    </div>
  );
}

function AnteprimaOrdine({ id, onChiudi }: { id: Id; onChiudi: () => void }) {
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const ordine = archivio.ordini.find((o) => o.id === id);
  if (!ordine) return null;
  const titolare = sessione.ruolo === "titolare";
  const studio = archivio.studi[0];
  const fornitore = archivio.fornitori.find((f) => f.id === ordine.fornitoreId);
  const progetto = archivio.progetti.find((p) => p.id === ordine.progettoId);
  const righe = archivio.righeOrdine.filter((r) => r.ordineId === id);
  const imponibile = righe.reduce((t, r) => t + totaleRiga(r.costoUnitario, r.quantita), 0);
  const totali = totaliCliente(imponibile);

  return (
    <Pannello aperto largo onChiudi={onChiudi} titolo={`Ordine ${ordine.numero}`} sottotitolo="Anteprima del PDF da inviare al fornitore">
      <article className="rounded-sm border border-linea bg-carta p-6 text-sm shadow-etichetta">
        <header className="flex justify-between gap-6 border-b border-grafite pb-4">
          <div>
            <p className="titolo-display text-xl">{studio?.nome}</p>
            <p className="text-pietra-scura">{studio?.citta}, P.IVA {studio?.partitaIva}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Ordine n. {ordine.numero}</p>
            <p className="text-pietra-scura">{formatData(ordine.dataInvio ?? new Date().toISOString().slice(0, 10))}</p>
          </div>
        </header>
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-pietra-scura">Fornitore</p>
            <p className="font-medium">{fornitore?.ragioneSociale}</p>
            <p>Alla c.a. di {fornitore?.referente}</p>
            <p className="text-pietra-scura">{fornitore?.email}</p>
          </div>
          <div>
            <p className="text-xs text-pietra-scura">Consegna</p>
            <p className="font-medium">{progetto?.nome}</p>
            <p>{progetto?.indirizzoCantiere}</p>
            <p className="text-pietra-scura">Pagamento: {fornitore?.condizioniPagamento}</p>
          </div>
        </div>
        <table className="cifre mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-linea-forte text-xs text-pietra-scura">
              <th className="py-2 font-normal">Codice</th>
              <th className="py-2 font-normal">Descrizione</th>
              <th className="py-2 text-right font-normal">Q.tà</th>
              {titolare && <th className="py-2 text-right font-normal">Prezzo</th>}
              {titolare && <th className="py-2 text-right font-normal">Totale</th>}
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => {
              const a = archivio.articoli.find((x) => x.id === r.articoloId);
              if (!a) return null;
              return (
                <tr key={r.id} className="border-b border-linea align-top">
                  <td className="py-2 pr-3">{a.codice}</td>
                  <td className="py-2 pr-3">
                    {a.nome}
                    <span className="block text-xs text-pietra-scura">
                      {a.finitura}
                      {formatDimensioni(a.dimensioni) && `, ${formatDimensioni(a.dimensioni)}`}
                    </span>
                  </td>
                  <td className="py-2 text-right">{formatQuantita(r.quantita, a.unita)}</td>
                  {titolare && <td className="py-2 text-right">{formatEuro(r.costoUnitario)}</td>}
                  {titolare && <td className="py-2 text-right">{formatEuro(totaleRiga(r.costoUnitario, r.quantita))}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {titolare ? (
          <dl className="cifre mt-4 ml-auto w-60 text-sm">
            <div className="flex justify-between py-0.5"><dt>Imponibile</dt><dd>{formatEuro(totali.imponibile)}</dd></div>
            <div className="flex justify-between py-0.5"><dt>IVA 22%</dt><dd>{formatEuro(totali.iva)}</dd></div>
            <div className="flex justify-between border-t border-grafite py-1 font-medium"><dt>Totale</dt><dd>{formatEuro(totali.totale)}</dd></div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-pietra-scura">I prezzi d&apos;acquisto compaiono nel PDF inviato dal titolare.</p>
        )}
      </article>
      <p className="mt-4 text-sm text-pietra-scura">Nella versione completa il PDF si scarica e si invia al fornitore direttamente da qui.</p>
    </Pannello>
  );
}
