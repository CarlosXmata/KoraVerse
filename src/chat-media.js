import {MEDIA_BUCKET,validMediaPath,photoMetadata} from './signals-utils.js'
import {escapeHTML as esc} from './sky-utils.js'
export const MAX_INPUT_BYTES=20*1024*1024
export function photoDimensions(width,height,limit=1800){if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width*height>80000000)throw Error('La imagen es demasiado grande para procesarla.');const ratio=Math.min(1,limit/Math.max(width,height));return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))}}
export async function preparePhoto(file){
 if(!file||file.size<1||file.size>MAX_INPUT_BYTES)throw Error('Elige una foto de hasta 20 MB.')
 if(!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)&&! /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name||''))throw Error('Elige JPEG, PNG o WebP.')
 let bitmap
 try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})}catch{throw Error('Este navegador no pudo abrir la foto. Convierte HEIC a JPEG o WebP.')}
 try{
  const size=photoDimensions(bitmap.width,bitmap.height)
  async function encode(limit){const d=photoDimensions(bitmap.width,bitmap.height,limit),canvas=document.createElement('canvas');canvas.width=d.width;canvas.height=d.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,d.width,d.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));if(!blob)throw Error('No se pudo preparar la foto.');return {blob,...d}}
  const full=await encode(1800),thumb=await encode(480)
  if(!['image/webp','image/jpeg'].includes(full.blob.type)||full.blob.size>4*1024*1024)throw Error('No se pudo reducir la foto; elige una más pequeña.')
  return {...size,blob:full.blob,thumbnail:thumb.blob,mime:full.blob.type,original_name:file.name||'photo'}
 }finally{bitmap.close()}
}
export class ChatMedia{
 constructor({player,qa=()=>false,request=(...args)=>fetch(...args)}){Object.assign(this,{player,qa,request});this.cache=new Map();this.pending=new Map();this.cleanupTickets=new Map()}
 async call(operation,body,headers={}){if(this.qa())throw Error('Las fotos reales están desactivadas en QA.');const who=this.player();if(!['carlos','kora'].includes(who))throw Error('Perfil no válido para fotografías.');const response=await this.request('/api/chat-media-'+operation,{method:'POST',credentials:'same-origin',headers:{'Content-Type':operation==='upload'?'application/octet-stream':'application/json',...headers},body:operation==='upload'?body:JSON.stringify({...body,player_key:who})});const value=await response.json();if(!response.ok)throw Error(value.error||'No se pudo completar la fotografía.');return value}
 async upload(prepared){if(this.qa())throw Error('QA no sube fotografías.');const who=this.player();if(!['carlos','kora'].includes(who))throw Error('Perfil no válido para fotografías.');const date=new Date(),stem=who+'/'+date.getUTCFullYear()+'/'+String(date.getUTCMonth()+1).padStart(2,'0')+'/'+crypto.randomUUID(),ext=prepared.mime==='image/jpeg'?'jpg':'webp',path=stem+'.'+ext,thumbnail_path=stem+'-thumb.'+ext;const metadata=photoMetadata({...prepared,path,thumbnail_path});for(const blob of [prepared.blob,prepared.thumbnail])if(!blob||blob.size<1||blob.size>4*1024*1024||blob.type!==prepared.mime)throw Error('No se pudo preparar la fotografía.');const saved=await this.call('upload',prepared.blob,{'x-player-key':who,'x-media-path':path});this.cleanupTickets.set(path,saved.cleanup_ticket);try{await this.call('upload',prepared.thumbnail,{'x-player-key':who,'x-media-path':thumbnail_path})}catch(error){await this.cleanup(metadata).catch(()=>{});throw error}return metadata}
 async cleanup(metadata){if(this.qa()||!metadata)return;const cleanup_ticket=this.cleanupTickets.get(metadata.path);if(!cleanup_ticket)return;await this.call('delete',{path:metadata.path,cleanup_ticket});this.cleanupTickets.delete(metadata.path);this.cache.delete(metadata.path);this.cache.delete(metadata.thumbnail_path)}
 committed(metadata){this.cleanupTickets.delete(metadata?.path)}
 clearCache(){this.cache.clear();this.pending.clear();this.cleanupTickets.clear()}
 async signed(path){if(!validMediaPath(path)||this.qa())return null;const cached=this.cache.get(path);if(cached?.until>Date.now())return cached.url;if(this.pending.has(path))return this.pending.get(path);const request=(async()=>{const value=await this.call('sign',{path});this.cache.set(path,{url:value.url,until:Date.now()+Math.max(0,(value.expires_in-60)*1000)});return value.url})();this.pending.set(path,request);try{return await request}finally{this.pending.delete(path)}}
 async hydrate(root){if(this.qa())return;await Promise.all([...root.querySelectorAll('[data-photo-path]')].map(async img=>{try{const url=await this.signed(img.dataset.photoPath);if(url&&img.isConnected){img.src=url;img.parentElement.querySelector('.photo-access-note')?.setAttribute('hidden','')}}catch{const note=img.parentElement.querySelector('.photo-access-note');if(note)note.textContent='No se pudo cargar la fotografía. Toca para reintentar.'}}))}
 async open(message){const url=await this.signed(message.metadata?.path);if(!url)throw Error('La foto no está disponible.');openPhotoLightbox(url,message.body||'',message.metadata?.original_name)}
}
export function openPhotoLightbox(url,caption='',name='photo.webp'){
 const before=document.activeElement,dialog=document.createElement('dialog');dialog.className='photo-lightbox';dialog.innerHTML=`<header><button class="photo-close" aria-label="Cerrar fotografía">×</button><label>Zoom <input type="range" min="100" max="300" value="100"></label><a href="${esc(url)}" download="${esc(name)}">Guardar fotografía</a></header><div class="photo-lightbox-scroll"><img src="${esc(url)}" alt="${esc(caption||'Fotografía compartida')}"></div><p>${esc(caption)}</p>`;document.body.append(dialog);dialog.showModal();const close=()=>{dialog.close();dialog.remove();before?.focus?.()};dialog.querySelector('.photo-close').onclick=close;dialog.oncancel=e=>{e.preventDefault();close()};dialog.querySelector('input').oninput=e=>dialog.querySelector('img').style.width=e.target.value+'%';return dialog
}
