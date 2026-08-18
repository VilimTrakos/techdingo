-- TechDingo Faza 2 — početna shema: profili, sinkronizacija napretka,
-- javni leaderboard, PvP matchmaking i dvoboji.
--
-- Pokreni ovu datoteku JEDNOM u Supabase SQL Editoru (Project → SQL Editor
-- → New query → zalijepi cijeli sadržaj → Run), nakon toga
-- supabase/seed_questions_meta.sql (generiran iz stvarne baze pitanja).

-- ============================================================
-- profiles
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Javno čitljivo (leaderboard, ime protivnika u PvP-u) - NAMJERNO. Zato
-- display_name NIKAD ne smije defaultirati na email/dio emaila (PII leak) -
-- vidi handle_new_user() ispod.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Automatski kreira profil pri signupu, s ne-PII default imenom.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'Player-' || substr(new.id::text, 1, 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- progress / lesson_progress / score_strike_progress
-- (mirror ProgressStateV1 iz src/state/progressTypes.ts, jedan red po korisniku/temi)
-- ============================================================

create table public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp_total int not null default 0,
  streak_current int not null default 0,
  streak_longest int not null default 0,
  streak_last_completed_date date,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "users manage own progress"
  on public.progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.lesson_progress (
  user_id uuid references auth.users (id) on delete cascade,
  topic_id text not null,
  pass_count int not null default 0,
  fail_count int not null default 0,
  recent_question_ids text[] not null default '{}',
  primary key (user_id, topic_id)
);

alter table public.lesson_progress enable row level security;

create policy "users manage own lesson progress"
  on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.score_strike_progress (
  user_id uuid references auth.users (id) on delete cascade,
  topic_id text not null,
  best_score int not null default 0,
  best_at timestamptz,
  play_count int not null default 0,
  recent_question_ids text[] not null default '{}',
  primary key (user_id, topic_id)
);

alter table public.score_strike_progress enable row level security;

create policy "users manage own score strike progress"
  on public.score_strike_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- leaderboard (VIEW, ne tablica)
--
-- NAMJERNO bez `security_invoker` - ovo je standardni Supabase pattern za
-- "javni view nad privatnom tablicom" (view se izvršava s privilegijama
-- vlasnika viewa, ne pozivatelja, pa zaobilazi owner-only RLS na
-- score_strike_progress). RLS OVDJE NE ŠTITI - štiti isključivo eksplicitni
-- SELECT popis dolje. NIKAD ne pretvoriti u `select *` i NIKAD ne dodati
-- `security_invoker = true` (to bi tiho slomilo leaderboard jer bi opet
-- upalio RLS koji SELECT ograničava na vlastite redove).
-- ============================================================

create view public.leaderboard as
  select
    s.topic_id,
    p.display_name,
    s.best_score
  from public.score_strike_progress s
  join public.profiles p on p.id = s.user_id
  order by s.best_score desc;

grant select on public.leaderboard to anon, authenticated;

-- ============================================================
-- questions_meta — SAMO metapodaci (id/tema/težina), NIKAD odgovori/točan
-- odgovor. Puna banka pitanja (uključujući correctIndex) ostaje isključivo
-- u client bundleu (src/data/questions/*.json) - ovo postoji samo da
-- join_pvp_queue može server-side birati fer, deterministički skup pitanja
-- za oba igrača u PvP meču. Sadržaj generira scripts/generate-question-
-- metadata-seed.ts iz postojećih JSON datoteka - vidi seed_questions_meta.sql.
-- ============================================================

create table public.questions_meta (
  id text primary key,
  topic_id text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard'))
);

create index questions_meta_topic_difficulty_idx
  on public.questions_meta (topic_id, difficulty);

alter table public.questions_meta enable row level security;

create policy "questions_meta is publicly readable"
  on public.questions_meta for select
  using (true);

-- ============================================================
-- PvP: queue + matches
-- Sve pisanje u pvp_queue/pvp_matches ide ISKLJUČIVO kroz SECURITY DEFINER
-- funkcije ispod - namjerno NEMA insert/update policy za authenticated na
-- ovim tablicama, inače bi jedan igrač mogao npr. prepisati rezultat drugog
-- igrača (RLS je row-scoped, ne column-scoped - `with check` ne bi to spriječio).
-- ============================================================

create table public.pvp_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  topic_id text not null,
  status text not null default 'waiting' check (status in ('waiting', 'matched')),
  joined_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

alter table public.pvp_queue enable row level security;

create policy "users read own queue row"
  on public.pvp_queue for select
  using (auth.uid() = user_id);

create table public.pvp_matches (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null,
  status text not null default 'active' check (status in ('active', 'finished')),
  player1_id uuid not null references auth.users (id) on delete cascade,
  player2_id uuid not null references auth.users (id) on delete cascade,
  question_ids text[] not null,
  player1_score int,
  player2_score int,
  player1_answers jsonb,
  player2_answers jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.pvp_matches enable row level security;

create policy "participants read own match"
  on public.pvp_matches for select
  using (auth.uid() in (player1_id, player2_id));

-- Postgres Changes (za "čekam u redu -> upravo sam uparen" notifikaciju).
alter publication supabase_realtime add table public.pvp_matches;

-- Difficulty-proporcionalni odabir pitanja za jedan PvP meč (mirror logike
-- iz src/lib/pool.ts, ali server-side na questions_meta) - easy pitanja su
-- prva u nizu, pa medium, pa hard (isti "lakše prema težem" osjećaj kao solo).
create function public.pick_pvp_question_ids(p_topic_id text, p_size int default 15)
returns text[]
language plpgsql
stable
as $$
declare
  v_easy int := ceil(p_size / 3.0);
  v_medium int := ceil(p_size / 3.0);
  v_hard int := greatest(p_size - v_easy - v_medium, 0);
  v_picked text[] := '{}';
  v_shortfall int;
begin
  v_picked := v_picked || array(
    select id from public.questions_meta
    where (p_topic_id = 'mixed' or topic_id = p_topic_id) and difficulty = 'easy'
    order by random() limit v_easy
  );
  v_picked := v_picked || array(
    select id from public.questions_meta
    where (p_topic_id = 'mixed' or topic_id = p_topic_id) and difficulty = 'medium'
    order by random() limit v_medium
  );
  v_picked := v_picked || array(
    select id from public.questions_meta
    where (p_topic_id = 'mixed' or topic_id = p_topic_id) and difficulty = 'hard'
    order by random() limit v_hard
  );

  v_shortfall := p_size - coalesce(array_length(v_picked, 1), 0);
  if v_shortfall > 0 then
    v_picked := v_picked || array(
      select id from public.questions_meta
      where (p_topic_id = 'mixed' or topic_id = p_topic_id)
        and not (id = any(v_picked))
      order by random()
      limit v_shortfall
    );
  end if;

  return v_picked;
end;
$$;

-- Matchmaking: transakcijski, FOR UPDATE SKIP LOCKED sprječava da dva
-- konkurentna poziva uhvate istog partnera (job-queue pattern). Client-side
-- "presence pa INSERT ON CONFLICT" pristup je namjerno ODBAČEN - dokazano
-- lomljiv kod 3+ istovremenih igrača (dva klijenta mogu izračunati različit
-- par jer je presence eventualno-konzistentan, pa isti igrač završi u dva
-- meča odjednom). Ovo ne može mimoići taj problem jer je sve u jednoj
-- Postgres transakciji.
--
-- Rijedak preostali slučaj: dva korisnika pozovu ovu funkciju u TOČNO
-- istom trenutku (obje transakcije vide samo svoj vlastiti, još nepotvrđen
-- red) - oboje završe u statusu 'waiting' bez para. Ovo se samo-popravlja:
-- klijent (usePvpMatch hook) treba periodički (npr. svake 3s) ponovno zvati
-- ovu funkciju dok je status 'waiting' (idempotentno zbog upserta ispod) -
-- sljedeći poziv će vidjeti već commitani red druge strane i uparit ih.
create function public.join_pvp_queue(p_topic_id text)
returns table (match_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_partner_id uuid;
  v_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.pvp_queue (user_id, topic_id, status, joined_at, last_activity_at)
  values (v_user_id, p_topic_id, 'waiting', now(), now())
  on conflict (user_id) do update
    set topic_id = excluded.topic_id,
        status = 'waiting',
        joined_at = now(),
        last_activity_at = now();

  select q.user_id into v_partner_id
  from public.pvp_queue q
  where q.topic_id = p_topic_id
    and q.status = 'waiting'
    and q.user_id <> v_user_id
  order by q.joined_at
  limit 1
  for update skip locked;

  if v_partner_id is null then
    return query select null::uuid, 'waiting'::text;
    return;
  end if;

  v_match_id := gen_random_uuid();

  insert into public.pvp_matches (id, topic_id, status, player1_id, player2_id, question_ids)
  values (v_match_id, p_topic_id, 'active', v_user_id, v_partner_id,
          public.pick_pvp_question_ids(p_topic_id));

  update public.pvp_queue set status = 'matched'
  where user_id in (v_user_id, v_partner_id);

  return query select v_match_id, 'matched'::text;
end;
$$;

grant execute on function public.join_pvp_queue(text) to authenticated;

-- Svaki igrač smije pisati ISKLJUČIVO svoj player{1,2}_score/answers stupac -
-- funkcija grana na temelju auth.uid() usporedbe, nikad ne dopušta pisanje
-- tuđeg stupca. Kad OBA igrača upišu rezultat, meč se automatski označi
-- 'finished'.
create function public.submit_pvp_result(p_match_id uuid, p_score int, p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.pvp_matches;
begin
  select * into v_match from public.pvp_matches where id = p_match_id;
  if v_match.id is null then
    raise exception 'match not found';
  end if;

  if v_user_id = v_match.player1_id then
    update public.pvp_matches
      set player1_score = p_score, player1_answers = p_answers
      where id = p_match_id;
  elsif v_user_id = v_match.player2_id then
    update public.pvp_matches
      set player2_score = p_score, player2_answers = p_answers
      where id = p_match_id;
  else
    raise exception 'not a participant in this match';
  end if;

  update public.pvp_matches
    set status = 'finished', finished_at = now()
    where id = p_match_id
      and player1_score is not null
      and player2_score is not null
      and status <> 'finished';
end;
$$;

grant execute on function public.submit_pvp_result(uuid, int, jsonb) to authenticated;

-- ============================================================
-- Realtime Authorization za privatan Broadcast kanal po meču
-- (kanal "pvp:match:<id>", kreiran client-side s { config: { private: true } }).
-- Bez ovoga bi bilo tko s anon key-em (svatko, po dizajnu javan) mogao
-- prisluškivati ili krivotvoriti evente u TUĐEM meču - table RLS na
-- pvp_matches ovo NE štiti jer je Broadcast zaseban autorizacijski sloj.
-- ============================================================

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
