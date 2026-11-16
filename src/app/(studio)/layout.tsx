import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@/components/shell/shell";
import { SessioneStudioProvider } from "@/dati/sessione-studio";
import { creaClientServer } from "@/lib/supabase/server";

/** "anna.maria_rossi@…" → "Anna Maria Rossi", come il nome provvisorio dello studio. */
function nomeDaEmail(email: string) {
  const parole = (email.split("@")[0] ?? "").replace(/[._+0-9-]+/g, " ").trim();
  if (!parole) return email;
  return parole.replace(/\S+/g, (p) => p[0]!.toUpperCase() + p.slice(1).toLowerCase());
}

export default async function LayoutStudio({ children }: { children: ReactNode }) {
  const supabase = await creaClientServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/accedi");

  const { data: profilo } = await supabase
    .from("profili")
    .select("id, nome, email, ruolo, studi(id, nome)")
    .eq("id", data.claims.sub)
    .single();
  if (!profilo?.studi) redirect("/accedi?errore=profilo");

  const sessione = {
    utente: {
      id: profilo.id,
      nome: profilo.nome?.trim() || nomeDaEmail(profilo.email),
      email: profilo.email,
      ruolo: profilo.ruolo,
    },
    studio: { id: profilo.studi.id, nome: profilo.studi.nome },
  };

  return (
    <SessioneStudioProvider valore={sessione}>
      <Shell>{children}</Shell>
    </SessioneStudioProvider>
  );
}
