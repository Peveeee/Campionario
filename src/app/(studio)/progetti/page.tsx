"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PaletteProgetto } from "@/components/campionario/palette-progetto";
import { BarraBudget } from "@/components/progetto/barra-budget";
import { IndicatoreFase } from "@/components/progetto/indicatore-fase";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { leggiArticoli, leggiProgetti, type ProgettoInElenco, type Sessione } from "@/dati/accesso";
import { useArchivio, useSessione } from "@/dati/store";
import { ETICHETTA_FASE } from "@/dominio/etichette";
import { FASI, type Articolo, type Fase } from "@/dominio/tipi";
import { formatEuroArrotondato, formatPercentuale } from "@/lib/formato";

type Filtro = Fase | "tutti";

export default function Progetti() {
  const archivio = useArchivio();
  const sessione = useSessione() as Sessione;
  const [filtro, setFiltro] = useState<Filtro>("tutti");

  const tutti = useMemo(() => leggiProgetti(archivio, sessione), [archivio, sessione]);
  const articoli = useMemo(() => leggiArticoli(archivio, sessione), [archivio, sessione]);
  const visibili = filtro === "tutti" ? tutti : tutti.filter((p) => p.progetto.fase === filtro);
  const attivi = tutti.filter((p) => p.progetto.fase !== "chiuso").length;

  const opzioni = [
    { valore: "tutti" as const, etichetta: "Tutti", conteggio: tutti.length },
    ...FASI.map((f) => ({
      valore: f,
      etichetta: ETICHETTA_FASE[f],
      conteggio: tutti.filter((p) => p.progetto.fase === f).length,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
      <header className="flex flex-col gap-6">
        <div>
          <h1 className="titolo-display text-4xl sm:text-5xl">Progetti</h1>
          <p className="mt-2 text-pietra-scura">
            {attivi === 1 ? "1 progetto in corso" : `${attivi} progetti in corso`}
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented<Filtro> etichetta="Filtra per fase" opzioni={opzioni} valore={filtro} onCambia={setFiltro} />
        </div>
      </header>

      {visibili.length === 0 ? (
        <div className="mt-16 flex flex-col items-start gap-4 border-t border-linea pt-10">
          <p className="text-lg">
            Nessun progetto in fase {ETICHETTA_FASE[filtro as Fase].toLowerCase()}.
          </p>
          <Button variante="secondario" onClick={() => setFiltro("tutti")}>
            Mostra tutti i progetti
          </Button>
        </div>
      ) : (
        <ul className="mt-12 flex flex-col gap-16">
          {visibili.map((p) => (
            <li key={p.progetto.id}>
              <SchedaProgetto voce={p} articoli={articoli} titolare={sessione.ruolo === "titolare"} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SchedaProgetto({
  voce,
  articoli,
  titolare,
}: {
  voce: ProgettoInElenco;
  articoli: Articolo[];
  titolare: boolean;
}) {
  const { progetto, cliente, economia } = voce;
  const idStanze = new Set(voce.stanze.map((s) => s.stanza.id));
  const articoliProgetto = articoli.filter((a) => idStanze.has(a.stanzaId));

  return (
    <article aria-labelledby={`titolo-${progetto.id}`}>
      <PaletteProgetto articoli={articoliProgetto} />

      <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2 id={`titolo-${progetto.id}`} className="titolo-display text-3xl">
              <Link href={`/progetti/${progetto.id}/schedario`} className="decoration-1 underline-offset-[6px] hover:underline">
                {progetto.nome}
              </Link>
            </h2>
            <p className="text-pietra-scura">
              {cliente?.nome}
              <span className="mx-2 text-linea-forte" aria-hidden="true">/</span>
              {progetto.indirizzoCantiere}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <Dato etichetta="Approvati" valore={`${voce.approvati} di ${voce.articoli}`} />
            <Dato
              etichetta="In attesa del cliente"
              valore={String(voce.inAttesa)}
              enfasi={voce.inAttesa > 0}
            />
            <Dato etichetta="Forniture approvate" valore={formatEuroArrotondato(voce.valoreApprovato)} />
            {titolare && economia ? (
              <Dato
                etichetta="Margine forniture"
                valore={formatEuroArrotondato(economia.margineForniture.importo)}
                nota={economia.margineForniture.percentuale !== null ? formatPercentuale(economia.margineForniture.percentuale) : undefined}
              />
            ) : (
              <Dato etichetta="Parcella" valore={formatEuroArrotondato(progetto.parcella)} />
            )}
          </dl>
        </div>

        <IndicatoreFase fase={progetto.fase} className="lg:pt-2" />
      </div>

      <section aria-label={`Stanze di ${progetto.nome}`} className="mt-10">
        <h3 className="text-sm text-pietra-scura">Budget per stanza</h3>
        <ul className="mt-3 divide-y divide-linea border-y border-linea">
          {voce.stanze.map(({ stanza, budget }) => (
            <li key={stanza.id} className="grid items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[13.75rem_1fr]">
              <p className="flex items-baseline gap-3">
                <span className="cifre w-11 shrink-0 text-sm font-medium tracking-wide text-pietra-scura">{stanza.codice}</span>
                <span className="truncate">{stanza.nome}</span>
              </p>
              <BarraBudget stato={budget} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function Dato({ etichetta, valore, nota, enfasi }: { etichetta: string; valore: string; nota?: string; enfasi?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-pietra-scura">{etichetta}</dt>
      <dd className="cifre text-xl">
        <span className={enfasi ? "text-ocra" : undefined}>{valore}</span>
        {nota && <span className="ml-2 text-sm text-pietra-scura">{nota}</span>}
      </dd>
    </div>
  );
}
