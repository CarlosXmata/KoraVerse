import {createClient} from '@supabase/supabase-js'
import webpush from 'web-push'
import {notificationData} from '../src/signals-utils.js'
export function createPushHandler({env=process.env,db=null,push=webpush}={}){return async(req,res)=>{
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 const origin=env.KORAVERSE_ORIGIN||env.SANCTUARY_ORIGIN
 if(!origin||req.headers.origin!==origin||req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return res.status(403).json({error:'Not allowed'})
 const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL,service=env.SUPABASE_SERVICE_ROLE_KEY,pub=env.VAPID_PUBLIC_KEY,priv=env.VAPID_PRIVATE_KEY
 if((!db&&(!url||!service))||!pub||!priv)return res.status(503).json({error:'Push backend not configured'})
 const id=req.body?.message_id;if(!/^\d+$/.test(String(id||'')))return res.status(400).json({error:'A persisted message is required'})
 const client=db||createClient(url,service,{auth:{persistSession:false}})
 try{
  const {data:message,error}=await client.from('koraverse_messages').select('*').eq('id',id).single()
  if(error||!message||!['carlos','kora'].includes(message.from_player)||!['carlos','kora'].includes(message.to_player)||message.from_player===message.to_player||Date.now()-new Date(message.created_at).getTime()>600000)return res.status(400).json({error:'Message unavailable'})
  const claimed=await client.from('koraverse_push_receipts').insert({message_id:message.id})
  if(claimed.error?.code==='23505')return res.status(200).json({ok:true,sent:0})
  if(claimed.error)return res.status(503).json({error:'Push unavailable'})
  push.setVapidDetails(env.VAPID_CONTACT||'mailto:koraverse@example.com',pub,priv)
  const {data,error:subError}=await client.from('koraverse_push_subscriptions').select('*').eq('player_key',message.to_player)
  if(subError)return res.status(503).json({error:'Push unavailable'})
  const payload=JSON.stringify(notificationData(message));let sent=0
  for(const row of data||[]){try{await push.sendNotification(row.subscription,payload);sent++}catch(error){if([404,410].includes(error.statusCode))await client.from('koraverse_push_subscriptions').delete().eq('id',row.id)}}
  return res.status(200).json({ok:true,sent})
 }catch{return res.status(503).json({error:'Push unavailable'})}
}}
export default createPushHandler()
