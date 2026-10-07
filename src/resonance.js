import {classifySignal,signalDestination,escapeHTML as esc} from './sky-utils.js'
export class Resonance{
 constructor({navigate,lang=()=> 'es',enabled=()=>true}){Object.assign(this,{navigate,lang,enabled});this.lastWave=0;this.seen=new Set()}
 receive(message,{preview=false}={}){
  if(!this.enabled())return
  const id=message.client_id||message.id;if(id&&this.seen.has(id)&&!preview)return;if(id)this.seen.add(id);if(this.seen.size>500)this.seen.delete(this.seen.values().next().value)
  const kind=classifySignal(message),action=['coffee_invite','game_invite','system_event'].includes(kind),en=this.lang()==='en'
  document.querySelectorAll('.kora-orb,.scene-inhabitant').forEach(el=>{el.classList.remove('signal-reaction');void el.offsetWidth;el.classList.add('signal-reaction')})
  document.querySelector('[data-planet="signals"]')?.classList.add('signal-pulse')
  const note=document.createElement('button');note.className=`resonance-note ${action?'kora-signal':'cow-signal'}`
  const title=action?'KORA-Señal':'Vaca-Señal',line=kind==='coffee_invite'?(en?'A warm invitation.':'Hay un café esperando.'):kind==='game_invite'?(en?'An orbit to play together.':'Una órbita para jugar juntos.'):kind==='sketch'?(en?'A drawing reached your sky.':'Un dibujo llegó a tu cielo.'):kind==='system_event'?(en?'The sky has a new memory.':'El cielo tiene un recuerdo nuevo.'):(en?'A voice reached your orbit.':'Una voz llegó a tu órbita.')
  note.innerHTML=`<span>✦</span><b>${title}</b><small>${esc(line)}</small>`;note.setAttribute('aria-label',`${title}. ${line}`);note.onclick=()=>{this.navigate(signalDestination(message),message);note.remove()};document.body.append(note);setTimeout(()=>note.remove(),8000)
 }
 quietWave(partner,world){if(!this.enabled()||!partner||partner.status==='idle'||partner.current_world===world||document.hidden||Date.now()-this.lastWave<180000)return;this.lastWave=Date.now();const wave=document.createElement('div');wave.className='quiet-resonance-wave';wave.setAttribute('aria-hidden','true');document.body.append(wave);setTimeout(()=>wave.remove(),4000)}
}
