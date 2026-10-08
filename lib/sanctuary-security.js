import { scryptSync,randomBytes,createHmac,timingSafeEqual,randomUUID } from 'node:crypto'
export const COOKIE='__Host-koraverse-sanctuary'
export const SESSION_SECONDS=1200
export function hashPin(pin,salt){return scryptSync(pin,Buffer.from(salt,'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}
export function securityConfigured(env){return /^[a-f0-9]{64}$/i.test(env.SANCTUARY_PIN_SALT||'')&&/^[a-f0-9]{128}$/i.test(env.SANCTUARY_PIN_HASH||'')&&(env.SANCTUARY_SESSION_SECRET||'').length>=43&&/^[a-f0-9-]{36}$/i.test(env.SANCTUARY_OWNER_USER_ID||'')&&Boolean(env.SANCTUARY_ORIGIN)}
export function strongVaultConfigured(env){return /^[A-Za-z0-9+/]{43}=$/.test(env.SANCTUARY_VAULT_KEY||'')&&Buffer.from(env.SANCTUARY_VAULT_KEY,'base64').length===32}
export function verifyPin(pin,env,{numeric=false}={}){if(typeof pin!=='string'||(numeric?!/^\d{4}$/.test(pin):pin.length<8||pin.length>128)||!securityConfigured(env))return false;return timingSafeEqual(Buffer.from(hashPin(pin,env.SANCTUARY_PIN_SALT),'hex'),Buffer.from(env.SANCTUARY_PIN_HASH,'hex'))}
const sign=(value,env)=>createHmac('sha256',env.SANCTUARY_SESSION_SECRET).update(value).digest('base64url')
export function issueSession(env,now=Date.now()){const claims={owner:env.SANCTUARY_OWNER_USER_ID,id:randomUUID(),iat:Math.floor(now/1000),exp:Math.floor(now/1000)+SESSION_SECONDS,revision:sign(env.SANCTUARY_PIN_HASH+'|'+(env.SANCTUARY_PIN_MODE||'legacy')+'|'+(env.SANCTUARY_VAULT_KEY||''),env)};const body=Buffer.from(JSON.stringify(claims)).toString('base64url');return {token:`${body}.${sign(body,env)}`,claims}}
export function verifySession(token,env,now=Date.now()){
  try{if(!securityConfigured(env)||typeof token!=='string'||token.length>2048)return null;const [body,signature,...extra]=token.split('.');if(extra.length||!signature)return null;const expected=Buffer.from(sign(body,env)),actual=Buffer.from(signature);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;const value=JSON.parse(Buffer.from(body,'base64url'));if(value.owner!==env.SANCTUARY_OWNER_USER_ID||value.exp<=now/1000||value.iat>now/1000+30||value.exp-value.iat!==SESSION_SECONDS||value.revision!==sign(env.SANCTUARY_PIN_HASH+'|'+(env.SANCTUARY_PIN_MODE||'legacy')+'|'+(env.SANCTUARY_VAULT_KEY||''),env))return null;return value}catch{return null}
}
export function cookieHeader(token='',clear=false){return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${clear?0:SESSION_SECONDS}`}
export function readCookie(req){return String(req.headers?.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1)||''}
export function sameOrigin(req,env){return req.headers?.origin===env.SANCTUARY_ORIGIN&&(!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin')}
export function privateResponse(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff')}
export function validEnvelope(value){const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;try{return value?.version===1&&uuid.test(value.id)&&typeof value.ciphertext==='string'&&value.ciphertext.length<=180000&&/^[A-Za-z0-9+/]+=*$/.test(value.ciphertext)&&Buffer.from(value.ciphertext,'base64').length>=16&&Buffer.from(value.iv,'base64').length===12&&Buffer.from(value.salt,'base64').length===16&&Object.keys(value).every(k=>['id','version','ciphertext','iv','salt'].includes(k))}catch{return false}}
export const attemptKey=(req,env)=>sign(`${String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0]}|${env.SANCTUARY_OWNER_USER_ID}`,env)
export const vaultSalt=()=>randomBytes(32).toString('base64')
