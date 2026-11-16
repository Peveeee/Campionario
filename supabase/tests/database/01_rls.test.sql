-- Test delle policy: isolamento tra studi e nessun accesso per anon.
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

-- ---------------------------------------------------------------------------
-- Dati: due utenti, quindi due studi creati dal trigger del primo accesso
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'anna@studio-a.it', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@studio-b.it', 'authenticated', 'authenticated');

select is(
  (select count(*)::int from public.studi), 2,
  'il primo accesso crea uno studio per utente'
);
select is(
  (select ruolo::text from public.profili where id = '11111111-1111-1111-1111-111111111111'),
  'titolare',
  'chi crea lo studio ne è titolare'
);
select is(
  (select s.nome from public.studi s join public.profili p on p.studio_id = s.id
   where p.id = '11111111-1111-1111-1111-111111111111'),
  'Studio di anna',
  'nome provvisorio dello studio dall''email'
);

-- Dati dello studio B, inseriti come superutente
do $$
declare
  sb uuid := (select studio_id from public.profili where id = '22222222-2222-2222-2222-222222222222');
begin
  insert into public.progetti (id, studio_id, nome) values ('b0000000-0000-0000-0000-000000000001', sb, 'Casa B');
  insert into public.stanze (id, studio_id, progetto_id, nome)
    values ('b0000000-0000-0000-0000-000000000002', sb, 'b0000000-0000-0000-0000-000000000001', 'Soggiorno');
  insert into public.articoli (id, studio_id, progetto_id, stanza_id, nome, prezzo_cliente_centesimi)
    values ('b0000000-0000-0000-0000-000000000003', sb, 'b0000000-0000-0000-0000-000000000001',
            'b0000000-0000-0000-0000-000000000002', 'Divano', 350000);
  insert into public.link_clienti (id, studio_id, progetto_id, token_hash)
    values ('b0000000-0000-0000-0000-000000000004', sb, 'b0000000-0000-0000-0000-000000000001',
            extensions.digest('token-di-prova', 'sha256'));
  insert into public.risposte_cliente (studio_id, progetto_id, articolo_id, link_id, esito)
    values (sb, 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
            'b0000000-0000-0000-0000-000000000004', 'approvato');
end $$;

select set_config('test.studio_b',
  (select studio_id::text from public.profili where id = '22222222-2222-2222-2222-222222222222'), true);

-- ---------------------------------------------------------------------------
-- Utente A
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from public.studi), 1, 'A vede solo il proprio studio');
select is((select count(*)::int from public.profili), 1, 'A vede solo i profili del proprio studio');
select is((select count(*)::int from public.progetti), 0, 'A non legge i progetti di B');
select is((select count(*)::int from public.stanze), 0, 'A non legge le stanze di B');
select is((select count(*)::int from public.articoli), 0, 'A non legge gli articoli di B');
select is((select count(*)::int from public.link_clienti), 0, 'A non legge i link di B');
select is((select count(*)::int from public.risposte_cliente), 0, 'A non legge le risposte di B');

-- A non può scrivere nello studio di B
select throws_ok(
  $$ insert into public.progetti (studio_id, nome)
     values (current_setting('test.studio_b')::uuid, 'Intruso') $$,
  '42501', null, 'A non inserisce progetti nello studio di B'
);

update public.articoli set nome = 'Manomesso' where id = 'b0000000-0000-0000-0000-000000000003';
delete from public.progetti where id = 'b0000000-0000-0000-0000-000000000001';

-- A lavora nel proprio studio
insert into public.progetti (id, studio_id, nome)
  values ('a0000000-0000-0000-0000-000000000001', private.mio_studio_id(), 'Casa A');
insert into public.stanze (id, studio_id, progetto_id, nome)
  values ('a0000000-0000-0000-0000-000000000002', private.mio_studio_id(),
          'a0000000-0000-0000-0000-000000000001', 'Cucina');
select is((select count(*)::int from public.progetti), 1, 'A crea un progetto nel proprio studio');

-- non può collegare una stanza al progetto di B (chiave esterna con studio_id)
select throws_ok(
  $$ insert into public.stanze (studio_id, progetto_id, nome)
     values (private.mio_studio_id(), 'b0000000-0000-0000-0000-000000000001', 'Furto') $$,
  '23503', null, 'A non aggancia stanze al progetto di B'
);

-- non può spostare il proprio progetto nello studio di B
select throws_ok(
  $$ update public.progetti set studio_id = current_setting('test.studio_b')::uuid
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'A non sposta un progetto fuori dal proprio studio'
);

-- risposte_cliente: nessuna scrittura diretta
select throws_ok(
  $$ insert into public.risposte_cliente (studio_id, progetto_id, articolo_id, esito)
     values (private.mio_studio_id(), 'a0000000-0000-0000-0000-000000000001',
             gen_random_uuid(), 'approvato') $$,
  '42501', null, 'A non scrive direttamente le risposte del cliente'
);

-- profili: non può promuoversi né cambiare studio
select throws_ok(
  $$ update public.profili set ruolo = 'membro' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'il ruolo non si modifica dal client'
);

reset role;

select is(
  (select nome from public.articoli where id = 'b0000000-0000-0000-0000-000000000003'),
  'Divano', 'A non ha modificato l''articolo di B'
);
select is(
  (select count(*)::int from public.progetti where id = 'b0000000-0000-0000-0000-000000000001'),
  1, 'A non ha cancellato il progetto di B'
);

-- ---------------------------------------------------------------------------
-- Utente B vede i propri dati e non quelli di A
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*)::int from public.progetti), 1, 'B vede il proprio progetto');
select is((select nome from public.progetti), 'Casa B', 'e solo quello');
select is((select count(*)::int from public.risposte_cliente), 1, 'B legge le proprie risposte');
reset role;

-- ---------------------------------------------------------------------------
-- anon: nessuna tabella leggibile
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok('select * from public.studi',            '42501', null, 'anon non legge studi');
select throws_ok('select * from public.profili',          '42501', null, 'anon non legge profili');
select throws_ok('select * from public.progetti',         '42501', null, 'anon non legge progetti');
select throws_ok('select * from public.stanze',           '42501', null, 'anon non legge stanze');
select throws_ok('select * from public.articoli',         '42501', null, 'anon non legge articoli');
select throws_ok('select * from public.link_clienti',     '42501', null, 'anon non legge link_clienti');
select throws_ok('select * from public.risposte_cliente', '42501', null, 'anon non legge risposte_cliente');
select throws_ok('select private.mio_studio_id()',        '42501', null, 'anon non usa le funzioni private');
reset role;

-- ---------------------------------------------------------------------------
-- RLS attiva su ogni tabella e studio_id ovunque
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'RLS attiva su tutte le tabelle di public'
);
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and not exists (select 1 from pg_attribute a
                     where a.attrelid = c.oid and a.attname = 'studio_id' and not a.attisdropped)),
  0, 'studio_id presente su tutte le tabelle di public'
);

select * from finish();
rollback;
