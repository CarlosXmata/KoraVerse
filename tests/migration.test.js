import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {PGlite} from '@electric-sql/pglite'
test('V5.1 migration executes twice, preserves V5 memories and denies public private access',async()=>{
 const db=new PGlite()
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
   create table public.koraverse_constellations(id bigint primary key,player_key text,event_key text,label text,icon text,created_at timestamptz);
   insert into public.koraverse_constellations values(1,'kora','first-visit','Primera luz','✦','2026-10-08T01:00:00Z');`)
  const sql=fs.readFileSync(new URL('../supabase/migration_v5_1.sql',import.meta.url),'utf8')
  await db.exec(sql);await db.exec(sql)
  const original=await db.query('select * from public.koraverse_constellations');assert.equal(original.rows.length,1)
  const stars=await db.query('select * from public.koraverse_stars');assert.equal(stars.rows.length,1);assert.equal(new Date(stars.rows[0].event_date).toISOString().slice(0,10),'2026-10-07')
  assert.equal((await db.query('select * from public.koraverse_constellation_definitions')).rows.length,6)
  for(let i=1;i<=10;i++)await db.query("select public.koraverse_event_progress('kora','alignment-2026',$1,true)",[i])
  await db.query("select public.koraverse_event_progress('kora','alignment-2026',10,true)")
  const receipt=(await db.query('select * from public.koraverse_events')).rows[0];assert.equal(receipt.roses.length,10);assert.ok(receipt.completed_at)
  const star={event_key:'alignment-2026',title:'La Alineación',star_name:'Aurelia',event_date:'2026-10-10',event_type:'alignment',story:'Una historia',fragment:'Una luz',metadata:{constellation:'rosa-decem'}}
  await db.query("select public.koraverse_event_progress('kora','alignment-2026',null,true,$1::jsonb)",[JSON.stringify(star)])
  await db.query("select public.koraverse_event_progress('kora','alignment-2026',null,true,$1::jsonb)",[JSON.stringify(star)])
  assert.equal((await db.query("select * from public.koraverse_stars where event_key='alignment-2026'")).rows.length,1)
  await assert.rejects(db.query("select public.koraverse_event_progress('carlos','atomic-failure',null,true,$1::jsonb)",[JSON.stringify({...star,title:null})]))
  assert.equal((await db.query("select * from public.koraverse_events where event_id='atomic-failure'")).rows.length,0)
  for(let i=0;i<5;i++)assert.equal((await db.query("select public.koraverse_sanctuary_attempt('test') as allowed")).rows[0].allowed,true)
  assert.equal((await db.query("select public.koraverse_sanctuary_attempt('test') as allowed")).rows[0].allowed,false)
  await db.exec('set role anon');assert.equal((await db.query('select * from public.koraverse_stars')).rows.length,2)
  await assert.rejects(db.query('select * from public.koraverse_sanctuary_entries'),/permission denied/)
  await assert.rejects(db.query("select public.koraverse_sanctuary_attempt('test')"),/permission denied/)
  await assert.rejects(db.query("update public.koraverse_universe_state set status='paused'"),/permission denied/)
 }finally{await db.close()}
})
