import {createHmac,timingSafeEqual} from 'node:crypto'
import {serverDB} from './server-db.js'
import {MEDIA_BUCKET,validMediaPath} from '../src/signals-utils.js'
const MAX_BYTES=4*1024*1024,TTL=300
const player=value=>typeof value==='string'&&['carlos','kora'].includes(value)
const fullPath=path=>path.replace(/-thumb\.(webp|jpg)$/,'.$1')
function ticket(path,who,secret,now){const data=Buffer.from(JSON.stringify({path:fullPath(path),player:who,exp:now+900000})).toString('base64url');return data+'.'+createHmac('sha256',secret).update(data).digest('base64url')}
function validTicket(value,path,who,secret,now){try{const [data,signature,...extra]=String(value).split('.'),expected=createHmac('sha256',secret).update(data).digest(),actual=Buffer.from(signature,'base64url');if(extra.length||actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;const claims=JSON.parse(Buffer.from(data,'base64url'));return claims.path===fullPath(path)&&claims.player===who&&claims.exp>now}catch{return false}}
export function imageMime(bytes){if(bytes.length>=12&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'image/webp';if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217)return 'image/jpeg';return null}
async function readBytes(req){if(Number(req.headers['content-length'])>MAX_BYTES)throw Object.assign(Error(),{status:413});if(Buffer.isBuffer(req.body)){if(req.body.length>MAX_BYTES)throw Object.assign(Error(),{status:413});return req.body}let length=0,chunks=[];for await(const chunk of req){length+=chunk.length;if(length>MAX_BYTES)throw Object.assign(Error(),{status:413});chunks.push(chunk)}return Buffer.concat(chunks)}
export function createMediaHandler(operation,{env=process.env,db=null,now=()=>Date.now()}={}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff')
 const fail=(status=503)=>res.status(status).json({error:status===413?'La fotografía excede el límite.':status===400?'Fotografía o ruta no válida.':status===403?'Operación de fotografía no autorizada.':'No se pudo completar la fotografía.'})
 if(req.method!=='POST')return fail(405)
 const origin=env.KORAVERSE_ORIGIN||env.SANCTUARY_ORIGIN
 if(!origin||req.headers.origin!==origin||req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return fail(403)
 const who=operation==='upload'?req.headers['x-player-key']:req.body?.player_key,path=operation==='upload'?req.headers['x-media-path']:req.body?.path
 if(!player(who)||typeof path!=='string'||path!==path.trim()||!validMediaPath(path))return fail(400)
 if(operation!=='sign'&&!path.startsWith(who+'/'))return fail(403)
 if(!env.SUPABASE_SERVICE_ROLE_KEY)return fail()
 const client=db||serverDB(env);if(!client)return fail()
 try{
  const bucketState=await client.storage.getBucket(MEDIA_BUCKET)
  if(bucketState.error||!bucketState.data||bucketState.data.public!==false)return fail()
  const bucket=client.storage.from(MEDIA_BUCKET)
  if(operation==='upload'){
   if(req.headers['content-type']!=='application/octet-stream')return fail(400)
   const bytes=await readBytes(req),mime=imageMime(bytes)
   if(!bytes.length||!mime||(path.endsWith('.webp')?mime!=='image/webp':mime!=='image/jpeg'))return fail(400)
   const result=await bucket.upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'300'})
   if(result.error)return fail()
   return res.status(200).json({path,cleanup_ticket:ticket(path,who,env.SUPABASE_SERVICE_ROLE_KEY,now())})
  }
  // Only sign persisted photo objects; never sign arbitrary bucket contents.
  const message=await client.from('koraverse_messages').select('id,metadata').eq('kind','photo').contains('metadata',{path:fullPath(path)}).limit(1).maybeSingle()
  if(message.error)return fail()
  if(operation==='sign'){
   if(!message.data||![message.data.metadata?.path,message.data.metadata?.thumbnail_path].includes(path))return fail(404)
   const result=await bucket.createSignedUrl(path,TTL)
   if(result.error||!result.data?.signedUrl)return fail()
   return res.status(200).json({url:result.data.signedUrl,expires_in:TTL})
  }
  if(operation==='delete'){
   if(path!==fullPath(path)||!validTicket(req.body?.cleanup_ticket,path,who,env.SUPABASE_SERVICE_ROLE_KEY,now()))return fail(403)
   if(message.data)return fail(409)
   const thumb=path.replace(/\.(webp|jpg)$/,'-thumb.$1')
   const result=await bucket.remove([path,thumb]);if(result.error)return fail()
   return res.status(200).json({ok:true})
  }
  return fail(400)
 }catch(error){return fail(error.status||503)}
}}
