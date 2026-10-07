import {serverDB,apiFailure} from '../lib/server-db.js'
import {securityConfigured,verifyPin,issueSession,cookieHeader,sameOrigin,privateResponse,attemptKey,vaultSalt} from '../lib/sanctuary-security.js'
export function createUnlockHandler({env=process.env,db=serverDB(env),now=()=>Date.now()}={}){return async(req,res)=>{
 privateResponse(res)
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 if(!sameOrigin(req,env))return apiFailure(res,403)
 if(!db||!securityConfigured(env))return apiFailure(res)
 try{
  const token=String(req.headers.authorization||'').replace(/^Bearer /,'')
  const {data,error}=await db.auth.getUser(token)
  if(error||data?.user?.id!==env.SANCTUARY_OWNER_USER_ID)return apiFailure(res,401)
  const attempt=await db.rpc('koraverse_sanctuary_attempt',{p_key:attemptKey(req,env)})
  if(attempt.error)return apiFailure(res)
  if(attempt.data!==true)return apiFailure(res,429)
  if(!verifyPin(req.body?.pin,env))return apiFailure(res,401)
  const owner=env.SANCTUARY_OWNER_USER_ID
  const insert=await db.from('koraverse_sanctuary_vaults').upsert({owner,salt:vaultSalt()},{onConflict:'owner',ignoreDuplicates:true})
  if(insert.error)return apiFailure(res)
  const vault=await db.from('koraverse_sanctuary_vaults').select('salt').eq('owner',owner).single()
  if(vault.error||!vault.data?.salt)return apiFailure(res)
  const session=issueSession(env,now())
  const saved=await db.from('koraverse_sanctuary_sessions').insert({id:session.claims.id,owner,expires_at:new Date(session.claims.exp*1000).toISOString()})
  if(saved.error)return apiFailure(res)
  res.setHeader('Set-Cookie',cookieHeader(session.token))
  return res.status(200).json({owner,salt:vault.data.salt,expires_at:session.claims.exp*1000})
 }catch{return apiFailure(res)}
}}
export default createUnlockHandler()
