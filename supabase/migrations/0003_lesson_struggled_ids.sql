-- Popis krivo odgovorenih pitanja po lekciji ("Ponovi greške" mod).
--
-- Bez ovog stupca fetchCloudProgress je vraćao prazan popis, a mergeProgress
-- bira stranu s više aktivnosti - pa je prijava na drugom uređaju TIHO
-- BRISALA lokalni popis grešaka i mod ponavljanja ostajao prazan.
--
-- Pokreni u Supabase SQL Editoru (New query -> zalijepi -> Run).
-- Sigurno za ponovno pokretanje.

alter table public.lesson_progress
  add column if not exists struggled_question_ids text[] not null default '{}';
