import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {PGlite} from '@electric-sql/pglite'
test('social SQL is repeatable, photo RLS isolates identities and diary conversion/rollback are atomic',async()=>{
 const db=new PGlite(),owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id bigint generated always as identity,bucket_id text,name text,owner_id text);
 alter table storage.objects enable row level security;
 grant usage on schema auth,storage to authenticated,anon,service_role;
 grant select,insert,delete,update on storage.objects to authenticated,anon,service_role;
 grant usage on all sequences in schema storage to authenticated,anon,service_role;
 create table public.koraverse_constellations(id bigint primary key,player_key text,event_key text,label text,icon text,created_at timestamptz);
 create table public.koraverse_messages(id bigint primary key,body text);
 insert into public.koraverse_messages values(1,'old message');
 insert into auth.users values('${owner}'),('${other}');`)
 await db.exec(fs.readFileSync(new URL('../supabase/migration_v5_1.sql',import.meta.url),'utf8'))
 const sql=fs.readFileSync(new URL('../supabase/migration_social_v5_1.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql)
 assert.equal((await db.query('select body from koraverse_messages')).rows[0].body,'old message')
 assert.equal((await db.query("select public from storage.buckets where id='koraverse-chat-media'")).rows[0].public,false)
 await db.query("insert into koraverse_media_members values($1,'carlos'),($2,'kora')",[owner,other])
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${owner}'`)
 assert.equal((await db.query('select * from koraverse_media_members')).rows.length,1)
 await db.query("insert into storage.objects(bucket_id,name,owner_id) values('koraverse-chat-media',$1,$2)",[`carlos/2026/10/${id}.webp`,owner])
 await assert.rejects(db.query("insert into storage.objects(bucket_id,name,owner_id) values('koraverse-chat-media',$1,$2)",[`kora/2026/10/${id}.webp`,owner]),/row-level security/)
 await db.exec(`set request.jwt.claim.sub='${other}'`);assert.equal((await db.query('select * from storage.objects')).rows.length,1)
 assert.equal((await db.query('delete from storage.objects returning *')).rows.length,0)
 await db.exec('set role anon');assert.equal((await db.query('select * from storage.objects')).rows.length,0)
 await assert.rejects(db.query('select * from koraverse_sanctuary_key_backup'),/permission denied/)
 await assert.rejects(db.query('select koraverse_rollback_vault_key($1)',[owner]),/permission denied/)
 await db.exec('reset role');await db.query("insert into koraverse_sanctuary_vaults(owner,salt) values($1,'vault-salt')",[owner])
 await db.query("insert into koraverse_sanctuary_entries(id,owner,ciphertext,iv,salt,version) values($1,$2,'old-cipher','old-iv','old-salt',1)",[id,owner])
 const converted=[{id,version:1,ciphertext:'new-cipher',iv:'new-iv',salt:'new-salt',previous_ciphertext:'old-cipher'}]
 await assert.rejects(db.query('select koraverse_migrate_vault_key($1,$2::jsonb)',[owner,'[]']),/count mismatch/)
 await assert.rejects(db.query('select koraverse_migrate_vault_key($1,$2::jsonb)',[owner,JSON.stringify([{...converted[0],previous_ciphertext:'stale'}])]),/Concurrent edit/)
 assert.equal((await db.query('select * from koraverse_sanctuary_key_backup')).rows.length,0)
 await db.query('select koraverse_migrate_vault_key($1,$2::jsonb)',[owner,JSON.stringify(converted)])
 assert.equal((await db.query('select key_version from koraverse_sanctuary_vaults')).rows[0].key_version,2)
 await db.exec("update koraverse_sanctuary_entries set ciphertext='later-edit'")
 await assert.rejects(db.query('select koraverse_rollback_vault_key($1)',[owner]),/New diary changes/)
 assert.equal((await db.query('select ciphertext from koraverse_sanctuary_entries')).rows[0].ciphertext,'later-edit')
 await db.exec("update koraverse_sanctuary_entries set ciphertext='new-cipher'");await db.query('select koraverse_rollback_vault_key($1)',[owner])
 assert.equal((await db.query('select ciphertext from koraverse_sanctuary_entries')).rows[0].ciphertext,'old-cipher')
 assert.equal((await db.query('select key_version from koraverse_sanctuary_vaults')).rows[0].key_version,1)
 }finally{await db.close()}
})
