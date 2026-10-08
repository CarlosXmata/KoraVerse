import test from 'node:test'
import assert from 'node:assert/strict'
import {TypingPulse,shouldSound,notificationData,photoMetadata,roomLink,parseDuoLink,validMediaPath,triviaRank} from '../src/signals-utils.js'
import {renderMessage,safeMediaUrl} from '../src/signals-renderers.js'
import {triviaBank} from '../src/trivia-bank.js'
import {triviaQueue,advanceDuoTrivia,settleDuoTrivia} from '../src/trivia-session.js'
import {photoDimensions,preparePhoto,ChatMedia} from '../src/chat-media.js'
import {SignalAudio} from '../src/signals-audio.js'
import {validFourDigitPin,mountPinKeypad} from '../src/sanctuary-pin.js'
import {hashPin,verifyPin,issueSession,verifySession} from '../lib/sanctuary-security.js'
import {createUnlockHandler} from '../api/sanctuary-unlock.js'
import {unlockVault,encryptEntry,decryptEntry,encode64} from '../src/sanctuary-crypto.js'
import {reencryptVault} from '../scripts/migrate-sanctuary-vault.mjs'
import {createPushHandler} from '../api/chat-push.js'
import {createSanctuaryHandler} from '../api/sanctuary.js'
import fs from 'node:fs'
import vm from 'node:vm'
test('typing throttles rapid input, refreshes expiry, stops on send/blur and never persists',()=>{
 let now=0,pending,events=[],cancels=0;const pulse=new TypingPulse(active=>events.push(active),{now:()=>now,schedule:fn=>{pending=fn;return 1},cancel:()=>cancels++})
 for(now=0;now<800;now+=50)pulse.input();assert.deepEqual(events,[true]);now=1000;pulse.input();assert.deepEqual(events,[true,true]);pending();assert.deepEqual(events,[true,true,false]);pulse.stop();assert.equal(events.length,3);pulse.input();pulse.stop();assert.deepEqual(events.slice(-2),[true,false]);assert.ok(cancels>0)
})
test('incoming sounds respect every mute rule, own messages and duplicates',()=>{
 const base={from:'kora',me:'carlos'};assert.equal(shouldSound(base),true)
 for(const extra of [{from:'carlos'},{duplicate:true},{qa:true},{sound:false},{notificationSound:false},{discreet:true},{quiet:true}])assert.equal(shouldSound({...base,...extra}),false)
})
test('default typing timers keep the browser global receiver on input, stop and expiry',()=>{
 const originalSchedule=globalThis.setTimeout,originalCancel=globalThis.clearTimeout,events=[];let pending,cancelCalls=0
 try{
  globalThis.setTimeout=function(fn){assert.equal(this,globalThis,'Window.setTimeout received the wrong this');pending=fn;return 123}
  globalThis.clearTimeout=function(){assert.equal(this,globalThis,'Window.clearTimeout received the wrong this');cancelCalls++}
  const pulse=new TypingPulse(active=>events.push(active))
  pulse.stop();pulse.input();pulse.stop();pulse.input();pending();pulse.stop()
  assert.deepEqual(events,[true,false,true,false]);assert.ok(cancelCalls>=5)
 }finally{globalThis.setTimeout=originalSchedule;globalThis.clearTimeout=originalCancel}
})
test('generative signal audio reuses its context, differentiates kinds and softens open-chat volume',async()=>{
 const saved=globalThis.window;let created=0,frequencies=[],peaks=[]
 class Context{constructor(){created++;this.state='running';this.currentTime=0;this.destination={}}resume(){return Promise.resolve()}createOscillator(){return {frequency:{set value(v){frequencies.push(v)}},connect(){},start(){},stop(){},disconnect(){}}}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime:v=>peaks.push(v),exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}}
 try{globalThis.window={AudioContext:Context};const audio=new SignalAudio();await audio.activate();await audio.activate();audio.play('text',false);audio.play('game_invite',true);assert.equal(created,1);assert.equal(frequencies.length,3);assert.ok(peaks[0]>peaks[1]);audio.hush()}finally{globalThis.window=saved}
})
test('quote renderer displays the real body, invite renderer uses a validated CTA and legacy chat remains readable',()=>{
 const q=renderMessage({id:1,body:'No todo minuto libre tiene que convertirse en productividad.',kind:'quote',metadata:{source:'quiet-library'}},{me:'carlos'});assert.match(q,/No todo minuto libre/);assert.match(q,/FRASE COMPARTIDA/)
 const invite=renderMessage({id:2,body:'Ajedrez',kind:'game_invite',metadata:{room_code:'ABC123',game:'chess'}},{me:'carlos'});assert.match(invite,/ENTRAR A LA PARTIDA/);assert.match(invite,/data-code="ABC123"/)
 assert.match(renderMessage({id:3,body:'Hola antiguo <script>'},{me:'kora'}),/Hola antiguo &lt;script&gt;/)
 assert.match(renderMessage({id:4,kind:'game_invite',metadata:{room_code:null}},{me:'kora'}),/anterior no tiene sala/)
 assert.match(renderMessage({id:5,kind:'game_invite',metadata:{room_code:'ABC123',game:'trivia'}},{status:'closed'}),/Crear una nueva/)
 assert.match(renderMessage({id:6,kind:'game_invite',metadata:{room_code:'ABC123',game:'trivia'}},{status:'joined'}),/Entraste a la .+rbita/)
 assert.equal(safeMediaUrl('javascript:alert(1)'), '')
 assert.equal(safeMediaUrl(undefined),'');assert.equal(safeMediaUrl(''),'')
 assert.match(renderMessage({id:7,kind:'sketch',metadata:{data_url:'data:image/png;base64,YQ=='}}),/src="data:image\/png;base64,YQ=="/)
})
test('photo metadata stores bounded dimensions and private paths, never a base64 image or signed URL',async()=>{
 const path='carlos/2026/10/11111111-1111-4111-8111-111111111111.webp',meta=photoMetadata({path,thumbnail_path:path.replace('.webp','-thumb.webp'),width:1600,height:1200,mime:'image/webp',original_name:'photo.jpg'})
 assert.equal(validMediaPath(path),true);assert.equal(meta.bucket,'koraverse-chat-media');assert.equal(meta.url,undefined);assert.equal(meta.data_url,undefined);assert.throws(()=>photoMetadata({...meta,width:9000}));assert.equal(validMediaPath('../photo.webp'),false)
 const html=renderMessage({id:1,kind:'photo',body:'Un recuerdo',metadata:meta});assert.match(html,/data-photo-path=/);assert.match(html,/Un recuerdo/);assert.match(html,/Cargando fotograf/)
 assert.deepEqual(photoDimensions(6000,4000),{width:1800,height:1200});assert.deepEqual(photoDimensions(400,600),{width:400,height:600})
 await assert.rejects(preparePhoto({size:21*1024*1024,type:'image/jpeg',name:'a.jpg'}),/20 MB/)
 const media=new ChatMedia({qa:()=>true});await assert.rejects(media.upload({}),/QA/)
})
test('room links reject malformed codes and unsupported games instead of navigating to external URLs',()=>{
 assert.equal(roomLink('ABC123','chess'), '/?room=ABC123&game=chess');assert.equal(roomLink('https://evil','chess'),null)
 assert.deepEqual(parseDuoLink('?room=abc123&game=sudoku'),{code:'ABC123',game:'sudoku',signals:false});assert.equal(parseDuoLink('?room=ABC123&game=https://evil').game,null)
 const data=notificationData({id:1,kind:'game_invite',body:'Private words',metadata:{room_code:'ABC123',game:'chess'}});assert.equal(data.room_code,'ABC123');assert.equal(JSON.stringify(data).includes('Private'),false)
})
test('each trivia bank has twenty unique questions with 5/10/5 difficulty and valid explanations/options',()=>{
 for(const [cat,bank]of Object.entries(triviaBank)){assert.equal(bank.length,20);assert.equal(new Set(bank.map(q=>q.q)).size,20);assert.deepEqual(['easy','medium','hard'].map(d=>bank.filter(q=>q.difficulty===d).length),[5,10,5]);for(const q of bank){assert.equal(q.a.length,4);assert.equal(new Set(q.a).size,4);assert.ok(q.c>=0&&q.c<4);assert.ok(q.explanation.length>10)}assert.equal(triviaQueue(cat).length,20)}
 const mix=triviaQueue('mix');assert.equal(new Set(mix.map(q=>q.q)).size,20);assert.ok(mix.every(q=>Object.values(triviaBank).flat().includes(q)));assert.equal(triviaRank(20),'Archivo Viviente')
})
test('Duo plays exactly twenty synchronized questions, locks until both answer, rejects stale duplicate answers and resumes serialized state',()=>{
 const game={mode:null,round:0,answers:{},result:null},players=['carlos','kora'];assert.equal(advanceDuoTrivia(game,'got',players),true)
 const seen=[];for(let i=0;i<20;i++){const q=game.trivia.q;seen.push(q.q);assert.equal(advanceDuoTrivia(game,'got',players),false);assert.deepEqual(settleDuoTrivia(game,'carlos',q.c,players),{pending:true});assert.equal(settleDuoTrivia(game,'carlos',q.c,players),null);assert.equal(settleDuoTrivia(game,'stranger',q.c,players),null);const restored=JSON.parse(JSON.stringify(game));assert.equal(restored.triviaSession.index,i);assert.equal(restored.answers.carlos,q.c);assert.equal(settleDuoTrivia(game,'kora',q.c,players).pending,false);assert.equal(settleDuoTrivia(game,'kora',q.c,players),null);advanceDuoTrivia(game,'got',players)}
 assert.equal(seen.length,20);assert.equal(new Set(seen).size,20);assert.equal(game.triviaSession.complete,true);assert.deepEqual(game.triviaSession.scores,{carlos:20,kora:20})
})
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',origin='https://example.test',strongKey=Buffer.alloc(32,7).toString('base64')
const numericEnv={SANCTUARY_PIN_SALT:'ab'.repeat(32),SANCTUARY_SESSION_SECRET:'s'.repeat(44),SANCTUARY_OWNER_USER_ID:owner,SANCTUARY_ORIGIN:origin,SANCTUARY_PIN_MODE:'four-digit',SANCTUARY_VAULT_KEY:strongKey}
numericEnv.SANCTUARY_PIN_HASH=hashPin('0451',numericEnv.SANCTUARY_PIN_SALT)
const response=()=>({code:0,headers:{},setHeader(k,v){this.headers[k]=v},status(v){this.code=v;return this},json(value){this.value=value;return this}})
test('four-digit validation preserves leading zero, refuses weak legacy keys and revokes sessions on PIN/key rotation',()=>{
 for(const bad of ['123','12345','abcd',451,null])assert.equal(validFourDigitPin(bad),false)
 assert.equal(validFourDigitPin('0451'),true);assert.equal(verifyPin('0451',numericEnv,{numeric:true}),true);assert.equal(verifyPin('0451',numericEnv),false)
 const session=issueSession(numericEnv,1000000);assert.ok(verifySession(session.token,numericEnv,1000100));assert.equal(verifySession(session.token,{...numericEnv,SANCTUARY_VAULT_KEY:Buffer.alloc(32,8).toString('base64')},1000100),null)
})
test('PIN-only unlock retains same-origin, persistent rate limit and migration marker before releasing the strong key',async()=>{
 for(const [limited,version,pin,status]of [[false,2,'0451',200],[false,1,'0451',409],[true,2,'0451',429],[false,2,'9999',401]]){
  let rpcCalls=0,authCalls=0,sessionWrites=0;const db={auth:{getUser(){authCalls++;throw Error('Auth should not be needed')}},rpc:async()=>{rpcCalls++;return {data:!limited}},from(table){return {upsert:async()=>({}),select(){return this},eq(){return this},single:async()=>({data:{salt:encode64(new Uint8Array(32)),key_version:version}}),insert:async()=>{sessionWrites++;return {}}}}}
  const res=response();await createUnlockHandler({env:numericEnv,db})({method:'POST',headers:{origin},body:{pin}},res);assert.equal(res.code,status);assert.equal(authCalls,0);assert.ok(rpcCalls>=1);assert.equal(sessionWrites,status===200?1:0);if(status===200){assert.equal(res.value.vault_key,strongKey);assert.equal(res.value.pin,undefined);assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/)}
 }
 const res=response();await createUnlockHandler({env:numericEnv,db:{}})({method:'POST',headers:{origin:'https://evil.test'},body:{pin:'0451'}},res);assert.equal(res.code,403)
})
test('numeric keypad submits once at four digits without placing the PIN in markup',async()=>{
 const nodes=new Map(),get=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',setAttribute(){},focus(){},classList:{add(){}}});return nodes.get(key)},buttons=Array.from({length:12},()=>({})),container={innerHTML:'',querySelector:get,querySelectorAll:()=>buttons};const submitted=[]
 const keypad=mountPinKeypad(container,{submit:async pin=>submitted.push(pin),close(){}});for(const k of ['0','4','5','1','9'])keypad.input(k);await Promise.resolve();assert.deepEqual(submitted,['0451']);assert.equal(container.innerHTML.includes('0451'),false)
})
test('maintenance prevents all private API access before conversion without touching diary rows',async()=>{
 const env={...numericEnv,SANCTUARY_MAINTENANCE:'true'},db={from(){throw Error('No data should be touched')}}
 for(const handler of [createSanctuaryHandler({env,db}),createUnlockHandler({env,db})]){const res=response();await handler({method:'POST',headers:{origin},body:{pin:'0451'}},res);assert.equal(res.code,503)}
})
test('vault migration reencrypts with an independent strong key, preserves plaintext and refuses a wrong old phrase',async()=>{
 const salt=encode64(crypto.getRandomValues(new Uint8Array(32))),oldPhrase='test-only-old-private-phrase',root=await unlockVault(oldPhrase,salt),id=crypto.randomUUID(),plain={title:'Private words',body:'Keep this page',tags:['secret']},row=await encryptEntry(root,owner,id,plain)
 const converted=await reencryptVault({owner,salt,rows:[row],oldPhrase,strongKey});assert.equal(converted[0].id,id);assert.equal(converted[0].previous_ciphertext,row.ciphertext);assert.notEqual(converted[0].ciphertext,row.ciphertext)
 const newRoot=await unlockVault(strongKey,salt);assert.deepEqual(await decryptEntry(newRoot,owner,converted[0]),plain);await assert.rejects(decryptEntry(await unlockVault('0451',salt),owner,converted[0]));await assert.rejects(reencryptVault({owner,salt,rows:[row],oldPhrase:'wrong phrase',strongKey}))
})
test('service worker validates invitation routing, focuses an existing PWA and never trusts payload text/URLs',async()=>{
 const listeners={},shown=[],posted=[],opened=[];const self={addEventListener:(k,fn)=>listeners[k]=fn,registration:{showNotification:async(t,o)=>shown.push({t,...o})},clients:{matchAll:async()=>[{focus:async()=>true,postMessage:value=>posted.push(value)}],openWindow:async url=>opened.push(url)}}
 vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self});let pending;listeners.push({data:{json:()=>({kind:'game_invite',room_code:'ABC123',game:'chess',body:'Private',url:'https://evil.test'})},waitUntil:p=>pending=p});await pending;assert.equal(shown[0].data.url,'/?room=ABC123&game=chess');assert.equal(shown[0].body.includes('Private'),false)
 listeners.notificationclick({notification:{close(){},data:shown[0].data},waitUntil:p=>pending=p});await pending;assert.equal(posted[0].type,'OPEN_SIGNALS');assert.equal(posted[0].room_code,'ABC123');assert.equal(opened.length,0)
})
test('push uses only persisted messages, generic payloads and one receipt, never raw supplied content',async()=>{
 let payload='',claimed=0;const message={id:12,client_id:'id12',from_player:'carlos',to_player:'kora',kind:'photo',body:'Private text',metadata:{url:'https://evil.test'},created_at:new Date().toISOString()}
 const db={from(table){return {select(){return this},eq(){return this},single:async()=>({data:message}),insert:async()=>({error:claimed++?{code:'23505'}:null}),then(resolve){return Promise.resolve({data:[{id:1,subscription:{}}]}).then(resolve)}}}},push={setVapidDetails(){},sendNotification:async(_,value)=>payload=value},handler=createPushHandler({env:{KORAVERSE_ORIGIN:origin,VAPID_PUBLIC_KEY:'pub',VAPID_PRIVATE_KEY:'priv'},db,push})
 for(const count of [1,0]){const res=response();await handler({method:'POST',headers:{origin},body:{message_id:12,body:'malicious'}},res);assert.equal(res.value.sent,count)}assert.equal(payload.includes('Private'),false);assert.equal(payload.includes('evil'),false)
 const bad=response();await handler({method:'POST',headers:{origin},body:{body:'no persisted message'}},bad);assert.equal(bad.code,400)
})



