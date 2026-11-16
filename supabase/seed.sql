-- Generato da scripts/genera-seed.ts: non modificare a mano.
-- Studio di esempio: Studio Varesi Interni. Accesso locale con magic link (email su Mailpit):
--   giulia@studiovaresi.example (titolare)
--   tommaso@studiovaresi.example (designer)

-- Utenti: il trigger del primo accesso crea uno studio per ciascuno;
-- qui li riuniamo nello studio di esempio.
insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '9ec20413-171c-9940-19b1-7b5963984d87', 'authenticated', 'authenticated', 'giulia@studiovaresi.example', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '9ec20413-171c-9940-19b1-7b5963984d87', '9ec20413-171c-9940-19b1-7b5963984d87',
  jsonb_build_object('sub', '9ec20413-171c-9940-19b1-7b5963984d87', 'email', 'giulia@studiovaresi.example', 'email_verified', true), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'bec33e80-ff6a-d80e-87fc-0ae86af28215', 'authenticated', 'authenticated', 'tommaso@studiovaresi.example', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'bec33e80-ff6a-d80e-87fc-0ae86af28215', 'bec33e80-ff6a-d80e-87fc-0ae86af28215',
  jsonb_build_object('sub', 'bec33e80-ff6a-d80e-87fc-0ae86af28215', 'email', 'tommaso@studiovaresi.example', 'email_verified', true), 'email', now(), now(), now());

-- Lo studio di esempio, con id stabile; i profili ci vengono spostati.
insert into public.studi (id, nome) values ('1f08ebfc-31c5-8fea-1f63-fdeecc564d61', 'Studio Varesi Interni');
update public.profili set nome = case id
    when '9ec20413-171c-9940-19b1-7b5963984d87' then 'Giulia Varesi'
    when 'bec33e80-ff6a-d80e-87fc-0ae86af28215' then 'Tommaso Rinaldi'
  end,
  studio_id = '1f08ebfc-31c5-8fea-1f63-fdeecc564d61',
  ruolo = case id
    when '9ec20413-171c-9940-19b1-7b5963984d87' then 'titolare'::public.ruolo_profilo
    when 'bec33e80-ff6a-d80e-87fc-0ae86af28215' then 'designer'::public.ruolo_profilo
  end
  where id in ('9ec20413-171c-9940-19b1-7b5963984d87', 'bec33e80-ff6a-d80e-87fc-0ae86af28215');
delete from public.studi s where not exists (select 1 from public.profili p where p.studio_id = s.id);

