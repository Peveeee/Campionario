-- Campionario · schema iniziale (Fase 1)
--
-- Regole:
--   * ogni tabella ha studio_id e RLS attiva;
--   * importi in centesimi interi, quantità in centesimi di unità
--     (1450 = 14,5 mq), dimensioni in mm: tutti integer, come in src/lib/;
--   * le chiavi esterne includono studio_id, così una riga figlia non può
--     puntare a un genitore di un altro studio;
--   * il ruolo anon non ha alcun privilegio sulle tabelle: il cliente passa
--     solo dalle funzioni security definer della Fase 3.

-- ---------------------------------------------------------------------------
-- Schema privato per le funzioni di supporto (non esposto dalle API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Tipi
-- ---------------------------------------------------------------------------
-- Gli stessi valori di src/dominio/tipi.ts
create type public.ruolo_profilo as enum ('titolare', 'designer');
create type public.fase_progetto as enum ('concept', 'progetto', 'forniture', 'cantiere', 'chiuso');
create type public.categoria_articolo as enum
  ('arredo', 'illuminazione', 'rivestimenti', 'tessili', 'sanitari', 'complementi');
create type public.unita_articolo as enum ('pz', 'mq', 'ml');
create type public.stato_articolo as enum ('proposto', 'approvato', 'rifiutato', 'da_rivedere');

-- 'modifiche' porta l'articolo in stato da_rivedere
create type public.esito_risposta as enum ('approvato', 'rifiutato', 'modifiche');

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------
create table public.studi (
  id         uuid primary key default gen_random_uuid(),
  studio_id  uuid generated always as (id) stored,
  nome       text not null check (length(trim(nome)) between 1 and 120),
  creato_il  timestamptz not null default now()
);

create table public.profili (
  id         uuid primary key references auth.users (id) on delete cascade,
  studio_id  uuid not null references public.studi (id) on delete cascade,
  email      text not null,
  nome       text check (nome is null or length(nome) <= 120),
  ruolo      public.ruolo_profilo not null default 'designer',
  creato_il  timestamptz not null default now()
);
create index profili_studio_id_idx on public.profili (studio_id);

create table public.progetti (
  id                 uuid primary key default gen_random_uuid(),
  studio_id          uuid not null references public.studi (id) on delete cascade,
  nome               text not null check (length(trim(nome)) between 1 and 160),
  cliente_nome       text check (cliente_nome is null or length(cliente_nome) <= 160),
  indirizzo_cantiere text check (indirizzo_cantiere is null or length(indirizzo_cantiere) <= 240),
  fase               public.fase_progetto not null default 'concept',
  budget             integer check (budget is null or budget >= 0),
  nascondi_fornitori boolean not null default false,
  creato_il          timestamptz not null default now(),
  aggiornato_il      timestamptz not null default now(),
  unique (id, studio_id)
);
create index progetti_studio_id_idx on public.progetti (studio_id);

create table public.stanze (
  id                 uuid primary key default gen_random_uuid(),
  studio_id          uuid not null,
  progetto_id        uuid not null,
  nome               text not null check (length(trim(nome)) between 1 and 120),
  codice             text check (codice is null or length(codice) <= 12),
  posizione          integer not null default 0,
  budget             integer check (budget is null or budget >= 0),
  creato_il          timestamptz not null default now(),
  aggiornato_il      timestamptz not null default now(),
  unique (id, progetto_id, studio_id),
  foreign key (progetto_id, studio_id)
    references public.progetti (id, studio_id) on delete cascade
);
create index stanze_progetto_idx on public.stanze (progetto_id, studio_id, posizione);

create table public.articoli (
  id                        uuid primary key default gen_random_uuid(),
  studio_id                 uuid not null,
  progetto_id               uuid not null,
  stanza_id                 uuid not null,
  nome                      text not null check (length(trim(nome)) between 1 and 160),
  categoria                 public.categoria_articolo not null default 'arredo',
  fornitore                 text check (fornitore is null or length(fornitore) <= 120),
  codice                    text check (codice is null or length(codice) <= 80),
  larghezza_mm              integer check (larghezza_mm is null or larghezza_mm > 0),
  profondita_mm             integer check (profondita_mm is null or profondita_mm > 0),
  altezza_mm                integer check (altezza_mm is null or altezza_mm > 0),
  finitura                  text check (finitura is null or length(finitura) <= 120),
  colore_campione           text check (colore_campione is null or colore_campione ~ '^#[0-9a-fA-F]{6}$'),
  foto_path                 text check (foto_path is null or length(foto_path) <= 400),
  quantita                  integer not null default 100 check (quantita > 0),  -- centesimi di unità
  unita                     public.unita_articolo not null default 'pz',
  prezzo_cliente_unitario   integer not null default 0 check (prezzo_cliente_unitario >= 0),
  stato                     public.stato_articolo not null default 'proposto',
  nota_cliente              text check (nota_cliente is null or length(nota_cliente) <= 2000),
  posizione                 integer not null default 0,
  creato_il                 timestamptz not null default now(),
  aggiornato_il             timestamptz not null default now(),
  unique (id, studio_id),
  unique (id, progetto_id, studio_id),
  foreign key (stanza_id, progetto_id, studio_id)
    references public.stanze (id, progetto_id, studio_id) on delete cascade
);
create index articoli_progetto_idx on public.articoli (progetto_id, studio_id);
create index articoli_stanza_idx on public.articoli (stanza_id, posizione);

create table public.link_clienti (
  id             uuid primary key default gen_random_uuid(),
  studio_id      uuid not null,
  progetto_id    uuid not null,
  token_hash     bytea not null unique check (length(token_hash) = 32), -- sha256
  scade_il       timestamptz not null default now() + interval '30 days',
  revocato_il    timestamptz,
  creato_da      uuid references auth.users (id) on delete set null,
  creato_il      timestamptz not null default now(),
  unique (id, progetto_id, studio_id),
  foreign key (progetto_id, studio_id)
    references public.progetti (id, studio_id) on delete cascade
);
create index link_clienti_progetto_idx on public.link_clienti (progetto_id, studio_id);
-- al massimo un link non revocato per progetto
create unique index link_clienti_un_attivo_idx
  on public.link_clienti (progetto_id) where revocato_il is null;

create table public.risposte_cliente (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null,
  progetto_id   uuid not null,
  articolo_id   uuid not null,
  link_id       uuid,
  esito         public.esito_risposta not null,
  commento      text check (commento is null or length(commento) <= 2000),
  creato_il     timestamptz not null default now(),
  foreign key (articolo_id, progetto_id, studio_id)
    references public.articoli (id, progetto_id, studio_id) on delete cascade,
  foreign key (link_id, progetto_id, studio_id)
    references public.link_clienti (id, progetto_id, studio_id) on delete set null (link_id)
);
create index risposte_progetto_idx on public.risposte_cliente (progetto_id, studio_id, creato_il desc);
create index risposte_articolo_idx on public.risposte_cliente (articolo_id);
create index risposte_link_idx on public.risposte_cliente (link_id);

-- ---------------------------------------------------------------------------
-- aggiornato_il automatico
-- ---------------------------------------------------------------------------
create function private.tocca_aggiornato_il()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.aggiornato_il := now();
  return new;
end;
$$;

create trigger progetti_aggiornato_il before update on public.progetti
  for each row execute function private.tocca_aggiornato_il();
create trigger stanze_aggiornato_il before update on public.stanze
  for each row execute function private.tocca_aggiornato_il();
create trigger articoli_aggiornato_il before update on public.articoli
  for each row execute function private.tocca_aggiornato_il();

-- ---------------------------------------------------------------------------
-- Studio dell'utente corrente
-- ---------------------------------------------------------------------------
create function private.mio_studio_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.studio_id from public.profili p where p.id = (select auth.uid());
$$;
revoke all on function private.mio_studio_id() from public, anon;
grant execute on function private.mio_studio_id() to authenticated;

create function private.sono_titolare()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profili p
    where p.id = (select auth.uid()) and p.ruolo = 'titolare'
  );
