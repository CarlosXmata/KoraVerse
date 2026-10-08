import {serverDB,apiFailure} from '../lib/server-db.js'
import {verifySession,readCookie,cookieHeader,sameOrigin,privateResponse,validEnvelope} from '../lib/sanctuary-security.js'
import {validOverride} from '../src/universe-engine.js'
export function createSanctuaryHandler({env=process.env,db=serverDB(env),now=()=>Date.now()}={}){return async(req,res)=>{
 privateResponse(res)
 if(env.SANCTUARY_MAINTENANCE==='true')return apiFailure(res)
 if(!['GET','POST','DELETE'].includes(req.method))return res.status(405).json({error:'Method not allowed'})
 if(req.method!=='GET'&&!sameOrigin(req,env))return apiFailure(res,403)
 if(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return apiFailure(res,403)
 if(!db)return apiFailure(res)
 const session=verifySession(readCookie(req),env,now())
 if(!session)return apiFailure(res,401)
 try{
  const active=await db.from('koraverse_sanctuary_sessions').select('id').eq('id',session.id).eq('owner',session.owner).gt('expires_at',new Date(now()).toISOString()).maybeSingle()
  if(active.error||!active.data)return apiFailure(res,401)
  const resource=req.query?.resource||'entries'
  if(resource==='session'){
   if(req.method==='DELETE'){await db.from('koraverse_sanctuary_sessions').delete().eq('id',session.id);res.setHeader('Set-Cookie',cookieHeader('',true));return res.status(200).json({ok:true})}
   if(req.method==='GET')return res.status(200).json({owner:session.owner,expires_at:session.exp*1000})
   return apiFailure(res,403)
  }
  if(resource==='universe'){
   if(req.method==='GET'){const result=await db.from('koraverse_universe_state').select('*').eq('id',1).single();if(result.error)return apiFailure(res);return res.status(200).json(result.data)}
   if(req.method!=='POST')return apiFailure(res,403)
   const {status,mode_override,effects_enabled}=req.body||{}
   if(!['normal','paused','maintenance'].includes(status)||!validOverride(mode_override)||typeof effects_enabled!=='boolean')return res.status(400).json({error:'Invalid state'})
   const result=await db.from('koraverse_universe_state').update({status,mode_override,effects_enabled,updated_at:new Date(now()).toISOString()}).eq('id',1).select().single()
   if(result.error)return apiFailure(res);return res.status(200).json(result.data)
  }
  if(resource!=='entries')return res.status(404).json({error:'Unknown place'})
  if(req.method==='GET'){const result=await db.from('koraverse_sanctuary_entries').select('*').eq('owner',session.owner).order('created_at');if(result.error)return apiFailure(res);return res.status(200).json({entries:result.data})}
  if(req.method==='POST'){
   if(!validEnvelope(req.body))return res.status(400).json({error:'Invalid encrypted entry'})
   const existing=await db.from('koraverse_sanctuary_entries').select('owner').eq('id',req.body.id).maybeSingle()
   if(existing.error)return apiFailure(res);if(existing.data&&existing.data.owner!==session.owner)return apiFailure(res,403)
   const result=await db.from('koraverse_sanctuary_entries').upsert({...req.body,owner:session.owner,updated_at:new Date(now()).toISOString()},{onConflict:'id'})
   if(result.error)return apiFailure(res);return res.status(200).json({ok:true})
  }
  if(!/^[a-f0-9-]{36}$/i.test(req.body?.id||''))return res.status(400).json({error:'Invalid entry'})
  const result=await db.from('koraverse_sanctuary_entries').delete().eq('owner',session.owner).eq('id',req.body.id)
  if(result.error)return apiFailure(res);return res.status(200).json({ok:true})
 }catch{return apiFailure(res)}
}}
export default createSanctuaryHandler()
