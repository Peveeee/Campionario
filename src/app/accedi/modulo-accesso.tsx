"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/input";
import { entraConCodice, inviaMagicLink, type EsitoCodice, type EsitoInvio } from "@/lib/supabase/accesso";

export function ModuloAccesso({ poi, errore }: { poi: string; errore: string | null }) {
  const [esito, invia, inCorso] = useActionState<EsitoInvio | null, FormData>(inviaMagicLink, null);
  const [esitoCodice, verifica, verificaInCorso] = useActionState<EsitoCodice, FormData>(entraConCodice, null);
  const [altraEmail, setAltraEmail] = useState(false);
  const [esitoVisto, setEsitoVisto] = useState(esito);
  // Un nuovo invio riporta alla conferma, anche dopo "Usa un'altra email".
  if (esito !== esitoVisto) {
    setEsitoVisto(esito);
    setAltraEmail(false);
  }

  if (esito?.stato === "inviato" && !altraEmail) {
    return (
      <div className="animate-[sale_200ms_var(--ease-morbido)]" aria-live="polite">
        <h1 className="titolo-display text-3xl text-balance sm:text-4xl">Controlla la posta</h1>
        <p className="mt-4 text-lg text-grafite">
          Abbiamo mandato un codice a <strong className="font-medium [overflow-wrap:anywhere]">{esito.email}</strong>.
        </p>

        <form action={verifica} className="mt-8 flex flex-col gap-5" noValidate>
          <input type="hidden" name="email" value={esito.email} />
          <input type="hidden" name="poi" value={poi} />
          <Campo etichetta="Codice dell'email" errore={esitoCodice?.messaggio}>
            {(props) => (
              <Input
                {...props}
                name="codice"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                pattern="[0-9]*"
                autoFocus
                placeholder="Codice"
                className="cifre h-14 text-center text-2xl tracking-[0.4em]"
              />
            )}
          </Campo>
          <Button type="submit" misura="lg" className="w-full" disabled={verificaInCorso}>
            {verificaInCorso ? "Controllo il codice…" : "Entra"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-pietra-scura">
          Oppure apri il link nell&apos;email da questo dispositivo: entri direttamente.
        </p>

        <div className="mt-10 border-t border-linea pt-6">
          <p className="text-sm text-pietra-scura">Non arriva? Guarda nella posta indesiderata, oppure:</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <form action={invia}>
              <input type="hidden" name="email" value={esito.email} />
              <input type="hidden" name="poi" value={poi} />
              <Button type="submit" variante="secondario" disabled={inCorso}>
                {inCorso ? "Invio in corso…" : "Manda un nuovo codice"}
              </Button>
            </form>
            <Button variante="quieto" onClick={() => setAltraEmail(true)}>
              Usa un&apos;altra email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const messaggioErrore = esito?.stato === "errore" ? esito.messaggio : null;

  return (
    <div>
      <h1 className="titolo-display text-3xl text-balance sm:text-4xl">Entra nel tuo studio</h1>
      <p className="mt-3 text-pietra-scura">Scrivi la tua email: ti mandiamo un codice per entrare, senza password.</p>

      {errore && !esito && (
        <p role="alert" className="mt-8 border-l-2 border-mattone bg-mattone-velo px-4 py-3 text-sm text-grafite">
          {errore}
        </p>
      )}

      <form action={invia} className="mt-8 flex flex-col gap-5" noValidate>
        <input type="hidden" name="poi" value={poi} />
        <Campo etichetta="Email" errore={messaggioErrore}>
          {(props) => (
            <Input
              {...props}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              defaultValue={altraEmail ? "" : undefined}
              placeholder="nome@studio.it"
              className="h-12 text-lg sm:text-base"
            />
          )}
        </Campo>
        <Button type="submit" misura="lg" className="w-full" disabled={inCorso}>
          {inCorso ? "Invio in corso…" : "Mandami il codice"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-pietra-scura">
        È la prima volta? Entrando crei il tuo studio e ne diventi titolare.
      </p>
    </div>
  );
}
