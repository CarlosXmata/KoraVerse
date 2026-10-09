-- Run after migration_social_v5_1.sql. No existing progress is changed.
begin;
create table if not exists public.koraverse_color_rest(
 player_key text primary key check(player_key in ('carlos','kora')),
 last_visit timestamptz not null default now(),
 dormant boolean not null default false,
 forced_gray boolean not null default false,
 xp_checkpoint bigint not null default 0
);
alter table public.koraverse_color_rest enable row level security;
revoke all on public.koraverse_color_rest from public,anon,authenticated;
grant all on public.koraverse_color_rest to service_role;
insert into public.koraverse_color_rest(player_key,last_visit,xp_checkpoint)
select player_key,coalesce(last_seen::timestamptz,last_active::timestamptz,now()),coalesce(xp,0)
from public.koraverse_profiles where player_key in ('carlos','kora') on conflict do nothing;
create or replace function public.koraverse_color_touch(p_player text,p_awake boolean default false) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r public.koraverse_color_rest;current_xp bigint;
begin
 if p_player not in ('carlos','kora') or p_player is null then raise exception 'Invalid player';end if;
 select coalesce(xp,0) into current_xp from public.koraverse_profiles where player_key=p_player;
 if current_xp is null then raise exception 'Missing profile';end if;
 insert into public.koraverse_color_rest(player_key,xp_checkpoint) values(p_player,current_xp) on conflict do nothing;
 select * into r from public.koraverse_color_rest where player_key=p_player for update;
 if not r.dormant and not r.forced_gray and r.last_visit<=now()-interval '5 days' then
  r.dormant:=true;r.xp_checkpoint:=current_xp;
 end if;
 -- Login never clears gray. Only an XP-award request with a persisted increase can.
 if p_awake and current_xp>r.xp_checkpoint then r.dormant:=false;r.forced_gray:=false;end if;
 update public.koraverse_color_rest set last_visit=now(),dormant=r.dormant,forced_gray=r.forced_gray where player_key=p_player returning * into r;
 return to_jsonb(r)||jsonb_build_object('gray',r.dormant or r.forced_gray);
end $$;
create or replace function public.koraverse_color_preview(p_player text,p_enabled boolean) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r public.koraverse_color_rest;current_xp bigint;
begin
 if p_player not in ('carlos','kora') or p_player is null or p_enabled is null then raise exception 'Invalid preview';end if;
 select coalesce(xp,0) into current_xp from public.koraverse_profiles where player_key=p_player;
 if current_xp is null then raise exception 'Missing profile';end if;
 insert into public.koraverse_color_rest(player_key,xp_checkpoint) values(p_player,current_xp) on conflict do nothing;
 update public.koraverse_color_rest set forced_gray=p_enabled,xp_checkpoint=case when p_enabled then current_xp else xp_checkpoint end where player_key=p_player returning * into r;
 return to_jsonb(r)||jsonb_build_object('gray',r.dormant or r.forced_gray);
end $$;
revoke all on function public.koraverse_color_touch(text,boolean),public.koraverse_color_preview(text,boolean) from public,anon,authenticated;
grant execute on function public.koraverse_color_touch(text,boolean),public.koraverse_color_preview(text,boolean) to service_role;
commit;
