"use client";

import { useRouter } from "next/navigation";
import { IconaFreccia } from "@/components/ui/icone";
import { entraCome, useArchivio } from "@/dati/store";
import { ETICHETTA_RUOLO } from "@/dominio/etichette";
import type { Utente } from "@/dominio/tipi";

const DESCRIZIONE_RUOLO = {
  titolare: "Vede tutto lo studio, compresi costi, ricarichi e margini.",
  designer: "Gestisce progetti, schedari e libreria. Inserisce i costi ma non li rilegge.",
} as const;

/** Finiture della tavola materiali in apertura, prese dallo schedario di esempio. */
const TAVOLA = ["a01", "a02", "a03", "a05", "a12", "a13", "a09", "a06", "a18"];

export default function Accedi() {
  const archivio = useArchivio();
  const router = useRouter();
  const studio = archivio.studi[0];
  const campioni = TAVOLA.map((id) => archivio.articoli.find((a) => a.id === id)).filter((a) => a !== undefined);

  function entra(utente: Utente) {
    entraCome(utente);
    router.push("/cruscotto");
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between gap-12 bg-nebbia px-6 py-10 sm:px-12 lg:px-16 lg:py-14">
        <p className="titolo-display text-xl">Campionario</p>

        <div className="grid w-full max-w-[26rem] grid-cols-3 gap-2 sm:gap-3" aria-hidden="true">
          {campioni.map((a, i) => (
            <figure key={a.id} className={i % 3 === 1 ? "translate-y-6" : undefined}>
              <div className="aspect-square shadow-etichetta" style={{ backgroundColor: a.coloreCampione }} />
              <figcaption className="mt-2 truncate text-xs text-pietra-scura">{a.finitura}</figcaption>
            </figure>
          ))}
        </div>

        <p className="max-w-md text-lg text-grafite">
          Lo schedario di ogni progetto, stanza per stanza, dalla proposta al cliente fino all&apos;ordine al fornitore.
        </p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <h1 className="titolo-display text-3xl sm:text-4xl">Entra in {studio?.nome ?? "studio"}</h1>
          <p className="mt-3 text-pietra-scura">
            Scegli con quale ruolo provare il prototipo. Puoi cambiarlo in qualsiasi momento dal menu.
          </p>

          <ul className="mt-10 flex flex-col gap-3">
            {archivio.utenti.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => entra(u)}
                  className="group flex w-full items-center gap-4 rounded-md border border-linea-forte p-4 text-left transition-colors hover:border-grafite/50 hover:bg-nebbia"
                >
                  <span className="titolo-display flex size-12 shrink-0 items-center justify-center rounded-full bg-avio-velo text-lg text-avio">
                    {u.nome.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium">
                      {u.nome}
                      <span className="ml-2 text-sm font-normal text-pietra-scura">{ETICHETTA_RUOLO[u.ruolo]}</span>
                    </span>
                    <span className="text-sm text-pietra-scura">{DESCRIZIONE_RUOLO[u.ruolo]}</span>
                  </span>
                  <IconaFreccia className="text-pietra transition-transform group-hover:translate-x-0.5 group-hover:text-grafite" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-linea pt-6">
            <p className="text-sm text-pietra-scura">Oppure guarda cosa riceve il cliente sul telefono:</p>
            <button
              type="button"
              onClick={() => router.push("/cliente/fx7k2m9qv4rt8wz3")}
              className="mt-2 text-avio underline-offset-4 hover:underline"
            >
              Apri il link di Elena e Marco Ferraris
            </button>
          </div>

          <p className="mt-8 text-sm text-pietra-scura">
            Prototipo senza password: i dati restano in questo browser e si possono ripristinare dal menu.
          </p>
        </div>
      </section>
    </main>
  );
}
