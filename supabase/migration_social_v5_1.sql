-- Signals 2.0, additive and idempotent. Run AFTER migration_v5_1.sql.
begin;
alter table public.koraverse_messages add column if not exists metadata jsonb not null default '{}'::jsonb;
create table if not exists public.koraverse_media_members(
 user_id uuid primary key references auth.users(id) on delete cascade,
 player_key text not null unique check(player_key in ('carlos','kora'))
);
alter table public.koraverse_media_members enable row level security;
revoke all on public.koraverse_media_members from public,anon,authenticated;
grant select on public.koraverse_media_members to authenticated;
grant all on public.koraverse_media_members to service_role;
drop policy if exists media_member_self on public.koraverse_media_members;
create policy media_member_self on public.koraverse_media_members for select to authenticated using(user_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('koraverse-chat-media','koraverse-chat-media',false,4194304,array['image/webp','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists chat_media_read on storage.objects;
create policy chat_media_read on storage.objects for select to authenticated using(
 bucket_id='koraverse-chat-media' and exists(select 1 from public.koraverse_media_members where user_id=auth.uid())
);
drop policy if exists chat_media_insert on storage.objects;
create policy chat_media_insert on storage.objects for insert to authenticated with check(
 bucket_id='koraverse-chat-media'
 and name ~ '^(carlos|kora)/[0-9]{4}/(0[1-9]|1[0-2])/[a-f0-9-]{36}(-thumb)?\.(webp|jpg)$'
 and exists(select 1 from public.koraverse_media_members where user_id=auth.uid() and player_key=(storage.foldername(name))[1])
);
drop policy if exists chat_media_delete on storage.objects;
create policy chat_media_delete on storage.objects for delete to authenticated using(
 bucket_id='koraverse-chat-media' and owner_id=auth.uid()::text
 and exists(select 1 from public.koraverse_media_members where user_id=auth.uid() and player_key=(storage.foldername(name))[1])
);
-- No public bucket, no anon object access, no update/upsert policy.
create table if not exists public.koraverse_push_receipts(message_id bigint primary key references public.koraverse_messages(id) on delete cascade,created_at timestamptz not null default now());
alter table public.koraverse_push_receipts enable row level security;
revoke all on public.koraverse_push_receipts from public,anon,authenticated;
grant all on public.koraverse_push_receipts to service_role;
-- PIN migration adds a marker and preserves encrypted originals; no diary text is decrypted by SQL.
alter table public.koraverse_sanctuary_vaults add column if not exists key_version integer not null default 1;
create table if not exists public.koraverse_sanctuary_key_backup(owner uuid primary key,salt text not null,entries jsonb not null,created_at timestamptz not null default now());
alter table public.koraverse_sanctuary_key_backup add column if not exists converted jsonb;
alter table public.koraverse_sanctuary_key_backup enable row level security;
revoke all on public.koraverse_sanctuary_key_backup from public,anon,authenticated;
grant all on public.koraverse_sanctuary_key_backup to service_role;
create or replace function public.koraverse_migrate_vault_key(p_owner uuid,p_entries jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare old_version integer;old_salt text;item jsonb;stored_count integer;
begin
 lock table public.koraverse_sanctuary_entries in share row exclusive mode;
 select key_version,salt into old_version,old_salt from public.koraverse_sanctuary_vaults where owner=p_owner for update;
 if old_version is null or old_version<>1 then raise exception 'Vault is not a legacy vault';end if;
 perform 1 from public.koraverse_sanctuary_entries where owner=p_owner for update;
 select count(*) into stored_count from public.koraverse_sanctuary_entries where owner=p_owner;
 if jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)<>stored_count then raise exception 'Entry count mismatch';end if;
 if (select count(distinct v->>'id') from jsonb_array_elements(p_entries) v)<>stored_count then raise exception 'Duplicate entry';end if;
 insert into public.koraverse_sanctuary_key_backup(owner,salt,entries)
 select p_owner,old_salt,coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) from public.koraverse_sanctuary_entries e where owner=p_owner;
 for item in select * from jsonb_array_elements(p_entries) loop
  if not exists(select 1 from public.koraverse_sanctuary_entries where owner=p_owner and id=(item->>'id')::uuid) then raise exception 'Unknown entry';end if;
  if exists(select 1 from public.koraverse_sanctuary_entries where owner=p_owner and id=(item->>'id')::uuid and ciphertext is distinct from item->>'previous_ciphertext') then raise exception 'Concurrent edit; retry migration';end if;
  if (item->>'version')::integer is distinct from 1 or coalesce(length(item->>'ciphertext'),0) not between 1 and 180000 or coalesce(length(item->>'iv'),0)=0 or coalesce(length(item->>'salt'),0)=0 then raise exception 'Invalid encrypted entry';end if;
  update public.koraverse_sanctuary_entries set ciphertext=item->>'ciphertext',iv=item->>'iv',salt=item->>'salt',updated_at=now() where owner=p_owner and id=(item->>'id')::uuid;
 end loop;
 update public.koraverse_sanctuary_key_backup set converted=p_entries where owner=p_owner;
 update public.koraverse_sanctuary_vaults set key_version=2 where owner=p_owner;
 delete from public.koraverse_sanctuary_sessions where owner=p_owner;
end $$;
revoke all on function public.koraverse_migrate_vault_key(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.koraverse_migrate_vault_key(uuid,jsonb) to service_role;
-- Safe immediate rollback only: refuse if any entry was added, deleted or edited afterward.
create or replace function public.koraverse_rollback_vault_key(p_owner uuid) returns void
language plpgsql security definer set search_path=public as $$
declare backup public.koraverse_sanctuary_key_backup;item jsonb;v integer;n integer;
begin
 lock table public.koraverse_sanctuary_entries in share row exclusive mode;
 select key_version into v from public.koraverse_sanctuary_vaults where owner=p_owner for update;
 if v is distinct from 2 then raise exception 'Vault is not migrated';end if;
 select * into backup from public.koraverse_sanctuary_key_backup where owner=p_owner for update;
 if backup.converted is null then raise exception 'No migration backup';end if;
 perform 1 from public.koraverse_sanctuary_entries where owner=p_owner for update;
 select count(*) into n from public.koraverse_sanctuary_entries where owner=p_owner;
 if n<>jsonb_array_length(backup.converted) then raise exception 'New diary changes; rollback refused';end if;
 for item in select * from jsonb_array_elements(backup.converted) loop
  if not exists(select 1 from public.koraverse_sanctuary_entries where owner=p_owner and id=(item->>'id')::uuid and ciphertext=item->>'ciphertext' and iv=item->>'iv' and salt=item->>'salt') then raise exception 'New diary changes; rollback refused';end if;
 end loop;
 for item in select * from jsonb_array_elements(backup.entries) loop
  update public.koraverse_sanctuary_entries set ciphertext=item->>'ciphertext',iv=item->>'iv',salt=item->>'salt',updated_at=(item->>'updated_at')::timestamptz where owner=p_owner and id=(item->>'id')::uuid;
 end loop;
 update public.koraverse_sanctuary_vaults set salt=backup.salt,key_version=1 where owner=p_owner;
 delete from public.koraverse_sanctuary_sessions where owner=p_owner;
 delete from public.koraverse_sanctuary_key_backup where owner=p_owner;
end $$;
revoke all on function public.koraverse_rollback_vault_key(uuid) from public,anon,authenticated;
grant execute on function public.koraverse_rollback_vault_key(uuid) to service_role;
commit;