$$;
revoke all on function private.sono_titolare() from public, anon;
grant execute on function private.sono_titolare() to authenticated;

-- ---------------------------------------------------------------------------
-- Primo accesso: crea lo studio e il profilo titolare
-- ---------------------------------------------------------------------------
-- "anna.maria_rossi@…" → "Studio di Anna Maria Rossi" (lo studio lo potrà rinominare)
create function private.nome_provvisorio(email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Studio di ' || coalesce(
    nullif(initcap(trim(regexp_replace(split_part(coalesce(email, ''), '@', 1), '[._+0-9-]+', ' ', 'g'))), ''),
    'nuovo utente'
  );
$$;
revoke all on function private.nome_provvisorio(text) from public, anon, authenticated;

create function private.nuovo_utente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuovo_studio uuid;
begin
  insert into public.studi (nome)
  values (private.nome_provvisorio(new.email))
  returning id into nuovo_studio;

  insert into public.profili (id, studio_id, email, ruolo)
  values (new.id, nuovo_studio, coalesce(new.email, ''), 'titolare');

  return new;
end;
$$;
revoke all on function private.nuovo_utente() from public, anon, authenticated;

create trigger alla_creazione_utente
  after insert on auth.users
  for each row execute function private.nuovo_utente();

-- ---------------------------------------------------------------------------
-- Privilegi: anon non tocca nessuna tabella
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- authenticated: solo quello che serve; le righe le filtra RLS
revoke all on all tables in schema public from authenticated;
grant select, update on public.studi to authenticated;
grant select, update (nome) on public.profili to authenticated;
grant select, insert, update, delete on public.progetti to authenticated;
grant select, insert, update, delete on public.stanze to authenticated;
grant select, insert, update, delete on public.articoli to authenticated;
grant select, insert, update, delete on public.link_clienti to authenticated;
grant select on public.risposte_cliente to authenticated;
-- studi: si può cambiare solo il nome
revoke update on public.studi from authenticated;
grant update (nome) on public.studi to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.studi            enable row level security;
alter table public.profili          enable row level security;
alter table public.progetti         enable row level security;
alter table public.stanze           enable row level security;
alter table public.articoli         enable row level security;
alter table public.link_clienti     enable row level security;
alter table public.risposte_cliente enable row level security;

