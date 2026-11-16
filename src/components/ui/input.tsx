"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatScalato, leggiNumero } from "@/lib/formato";

export const stiliCampo =
  "h-10 w-full rounded-md border border-linea-forte bg-carta px-3 text-base text-grafite placeholder:text-pietra transition-colors hover:border-pietra focus-visible:border-avio focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-avio/20 aria-[invalid=true]:border-mattone";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(stiliCampo, className)} {...props} />;
}

/** Etichetta, campo e messaggio di aiuto o errore, collegati per gli screen reader. */
export function Campo({
  etichetta,
  aiuto,
  errore,
  children,
}: {
  etichetta: string;
  aiuto?: string;
  errore?: string | null;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const idDescrizione = `${id}-descrizione`;
  const descrizione = errore ?? aiuto;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-grafite">
        {etichetta}
      </label>
      {children({ id, "aria-describedby": descrizione ? idDescrizione : undefined, "aria-invalid": !!errore })}
      {descrizione && (
        <p id={idDescrizione} className={cn("text-sm", errore ? "text-mattone" : "text-pietra-scura")}>
          {descrizione}
        </p>
      )}
    </div>
  );
}

/**
 * Campo numerico all'italiana. Il valore è un intero scalato (centesimi, punti base…):
 * mentre si scrive il testo resta libero, all'uscita dal campo viene riletto e riformattato.
 */
export function CampoNumero({
  valore,
  onCambia,
  decimali = 2,
  suffisso,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  valore: number | null;
  onCambia: (valore: number | null, valido: boolean) => void;
  decimali?: number;
  suffisso?: string;
}) {
  const formatta = (v: number | null) => (v === null ? "" : formatScalato(v, decimali));
  const [testo, setTesto] = useState(() => formatta(valore));
  const [valoreVisto, setValoreVisto] = useState(valore);

  // Riallinea il testo se il valore cambia dall'esterno.
  if (valore !== valoreVisto) {
    setValoreVisto(valore);
    setTesto(formatta(valore));
  }

  return (
    <div className="relative">
      <input
        inputMode="decimal"
        autoComplete="off"
        className={cn(stiliCampo, "cifre text-right", suffisso && "pr-9", className)}
        value={testo}
        onChange={(e) => {
          setTesto(e.target.value);
          const letto = leggiNumero(e.target.value, decimali);
          onCambia(letto, e.target.value.trim() === "" || letto !== null);
        }}
        onBlur={() => {
          const letto = leggiNumero(testo, decimali);
          if (letto !== null) setTesto(formatta(letto));
        }}
        {...props}
      />
      {suffisso && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-pietra-scura">
          {suffisso}
        </span>
      )}
    </div>
  );
}
