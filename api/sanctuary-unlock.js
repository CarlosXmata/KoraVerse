import {serverDB,apiFailure} from '../lib/server-db.js'
import {securityConfigured,verifyPin,issueSession,cookieHeader,sameOrigin,privateResponse,attemptKey,vaultSalt,strongVaultConfigured} from '../lib/sanctuary-security.js'
export function createUnlockHandler({env=process.env,db=serverDB(env),now=()=>Date.now()}={}){return async(req,res)=>{
 privateResponse(res)
 if(env.SANCTUARY_MAINTENANCE==='true')return apiFailure(res)
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 if(!sameOrigin(req,env))return apiFailure(res,403)
 if(!db||!securityConfigured(env))return apiFailure(res)
 try{
  const numeric=env.SANCTUARY_PIN_MODE==='four-digit'
  if(numeric&&!strongVaultConfigured(env))return apiFailure(res)
  if(!numeric){const token=String(req.headers.authorization||'').replace(/^Bearer /,'');const {data,error}=await db.auth.getUser(token);if(error||data?.user?.id!==env.SANCTUARY_OWNER_USER_ID)return apiFailure(res,401)}
  const attempt=await db.rpc('koraverse_sanctuary_attempt',{p_key:attemptKey(req,env)})
  if(attempt.error)return apiFailure(res)
  if(attempt.data!==true)return apiFailure(res,429)
  if(numeric){const globalAttempt=await db.rpc('koraverse_sanctuary_attempt',{p_key:'owner:'+env.SANCTUARY_OWNER_USER_ID});if(globalAttempt.error)return apiFailure(res);if(globalAttempt.data!==true)return apiFailure(res,429)}
  if(!verifyPin(req.body?.pin,env,{numeric}))return apiFailure(res,401)
  const owner=env.SANCTUARY_OWNER_USER_ID
  const insert=await db.from('koraverse_sanctuary_vaults').upsert({owner,salt:vaultSalt(),...(numeric?{key_version:2}:{})},{onConflict:'owner',ignoreDuplicates:true})
  if(insert.error)return apiFailure(res)
  const vault=await db.from('koraverse_sanctuary_vaults').select('salt,key_version').eq('owner',owner).single()
  if(vault.error||!vault.data?.salt)return apiFailure(res)
  if(!numeric&&vault.data.key_version===2)return apiFailure(res,409)
  if(numeric&&vault.data.key_version!==2)return res.status(409).json({error:'Esta puerta todavía se está preparando.'})
  const session=issueSession(env,now())
  const saved=await db.from('koraverse_sanctuary_sessions').insert({id:session.claims.id,owner,expires_at:new Date(session.claims.exp*1000).toISOString()})
  if(saved.error)return apiFailure(res)
  res.setHeader('Set-Cookie',cookieHeader(session.token))
  return res.status(200).json({owner,salt:vault.data.salt,expires_at:session.claims.exp*1000,...(numeric?{vault_key:env.SANCTUARY_VAULT_KEY}:{})})
 }catch{return apiFailure(res)}
}}
export default createUnlockHandler()
