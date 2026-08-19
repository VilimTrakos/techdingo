-- Realtime Authorization za privatan Broadcast kanal po PvP meču
-- (kanal "pvp:match:<id>", kreiran client-side s { config: { private: true } }).
-- Bez ovoga bi bilo tko s anon key-em (svatko, po dizajnu javan) mogao
-- prisluškivati ili krivotvoriti evente u TUĐEM meču - table RLS na
-- pvp_matches ovo NE štiti jer je Broadcast zaseban autorizacijski sloj.
--
-- ⚠️ NE POKREĆI JOŠ. Prvi pokušaj (unutar 0001_init.sql) pukao je s
-- "ERROR: 42501: must be owner of table messages" - na hostanom Supabaseu
-- `realtime.messages` pripada internoj ulozi (supabase_realtime_admin), pa
-- čak ni vlasnik projekta preko SQL Editora (postgres uloga) ne smije
-- direktno ALTER/CREATE POLICY nad njom bez dodatnog koraka koji još nisam
-- potvrdio (vjerojatno: Supabase dashboard "Realtime" postavke moraju prvo
-- eksplicitno uključiti Authorization za taj kanal/shemu, ili treba drugi
-- SQL obrazac specifičan za trenutnu verziju Supabase Realtime-a). Treba
-- provjeriti aktualnu Supabase dokumentaciju prije pokretanja ove datoteke.
-- Ovo je isključivo za Fazu D (live PvP) - Faze A/B/C (računi, sinkronizacija,
-- leaderboard) ne ovise o ovome i rade bez ovog koraka.

alter table realtime.messages enable row level security;

create policy "pvp match participants can read broadcast"
  on realtime.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.pvp_matches m
      where realtime.topic() = 'pvp:match:' || m.id::text
        and auth.uid() in (m.player1_id, m.player2_id)
    )
  );

create policy "pvp match participants can send broadcast"
  on realtime.messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.pvp_matches m
      where realtime.topic() = 'pvp:match:' || m.id::text
        and auth.uid() in (m.player1_id, m.player2_id)
    )
  );
