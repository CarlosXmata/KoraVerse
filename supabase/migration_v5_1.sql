-- KORAVERSE 5.1. Additive; apply AFTER migration_v5.sql. Existing data is retained.
begin;
create table if not exists public.koraverse_stars (
 id uuid primary key default gen_random_uuid(), player_key text not null check(player_key in ('carlos','kora')),
 event_key text not null, title text not null, star_name text not null, event_date date not null,
 event_type text not null, story text not null default '', fragment text not null default '', icon text not null default '✦',
 visibility text not null default 'shared' check(visibility in ('shared','public','private')),
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(player_key,event_key)
);
create table if not exists public.koraverse_constellation_definitions (
 id text primary key, name text not null, en text not null, types jsonb not null default '[]', anchor jsonb not null
);
create table if not exists public.koraverse_constellation_members (
 constellation_id text references public.koraverse_constellation_definitions(id), star_id uuid references public.koraverse_stars(id),
 primary key(constellation_id,star_id)
);
create table if not exists public.koraverse_events (
 player_key text not null check(player_key in ('carlos','kora')), event_id text not null,
 completed_at timestamptz, roses jsonb not null default '[]', updated_at timestamptz not null default now(), primary key(player_key,event_id)
);
create table if not exists public.koraverse_universe_state (
 id integer primary key check(id=1), status text not null default 'normal' check(status in ('normal','paused','maintenance')),
 mode_override jsonb, effects_enabled boolean not null default true, updated_at timestamptz not null default now()
);
insert into public.koraverse_universe_state(id) values(1) on conflict do nothing;
create table if not exists public.koraverse_sanctuary_vaults (owner uuid primary key, salt text not null, created_at timestamptz not null default now());
create table if not exists public.koraverse_sanctuary_entries (
 id uuid primary key, owner uuid not null, version integer not null check(version=1), ciphertext text not null,
 iv text not null, salt text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists koraverse_sanctuary_entries_owner on public.koraverse_sanctuary_entries(owner);
create table if not exists public.koraverse_sanctuary_sessions(id uuid primary key, owner uuid not null, expires_at timestamptz not null);
create table if not exists public.koraverse_sanctuary_attempts(key text primary key, attempts integer not null default 0, window_start timestamptz not null default now());
insert into public.koraverse_constellation_definitions(id,name,en,types,anchor) values
 ('signals','Constelación de las Señales','Signals','["signal","sketch"]','[22,28]'),
 ('coffee','Constelación del Café','Coffee','["coffee"]','[73,26]'),
 ('ludus','Ludus','Ludus','["game","chess","sudoku","duo"]','[31,68]'),
 ('quietus','Quietus','Quietus','["quiet","learning"]','[74,66]'),
 ('first-encounter','Constelación del Primer Encuentro','First Encounter','["visit"]','[48,44]'),
 ('rosa-decem','Rosa Decem','Rosa Decem','["birthday","alignment","roses"]','[51,23]') on conflict do nothing;
-- Preserve V5 memories and translate them into dated coordinates.
insert into public.koraverse_stars(player_key,event_key,title,star_name,event_date,event_type,icon,metadata)
 select player_key,event_key,label,label,(created_at at time zone 'America/Santo_Domingo')::date,
 case when event_key like '%coffee%' then 'coffee' when event_key like '%chess%' then 'chess' when event_key like '%sudoku%' then 'sudoku' when event_key like '%signal%' then 'signal' when event_key like '%quiet%' then 'quiet' when event_key like '%learning%' then 'learning' when event_key like '%game%' then 'game' else 'visit' end,
 icon,jsonb_build_object('origin','KORAVERSE 5','legacy',true)
 from public.koraverse_constellations on conflict(player_key,event_key) do nothing;
do $$ declare name text; begin
 foreach name in array array['koraverse_stars','koraverse_constellation_definitions','koraverse_constellation_members','koraverse_events','koraverse_universe_state','koraverse_sanctuary_vaults','koraverse_sanctuary_entries','koraverse_sanctuary_sessions','koraverse_sanctuary_attempts'] loop
 execute format('alter table public.%I enable row level security',name);
 execute format('revoke all on public.%I from anon, authenticated',name);
 execute format('grant all on public.%I to service_role',name);
 end loop;
end $$;
grant select on public.koraverse_stars,public.koraverse_constellation_definitions,public.koraverse_constellation_members,public.koraverse_events,public.koraverse_universe_state to anon,authenticated;
drop policy if exists sky_shared_read on public.koraverse_stars;
create policy sky_shared_read on public.koraverse_stars for select to anon,authenticated using(visibility in ('shared','public'));
do $$ declare name text; begin
 foreach name in array array['koraverse_constellation_definitions','koraverse_constellation_members','koraverse_events','koraverse_universe_state'] loop
 execute format('drop policy if exists sky_read on public.%I',name);
 execute format('create policy sky_read on public.%I for select to anon,authenticated using(true)',name);
 end loop;
end $$;
drop policy if exists sky_read on public.koraverse_constellation_members;
create policy sky_read on public.koraverse_constellation_members for select to anon,authenticated using(exists(select 1 from public.koraverse_stars s where s.id=star_id and s.visibility in ('shared','public')));
-- Only server-side service_role may execute these atomic operations.
create or replace function public.koraverse_sanctuary_attempt(p_key text) returns boolean
language plpgsql security definer set search_path='' as $$
declare allowed boolean; begin
 insert into public.koraverse_sanctuary_attempts as a(key,attempts,window_start) values(p_key,1,now())
 on conflict(key) do update set attempts=case when a.window_start<now()-interval '15 minutes' then 1 else a.attempts+1 end,
 window_start=case when a.window_start<now()-interval '15 minutes' then now() else a.window_start end
 returning attempts<=5 into allowed;
 return allowed;
end $$;
create or replace function public.koraverse_event_progress(p_player text,p_event text,p_rose integer default null,p_complete boolean default false,p_star jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare row_value public.koraverse_events; begin
 if p_player not in ('carlos','kora') or length(p_event)>80 or p_event='' or (p_rose is not null and (p_rose<1 or p_rose>10)) then raise exception 'Invalid event'; end if;
 insert into public.koraverse_events(player_key,event_id) values(p_player,p_event) on conflict do nothing;
 select * into row_value from public.koraverse_events where player_key=p_player and event_id=p_event for update;
 if p_rose is not null and not row_value.roses @> jsonb_build_array(p_rose) then row_value.roses:=row_value.roses||jsonb_build_array(p_rose); end if;
 update public.koraverse_events set roses=row_value.roses,completed_at=case when p_complete then coalesce(completed_at,now()) else completed_at end,updated_at=now()
 where player_key=p_player and event_id=p_event returning * into row_value;
 if p_star is not null and (p_complete or jsonb_array_length(row_value.roses)=10) then
 insert into public.koraverse_stars(player_key,event_key,title,star_name,event_date,event_type,story,fragment,icon,metadata)
 values(p_player,p_star->>'event_key',p_star->>'title',p_star->>'star_name',(p_star->>'event_date')::date,p_star->>'event_type',p_star->>'story',p_star->>'fragment',coalesce(p_star->>'icon','✦'),coalesce(p_star->'metadata','{}'::jsonb))
 on conflict(player_key,event_key) do nothing;
 end if;
 return to_jsonb(row_value);
end $$;
revoke all on function public.koraverse_sanctuary_attempt(text),public.koraverse_event_progress(text,text,integer,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.koraverse_sanctuary_attempt(text),public.koraverse_event_progress(text,text,integer,boolean,jsonb) to service_role;
create or replace function public.koraverse_link_star() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.koraverse_constellation_members(constellation_id,star_id)
 select id,new.id from public.koraverse_constellation_definitions
 where id=new.metadata->>'constellation' or (not new.metadata ? 'constellation' and types @> to_jsonb(array[new.event_type]))
 on conflict do nothing;
 return new;
end $$;
revoke all on function public.koraverse_link_star() from public,anon,authenticated;
drop trigger if exists koraverse_star_membership on public.koraverse_stars;
create trigger koraverse_star_membership after insert or update on public.koraverse_stars for each row execute function public.koraverse_link_star();
insert into public.koraverse_constellation_members(constellation_id,star_id)
select d.id,s.id from public.koraverse_stars s join public.koraverse_constellation_definitions d on d.id=s.metadata->>'constellation' or (not s.metadata ? 'constellation' and d.types @> to_jsonb(array[s.event_type])) on conflict do nothing;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='koraverse_universe_state') then alter publication supabase_realtime add table public.koraverse_universe_state; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='koraverse_stars') then alter publication supabase_realtime add table public.koraverse_stars; end if;
 end if;
end $$;
commit;
