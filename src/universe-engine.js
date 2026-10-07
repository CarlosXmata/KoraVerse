import { UNIVERSE_EVENTS } from './birthday-data.js'
export const MODES=['classic','birthday-prelude','birthday-alignment','birthday-afterglow']
export function dateInZone(value=new Date(),timeZone='America/Santo_Domingo'){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value))
  const get=type=>parts.find(p=>p.type===type).value
  return `${get('year')}-${get('month')}-${get('day')}`
}
export function resolveUniverseMode({now=new Date(),events=UNIVERSE_EVENTS,override=null}={}){
  if(override?.mode&&MODES.includes(override.mode))return {mode:override.mode,event:events.find(e=>e.id===override.event_id)||events[0]||null,date:dateInZone(now),preview:Boolean(override.preview),manual:true}
  for(const event of events){const date=dateInZone(now,event.timeZone);for(const [mode,[start,end]] of Object.entries(event.phases||{})){if(date>=start&&date<=end)return {mode,event,date,preview:false,manual:false}}}
  return {mode:'classic',event:null,date:dateInZone(now),preview:false,manual:false}
}
export function validOverride(value){return value===null||Boolean(value&&MODES.includes(value.mode)&&typeof value.preview==='boolean'&&(!value.event_id||typeof value.event_id==='string'&&value.event_id.length<=80)&&Object.keys(value).every(k=>['mode','preview','event_id'].includes(k)))}
export class UniverseEngine {
  constructor({events=UNIVERSE_EVENTS,now=()=>new Date()}={}){this.events=events;this.now=now;this.override=null;this.status='normal';this.effects=true;this.offset=0;this.listeners=new Set()}
  get(){return {...resolveUniverseMode({now:new Date(new Date(this.now()).getTime()+this.offset),events:this.events,override:this.override}),status:this.status,effects:this.effects}}
  sync(snapshot,serverTime){if(serverTime)this.offset=new Date(serverTime).getTime()-new Date(this.now()).getTime();this.override=snapshot?.mode_override||null;this.status=snapshot?.status||'normal';this.effects=snapshot?.effects_enabled!==false;this.emit()}
  setOverride(value){if(!validOverride(value))throw Error('Invalid universe mode');this.override=value;this.emit();return this.get()}
  clearOverride(){return this.setOverride(null)}
  subscribe(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn)}
  emit(){for(const fn of this.listeners)fn(this.get())}
}
export const universeEngine=new UniverseEngine()
export const getUniverseMode=()=>universeEngine.get()
export const setUniverseOverride=value=>universeEngine.setOverride(value)
export const clearUniverseOverride=()=>universeEngine.clearOverride()
