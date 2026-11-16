"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Shell } from "@/components/shell/shell";
import { useSessione } from "@/dati/store";

export default function LayoutStudio({ children }: { children: ReactNode }) {
  const sessione = useSessione();
  const router = useRouter();

  useEffect(() => {
    if (sessione === null) router.replace("/accedi");
  }, [sessione, router]);

  // Finché il browser non ha letto la sessione non mostriamo nulla: niente lampi di contenuto sbagliato.
  if (!sessione) return <div className="min-h-dvh" aria-busy="true" />;

  return <Shell>{children}</Shell>;
}
