import type { JSX } from "react";
import type { Categoria } from "@/dominio/tipi";

/**
 * Disegni al tratto usati quando un articolo non ha ancora una foto.
 * Tratto sottile e geometrico, così non competono con le foto vere.
 */
const DISEGNI: Record<Categoria, JSX.Element> = {
  arredo: (
    <>
      <path d="M22 58V44a6 6 0 0 1 6-6h64a6 6 0 0 1 6 6v14" />
      <path d="M14 62a6 6 0 0 1 12 0v12h68V62a6 6 0 0 1 12 0v16a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" />
      <path d="M26 66h68" />
      <path d="M60 66v8" />
      <path d="M22 82v6M98 82v6" />
    </>
  ),
  illuminazione: (
    <>
      <path d="M60 14v28" />
      <path d="M34 66a26 26 0 0 1 52 0z" />
      <path d="M56 42h8v4h-8z" />
      <path d="M52 72a8 8 0 0 0 16 0" />
      <path d="M40 86l-4 6M60 90v8M80 86l4 6" strokeDasharray="2 4" />
    </>
  ),
  rivestimenti: (
    <>
      <path d="M24 24h72v72H24z" />
      <path d="M24 48h72M24 72h72" />
      <path d="M48 24v24M72 24v24M36 48v24M60 48v24M84 48v24M48 72v24M72 72v24" />
    </>
  ),
  tessili: (
    <>
      <path d="M18 22h84" />
      <path d="M26 22c-4 20 4 44-2 74M40 22c4 22-4 46 2 74M54 22c-4 24 4 46-2 74" />
      <path d="M68 22c4 24-4 46 2 74M82 22c-4 22 4 46-2 74M96 22c3 20-3 50 0 74" />
      <path d="M22 96h78" />
    </>
  ),
  sanitari: (
    <>
      <path d="M18 60h84" />
      <path d="M24 60c2 18 16 26 36 26s34-8 36-26" />
      <path d="M60 60V36a8 8 0 0 1 8-8h8" />
      <path d="M76 24v8" />
      <path d="M54 86v10h12V86" />
    </>
  ),
  complementi: (
    <>
      <path d="M48 96h24c6-12 8-26 2-40l-4-8V40h-20v8l-4 8c-6 14-4 28 2 40z" />
      <path d="M60 40c0-12 4-22 14-28M60 40c-2-10-8-16-18-18" />
      <path d="M74 12c4 2 6 6 6 10M42 22c-4 0-8 2-10 6" />
    </>
  ),
};

export function Illustrazione({ categoria, className }: { categoria: Categoria; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {DISEGNI[categoria]}
    </svg>
  );
}
