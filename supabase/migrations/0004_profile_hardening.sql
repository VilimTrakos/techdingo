-- 1) Validacija javnog imena NA SERVERU.
--
-- display_name je javno čitljiv (ljestvica, PvP), a ograničenje 3-24 znaka
-- postojalo je samo u klijentu (src/hooks/useProfile.ts). Bilo tko s anon
-- ključem - koji je po dizajnu javan - mogao je poslati PATCH s praznim
-- stringom, 100 KB teksta ili HTML-om, i to bi se prikazalo svima.
--
-- Jedinstvenost imena NAMJERNO ne uvodimo: lažno bi obećavala zaštitu od
-- lažnog predstavljanja (dovoljna je jedna zamijenjena slova), a stvarala bi
-- sukobe pri registraciji.

-- Postojeća imena prvo dovedi u okvir da constraint može proći.
update public.profiles
   set display_name = 'Player-' || substr(id::text, 1, 8)
 where char_length(trim(display_name)) < 3
    or char_length(display_name) > 24;

alter table public.profiles
  drop constraint if exists profiles_display_name_length;

alter table public.profiles
  add constraint profiles_display_name_length
  check (char_length(trim(display_name)) between 3 and 24);

-- 2) Brisanje vlastitog računa.
--
-- Bez ovoga brisanje traži service-role ključ (dashboard). Uz javno čitljivo
-- ime to je i pravna obveza (GDPR "pravo na zaborav").
-- SECURITY DEFINER jer auth.users nije dostupan anon/authenticated ulozi;
-- set search_path = public je obavezna zaštita od search_path napada.
-- Briše SAMO vlastiti račun - auth.uid() se ne može lažirati.
-- Ostali redovi (progress, lesson_progress, ...) odlaze kaskadno preko
-- profiles.id -> auth.users(id) on delete cascade.

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nije prijavljen nijedan korisnik.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
