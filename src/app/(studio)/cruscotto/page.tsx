"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgeInRitardo } from "@/components/ui/badge";
import { leggiProgetti } from "@/dati/accesso";
import { useSessioneAttiva } from "@/dati/hooks";
import { useArchivio, useUtenteCorrente } from "@/dati/store";
import { somma } from "@/lib/denaro";
import { formatData, formatDataEstesa, formatEuro, formatEuroArrotondato, formatPercentuale } from "@/lib/formato";
import { margine } from "@/lib/prezzi";
import { inRitardo } from "@/lib/ordini";
import { cn } from "@/lib/cn";

export default function Cruscotto() {
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const utente = useUtenteCorrente();
  const progetti = useMemo(() => leggiProgetti(archivio, sessione), [archivio, sessione]);
  const titolare = sessione.ruolo === "titolare";

  const attivi = progetti.filter((p) => p.progetto.fase !== "chiuso");
  const valore = somma(attivi.map((p) => p.valoreApprovato));
  const costo = somma(attivi.map((p) => p.economia?.costoForniture ?? 0));
  const m = margine(costo, valore);
  const inAttesa = somma(attivi.map((p) => p.inAttesa));
  const ritardo = archivio.ordini.filter((o) => o.studioId === sessione.studioId && inRitardo(o));
  const daIncassare = archivio.accontiClienti.filter((a) => a.studioId === sessione.studioId && a.stato === "richiesto");
  const oggi = new Date().toISOString().slice(0, 10);
  const nome = utente?.nome.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
      <p className="text-pietra-scura">{formatDataEstesa(oggi)}</p>
      <h1 className="titolo-display mt-1 text-4xl sm:text-5xl">Buongiorno, {nome}</h1>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-linea bg-linea lg:grid-cols-3">
        <Tessera etichetta="Progetti in corso" valore={String(attivi.length)} />
        <Tessera etichetta="Forniture approvate" valore={formatEuroArrotondato(valore)} nota="IVA esclusa" />
        {titolare ? (
          <Tessera
            etichetta="Margine forniture"
            valore={formatEuroArrotondato(m.importo)}
            nota={m.percentuale !== null ? `${formatPercentuale(Math.round(m.percentuale / 100) * 100)} sul venduto` : undefined}
          />
        ) : (
          <Tessera etichetta="Margine forniture" valore="Riservato" nota="Visibile solo al titolare" quieta />
        )}
        <Tessera etichetta="In attesa del cliente" valore={String(inAttesa)} tono={inAttesa > 0 ? "ocra" : undefined} nota="articoli da approvare" />
        <Tessera etichetta="Ordini in ritardo" valore={String(ritardo.length)} tono={ritardo.length > 0 ? "prugna" : undefined} />
        <Tessera
          etichetta="Acconti da incassare"
          valore={formatEuroArrotondato(somma(daIncassare.map((a) => a.importo)))}
          nota={`${daIncassare.length} ${daIncassare.length === 1 ? "richiesta" : "richieste"}`}
          tono={daIncassare.length > 0 ? "ocra" : undefined}
        />
      </dl>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-medium">Da sollecitare</h2>
          {ritardo.length === 0 && daIncassare.length === 0 ? (
            <p className="mt-2 text-pietra-scura">Nessun ordine in ritardo e nessun acconto in sospeso.</p>
          ) : (
            <ul className="mt-3 divide-y divide-linea border-y border-linea">
              {ritardo.map((o) => {
                const f = archivio.fornitori.find((x) => x.id === o.fornitoreId);
                const p = archivio.progetti.find((x) => x.id === o.progettoId);
                return (
                  <li key={o.id}>
                    <Link href={`/progetti/${o.progettoId}/ordini`} className="flex items-center justify-between gap-3 py-3 hover:bg-nebbia">
                      <span>
                        <span className="block">{f?.ragioneSociale}</span>
                        <span className="text-sm text-pietra-scura">
                          {p?.nome}, ordine {o.numero}, consegna prevista {o.consegnaPrevista && formatData(o.consegnaPrevista)}
                        </span>
                      </span>
                      <BadgeInRitardo />
                    </Link>
                  </li>
                );
              })}
              {daIncassare.map((a) => {
                const p = archivio.progetti.find((x) => x.id === a.progettoId);
                return (
                  <li key={a.id}>
                    <Link href={`/progetti/${a.progettoId}/ordini`} className="flex items-center justify-between gap-3 py-3 hover:bg-nebbia">
                      <span>
                        <span className="block">Acconto di {formatEuro(a.importo)}</span>
                        <span className="text-sm text-pietra-scura">
                          {p?.nome}, richiesto il {formatData(a.dataRichiesta)}
                        </span>
                      </span>
                      <span className="text-sm text-ocra">Da incassare</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium">Attività recente</h2>
          <ol className="mt-4 flex flex-col gap-4 border-l border-linea pl-4">
            {archivio.registro
              .filter((r) => r.studioId === sessione.studioId)
              .slice(0, 8)
              .map((r) => {
                const p = archivio.progetti.find((x) => x.id === r.progettoId);
                return (
                  <li key={r.id} className="text-sm">
                    <p className="text-pietra-scura">
                      {formatData(r.creatoIl.slice(0, 10))}, {p?.nome}
                    </p>
                    <p className="mt-0.5">{r.dettaglio}</p>
                  </li>
                );
              })}
          </ol>
        </section>
      </div>
    </div>
  );
}

function Tessera({
  etichetta,
  valore,
  nota,
  tono,
  quieta,
}: {
  etichetta: string;
  valore: string;
  nota?: string;
  tono?: "ocra" | "prugna";
  quieta?: boolean;
}) {
  return (
    <div className="bg-carta p-5 sm:p-6">
      <dt className="text-sm text-pietra-scura">{etichetta}</dt>
      <dd
        className={cn(
          "cifre mt-2 text-3xl",
          tono === "ocra" && "text-ocra",
          tono === "prugna" && "text-prugna",
          quieta && "text-xl text-pietra-scura",
        )}
      >
        {valore}
      </dd>
      {nota && <dd className="mt-1 text-xs text-pietra-scura">{nota}</dd>}
    </div>
  );
}
