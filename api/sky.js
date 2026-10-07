import {serverDB,apiFailure} from '../lib/server-db.js'
import {BIRTHDAY,CONSTELLATIONS} from '../src/birthday-data.js'
import {resolveUniverseMode,dateInZone} from '../src/universe-engine.js'
const milestones={
 'first-visit':['Primer encuentro','visit','✦'],'seven-days':['Una semana entre mundos','visit','✦'],
 'first-quiet':['Un lugar para descansar','quiet','☾'],'first-game':['Un pequeño desafío','game','♟'],
 'first-learning':['Una pregunta nueva','learning','✧'],'first-create':['Algo que nació aquí','sketch','✎'],
 'first-coffee':['Un café compartido','coffee','☕'],'first-signal':['Una señal encontró su órbita','signal','✦'],
 'first-sudoku':['Un cielo en orden','sudoku','✦'],'first-chess':['La primera partida','chess','♟'],
 'first-check':['Una nueva jugada','chess','♟'],'first-duo':['Dos en una órbita','duo','✦'],
 'first-sketch':['Un dibujo cruzó el cielo','sketch','✎'],'coffee-accepted':['Un café compartido','coffee','☕'],
 'first-english':['Una palabra nueva','learning','✧'],'first-arcade':['Un pequeño desafío','game','✦'],
 'first-puzzle':['Un cielo en orden','game','✦'],'first-trivia':['Una respuesta nueva','game','✦'],
 'first-chill':['Un lugar para descansar','quiet','☾']
}
export function createSkyHandler({db=serverDB(),now=()=>new Date()}={}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store')
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed'})
 if(!db)return apiFailure(res)
 const player=req.method==='GET'?req.query?.player:req.body?.player
 if(!['carlos','kora'].includes(player))return res.status(400).json({error:'Invalid player'})
 try{
  const snapshot=await db.from('koraverse_universe_state').select('*').eq('id',1).single()
  if(snapshot.error)return apiFailure(res)
  if(req.method==='GET'){
   const [stars,events,definitions]=await Promise.all([
    db.from('koraverse_stars').select('*').in('visibility',['shared','public']).order('event_date'),
    db.from('koraverse_events').select('*').eq('player_key',player),db.from('koraverse_constellation_definitions').select('*')
   ])
   if(stars.error||events.error||definitions.error)return apiFailure(res)
   return res.status(200).json({state:snapshot.data,stars:stars.data,events:events.data,definitions:definitions.data,server_time:new Date(now()).toISOString()})
  }
  // Public shared milestones preserve V5's two-person trust model; these are not Sanctuary identities.
  const mode=resolveUniverseMode({now:now(),override:snapshot.data.mode_override})
  const body=req.body||{}
  if(snapshot.data.status!=='normal')return res.status(409).json({error:'El universo está descansando.'})
  let star=null,progress=null
  if(body.action==='milestone'){
   const data=milestones[body.key];if(!data)return res.status(400).json({error:'Unknown milestone'})
   star={player_key:player,event_key:body.key,title:data[0],star_name:data[0],event_date:dateInZone(now()),event_type:data[1],icon:data[2],story:'Un pequeño momento quedó viviendo en el cielo.',fragment:'Cada órbita empieza con un paso.',metadata:{origin:'KORAVERSE',constellation:CONSTELLATIONS.find(c=>c.types.includes(data[1]))?.id}}
  }else if(['alignment_complete','rose_open'].includes(body.action)){
   if(mode.preview||!['birthday-alignment','birthday-afterglow'].includes(mode.mode)||mode.event?.id!==BIRTHDAY.id||dateInZone(now(),BIRTHDAY.timeZone)<BIRTHDAY.date)return res.status(409).json({error:'Esta es una vista previa.'})
   if(body.action==='rose_open'&&(!Number.isInteger(body.rose)||body.rose<1||body.rose>10))return res.status(400).json({error:'Invalid rose'})
   const roseEvent=body.action==='rose_open'
   const candidate={player_key:player,event_key:roseEvent?'ten-roses':BIRTHDAY.id,title:roseEvent?'Diez rosas':BIRTHDAY.name.es,star_name:roseEvent?'Rosa Decem':BIRTHDAY.starName,event_date:BIRTHDAY.date,event_type:roseEvent?'roses':'alignment',story:BIRTHDAY.starStory.es,fragment:BIRTHDAY.fragment.es,icon:'✦',metadata:{origin:BIRTHDAY.name.es,constellation:BIRTHDAY.constellation,replay:'alignment',gold:true,event_id:BIRTHDAY.id}}
   const receipt=await db.rpc('koraverse_event_progress',{p_player:player,p_event:BIRTHDAY.id,p_rose:roseEvent?body.rose:null,p_complete:!roseEvent,p_star:candidate})
   if(receipt.error)return apiFailure(res);progress=receipt.data
   const all=progress.roses?.length===10
   if(!roseEvent||all)star=candidate
  }else return res.status(400).json({error:'Unknown action'})
  if(star&&body.action==='milestone'){const result=await db.from('koraverse_stars').upsert(star,{onConflict:'player_key,event_key',ignoreDuplicates:true});if(result.error)return apiFailure(res)}
  return res.status(200).json({ok:true,progress,star})
 }catch{return apiFailure(res)}
}}
export default createSkyHandler()