insert into public.progetti (id, studio_id, nome, cliente_nome, indirizzo_cantiere, fase, budget, nascondi_fornitori) values
  ('6608fd47-951c-a410-9731-90e5f18267bb', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', 'Casa Ferraris', 'Elena e Marco Ferraris', 'Via Solferino 14, Milano', 'forniture', 9500000, true),
  ('4aea9f92-f2a9-49ec-a0c9-566b315d466f', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', 'Attico Benassi', 'Chiara Benassi', 'Lungarno Torrigiani 9, Firenze', 'progetto', null, false);

insert into public.stanze (id, studio_id, progetto_id, nome, codice, posizione, budget) values
  ('ce0e9331-f7ec-3fbc-ab94-bec293efccdb', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'Soggiorno', 'SOG', 0, 1500000),
  ('1c231f5b-c861-454b-5d4b-dd707ee15dcd', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'Camera padronale', 'CAM1', 1, 1400000),
  ('7921266b-c059-66aa-c594-3563c3088a23', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'Bagno padronale', 'BAG1', 2, 400000),
  ('d13df7d3-5432-c267-4a4d-e003068f6286', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', 'Cucina', 'CUC', 0, 2600000);

insert into public.articoli (id, studio_id, progetto_id, stanza_id, nome, categoria, fornitore, codice,
  larghezza_mm, profondita_mm, altezza_mm, finitura, colore_campione, foto_path, quantita, unita,
  prezzo_cliente_unitario, stato, nota_cliente, posizione) values
  ('a07c84db-e07e-db89-6554-fcfcb9388abc', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Divano Arno, tre posti', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-AR3',
   2600, 1000, 780, 'Bouclé avena', '#D9D1C3', null, 100, 'pz',
   519750, 'approvato', null, 0),
  ('6940c41a-58c1-83f3-7604-5d6bc41968fb', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Tavolino Pieve', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-PV12',
   1200, 600, 350, 'Rovere termotrattato', '#6B4A33', null, 100, 'pz',
   151200, 'approvato', null, 1),
  ('81bbb319-2861-1705-6c21-48c9a8d8c92f', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Poltrona Lario', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-LR1',
   780, 820, 740, 'Velluto salvia', '#8E9B82', null, 200, 'pz',
   180900, 'proposto', null, 2),
  ('36c390ca-5575-4d88-64e4-2e7d3e345237', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Sospensione Murano Fil', 'illuminazione', 'Officine Luce Veneta S.n.c.', 'OLV-MF60',
   600, 600, 420, 'Vetro fumé', '#7C7468', null, 100, 'pz',
   137200, 'approvato', null, 3),
  ('a9eb8dac-007b-92f4-addd-57e5dad9ffe4', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Lampada da terra Bricola', 'illuminazione', 'Officine Luce Veneta S.n.c.', 'OLV-BR18',
   350, 350, 1650, 'Ottone brunito', '#8C6A3F', null, 100, 'pz',
   89600, 'da_rivedere', null, 4),
  ('9de09a30-692d-5ad0-8595-c2fee40cc102', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Tende in lino garzato', 'tessili', 'Tessiture Arnaldi S.r.l.', 'TA-LG280',
   null, null, 2800, 'Lino naturale', '#E4DDCF', null, 1450, 'ml',
   6960, 'proposto', null, 5),
  ('634c8444-10e1-ba82-efbe-791a78341572', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', 'ce0e9331-f7ec-3fbc-ab94-bec293efccdb', 'Tappeto Trama', 'tessili', 'Tessiture Arnaldi S.r.l.', 'TA-TR2030',
   3000, 2000, null, 'Lana grigio perla', '#B9B6AE', null, 100, 'pz',
   263250, 'rifiutato', 'Lo vorremmo più caldo, magari sui toni della sabbia.', 6),
  ('c5a08776-6844-ba9b-2176-0b79e5dea55e', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '1c231f5b-c861-454b-5d4b-dd707ee15dcd', 'Letto Ombra 180', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-OM180',
   1960, 2200, 1050, 'Lino grezzo', '#CFC6B5', null, 100, 'pz',
   361800, 'approvato', null, 7),
  ('464f9007-ace2-ac8a-e931-d957ecb5a68c', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '1c231f5b-c861-454b-5d4b-dd707ee15dcd', 'Comodino Sasso', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-SS45',
   450, 400, 500, 'Noce canaletto', '#5A3D2B', null, 200, 'pz',
   70200, 'approvato', null, 8),
  ('e2c3c16a-33ab-e8b2-47fe-34135bf50fb4', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '1c231f5b-c861-454b-5d4b-dd707ee15dcd', 'Applique Lume', 'illuminazione', 'Officine Luce Veneta S.n.c.', 'OLV-LU02',
   120, 150, 260, 'Gesso', '#EDEAE4', null, 200, 'pz',
   29400, 'proposto', null, 9),
  ('722ded8a-e886-f94d-a035-58e946aa8cb1', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '1c231f5b-c861-454b-5d4b-dd707ee15dcd', 'Boiserie a doghe', 'rivestimenti', 'Lanzi Mobili Brianza S.r.l.', 'LMB-BS',
   null, null, null, 'Rovere naturale', '#B08A62', null, 840, 'mq',
   21450, 'proposto', null, 10),
  ('b4378525-2044-1665-d7f1-d73b1d38de46', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '7921266b-c059-66aa-c594-3563c3088a23', 'Gres Pietra di Vals 60×120', 'rivestimenti', 'Ceramiche Valsecchia S.p.A.', 'CV-PV612',
   1200, 600, 10, 'Grigio cenere', '#9A968D', null, 1860, 'mq',
   8060, 'approvato', null, 11),
  ('3c16d2aa-c20f-0f15-f0db-b96cfba59f47', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '7921266b-c059-66aa-c594-3563c3088a23', 'Mosaico Rigato', 'rivestimenti', 'Ceramiche Valsecchia S.p.A.', 'CV-RG30',
   300, 300, 8, 'Verde bottiglia', '#2F4A3C', null, 620, 'mq',
   19240, 'proposto', null, 12),
  ('d1b2e5dc-45ec-f115-f605-f05938d92718', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '7921266b-c059-66aa-c594-3563c3088a23', 'Lavabo Conca', 'sanitari', 'Sanitari Orsenigo S.r.l.', 'SO-CN55',
   550, 420, 160, 'Ceramica bianco opaco', '#F2F1EE', null, 100, 'pz',
   93150, 'approvato', null, 13),
  ('f322e9e9-32c7-996a-8c2f-d4621c085791', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '7921266b-c059-66aa-c594-3563c3088a23', 'Miscelatore Filo', 'sanitari', 'Sanitari Orsenigo S.r.l.', 'SO-FL01',
   50, 160, 280, 'Nichel spazzolato', '#A7A49C', null, 100, 'pz',
   55350, 'approvato', null, 14),
  ('e105591e-c4c3-ba7f-185d-0446e088d806', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', 'd13df7d3-5432-c267-4a4d-e003068f6286', 'Isola Banco', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-BC28',
   2800, 1100, 900, 'Laccato grigio fumo', '#6E6A64', null, 100, 'pz',
   1222000, 'proposto', null, 15),
  ('9fe924e5-4486-ff2f-25a7-25e64a29e1c7', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', 'd13df7d3-5432-c267-4a4d-e003068f6286', 'Piano in marmo Arabescato', 'rivestimenti', 'Ceramiche Valsecchia S.p.A.', 'CV-MA30',
   null, null, 30, 'Arabescato levigato', '#E7E4DE', null, 420, 'mq',
   89700, 'proposto', null, 16),
  ('7ae73bf0-caf2-228f-972b-4f8d278219bb', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', 'd13df7d3-5432-c267-4a4d-e003068f6286', 'Sospensione Goccia', 'illuminazione', 'Officine Luce Veneta S.n.c.', 'OLV-GC20',
   200, 200, 340, 'Vetro ambra', '#C08A3E', null, 300, 'pz',
   44800, 'proposto', null, 17),
  ('284c7385-9d95-35f2-efed-470fe482f515', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', 'd13df7d3-5432-c267-4a4d-e003068f6286', 'Sgabello Trespolo', 'arredo', 'Lanzi Mobili Brianza S.r.l.', 'LMB-TR65',
   420, 420, 650, 'Frassino nero', '#2B2724', null, 400, 'pz',
   38475, 'proposto', null, 18),
  ('bf51be7a-2e6e-1a55-b642-a8257876e721', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', 'd13df7d3-5432-c267-4a4d-e003068f6286', 'Lavello Vasca 80', 'sanitari', 'Sanitari Orsenigo S.r.l.', 'SO-VS80',
   800, 450, 220, 'Acciaio satinato', '#BDBCB8', null, 100, 'pz',
   159300, 'proposto', null, 19);

-- Link cliente di esempio (solo locale): /cliente/<token del prototipo>
insert into public.link_clienti (id, studio_id, progetto_id, token_hash, scade_il, creato_da, creato_il) values
  ('7b65e023-0c45-6320-67bd-58e15831878f', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', extensions.digest('fx7k2m9qv4rt8wz3', 'sha256'), now() + interval '30 days', 'bec33e80-ff6a-d80e-87fc-0ae86af28215', '2026-10-06T10:00:00+02:00'),
  ('7484ac63-5e42-2efd-2292-72023c998df6', '1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '4aea9f92-f2a9-49ec-a0c9-566b315d466f', extensions.digest('bn4p8s2xk6md9cq1', 'sha256'), now() + interval '30 days', 'bec33e80-ff6a-d80e-87fc-0ae86af28215', '2026-11-02T09:30:00+01:00');

insert into public.risposte_cliente (studio_id, progetto_id, articolo_id, link_id, esito, commento, creato_il) values
  ('1f08ebfc-31c5-8fea-1f63-fdeecc564d61', '6608fd47-951c-a410-9731-90e5f18267bb', '634c8444-10e1-ba82-efbe-791a78341572', '7b65e023-0c45-6320-67bd-58e15831878f', 'rifiutato', 'Lo vorremmo più caldo, magari sui toni della sabbia.', '2026-11-11T21:05:00+01:00');
