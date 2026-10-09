import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {PGlite} from '@electric-sql/pglite'
import {ColorRest} from '../src/color-rest.js'
import {Sanctuary} from '../src/sanctuary.js'
import {createSanctuaryHandler} from '../api/sanctuary.js'
test('five days latches gray across visits; only new persisted XP restores it; admin previews are per-profile and reversible',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table koraverse_profiles(player_key text primary key,xp bigint,last_seen timestamptz,last_active date);
 insert into koraverse_profiles values('carlos',100,now(),current_date),('kora',50,now()-interval '6 days',current_date-6);`)
 const sql=fs.readFileSync(new URL('../supabase/migration_color_rest.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql)
 const call=async(who,awake=false)=>(await db.query('select koraverse_color_touch($1,$2) as value',[who,awake])).rows[0].value
 assert.equal((await call('carlos')).gray,false);assert.equal((await call('kora')).gray,true);assert.equal((await call('kora')).gray,true);assert.equal((await call('kora',true)).gray,true)
 await db.exec("update koraverse_profiles set xp=51 where player_key='kora'");assert.equal((await call('kora')).gray,true);assert.equal((await call('kora',true)).gray,false)
 const preview=async(who,on)=>(await db.query('select koraverse_color_preview($1,$2) as value',[who,on])).rows[0].value
 const before=(await db.query("select * from koraverse_color_rest where player_key='carlos'")).rows[0];assert.equal((await preview('carlos',true)).gray,true);assert.equal((await call('kora')).gray,false)
 const after=(await db.query("select * from koraverse_color_rest where player_key='carlos'")).rows[0];assert.equal(String(before.last_visit),String(after.last_visit));assert.equal((await call('carlos',true)).gray,true)
 assert.equal((await preview('carlos',false)).gray,false);await preview('kora',true);await db.exec("update koraverse_profiles set xp=52 where player_key='kora'");assert.equal((await call('kora',true)).forced_gray,false)
 await db.exec("update koraverse_color_rest set last_visit=now()-interval '5 days' where player_key='carlos'");assert.equal((await call('carlos')).gray,true);await preview('carlos',true);assert.equal((await preview('carlos',false)).gray,true)
 await assert.rejects(call('admin'));await db.exec('set role anon');await assert.rejects(db.query('select * from koraverse_color_rest'),/permission denied/);await assert.rejects(call('kora'),/permission denied/)
 }finally{await db.close()}
})
test('color client distinguishes visit and EXP, serializes requests, excludes QA and ignores a departed profile response',async()=>{
 let who='kora',qa=false,values=[],requests=[],release;const client=new ColorRest({player:()=>who,qa:()=>qa,apply:x=>values.push(x),request:async(_,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({color:{gray:requests.length===1}})}}})
 await client.sync();await client.sync(true);assert.deepEqual(requests.map(x=>x.action),['color-touch','color-awake']);assert.deepEqual(values,[true,false]);qa=true;await client.sync(true);assert.equal(requests.length,2)
 qa=false;client.request=async()=>{await new Promise(r=>release=r);return {ok:true,json:async()=>({color:{gray:true}})}};const pending=client.sync();await Promise.resolve();who='carlos';release();await pending;assert.deepEqual(values,[true,false]);client.clear();assert.equal(values.at(-1),false)
})
test('Sanctuary controls name both profiles and preserve private session authorization',async()=>{
 const markup=Sanctuary.prototype.colorMarkup.call({colors:[{player_key:'carlos',forced_gray:true},{player_key:'kora',dormant:true}]});assert.match(markup,/data-color-player="carlos"/);assert.match(markup,/data-color-player="kora"/);assert.match(markup,/Quitar simulación/)
 const res={setHeader(){},status(value){this.code=value;return this},json(){return this}};await createSanctuaryHandler({env:{},db:{from(){throw Error('Unauthenticated preview must never touch DB')}}})({method:'POST',headers:{origin:'https://example.test'},query:{resource:'color-rest'},body:{player:'kora',enabled:true}},res);assert.equal(res.code,403)
})
