import {ColorRest} from '../src/color-rest.js'
import * as signals from '../src/signals-utils.js'
import {renderMessage} from '../src/signals-renderers.js'
import {SignalAudio} from '../src/signals-audio.js'
import {ChatMedia,preparePhoto,openPhotoLightbox} from '../src/chat-media.js'
import {triviaQueue,advanceDuoTrivia,settleDuoTrivia} from '../src/trivia-session.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import fs from 'node:fs'
import {Chess} from '../src/chess-engine.js'
import * as data from '../src/data.js'
import {mergeMessages,latestPresence} from '../src/social-utils.js'
let source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
source=source.replace(/^import[\s\S]*?from '\.\/data\.js'\s*/,'')
source=source.replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://test.supabase.co'").replaceAll('import.meta.env.VITE_SUPABASE_KEY',"'test-public-key'").replaceAll('import.meta.env.VITE_VAPID_PUBLIC_KEY',"''")
source=source.replace(/sky.start\(init\)\s*$/,`globalThis.api={state,QA,loginQA,exitQA,awardXP,awardDuoXP,persistProfile,sendChatMessage,receiveChatMessage,sendCoffeeInvite,sendSketch,connectRoom,enableNotifications,clearTimers,selectAvatar,stop:()=>clearInterval(socialHeartbeat)};`)
function harness(admin=true, adapter=null){
 const calls=[],storage=new Map(),dom={innerHTML:'',replaceChildren(){},appendChild(){},classList:{toggle(){},remove(){},add(){}},querySelector(){return null},addEventListener(){}}
 const ch={on(){return this},subscribe(cb){if(cb)queueMicrotask(()=>cb('SUBSCRIBED'));return this},track:async()=>{},send:async()=>{calls.push('broadcast')},presenceState:()=>({})}
 const db={auth:{signInWithPassword:async()=>({error:null}),signOut:async()=>({})},rpc:async()=>({data:admin}),removeChannel:async()=>{},channel:()=>ch,from:table=>{calls.push(table);if(adapter)return adapter(table);throw Error('unexpected persistence')},storage:{from(){calls.push('storage');throw Error('unexpected storage')}}}
 class Ambient{constructor(){this.enabled=false}pause(){}activate(){}}
 const createLivingSky=()=>({adornment:()=>'',decorations:()=>'',homeMarkup:()=>'',qaMarkup:()=>'',enterHome(){},restoreQA(){},receive(){},captureLegacy(){}})
 const ctx=vm.createContext({createLivingSky,ColorRest,...data,...signals,renderMessage,SignalAudio:class{play(kind,open){calls.push('audio:'+kind+':'+open)}hush(){}activate(){}},ChatMedia,preparePhoto,openPhotoLightbox,triviaQueue,advanceDuoTrivia,settleDuoTrivia,Chess,mergeMessages,latestPresence,Ambient,createClient:()=>db,crypto,console,structuredClone,setTimeout,clearTimeout,setInterval,clearInterval,queueMicrotask,URLSearchParams,AbortSignal,localStorage:{getItem:key=>storage.get(key)||null,setItem:(k,v)=>{storage.set(k,v);calls.push('local:'+k)},removeItem:k=>storage.delete(k)},document:{hidden:false,documentElement:{dataset:{},lang:''},querySelector:selector=>selector==='#qaEmail'?{value:'qa@example.test'}:selector==='#qaPassword'?{value:'test-only'}:dom,addEventListener(){},createElement:()=>dom,body:{appendChild(){}}},window:{addEventListener(){}},navigator:{},location:{pathname:'/',search:''},history:{replaceState(){}},matchMedia:()=>({matches:true}),innerWidth:1000,cancelAnimationFrame(){},fetch:async()=>{calls.push('fetch');return {}},confirm:()=>true})
 vm.runInContext(source,ctx)
 return {api:ctx.api,calls,storage,ch}
}
test('authorized QA isolates rewards, profiles, social, push, storage and room access',async()=>{
 const {api,calls}=harness();api.state.profile={player_key:'carlos',display_name:'Carlos',xp:70,avatar_id:'cow-classic'}
 await api.loginQA();assert.equal(api.QA.active,true);calls.length=0
 await api.awardXP(300,'english','test');await api.awardDuoXP(100);await api.persistProfile();await api.sendChatMessage('Prueba');await api.sendCoffeeInvite('coffee');await api.sendSketch();await api.connectRoom('host','ABC123');await api.enableNotifications();await api.selectAvatar('cow-galaxy')
 assert.deepEqual(calls,[]);assert.equal(api.QA.original.xp,70)
 await api.exitQA();assert.equal(api.state.profile.xp,70);assert.equal(api.state.profile.avatar_id,'cow-classic');assert.equal(api.QA.active,false)
 api.stop();api.clearTimers()
})
test('non-admin Auth user cannot activate QA',async()=>{
 const {api,calls}=harness(false);api.state.profile={player_key:'kora',display_name:'Kora',xp:12}
 await api.loginQA();assert.equal(api.QA.active,false);assert.equal(api.state.profile.xp,12);assert.deepEqual(calls.filter(c=>!c.startsWith('local:')),[]);api.clearTimers()
})
test('chat is not displayed or broadcast when database rejects persistence',async()=>{
 const {api,calls,ch}=harness(true,()=>({insert(){return this},select(){return this},single:async()=>({data:null,error:{message:'RLS denied'}})}))
 api.state.profile={player_key:'carlos',display_name:'Carlos'};api.state.dbReady=true;api.state.social.channel=ch
 assert.equal(await api.sendChatMessage('Hola'),false);assert.equal(api.state.social.messages.length,0);assert.equal(calls.includes('broadcast'),false);api.clearTimers()
})
test('chat confirms persistence before broadcasting and deduplicates echoed INSERT',async()=>{
 let saved
 const {api,calls,ch}=harness(true,()=>({insert(row){saved={...row,id:42};return this},select(){return this},single:async()=>({data:saved,error:null})}))
 api.state.profile={player_key:'kora',display_name:'Kora'};api.state.dbReady=true;api.state.social.channel=ch
 assert.equal(await api.sendChatMessage('Hola Carlos'),true);api.receiveChatMessage(saved)
 assert.equal(api.state.social.messages.length,1);assert.equal(api.state.social.messages[0].id,42);assert.deepEqual(calls.filter(c=>!c.startsWith('local:')),['koraverse_messages','broadcast','fetch']);api.clearTimers()
})
test('real chat receiver sounds once per partner message, softens open chat and suppresses own/duplicate/muted/QA input',()=>{
 const {api,calls}=harness();api.state.profile={player_key:'carlos',display_name:'Carlos'};api.state.sound=true;api.state.notificationSound=true;api.state.social.open=true
 const incoming={id:1,client_id:'partner-1',from_player:'kora',to_player:'carlos',body:'Hello',kind:'text'}
 api.receiveChatMessage(incoming);api.receiveChatMessage(incoming);api.receiveChatMessage({...incoming,id:2,client_id:'own',from_player:'carlos',to_player:'kora'})
 assert.deepEqual(calls.filter(c=>c.startsWith('audio:')),['audio:text:true']);assert.equal(api.state.social.unread,0)
 for(const flag of ['discreet','notificationSound','sound']){const old=api.state[flag];api.state[flag]=flag==='discreet';api.receiveChatMessage({...incoming,id:crypto.randomUUID(),client_id:crypto.randomUUID()});api.state[flag]=old}
 api.QA.active=true;api.receiveChatMessage({...incoming,id:7,client_id:'qa'});api.QA.active=false
 assert.equal(calls.filter(c=>c.startsWith('audio:')).length,1)
 api.state.social.open=false;api.state.discreet=true;api.receiveChatMessage({...incoming,id:8,client_id:'closed'});assert.equal(api.state.social.unread,1)
 api.clearTimers();api.stop()
})
