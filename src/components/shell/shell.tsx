"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Avviso } from "@/components/ui/avviso";
import { IconaEsci, IconaProgetti } from "@/components/ui/icone";
import { useSessioneStudio } from "@/dati/sessione-studio";
import { ETICHETTA_RUOLO } from "@/dominio/etichette";
import { esci } from "@/lib/supabase/accesso";
import { cn } from "@/lib/cn";

interface Voce {
  href: string;
  etichetta: string;
  icona: ComponentType<{ dimensione?: number; className?: string }>;
}

/**
 * Super mini MVP: solo i progetti. Cruscotto, ordini, riepilogo e sistema visivo
 * restano nel codice ma fuori dal menu.
 */
const VOCI: Voce[] = [{ href: "/progetti", etichetta: "Progetti", icona: IconaProgetti }];

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

function PulsanteEsci({ className }: { className?: string }) {
  return (
    <form action={esci}>
      <button
        type="submit"
        className={cn(
          "flex size-11 items-center justify-center rounded-md text-pietra-scura hover:bg-nebbia hover:text-grafite lg:size-9",
          className,
        )}
        aria-label="Esci"
        title="Esci"
      >
        <IconaEsci dimensione={18} />
      </button>
    </form>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { utente, studio } = useSessioneStudio();

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
          <span className="titolo-display line-clamp-3 text-xl leading-tight [overflow-wrap:anywhere]" title={studio.nome}>
            {studio.nome}
          </span>
        </Link>

        <nav aria-label="Principale" className="mt-10 flex flex-col gap-0.5">
          {VOCI.map((v) => (
            <VoceMenu key={v.href} voce={v} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-linea pt-4 pl-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{utente.nome}</p>
            <p className="truncate text-xs text-pietra-scura" title={utente.email}>
              {ETICHETTA_RUOLO[utente.ruolo]}
            </p>
          </div>
          <PulsanteEsci />
        </div>
      </aside>

      {/* Intestazione, da telefono */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-linea bg-carta/95 py-1 pr-1 pl-4 backdrop-blur lg:hidden">
        <Link href="/progetti" className="titolo-display min-w-0 truncate text-lg">
          {studio.nome}
        </Link>
        <PulsanteEsci />
      </header>

      <main id="contenuto" className="min-w-0">
        {children}
      </main>

      <Avviso />
    </div>
  );
}
