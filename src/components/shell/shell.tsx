"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Avviso } from "@/components/ui/avviso";
import { IconaCruscotto, IconaEsci, IconaProgetti, IconaRipristina, IconaStile } from "@/components/ui/icone";
import { esci, mostraAvviso, ripristinaDatiDiEsempio, useArchivio, useCambioRuolo, useUtenteCorrente } from "@/dati/store";
import { cn } from "@/lib/cn";
import type { Ruolo } from "@/dominio/tipi";

interface Voce {
  href: string;
  etichetta: string;
  icona: ComponentType<{ dimensione?: number; className?: string }>;
}

/** Le voci crescono fase dopo fase: qui solo ciò che esiste davvero. */
const VOCI: Voce[] = [
  { href: "/cruscotto", etichetta: "Cruscotto", icona: IconaCruscotto },
  { href: "/progetti", etichetta: "Progetti", icona: IconaProgetti },
];
const VOCI_PROTOTIPO: Voce[] = [{ href: "/stile", etichetta: "Sistema visivo", icona: IconaStile }];

const RUOLI = [
  { valore: "titolare", etichetta: "Titolare" },
  { valore: "designer", etichetta: "Designer" },
] as const;

function attiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function VoceMenu({ voce, pathname }: { voce: Voce; pathname: string }) {
  const Icona = voce.icona;
  const corrente = attiva(pathname, voce.href);
  return (
    <Link
      href={voce.href}
      aria-current={corrente ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-2.5 text-base transition-colors",
        corrente ? "bg-nebbia font-medium text-grafite" : "text-pietra-scura hover:bg-nebbia hover:text-grafite",
      )}
    >
      <Icona dimensione={18} className={corrente ? "text-avio" : undefined} />
      {voce.etichetta}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const archivio = useArchivio();
  const utente = useUtenteCorrente();
  const cambiaRuolo = useCambioRuolo();
  const studio = archivio.studi[0];

  const sceltaRuolo = utente && (
    <Segmented<Ruolo>
      etichetta="Prova l'app come"
      opzioni={RUOLI}
      valore={utente.ruolo}
      onCambia={cambiaRuolo}
      className="w-full [&>button]:flex-1 [&>button]:justify-center"
    />
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <a
        href="#contenuto"
        className="sr-only z-50 rounded-md bg-avio px-4 py-2 text-carta focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Vai al contenuto
      </a>

      {/* Barra laterale, da desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-linea px-4 py-6 lg:flex">
        <Link href="/progetti" className="px-2.5">
          <span className="titolo-display block text-xl leading-tight">{studio?.nome}</span>
          <span className="mt-0.5 block text-sm text-pietra-scura">{studio?.citta}</span>
        </Link>

        <nav aria-label="Principale" className="mt-10 flex flex-col gap-0.5">
          {VOCI.map((v) => (
            <VoceMenu key={v.href} voce={v} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-5">
          <div className="flex flex-col gap-0.5 border-t border-linea pt-4">
            <p className="px-2.5 pb-1 text-xs text-pietra">Strumenti del prototipo</p>
            {VOCI_PROTOTIPO.map((v) => (
              <VoceMenu key={v.href} voce={v} pathname={pathname} />
            ))}
            <button
              type="button"
              onClick={() => {
                ripristinaDatiDiEsempio();
                mostraAvviso("Dati di esempio ripristinati");
              }}
              className="flex h-9 items-center gap-3 rounded-md px-2.5 text-left text-base text-pietra-scura transition-colors hover:bg-nebbia hover:text-grafite"
            >
              <IconaRipristina dimensione={18} />
              Ripristina i dati
            </button>
          </div>

          {utente && (
            <div className="flex flex-col gap-3 border-t border-linea pt-4">
              <div className="flex items-center justify-between gap-2 px-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{utente.nome}</p>
                  <p className="text-xs text-pietra-scura">
                    {utente.ruolo === "titolare" ? "Vedi costi e margini" : "Costi e margini nascosti"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    esci();
                    router.push("/accedi");
                  }}
                  className="flex size-8 items-center justify-center rounded-md text-pietra-scura hover:bg-nebbia hover:text-grafite"
                  aria-label="Esci"
                  title="Esci"
                >
                  <IconaEsci dimensione={18} />
                </button>
              </div>
              {sceltaRuolo}
            </div>
          )}
        </div>
      </aside>

      {/* Intestazione, da telefono */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-linea bg-carta/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/progetti" className="titolo-display truncate text-lg">
          {studio?.nome}
        </Link>
        <div className="w-44 shrink-0">{sceltaRuolo}</div>
      </header>

      <main id="contenuto" className="min-w-0 pb-24 lg:pb-0">
        {children}
      </main>

      <Avviso />

      {/* Barra di navigazione in basso, a portata di pollice */}
      <nav
        aria-label="Principale"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-linea bg-carta/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {[...VOCI, ...VOCI_PROTOTIPO].map((v) => {
          const Icona = v.icona;
          const corrente = attiva(pathname, v.href);
          return (
            <Link
              key={v.href}
              href={v.href}
              aria-current={corrente ? "page" : undefined}
              className={cn(
                "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs",
                corrente ? "font-medium text-avio" : "text-pietra-scura",
              )}
            >
              <Icona dimensione={22} />
              {v.etichetta}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
