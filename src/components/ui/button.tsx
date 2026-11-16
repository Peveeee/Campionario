import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const stiliPulsante = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        primario: "bg-avio text-carta hover:bg-avio-scuro active:bg-avio-scuro",
        secondario: "border border-linea-forte bg-carta text-grafite hover:border-grafite/40 hover:bg-nebbia",
        quieto: "text-grafite hover:bg-nebbia",
        pericolo: "border border-mattone/30 bg-carta text-mattone hover:bg-mattone-velo",
      },
      misura: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-5 text-base",
        icona: "size-10",
      },
    },
    defaultVariants: { variante: "primario", misura: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof stiliPulsante>;

export function Button({ className, variante, misura, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(stiliPulsante({ variante, misura }), className)} {...props} />;
}
