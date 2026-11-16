/**
 * Genera supabase/seed.sql dallo studio di esempio del prototipo (src/dati/seed.ts),
 * con i soli campi delle tabelle. Uso: npx tsx scripts/genera-seed.ts
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { creaArchivioDiEsempio } from "../src/dati/seed";

const a = creaArchivioDiEsempio();

/** Id del prototipo ("a01") → uuid stabile, uguale a ogni generazione. */
const uuid = (id: string) => {
  const h = createHash("md5").update(`campionario:${id}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};
const q = (v: string | number | boolean | null | undefined): string =>
  v === null || v === undefined ? "null" : typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v);

const studio = a.studi[0]!;
const fornitore = new Map(a.fornitori.map((f) => [f.id, f.ragioneSociale]));
const cliente = new Map(a.clienti.map((c) => [c.id, c.nome]));
const stanzaProgetto = new Map(a.stanze.map((s) => [s.id, s.progettoId]));
const titolare = a.utenti.find((u) => u.ruolo === "titolare")!;

const righe: string[] = [];
righe.push(`-- Generato da scripts/genera-seed.ts: non modificare a mano.
-- Studio di esempio: ${studio.nome}. Accesso locale con magic link (email su Mailpit):
${a.utenti.map((u) => `--   ${u.email} (${u.ruolo})`).join("\n")}

-- Utenti: il trigger del primo accesso crea uno studio per ciascuno;
-- qui li riuniamo nello studio di esempio.`);

for (const u of a.utenti) {
  const id = uuid(u.id);
  righe.push(`insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '${id}', 'authenticated', 'authenticated', ${q(u.email)}, now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '${id}', '${id}',
  jsonb_build_object('sub', '${id}', 'email', ${q(u.email)}, 'email_verified', true), 'email', now(), now(), now());`);
}

const sid = uuid(studio.id);
righe.push(`
-- Lo studio di esempio, con id stabile; i profili ci vengono spostati.
insert into public.studi (id, nome) values ('${sid}', ${q(studio.nome)});
update public.profili set nome = case id
${a.utenti.map((u) => `    when '${uuid(u.id)}' then ${q(u.nome)}`).join("\n")}
  end,
  studio_id = '${sid}',
  ruolo = case id
${a.utenti.map((u) => `    when '${uuid(u.id)}' then '${u.ruolo}'::public.ruolo_profilo`).join("\n")}
  end
  where id in (${a.utenti.map((u) => `'${uuid(u.id)}'`).join(", ")});
delete from public.studi s where not exists (select 1 from public.profili p where p.studio_id = s.id);
`);

righe.push(`insert into public.progetti (id, studio_id, nome, cliente_nome, indirizzo_cantiere, fase, budget, nascondi_fornitori) values
${a.progetti
  .map((p) => `  ('${uuid(p.id)}', '${sid}', ${q(p.nome)}, ${q(cliente.get(p.clienteId))}, ${q(p.indirizzoCantiere)}, '${p.fase}', ${q(p.budget)}, ${p.nascondiFornitori})`)
  .join(",\n")};
`);

righe.push(`insert into public.stanze (id, studio_id, progetto_id, nome, codice, posizione, budget) values
${a.stanze
  .map((s) => `  ('${uuid(s.id)}', '${sid}', '${uuid(s.progettoId)}', ${q(s.nome)}, ${q(s.codice)}, ${s.posizione}, ${q(s.budget)})`)
  .join(",\n")};
`);

righe.push(`insert into public.articoli (id, studio_id, progetto_id, stanza_id, nome, categoria, fornitore, codice,
  larghezza_mm, profondita_mm, altezza_mm, finitura, colore_campione, foto_path, quantita, unita,
  prezzo_cliente_unitario, stato, nota_cliente, posizione) values
${a.articoli
  .map(
    (r) =>
      `  ('${uuid(r.id)}', '${sid}', '${uuid(stanzaProgetto.get(r.stanzaId)!)}', '${uuid(r.stanzaId)}', ${q(r.nome)}, '${r.categoria}', ${q(fornitore.get(r.fornitoreId))}, ${q(r.codice)},\n` +
      `   ${q(r.dimensioni.larghezza)}, ${q(r.dimensioni.profondita)}, ${q(r.dimensioni.altezza)}, ${q(r.finitura)}, ${q(r.coloreCampione)}, null, ${r.quantita}, '${r.unita}',\n` +
      `   ${r.prezzoClienteUnitario}, '${r.stato}', ${q(r.notaCliente)}, ${r.posizione})`,
  )
  .join(",\n")};
`);

// Link del prototipo, salvati come hash: funzionano solo in locale.
righe.push(`-- Link cliente di esempio (solo locale): /cliente/<token del prototipo>
insert into public.link_clienti (id, studio_id, progetto_id, token_hash, scade_il, creato_da, creato_il) values
${a.linkClienti
  .map(
    (l) =>
      `  ('${uuid(l.id)}', '${sid}', '${uuid(l.progettoId)}', extensions.digest(${q(l.token)}, 'sha256'), now() + interval '30 days', '${uuid(l.creatoDa)}', ${q(l.creatoIl)})`,
  )
  .join(",\n")};
`);

// Il rifiuto del tappeto, dal registro del prototipo, come risposta del cliente.
const risposte = a.registro.filter((r) => r.autore.tipo === "cliente");
const rifiutati = a.articoli.filter((r) => r.stato === "rifiutato");
if (risposte.length && rifiutati.length) {
  righe.push(`insert into public.risposte_cliente (studio_id, progetto_id, articolo_id, link_id, esito, commento, creato_il) values
${rifiutati
  .map((r, i) => {
    const voce = risposte[i] ?? risposte[0]!;
    const link = voce.autore.tipo === "cliente" ? voce.autore.linkId : "";
    return `  ('${sid}', '${uuid(stanzaProgetto.get(r.stanzaId)!)}', '${uuid(r.id)}', '${uuid(link)}', 'rifiutato', ${q(r.notaCliente)}, ${q(voce.creatoIl)})`;
  })
  .join(",\n")};
`);
}

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), righe.join("\n"));
console.log("supabase/seed.sql scritto");
