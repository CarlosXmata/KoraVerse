import { createClient } from '@supabase/supabase-js'

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const url=process.env.VITE_SUPABASE_URL
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!service) return res.status(503).json({error:'Push backend not configured'})
  const {player_key,subscription}=req.body||{}
  if(!player_key||!subscription?.endpoint) return res.status(400).json({error:'Invalid subscription'})
  const db=createClient(url,service,{auth:{persistSession:false}})
  const {error}=await db.from('koraverse_push_subscriptions').upsert({player_key,endpoint:subscription.endpoint,subscription,updated_at:new Date().toISOString()},{onConflict:'endpoint'})
  if(error) return res.status(500).json({error:error.message})
  return res.status(200).json({ok:true})
}