-- studi
create policy "studi: lettura del proprio studio" on public.studi
  for select to authenticated
  using (id = (select private.mio_studio_id()));
create policy "studi: il titolare rinomina" on public.studi
  for update to authenticated
  using (id = (select private.mio_studio_id()) and (select private.sono_titolare()))
  with check (id = (select private.mio_studio_id()));

-- profili
create policy "profili: lettura dello stesso studio" on public.profili
  for select to authenticated
  using (studio_id = (select private.mio_studio_id()));
create policy "profili: ognuno modifica il proprio" on public.profili
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- progetti, stanze, articoli, link_clienti: tutto dentro il proprio studio
create policy "progetti: proprio studio" on public.progetti
  for all to authenticated
  using (studio_id = (select private.mio_studio_id()))
  with check (studio_id = (select private.mio_studio_id()));

create policy "stanze: proprio studio" on public.stanze
  for all to authenticated
  using (studio_id = (select private.mio_studio_id()))
  with check (studio_id = (select private.mio_studio_id()));

create policy "articoli: proprio studio" on public.articoli
  for all to authenticated
  using (studio_id = (select private.mio_studio_id()))
  with check (studio_id = (select private.mio_studio_id()));

create policy "link_clienti: proprio studio" on public.link_clienti
  for all to authenticated
  using (studio_id = (select private.mio_studio_id()))
  with check (studio_id = (select private.mio_studio_id()));

-- risposte_cliente: lo studio legge, scrive solo cliente_rispondi (Fase 3)
create policy "risposte_cliente: lettura del proprio studio" on public.risposte_cliente
  for select to authenticated
  using (studio_id = (select private.mio_studio_id()));
