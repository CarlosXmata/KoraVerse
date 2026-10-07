const encoder=new TextEncoder(),decoder=new TextDecoder()
export const encode64=bytes=>{const array=new Uint8Array(bytes);let value='';for(let offset=0;offset<array.length;offset+=8192)value+=String.fromCharCode(...array.subarray(offset,offset+8192));return btoa(value)}
export const decode64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0))
export async function unlockVault(pin,vaultSalt){
  const material=await crypto.subtle.importKey('raw',encoder.encode(pin),'PBKDF2',false,['deriveBits'])
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:600000,salt:decode64(vaultSalt)},material,256)
  const root=await crypto.subtle.importKey('raw',bits,'HKDF',false,['deriveKey'])
  new Uint8Array(bits).fill(0)
  return root
}
async function entryKey(root,salt,id){return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:decode64(salt),info:encoder.encode(`koraverse:diary:v1:${id}`)},root,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
export async function encryptEntry(root,owner,id,plaintext){
  const salt=encode64(crypto.getRandomValues(new Uint8Array(16))),iv=encode64(crypto.getRandomValues(new Uint8Array(12)))
  const key=await entryKey(root,salt,id)
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv:decode64(iv),additionalData:encoder.encode(`1|${owner}|${id}`)},key,encoder.encode(JSON.stringify(plaintext)))
  return {id,version:1,salt,iv,ciphertext:encode64(ciphertext)}
}
export async function decryptEntry(root,owner,envelope){
  if(envelope.version!==1)throw Error('Unsupported diary version')
  const key=await entryKey(root,envelope.salt,envelope.id)
  const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode64(envelope.iv),additionalData:encoder.encode(`1|${owner}|${envelope.id}`)},key,decode64(envelope.ciphertext))
  return JSON.parse(decoder.decode(plaintext))
}
