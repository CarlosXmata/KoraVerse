import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createMediaHandler} from '../lib/chat-media-server.js'
import {ChatMedia} from '../src/chat-media.js'
const origin='https://kora.test',secret='test-only-server-secret',env={KORAVERSE_ORIGIN:origin,SUPABASE_SERVICE_ROLE_KEY:secret}
const bytes=Buffer.from('524946460400000057454250','hex'),blob=new Blob([bytes],{type:'image/webp'})
const res=()=>({statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(value){this.value=value;return this}})
function setup(){const objects=new Map(),messages=[],signed=[],deleted=[],uploads=[];let publicBucket=false,failThumb=false
 const bucket={async upload(path,body,options){uploads.push({path,options});if(failThumb&&path.includes('-thumb'))return {error:{}};if(objects.has(path))return {error:{}};objects.set(path,body);return {data:{path}}},async createSignedUrl(path,ttl){signed.push({path,ttl});return objects.has(path)?{data:{signedUrl:'https://storage.test/'+path+'?signature=opaque'}}:{error:{}}},async remove(paths){deleted.push(paths);for(const path of paths)objects.delete(path);return {}}}
 const db={storage:{getBucket:async()=>({data:{public:publicBucket}}),from:name=>{assert.equal(name,'koraverse-chat-media');return bucket}},from:table=>{assert.equal(table,'koraverse_messages');let path;return {select(){return this},eq(){return this},contains(_,value){path=value.path;return this},limit(){return this},maybeSingle:async()=>({data:messages.find(m=>m.metadata.path===path)||null})}}}
 const handlers=Object.fromEntries(['upload','sign','delete'].map(op=>[op,createMediaHandler(op,{env,db})]))
 const request=async(url,options)=>{const operation=url.split('-').at(-1),response=res(),body=operation==='upload'?Buffer.from(await options.body.arrayBuffer()):JSON.parse(options.body);await handlers[operation]({method:'POST',headers:{origin,...Object.fromEntries(Object.entries(options.headers).map(([k,v])=>[k.toLowerCase(),v]))},body},response);return {ok:response.statusCode===200,status:response.statusCode,json:async()=>response.value}}
 return {objects,messages,signed,deleted,uploads,handlers,request,setPublic:value=>publicBucket=value,setFailThumb:value=>failThumb=value}
}
test('Carlos uploads and Kora automatically sees photos; reverse direction and refreshed history work without Auth',async()=>{
 const s=setup()
 for(const [sender,receiver]of [['carlos','kora'],['kora','carlos']]){
  const media=new ChatMedia({player:()=>sender,request:s.request}),metadata=await media.upload({blob,thumbnail:blob,mime:'image/webp',width:1800,height:1200,original_name:'test.webp'})
  assert.ok(metadata.path.startsWith(sender+'/'));assert.equal(metadata.cleanup_ticket,undefined);assert.equal(metadata.url,undefined)
  s.messages.push({id:s.messages.length+1,kind:'photo',metadata});media.committed(metadata)
  for(let reload=0;reload<2;reload++){
   const other=new ChatMedia({player:()=>receiver,request:s.request}),note={setAttribute(k){assert.equal(k,'hidden')}},img={dataset:{photoPath:metadata.thumbnail_path},isConnected:true,parentElement:{querySelector:()=>note}}
   await other.hydrate({querySelectorAll:()=>[img]});assert.match(img.src,/signature=opaque/)
   await other.signed(metadata.path);const count=s.signed.length;await other.signed(metadata.path);assert.equal(s.signed.length,count)
  }
 }
 assert.ok(s.signed.every(call=>call.ttl===300));assert.ok(s.uploads.every(call=>call.options.upsert===false));assert.equal(s.objects.size,4)
})
test('failed send cleanup removes both objects; failed thumbnail rolls back original; saved messages cannot be deleted',async()=>{
 const s=setup(),media=new ChatMedia({player:()=> 'carlos',request:s.request}),prepared={blob,thumbnail:blob,mime:'image/webp',width:120,height:80}
 const m=await media.upload(prepared);await media.cleanup(m);assert.equal(s.objects.size,0);assert.equal(s.deleted[0].length,2)
 s.setFailThumb(true);await assert.rejects(media.upload(prepared));assert.equal(s.objects.size,0)
 s.setFailThumb(false);const saved=await media.upload(prepared);s.messages.push({id:2,metadata:saved});await assert.rejects(media.cleanup(saved));assert.equal(s.objects.size,2)
})
test('media APIs reject spoofed origins, invalid players/traversal/foreign uploads, public buckets and oversized/fake images',async()=>{
 const s=setup(),path='carlos/2026/10/11111111-1111-4111-8111-111111111111.webp'
 for(const [headers,body,status]of [
  [{origin:'https://evil.test','x-player-key':'carlos','x-media-path':path},bytes,403],
  [{origin,'x-player-key':'admin','x-media-path':path},bytes,400],
  [{origin,'x-player-key':'carlos','x-media-path':'../secret.webp'},bytes,400],
  [{origin,'x-player-key':'kora','x-media-path':path},bytes,403],
  [{origin,'x-player-key':'carlos','x-media-path':path},Buffer.from('fake'),400],
  [{origin,'x-player-key':'carlos','x-media-path':path,'content-length':String(4*1024*1024+1)},bytes,413]
 ]){const response=res();await s.handlers.upload({method:'POST',headers:{'content-type':'application/octet-stream',...headers},body},response);assert.equal(response.statusCode,status)}
 s.setPublic(true);const response=res();await s.handlers.sign({method:'POST',headers:{origin},body:{player_key:'kora',path}},response);assert.equal(response.statusCode,503);assert.equal(s.signed.length,0)
})
test('sign requires a persisted photo and cleanup requires a signed, unexpired, path-bound ticket',async()=>{
 const s=setup(),path='carlos/2026/10/11111111-1111-4111-8111-111111111111.webp'
 for(const op of ['sign','delete']){const response=res();await s.handlers[op]({method:'POST',headers:{origin},body:{player_key:'carlos',path,cleanup_ticket:'forged'}},response);assert.equal(response.statusCode,op==='sign'?404:403)}
 const media=new ChatMedia({player:()=> 'carlos',request:s.request}),m=await media.upload({blob,thumbnail:blob,mime:'image/webp',width:30,height:30}),ticket=media.cleanupTickets.get(m.path)
 for(const [pathValue,time]of [[path,Date.now()],[m.path,Date.now()+1000000]]){const response=res();await createMediaHandler('delete',{env,db:{storage:{getBucket:async()=>({data:{public:false}}),from:()=>({})},from:()=>({select(){return this},eq(){return this},contains(){return this},limit(){return this},maybeSingle:async()=>({data:null})})},now:()=>time})({method:'POST',headers:{origin},body:{player_key:'carlos',path:pathValue,cleanup_ticket:ticket}},response);assert.equal(response.statusCode,403)}
})
test('photo frontend has no Supabase Auth, login modal, service secret or photo-signout action',()=>{
 const media=fs.readFileSync(new URL('../src/chat-media.js',import.meta.url),'utf8'),main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
 assert.doesNotMatch(media,/createClient|signInWithPassword|authorize\(|member\(|getSession|persistSession|media-login|SUPABASE_SERVICE_ROLE_KEY|Fotos entre órbitas/)
 assert.doesNotMatch(main,/media-signout|chatMedia\.signOut|Cerrar sesión de fotos/)
})
