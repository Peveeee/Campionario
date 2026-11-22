import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface Messaggio {
  ID: string;
  Created: string;
}

/** Aspetta su Mailpit la prima email di accesso arrivata a `email` dopo `dopo`. */
export async function leggiEmailAccesso(email: string, dopo: Date): Promise<{ codice: string; link: string }> {
  for (let tentativo = 0; tentativo < 40; tentativo++) {
    const risposta = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages = [] } = (await risposta.json()) as { messages?: Messaggio[] };
    const nuovo = messages.find((m) => new Date(m.Created) >= dopo);
    if (nuovo) {
      const { HTML } = (await (await fetch(`${MAILPIT}/api/v1/message/${nuovo.ID}`)).json()) as { HTML: string };
      const codice = HTML.match(/>\s*(\d{6,8})\s*</)?.[1];
      const link = HTML.match(/href="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
      if (codice && link) return { codice, link };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Nessuna email di accesso per ${email}`);
}

/** Chiede il codice e aspetta l'email. */
export async function chiediCodice(page: Page, email: string, percorso = "/accedi") {
  await page.goto(percorso);
  const inizio = new Date(Date.now() - 1000);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Mandami il codice" }).click();
  await expect(page.getByRole("heading", { name: "Controlla la posta" })).toBeVisible();
  return leggiEmailAccesso(email, inizio);
}

/** Accesso completo con il codice di 6 cifre. */
export async function accedi(page: Page, email: string, percorso = "/accedi") {
  const { codice } = await chiediCodice(page, email, percorso);
  await page.getByLabel("Codice dell'email").fill(codice);
  await page.getByRole("button", { name: "Entra", exact: true }).click();
}

/** Email nuova a ogni chiamata, così i test non si pestano i piedi. */
export function emailNuova(nome: string) {
  return `${nome}.${Date.now()}${Math.floor(Math.random() * 1000)}@studio-prova.it`;
}
