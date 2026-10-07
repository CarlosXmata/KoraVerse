import test from 'node:test'
import assert from 'node:assert/strict'
import {UniverseEngine,dateInZone,resolveUniverseMode} from '../src/universe-engine.js'
import {BIRTHDAY} from '../src/birthday-data.js'
import {alignmentStage,birthdayAdornment} from '../src/birthday-experience.js'
import {starsForDate,stepDate,validDate,mergeStars,classifySignal,signalDestination,starPosition} from '../src/sky-utils.js'
import {unlockVault,encryptEntry,decryptEntry,encode64} from '../src/sanctuary-crypto.js'
import {hashPin,verifyPin,issueSession,verifySession,cookieHeader,sameOrigin,validEnvelope} from '../lib/sanctuary-security.js'
import {avatarStateFor,activityAdornment} from '../src/avatar-state.js'
test('avatars inhabit reading, coffee, chess, signals, birthday, celebration and sleeping scenes',()=>{
 for(const [input,state] of [[{},'normal'],[{screen:'library'},'reading'],[{screen:'coffee'},'coffee'],[{screen:'chess-duo'},'chess'],[{screen:'signals'},'signal'],[{mode:'birthday-alignment'},'birthday'],[{reaction:'celebrating'},'celebrating'],[{status:'paused'},'sleeping']])assert.equal(avatarStateFor(input),state)
 assert.match(activityAdornment('reading'),/<svg/);assert.match(activityAdornment('coffee'),/<svg/);assert.equal(activityAdornment('normal'),'')
})
test('Santo Domingo dates cross midnight at 04:00 UTC, including all event phases',()=>{
 for(const [time,expected] of [['2026-10-08T03:59:59Z','classic'],['2026-10-08T04:00:00Z','birthday-prelude'],['2026-10-10T03:59:59Z','birthday-prelude'],['2026-10-10T04:00:00Z','birthday-alignment'],['2026-10-11T04:00:00Z','birthday-afterglow'],['2026-10-12T04:00:00Z','classic']])assert.equal(resolveUniverseMode({now:time}).mode,expected)
 assert.equal(dateInZone('2026-10-10T02:00:00Z'),'2026-10-09')
})
test('manual modes, automatic restoration, server clock and future events',()=>{
 const engine=new UniverseEngine({now:()=>new Date('2026-10-10T14:00:00Z')})
 engine.setOverride({mode:'classic',preview:true});assert.equal(engine.get().mode,'classic');engine.clearOverride();assert.equal(engine.get().mode,'birthday-alignment')
 engine.sync({status:'paused',effects_enabled:false},'2026-10-12T14:00:00Z');assert.equal(engine.get().mode,'classic');assert.equal(engine.get().status,'paused');assert.equal(engine.get().effects,false)
 const future={...BIRTHDAY,id:'future',date:'2027-10-10',phases:{'birthday-alignment':['2027-10-10','2027-10-10']}}
 assert.equal(resolveUniverseMode({events:[future],now:'2027-10-10T14:00:00Z'}).event.id,'future')
 assert.throws(()=>engine.setOverride({mode:'unknown',preview:true}))
})
test('cinematic stages, reduced motion, vector hats and ten unique roses',()=>{
 assert.equal(alignmentStage(0),'night');assert.equal(alignmentStage(BIRTHDAY.sequence.at(-1).at),'complete');assert.equal(alignmentStage(0,{reduced:true}),'greeting');assert.equal(alignmentStage(1800,{reduced:true}),'complete');assert.equal(BIRTHDAY.sequence.length,16)
 assert.match(birthdayAdornment('kora'),/<svg class="birthday-hat"/);assert.match(birthdayAdornment('carlos'),/secondary/);assert.match(birthdayAdornment('kora','full',true),/prelude/)
 assert.equal(BIRTHDAY.roses.length,10);assert.equal(new Set(BIRTHDAY.roses.map(r=>r.key)).size,10);assert.equal(BIRTHDAY.roses[9].gold,true)
})
test('Atlas exact and cumulative searches never create stars; dates are calendar-valid',()=>{
 const stars=[{id:'a',player_key:'kora',event_key:'a',event_date:'2026-10-08'},{id:'b',player_key:'kora',event_key:'b',event_date:'2026-10-10'}]
 assert.deepEqual(starsForDate(stars,'2026-10-09'),[]);assert.equal(starsForDate(stars,'2026-10-09',{timeTravel:true}).length,1);assert.equal(stars.length,2)
 assert.equal(validDate('2026-02-30'),false);assert.equal(stepDate('2026-10-10',-7),'2026-10-03');assert.equal(mergeStars(stars,[stars[0]]).length,2)
 assert.deepEqual(starPosition({...stars[0],event_type:'visit'}),starPosition({...stars[0],event_type:'visit'}))
})
test('resonance distinguishes text, sketches, coffee, games and system events',()=>{
 for(const kind of ['text','sketch','coffee_invite','game_invite','system_event'])assert.equal(classifySignal({kind}),kind)
 assert.equal(signalDestination({kind:'game_invite',metadata:{room_code:'ABCDEF'}}),'room');assert.equal(signalDestination({kind:'coffee_invite'}),'coffee')
})
const env={SANCTUARY_PIN_SALT:'ab'.repeat(32),SANCTUARY_SESSION_SECRET:'test-only-secret-'.repeat(4),SANCTUARY_OWNER_USER_ID:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',SANCTUARY_ORIGIN:'https://example.test'}
env.SANCTUARY_PIN_HASH=hashPin('test-only-private-key',env.SANCTUARY_PIN_SALT)
test('private key validity, signed session tampering, expiry, rotation and secure cookies',()=>{
 assert.equal(verifyPin('wrong-key',env),false);assert.equal(verifyPin('test-only-private-key',env),true)
 const {token}=issueSession(env,1000000);assert.ok(verifySession(token,env,1000001));assert.equal(verifySession(token+'x',env,1000001),null);assert.equal(verifySession(token,env,2200000),null)
 assert.equal(verifySession(token,{...env,SANCTUARY_PIN_HASH:'aa'.repeat(64)},1000001),null)
 assert.match(cookieHeader(token),/HttpOnly; Secure; SameSite=Strict/)
 assert.equal(sameOrigin({headers:{origin:'https://evil.test'}},env),false);assert.equal(sameOrigin({headers:{origin:env.SANCTUARY_ORIGIN,'sec-fetch-site':'same-origin'}},env),true)
})
test('diary encrypts titles, tags and body; wrong key, owner and entry ID cannot decrypt',async()=>{
 const salt=encode64(crypto.getRandomValues(new Uint8Array(32))),root=await unlockVault('test-only-private-key',salt),wrong=await unlockVault('wrong-key',salt)
 const id=crypto.randomUUID(),plain={title:'Private title',body:'Private words',tags:['sensitive'],section:'letters',status:'No enviar',date:'2026-10-10'}
 const envelope=await encryptEntry(root,env.SANCTUARY_OWNER_USER_ID,id,plain)
 assert.equal(root.extractable,false);assert.equal(validEnvelope(envelope),true);assert.equal(JSON.stringify(envelope).includes('Private'),false);assert.deepEqual(await decryptEntry(root,env.SANCTUARY_OWNER_USER_ID,envelope),plain)
 await assert.rejects(decryptEntry(wrong,env.SANCTUARY_OWNER_USER_ID,envelope));await assert.rejects(decryptEntry(root,'another-owner',envelope));await assert.rejects(decryptEntry(root,env.SANCTUARY_OWNER_USER_ID,{...envelope,id:crypto.randomUUID()}))
 assert.notEqual((await encryptEntry(root,env.SANCTUARY_OWNER_USER_ID,id,plain)).iv,envelope.iv)
 assert.equal(validEnvelope({...envelope,title:'plaintext'}),false)
})
