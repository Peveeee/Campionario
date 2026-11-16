"use client";

import { chiudiAvviso, useAvviso } from "@/dati/store";

/** Avviso in basso, con "Annulla" quando l'azione si può disfare. Annunciato agli screen reader. */
export function Avviso() {
  const avviso = useAvviso();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 lg:bottom-6">
      {avviso && (
        <div
          key={avviso.id}
          className="pointer-events-auto flex max-w-md items-center gap-4 rounded-md bg-grafite py-2.5 pr-2 pl-4 text-sm text-carta shadow-pannello animate-[sale_200ms_var(--ease-morbido)]"
        >
          <span>{avviso.messaggio}</span>
          {avviso.annulla && (
            <button
              type="button"
              onClick={() => {
                avviso.annulla?.();
              }}
              className="rounded-sm px-2 py-1 font-medium text-[#b9cde3] hover:bg-carta/10"
            >
              Annulla
            </button>
          )}
          <button
            type="button"
            onClick={chiudiAvviso}
            className="rounded-sm px-2 py-1 text-carta/70 hover:bg-carta/10"
            aria-label="Chiudi avviso"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
