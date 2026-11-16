"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeStato } from "@/components/ui/badge";
import { Button, stiliPulsante } from "@/components/ui/button";
import { creaLinkCliente, revocaLink } from "@/dati/azioni";
import { useAzione, useProgetto, useSessioneAttiva } from "@/dati/hooks";
import { mostraAvviso, useArchivio } from "@/dati/store";
import { formatData } from "@/lib/formato";

export default function Approvazioni() {
  const { id } = useParams<{ id: string }>();
  const archivio = useArchivio();
  const sessione = useSessioneAttiva();
  const azione = useAzione();
  const voce = useProgetto(id);
  if (!voce) return null;

  const link = archivio.linkClienti.filter((l) => l.progettoId === id && !l.revocatoIl).at(-1) ?? null;
  const percorso = link ? `/cliente/${link.token}` : null;
  const idStanze = new Set(voce.stanze.map((s) => s.stanza.id));
  const articoli = archivio.articoli.filter((a) => idStanze.has(a.stanzaId) && a.studioId === sessione.studioId);
  const variante = (a: (typeof articoli)[number]) => a.versioneApprovata !== null && a.versioneApprovata !== a.versione;
  const richieste = articoli.filter((a) => a.stato === "da_rivedere" && a.notaCliente && !variante(a));
  const varianti = articoli.filter((a) => a.stato === "da_rivedere" && variante(a));
  const proposti = articoli.filter((a) => a.stato === "proposto");
  const attivita = archivio.registro.filter((r) => r.progettoId === id).slice(0, 12);

  async function copia() {
    if (!percorso) return;
    const indirizzo = `${window.location.origin}${window.location.pathname}#${percorso.replace(/^\//, "").split("/").join("--")}`;
    try {
      await navigator.clipboard.writeText(indirizzo);
      mostraAvviso("Link copiato");
    } catch {
      mostraAvviso("Copia non riuscita: seleziona il link e copialo a mano");
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-10">
        <section className="rounded-md border border-linea p-5 sm:p-6">
          <h2 className="text-lg font-medium">Link per {voce.cliente?.nome}</h2>
          {link ? (
            <>
              <p className="mt-1 text-pietra-scura">
                Il cliente apre il link dal telefono, vede foto e prezzi al pubblico e approva articolo per articolo. Nessun
                account, nessuna password. Scade il {formatData(link.scadeIl)}.
              </p>
              <p className="cifre mt-4 truncate rounded-sm bg-nebbia px-3 py-2 text-sm text-pietra-scura">
                campionario.app{percorso}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={percorso!} className={stiliPulsante({})}>
                  Apri la vista del cliente
                </Link>
                <Button variante="secondario" onClick={copia}>
                  Copia il link
                </Button>
                <Button
                  variante="pericolo"
                  onClick={() => azione("Link revocato: il cliente non può più aprirlo", (a, s) => revocaLink(a, s, link.id))}
                >
                  Revoca
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-pietra-scura">Nessun link attivo. Creane uno: varrà 30 giorni e potrai revocarlo quando vuoi.</p>
              <Button className="mt-4" onClick={() => azione("Nuovo link creato", (a, s) => creaLinkCliente(a, s, id))}>
                Crea il link per il cliente
              </Button>
            </>
          )}
        </section>

        <ListaArticoli
          titolo="Il cliente chiede modifiche"
          vuoto="Nessuna richiesta di modifica in sospeso."
          articoli={richieste.map((a) => ({ id: a.id, nome: a.nome, stato: a.stato, nota: a.notaCliente }))}
          progettoId={id}
        />
        <ListaArticoli
          titolo="Varianti in attesa di riapprovazione"
          vuoto="Nessuna variante in attesa."
          articoli={varianti.map((a) => ({ id: a.id, nome: a.nome, stato: a.stato, nota: null }))}
          progettoId={id}
        />
        <ListaArticoli
          titolo="Proposte in attesa della prima risposta"
          vuoto="Il cliente ha risposto su tutte le proposte."
          articoli={proposti.map((a) => ({ id: a.id, nome: a.nome, stato: a.stato, nota: null }))}
          progettoId={id}
        />
      </div>

      <aside>
        <h2 className="text-lg font-medium">Attività</h2>
        {attivita.length === 0 ? (
          <p className="mt-3 text-pietra-scura">Ancora nessuna attività su questo progetto.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-4 border-l border-linea pl-4">
            {attivita.map((r) => {
              const chi =
                r.autore.tipo === "cliente"
                  ? voce.cliente?.nome
                  : archivio.utenti.find((u) => r.autore.tipo === "utente" && u.id === r.autore.utenteId)?.nome;
              return (
                <li key={r.id} className="text-sm">
                  <p className="text-pietra-scura">
                    {formatData(r.creatoIl.slice(0, 10))}, {chi}
                  </p>
                  <p className="mt-0.5">{r.dettaglio}</p>
                </li>
              );
            })}
          </ol>
        )}
      </aside>
    </div>
  );
}

function ListaArticoli({
  titolo,
  vuoto,
  articoli,
  progettoId,
}: {
  titolo: string;
  vuoto: string;
  articoli: { id: string; nome: string; stato: "proposto" | "approvato" | "rifiutato" | "da_rivedere"; nota: string | null }[];
  progettoId: string;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-2 text-lg font-medium">
        {titolo}
        <span className="cifre text-sm font-normal text-pietra-scura">{articoli.length}</span>
      </h2>
      {articoli.length === 0 ? (
        <p className="mt-2 text-pietra-scura">{vuoto}</p>
      ) : (
        <ul className="mt-3 divide-y divide-linea border-y border-linea">
          {articoli.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p>{a.nome}</p>
                {a.nota && <p className="text-sm text-pietra-scura italic">«{a.nota}»</p>}
              </div>
              <div className="flex items-center gap-3">
                <BadgeStato stato={a.stato} />
                <Link href={`/progetti/${progettoId}/schedario`} className="text-sm text-avio underline-offset-4 hover:underline">
                  Apri nello schedario
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
