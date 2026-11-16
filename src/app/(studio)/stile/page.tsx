"use client";

import { useState, type ReactNode } from "react";
import { SchedaCampione } from "@/components/campionario/scheda-campione";
import { BarraBudget } from "@/components/progetto/barra-budget";
import { IndicatoreFase } from "@/components/progetto/indicatore-fase";
import { Badge, BadgeFuoriBudget, BadgeInRitardo, BadgeStato } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Campo, CampoNumero, Input } from "@/components/ui/input";
import { useArchivio } from "@/dati/store";
import { statoBudget } from "@/lib/budget";
import { formatEuro } from "@/lib/formato";
import { prezzoDaRicarico } from "@/lib/prezzi";

const COLORI = [
  { nome: "Carta", hex: "#FFFFFF", uso: "Fondo" },
  { nome: "Nebbia", hex: "#F5F6F3", uso: "Superfici secondarie" },
  { nome: "Grafite", hex: "#1F2328", uso: "Testo" },
  { nome: "Pietra scura", hex: "#5E645C", uso: "Testo secondario" },
  { nome: "Pietra", hex: "#8A8F87", uso: "Icone e dettagli" },
  { nome: "Blu avio", hex: "#2D4A6B", uso: "Solo azioni principali" },
];

const STATI = [
  { nome: "Bosco", hex: "#2F6B4F", uso: "Approvato" },
  { nome: "Mattone", hex: "#A23B2C", uso: "Rifiutato" },
  { nome: "Ocra", hex: "#87590A", uso: "Da rivedere" },
  { nome: "Prugna", hex: "#7A3B69", uso: "In ritardo, fuori budget" },
];

