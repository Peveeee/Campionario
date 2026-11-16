"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PaletteProgetto } from "@/components/campionario/palette-progetto";
import { IndicatoreFase } from "@/components/progetto/indicatore-fase";
import { leggiArticoli } from "@/dati/accesso";
import { useProgetto, useSessioneAttiva } from "@/dati/hooks";
import { useArchivio } from "@/dati/store";
import { cn } from "@/lib/cn";

export default function LayoutProgetto({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const voce = useProgetto(id);
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();

  if (!voce) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 lg:px-12">
        <p className="text-lg">Questo progetto non esiste o non fa parte del tuo studio.</p>
        <Link href="/progetti" className="mt-4 inline-block text-avio underline underline-offset-4">
          Torna ai progetti
        </Link>
      </div>
    );
  }

  const idStanze = new Set(voce.stanze.map((s) => s.stanza.id));
  const articoli = leggiArticoli(archivio, sessione).filter((a) => idStanze.has(a.stanzaId));

  // Ordini e riepilogo restano nel codice ma fuori dal super mini MVP.
  const schede = [
    { href: `/progetti/${id}/schedario`, etichetta: "Schedario", conteggio: voce.articoli },
    { href: `/progetti/${id}/approvazioni`, etichetta: "Approvazioni", conteggio: voce.inAttesa },
  ];

  return (
    <div>
      <PaletteProgetto articoli={articoli} className="h-1.5" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-6 pt-8 lg:flex-row lg:items-end lg:justify-between lg:pt-12">
          <div className="min-w-0">
            <Link href="/progetti" className="text-sm text-pietra-scura hover:text-grafite">
              Progetti
            </Link>
            <h1 className="titolo-display mt-1 text-4xl sm:text-5xl">{voce.progetto.nome}</h1>
            <p className="mt-2 text-pietra-scura">
              {voce.cliente?.nome}
              <span className="mx-2 text-linea-forte" aria-hidden="true">/</span>
              {voce.progetto.indirizzoCantiere}
            </p>
          </div>
          <IndicatoreFase fase={voce.progetto.fase} className="w-full max-w-64" />
        </header>

        <nav aria-label="Sezioni del progetto" className="-mx-4 mt-8 overflow-x-auto border-b border-linea px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-6">
            {schede.map((s) => {
              const attiva = pathname === s.href;
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={attiva ? "page" : undefined}
                    className={cn(
                      "-mb-px flex h-11 items-center gap-2 border-b-2 text-base whitespace-nowrap transition-colors",
                      attiva ? "border-avio font-medium text-grafite" : "border-transparent text-pietra-scura hover:text-grafite",
                    )}
                  >
                    {s.etichetta}
                    {s.conteggio !== undefined && s.conteggio > 0 && (
                      <span className="cifre rounded-sm bg-nebbia px-1.5 text-xs text-pietra-scura">{s.conteggio}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="py-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
