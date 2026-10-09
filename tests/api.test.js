import test from 'node:test'
import assert from 'node:assert/strict'
import {createUnlockHandler} from '../api/sanctuary-unlock.js'
import {createSanctuaryHandler} from '../api/sanctuary.js'
import {createSkyHandler} from '../api/sky.js'
import {hashPin,issueSession,COOKIE} from '../lib/sanctuary-security.js'
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',origin='https://example.test',pin='test-only-private-key'
const env={SANCTUARY_PIN_SALT:'ab'.repeat(32),SANCTUARY_SESSION_SECRET:'test-only-secret-'.repeat(4),SANCTUARY_OWNER_USER_ID:owner,SANCTUARY_ORIGIN:origin}
env.SANCTUARY_PIN_HASH=hashPin(pin,env.SANCTUARY_PIN_SALT)
function response(){return {code:0,headers:{},value:null,setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(value){this.value=value;return this}}}
function fakeDB({user=owner,limited=false,fail=false,state={id:1,status:'normal',mode_override:null,effects_enabled:true}}={}){
 const calls=[],tables={koraverse_sanctuary_vaults:[],koraverse_sanctuary_sessions:[],koraverse_sanctuary_entries:[],koraverse_universe_state:[state],koraverse_stars:[],koraverse_events:[],koraverse_constellation_definitions:[]}
 const db={calls,tables,auth:{getUser:async()=>({data:{user:{id:user}},error:null})},rpc:async name=>{calls.push(name);return {data:!limited,error:fail?{}:null}},from(name){let operation='select',payload=null,single=false,filters=[];const result={select(){return this},eq(k,v){filters.push(r=>r[k]===v);return this},gt(k,v){filters.push(r=>r[k]>v);return this},in(k,v){filters.push(r=>v.includes(r[k]));return this},order(){return this},maybeSingle(){single=true;return this},single(){single=true;return this},upsert(value){operation='upsert';payload=value;return this},insert(value){operation='insert';payload=value;return this},update(value){operation='update';payload=value;return this},delete(){operation='delete';return this},then(resolve){calls.push(`${name}:${operation}`);if(fail)return Promise.resolve({error:{},data:null}).then(resolve);let rows=tables[name]||[];if(operation==='insert'||operation==='upsert'){if(name==='koraverse_sanctuary_vaults'&&rows.length){}else rows.push(payload);tables[name]=rows}if(operation==='update')rows.filter(r=>filters.every(f=>f(r))).forEach(r=>Object.assign(r,payload));if(operation==='delete')tables[name]=rows.filter(r=>!filters.every(f=>f(r)));const data=rows.filter(r=>filters.every(f=>f(r)));return Promise.resolve({error:null,data:single?data[0]||null:data}).then(resolve)}};return result}}
 return db
}
const request=(body,extra={})=>({method:'POST',headers:{origin,'sec-fetch-site':'same-origin',authorization:'Bearer test'},body,...extra})

test('gray preview validates profile and boolean behind an active Sanctuary session',async()=>{
 const db=fakeDB(),session=issueSession(env,1000000),calls=[];db.tables.koraverse_sanctuary_sessions.push({id:session.claims.id,owner,expires_at:new Date(session.claims.exp*1000).toISOString()});db.rpc=async(name,args)=>{calls.push({name,args});return {data:{player_key:args.p_player,forced_gray:args.p_enabled},error:null}}
 const headers={origin,'sec-fetch-site':'same-origin',cookie:`${COOKIE}=${session.token}`},handler=createSanctuaryHandler({env,db,now:()=>1000100})
 for(const body of [{player:'admin',enabled:true},{player:'kora',enabled:'true'},{player:'Carlos',enabled:true}]){const res=response();await handler(request(body,{headers,query:{resource:'color-rest'}}),res);assert.equal(res.code,400)}
 assert.equal(calls.length,0)
 for(const player of ['carlos','kora'])for(const enabled of [true,false]){const res=response();await handler(request({player,enabled},{headers,query:{resource:'color-rest'}}),res);assert.equal(res.code,200);assert.deepEqual(calls.at(-1),{name:'koraverse_color_preview',args:{p_player:player,p_enabled:enabled}})}
 const res=response();await createSanctuaryHandler({env,db,now:()=>2200000})(request({player:'kora',enabled:true},{headers,query:{resource:'color-rest'}}),res);assert.equal(res.code,401);assert.equal(calls.length,4)
})
test('unlock requires the owner Auth user, valid private key, rate allowance and same origin',async()=>{
 for(const [options,body,code] of [[{user:'someone-else'},{pin},401],[{}, {pin:'wrong-key'},401],[{limited:true},{pin},429],[{fail:true},{pin},503],[{}, {pin},200]]){
  const db=fakeDB(options),res=response();await createUnlockHandler({env,db,now:()=>1000000})(request(body),res);assert.equal(res.code,code)
  if(code===200){assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);assert.equal(res.value.owner,owner);assert.equal(db.tables.koraverse_sanctuary_sessions.length,1);assert.equal(JSON.stringify(res.value).includes(pin),false)}else assert.equal(db.tables.koraverse_sanctuary_sessions.length,0)
 }
 const res=response(),db=fakeDB();await createUnlockHandler({env,db})(request({pin},{headers:{origin:'https://evil.test'}}),res);assert.equal(res.code,403);assert.deepEqual(db.calls,[])
})
test('private endpoints reject expired or revoked sessions; universe state persists and wakes',async()=>{
 const db=fakeDB(),session=issueSession(env,1000000);db.tables.koraverse_sanctuary_sessions.push({id:session.claims.id,owner,expires_at:new Date(session.claims.exp*1000).toISOString()})
 const headers={origin,'sec-fetch-site':'same-origin',cookie:`${COOKIE}=${session.token}`}
 const handler=createSanctuaryHandler({env,db,now:()=>1000100})
 for(const status of ['paused','maintenance','normal']){const res=response();await handler(request({status,mode_override:null,effects_enabled:true},{headers,query:{resource:'universe'}}),res);assert.equal(res.code,200);assert.equal(db.tables.koraverse_universe_state[0].status,status)}
 const plaintext=response();await handler(request({id:crypto.randomUUID(),title:'private',body:'private'},{headers,query:{resource:'entries'}}),plaintext);assert.equal(plaintext.code,400);assert.equal(db.tables.koraverse_sanctuary_entries.length,0)
 const expired=response();await createSanctuaryHandler({env,db,now:()=>2200000})({method:'GET',headers,query:{resource:'entries'}},expired);assert.equal(expired.code,401)
 const logout=response();await handler({method:'DELETE',headers,query:{resource:'session'}},logout);assert.equal(logout.code,200);assert.equal(db.tables.koraverse_sanctuary_sessions.length,0)
 const revoked=response();await handler({method:'GET',headers,query:{resource:'entries'}},revoked);assert.equal(revoked.code,401)
})
test('preview birthday mode cannot write receipts, and unknown milestones fail closed',async()=>{
 const db=fakeDB({state:{id:1,status:'normal',mode_override:{mode:'birthday-alignment',preview:true}}}),handler=createSkyHandler({db,now:()=>new Date('2026-10-10T12:00:00Z')})
 const res=response();await handler(request({player:'kora',action:'alignment_complete'}),res);assert.equal(res.code,409);assert.equal(db.calls.includes('koraverse_event_progress'),false)
 const unknown=response();await handler(request({player:'kora',action:'milestone',key:'invented'}),unknown);assert.equal(unknown.code,400);assert.equal(db.tables.koraverse_stars.length,0)
})
