import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const url=process.env.VITE_SUPABASE_URL
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY
  const pub=process.env.VAPID_PUBLIC_KEY
  const priv=process.env.VAPID_PRIVATE_KEY
  if(!url||!service||!pub||!priv) return res.status(503).json({error:'Push backend not configured'})
  const {from_player,to_player,from_name}=req.body||{}
  if(!from_player||!to_player) return res.status(400).json({error:'Missing players'})
  webpush.setVapidDetails('mailto:koraverse@example.com',pub,priv)
  const db=createClient(url,service,{auth:{persistSession:false}})
  const {data,error}=await db.from('koraverse_push_subscriptions').select('*').eq('player_key',to_player)
  if(error) return res.status(500).json({error:error.message})
  const payload=JSON.stringify({title:'KORA SIGNAL ✨',body:`${from_name||from_player} quiere jugar contigo.`,url:'/'})
  let sent=0
  for(const row of data||[]){
    try{await webpush.sendNotification(row.subscription,payload);sent++}
    catch(err){if(err.statusCode===404||err.statusCode===410) await db.from('koraverse_push_subscriptions').delete().eq('id',row.id)}
  }
  return res.status(200).json({ok:true,sent})
}