export default function SistemaVisivo() {
  const archivio = useArchivio();
  const fornitori = new Map(archivio.fornitori.map((f) => [f.id, f]));
  const esempi = ["a01", "a05", "a06", "a07"]
    .map((id) => archivio.articoli.find((a) => a.id === id))
    .filter((a) => a !== undefined);

  const [costo, setCosto] = useState<number | null>(134_000);
  const [ricarico, setRicarico] = useState<number | null>(3500);
  const [costoValido, setCostoValido] = useState(true);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
      <header className="max-w-2xl">
        <h1 className="titolo-display text-4xl sm:text-5xl">Sistema visivo</h1>
        <p className="mt-3 text-lg text-pietra-scura">
          I mattoni dell&apos;interfaccia, con i dati dello studio di esempio. Le schermate delle prossime fasi useranno
          solo questi.
        </p>
      </header>

      <Sezione titolo="Colori" descrizione="Pochi colori, ognuno con un compito. Il blu avio compare solo dove si agisce.">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {COLORI.map((c) => (
            <Tinta key={c.hex} {...c} />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {STATI.map((c) => (
            <Tinta key={c.hex} {...c} />
          ))}
        </div>
      </Sezione>

      <Sezione
        titolo="Tipografia"
        descrizione="Bodoni Moda per i nomi di progetti e stanze, Instrument Sans per tutto il resto. Le cifre sono sempre allineate in colonna."
      >
        <div className="flex flex-col gap-6">
          <Riga etichetta="Titolo pagina">
            <p className="titolo-display text-5xl">Casa Ferraris</p>
          </Riga>
          <Riga etichetta="Titolo sezione">
            <p className="titolo-display text-3xl">Bagno padronale</p>
          </Riga>
          <Riga etichetta="Testo">
            <p className="max-w-prose">
              Divano a tre posti con struttura in faggio e rivestimento sfoderabile. Consegna prevista in otto
              settimane dalla conferma d&apos;ordine.
            </p>
          </Riga>
          <Riga etichetta="Cifre">
            <p className="cifre text-xl">
              {formatEuro(519_750)}
              <span className="ml-6 text-pietra-scura">{formatEuro(1_360_525)}</span>
            </p>
          </Riga>
        </div>
      </Sezione>

      <Sezione
        titolo="Stati"
        descrizione="Colore, simbolo e parola insieme: si riconoscono a colpo d'occhio e anche da chi non distingue i colori."
      >
        <div className="flex flex-wrap gap-2">
          <BadgeStato stato="proposto" />
          <BadgeStato stato="approvato" />
          <BadgeStato stato="da_rivedere" />
          <BadgeStato stato="rifiutato" />
          <BadgeInRitardo />
          <BadgeFuoriBudget />
          <Badge tono="avio">Ordinato</Badge>
        </div>
      </Sezione>

      <Sezione titolo="Scheda campione" descrizione="La foto è protagonista. Senza foto, un disegno al tratto tinto con il colore della finitura.">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {esempi.map((a) => (
            <SchedaCampione key={a.id} articolo={a} fornitore={fornitori.get(a.fornitoreId)} />
          ))}
        </div>
      </Sezione>

      <Sezione titolo="Budget e fasi" descrizione="Verde entro il budget, ocra oltre il 90%, prugna quando lo supera.">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <BarraBudget stato={statoBudget(741_180, 1_400_000)} />
            <BarraBudget stato={statoBudget(1_360_525, 1_500_000)} />
            <BarraBudget stato={statoBudget(417_704, 400_000)} />
            <BarraBudget stato={statoBudget(2_046_300, null)} />
          </div>
          <div className="flex flex-col gap-8">
            <IndicatoreFase fase="concept" />
            <IndicatoreFase fase="forniture" />
            <IndicatoreFase fase="chiuso" />
          </div>
        </div>
      </Sezione>

      <Sezione titolo="Pulsanti e campi" descrizione="I numeri si scrivono all'italiana: il campo li rilegge e li riformatta quando lo lasci.">
        <div className="flex flex-wrap gap-3">
          <Button>Invia al cliente</Button>
          <Button variante="secondario">Duplica</Button>
          <Button variante="quieto">Annulla</Button>
          <Button variante="pericolo">Revoca link</Button>
          <Button disabled>Ordina</Button>
        </div>

        <div className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-3">
          <Campo etichetta="Nome articolo">{(p) => <Input {...p} defaultValue="Poltrona Lario" />}</Campo>
          <Campo
            etichetta="Costo netto"
            errore={costoValido ? null : "Scrivi un importo, per esempio 1.340,00"}
          >
            {(p) => (
              <CampoNumero
                {...p}
                valore={costo}
                suffisso="€"
                onCambia={(v, valido) => {
                  setCosto(v);
                  setCostoValido(valido);
                }}
              />
            )}
          </Campo>
          <Campo etichetta="Ricarico">
            {(p) => <CampoNumero {...p} valore={ricarico} suffisso="%" onCambia={(v) => setRicarico(v)} />}
          </Campo>
        </div>
        <p className="cifre mt-4 text-pietra-scura">
          Prezzo cliente:{" "}
          <span className="font-medium text-grafite">
            {costo !== null && ricarico !== null ? formatEuro(prezzoDaRicarico(costo, ricarico)) : "—"}
          </span>
        </p>
      </Sezione>
    </div>
  );
}

function Sezione({ titolo, descrizione, children }: { titolo: string; descrizione: string; children: ReactNode }) {
  return (
    <section className="mt-16 border-t border-linea pt-8 lg:mt-20 lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
      <div className="mb-8 lg:mb-0">
        <h2 className="text-lg font-medium">{titolo}</h2>
        <p className="mt-1.5 text-sm text-pietra-scura">{descrizione}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Riga({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:items-baseline sm:gap-6">
      <p className="text-sm text-pietra">{etichetta}</p>
      {children}
    </div>
  );
}

function Tinta({ nome, hex, uso }: { nome: string; hex: string; uso: string }) {
  return (
    <div>
      <div className="aspect-[4/3] ring-1 ring-grafite/10 ring-inset" style={{ backgroundColor: hex }} />
      <p className="mt-2 text-sm font-medium">{nome}</p>
      <p className="cifre text-xs text-pietra-scura">{hex}</p>
      <p className="text-xs text-pietra-scura">{uso}</p>
    </div>
  );
}
