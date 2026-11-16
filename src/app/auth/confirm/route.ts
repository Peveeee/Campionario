import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { percorsoSicuro } from "@/lib/supabase/percorso";
import { creaClientServer } from "@/lib/supabase/server";

/**
 * Arrivo dal magic link. Gestisce entrambi i formati:
 *   ?code=…                       (flusso PKCE, link predefinito di Supabase)
 *   ?token_hash=…&type=magiclink  (modello email personalizzato)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const poi = percorsoSicuro(searchParams.get("poi"));
  const supabase = await creaClientServer();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && tipo) {
    ok = !(await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })).error;
  }

  const destinazione = ok ? poi : `/accedi?errore=link`;
  return NextResponse.redirect(new URL(destinazione, origin));
}
