import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface Messaggio {
  ID: string;
  Created: string;
}

/** Aspetta su Mailpit il primo magic link arrivato a `email` dopo `dopo`. */
export async function leggiMagicLink(email: string, dopo: Date): Promise<string> {
  for (let tentativo = 0; tentativo < 40; tentativo++) {
    const risposta = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages = [] } = (await risposta.json()) as { messages?: Messaggio[] };
    const nuovo = messages.find((m) => new Date(m.Created) >= dopo);
    if (nuovo) {
      const dettaglio = (await (await fetch(`${MAILPIT}/api/v1/message/${nuovo.ID}`)).json()) as { Text: string };
      const link = dettaglio.Text.match(/https?:\/\/\S+/)?.[0];
      if (link) return link.replace(/[)\]]$/, "");
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Nessun magic link per ${email}`);
}

/** Accesso completo con magic link: modulo, email, link. */
export async function accedi(page: Page, email: string, percorso = "/accedi") {
  await page.goto(percorso);
  const inizio = new Date(Date.now() - 1000);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Mandami il link" }).click();
  await expect(page.getByRole("heading", { name: "Controlla la posta" })).toBeVisible();
  await page.goto(await leggiMagicLink(email, inizio));
}

/** Email nuova a ogni chiamata, così i test non si pestano i piedi. */
export function emailNuova(nome: string) {
  return `${nome}.${Date.now()}${Math.floor(Math.random() * 1000)}@studio-prova.it`;
}
