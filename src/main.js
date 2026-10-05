import { createClient } from '@supabase/supabase-js'
import './style.css'
import {
  triviaBank, sameBrain, missions, gardenQuotes, englishCurriculum,
  bundledEnglishExercises, sudokuPuzzles, memoryIcons, achievements
} from './data.js'

const app = document.querySelector('#app')
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('TU-PROYECTO'))
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null

const PROFILE_KEY = 'koraverse_v3_profile'
const SOUND_KEY = 'koraverse_v3_sound'
const ROOM_KEY = 'koraverse_v3_room'
const DEVICE_KEY = 'koraverse_v3_device'
const deviceId = localStorage.getItem(DEVICE_KEY) || crypto.randomUUID()
localStorage.setItem(DEVICE_KEY, deviceId)

const state = {
  screen: 'gate',
  profile: null,
  profiles: [],
  duoStats: { xp: 0, sessions: 0, garden_level: 1 },
  dbReady: false,
  contentFromDb: [],
  signalChannel: null,
  room: {
    code: null,
    role: null,
    channel: null,
    players: [],
    connected: false,
    game: freshDuoGame(),
  },
  english: { lessonId: null, queue: [], index: 0, correct: 0, answered: false, builder: [] },
  sudoku: { puzzle: null, board: [], selected: null, mistakes: 0 },
  memory: null,
  chaos: null,
  invaders: null,
  sound: localStorage.getItem(SOUND_KEY) !== 'off',
  pendingSignal: null,
  timers: new Set(),
  raf: null,
}

function freshDuoGame() {
  return {
    screen: 'lobby', mode: null, round: 0,
    trivia: null, answers: {}, result: null,
    brain: null, brainAnswers: {}, brainResult: null,
    mission: null,
    sudokuId: null, sudokuBoard: null, sudokuFixed: null, sudokuStatus: null,
    casePhase: 'cases', caseCount: 0, bossHP: 100,
    gardenUnlocked: false, updatedAt: Date.now(),
  }
}

const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
const clamp = (n,a,b) => Math.max(a,Math.min(b,n))
const random = arr => arr[Math.floor(Math.random()*arr.length)]
const randomCode = () => Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('')
const todayKey = () => new Date().toISOString().slice(0,10)
const levelFromXP = xp => Math.max(1, Math.floor(Math.sqrt(Math.max(0,xp)/120))+1)
const levelFloor = level => 120 * (level-1) * (level-1)
const levelCeil = level => 120 * level * level
const profileKey = name => name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'player'
const otherDefault = () => state.profile?.player_key === 'carlos' ? 'kora' : 'carlos'

function setTimer(fn, ms) { const id=setTimeout(()=>{state.timers.delete(id);fn()},ms);state.timers.add(id);return id }
function clearTimers(){ for(const id of state.timers) clearTimeout(id); state.timers.clear(); if(state.raf) cancelAnimationFrame(state.raf); state.raf=null }

function beep(type='soft') {
  if(!state.sound) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    const map={soft:[360,.025],good:[620,.04],bad:[180,.035],signal:[760,.055]}
    const [freq,vol]=map[type]||map.soft
    osc.frequency.value=freq; osc.type=type==='signal'?'sine':'triangle'
    gain.gain.setValueAtTime(vol,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16)
    osc.start(); osc.stop(ctx.currentTime+.17); osc.onended=()=>ctx.close()
  } catch {}
}

function toast(message, tone='') {
  let el=document.querySelector('#toast')
  if(!el){ el=document.createElement('div'); el.id='toast'; document.body.appendChild(el) }
  el.className=`toast show ${tone}`; el.textContent=message
  setTimer(()=>el.classList.remove('show'),2200)
}

function confetti(count=34) {
  const colors=['#8b7cff','#56c8ff','#ff7fb0','#ffd56a','#7ce3a7']
  for(let i=0;i<count;i++){
    const d=document.createElement('i');d.className='confetti';d.style.left=(42+Math.random()*16)+'vw';d.style.top='12vh';d.style.background=random(colors);d.style.animationDelay=(Math.random()*.2)+'s';document.body.appendChild(d);setTimer(()=>d.remove(),1600)
  }
}

function starsMarkup(){return `<div class="space-bg"><i></i><i></i><i></i><i></i><i></i></div><div class="aurora a1"></div><div class="aurora a2"></div><div class="grain"></div>`}

function xpProgress(profile=state.profile){
  const level=levelFromXP(profile?.xp||0); const start=levelFloor(level), end=levelCeil(level); const pct=clamp(((profile?.xp||0)-start)/(end-start)*100,0,100)
  return {level,start,end,pct,next:end-(profile?.xp||0)}
}

function profileMini(){
  if(!state.profile) return ''
  const p=xpProgress();
  return `<button class="profile-mini" data-action="profile">
    <span class="mini-avatar">${esc(state.profile.display_name.slice(0,1).toUpperCase())}</span>
    <span><b>${esc(state.profile.display_name)}</b><small>Lv. ${p.level} · ${state.profile.xp||0} XP</small></span>
  </button>`
}

function shell(content,{world='home',back=null}={}){
  const connected=state.room.connected && state.room.code
  return `${starsMarkup()}<div id="toast" class="toast"></div>
  <div class="app-shell world-${world}">
    <header class="topbar-v3">
      <button class="brand-v3" data-action="home"><span class="brand-orb"></span><span>KORAVERSE<small>DUO UNIVERSE</small></span></button>
      <nav class="topnav">
        <button data-action="world" data-world="arcade">Arcade</button>
        <button data-action="world" data-world="puzzles">Puzzle Lab</button>
        <button data-action="world" data-world="english">English Lab</button>
        <button data-action="duo-entry">Duo Realm</button>
        <button data-action="world" data-world="chill">Chill</button>
      </nav>
      <div class="top-actions">
        ${connected?`<span class="live-pill"><i></i>${state.room.code}</span>`:''}
        <button class="icon-btn" data-action="sound" title="Sonido">${state.sound?'🔊':'🔇'}</button>
        ${profileMini()}
      </div>
    </header>
    <main class="main-wrap">
      ${back?`<button class="back-v3" data-action="${back.action}" ${back.world?`data-world="${back.world}"`:''}>← ${back.label}</button>`:''}
      ${content}
    </main>
    <button class="kora-orb" data-action="kora-tip"><span>🐮</span><i></i></button>
  </div>`
}

async function init(){
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})
  const saved=localStorage.getItem(PROFILE_KEY)
  if(saved){ try{ state.profile=JSON.parse(saved) }catch{} }
  if(state.profile){
    await hydrateProfile(); await setupSignalChannel(); await checkPendingSignals();
    const queryRoom=new URLSearchParams(location.search).get('room')?.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
    let savedRoom=null;try{savedRoom=JSON.parse(localStorage.getItem(ROOM_KEY)||'null')}catch{}
    if(queryRoom?.length===6){
      const role=savedRoom?.code===queryRoom?savedRoom.role:'guest'
      return connectRoom(role||'guest',queryRoom)
    }
    renderHome()
  } else renderGate()
}

async function detectDb(){
  if(!supabase) return false
  try{ const {error}=await supabase.from('koraverse_profiles').select('player_key').limit(1); state.dbReady=!error; return !error }catch{return false}
}

function defaultProfile(name){
  return {player_key:profileKey(name),display_name:name,xp:0,english_xp:0,puzzle_xp:0,arcade_xp:0,duo_xp:0,streak:0,last_active:null}
}

async function hydrateProfile(){
  await detectDb()
  if(state.dbReady){
    try{
      const key=state.profile.player_key
      const {data}=await supabase.from('koraverse_profiles').select('*').eq('player_key',key).maybeSingle()
      if(data) state.profile=data
      else await supabase.from('koraverse_profiles').upsert(state.profile)
      const {data:all}=await supabase.from('koraverse_profiles').select('*').order('xp',{ascending:false})
      if(all) state.profiles=all
      const {data:duo}=await supabase.from('koraverse_duo').select('*').eq('id',1).maybeSingle(); if(duo) state.duoStats=duo
      const {data:content}=await supabase.from('koraverse_english_content').select('*').eq('active',true).limit(200); if(content?.length) state.contentFromDb=content
    }catch{}
  } else {
    const local=JSON.parse(localStorage.getItem(`koraverse_profile_${state.profile.player_key}`)||'null'); if(local) state.profile={...state.profile,...local}
    state.profiles=['carlos','kora'].map(k=>JSON.parse(localStorage.getItem(`koraverse_profile_${k}`)||'null')).filter(Boolean)
  }
  touchStreak()
  localStorage.setItem(PROFILE_KEY,JSON.stringify(state.profile)); localStorage.setItem(`koraverse_profile_${state.profile.player_key}`,JSON.stringify(state.profile))
}

function touchStreak(){
  const last=state.profile.last_active
  const today=todayKey()
  if(last===today) return
  if(last){ const a=new Date(last+'T12:00:00'),b=new Date(today+'T12:00:00'); const days=Math.round((b-a)/86400000); state.profile.streak=days===1?(state.profile.streak||0)+1:1 }
  else state.profile.streak=1
  state.profile.last_active=today
  persistProfile(false)
}

async function persistProfile(refresh=true){
  localStorage.setItem(PROFILE_KEY,JSON.stringify(state.profile));localStorage.setItem(`koraverse_profile_${state.profile.player_key}`,JSON.stringify(state.profile))
  if(state.dbReady){ try{await supabase.from('koraverse_profiles').upsert({...state.profile,updated_at:new Date().toISOString()})}catch{} }
  if(refresh){ const idx=state.profiles.findIndex(p=>p.player_key===state.profile.player_key);if(idx>=0)state.profiles[idx]={...state.profile};else state.profiles.push({...state.profile}) }
}

async function awardXP(amount,category='general',source='activity',{duo=false,silent=false}={}){
  if(!state.profile||amount<=0)return
  const oldLevel=levelFromXP(state.profile.xp||0)
  state.profile.xp=(state.profile.xp||0)+amount
  const field={english:'english_xp',puzzle:'puzzle_xp',arcade:'arcade_xp',duo:'duo_xp'}[category]
  if(field) state.profile[field]=(state.profile[field]||0)+amount
  await persistProfile()
  if(state.dbReady){
    supabase.from('koraverse_activity').insert({player_key:state.profile.player_key,category,source,xp:amount}).then(()=>{})
  }
  if(duo) await awardDuoXP(Math.max(5,Math.round(amount*.65)))
  if(!silent){toast(`+${amount} XP · ${source}`,'xp');beep('good')}
  const newLevel=levelFromXP(state.profile.xp)
  if(newLevel>oldLevel){setTimer(()=>{confetti(56);toast(`LEVEL UP · Nivel ${newLevel}`,'level')},350)}
}

async function awardDuoXP(amount){
  state.duoStats.xp=(state.duoStats.xp||0)+amount
  if(state.dbReady){ try{await supabase.from('koraverse_duo').update({xp:state.duoStats.xp,updated_at:new Date().toISOString()}).eq('id',1)}catch{} }
}

function renderGate(){
  state.screen='gate'; clearTimers()
  app.innerHTML=`${starsMarkup()}<div class="gate-wrap">
    <div class="gate-card glass-xl">
      <div class="gate-brand"><span class="brand-orb huge"></span><div><small>WELCOME TO</small><h1>KORAVERSE</h1><p>Un pequeño universo para jugar, aprender y desaparecer cinco minutos.</p></div></div>
      <div class="gate-question">¿Quién está entrando?</div>
      <div class="profile-choices">
        <button class="identity-card kora" data-action="choose-profile" data-name="Kora"><span>✨</span><b>Kora</b><small>Player One</small></button>
        <button class="identity-card carlos" data-action="choose-profile" data-name="Carlos"><span>🚀</span><b>Carlos</b><small>Player Two</small></button>
      </div>
      <div class="or-line"><span>o</span></div>
      <div class="custom-profile"><input id="customName" class="input-v3" placeholder="Otro nombre"><button class="btn-v3 soft" data-action="custom-profile">Entrar</button></div>
      <small class="privacy-note">No necesita cuenta. El perfil se sincroniza en Supabase cuando activas la base de KORAVERSE.</small>
    </div>
  </div>`
}

async function chooseProfile(name){
  state.profile=defaultProfile(name); localStorage.setItem(PROFILE_KEY,JSON.stringify(state.profile)); await hydrateProfile(); await setupSignalChannel(); await checkPendingSignals();
  const room=new URLSearchParams(location.search).get('room')?.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
  if(room?.length===6)return connectRoom('guest',room)
  renderHome()
}

function dashboardHero(){
  const p=xpProgress(); const other=otherDefault(); const otherProfile=state.profiles.find(x=>x.player_key===other)
  const daily=englishCurriculum[(new Date().getDate()-1)%englishCurriculum.length]
  return `<section class="command-hero">
    <div class="hero-copy">
      <div class="eyebrow-v3"><i class="online-dot"></i> COMMAND CENTER · ${new Date().toLocaleDateString('es-DO',{weekday:'long',day:'numeric',month:'long'})}</div>
      <h1>Welcome back,<br><span>${esc(state.profile.display_name)}.</span></h1>
      <p>${otherProfile?`${esc(otherProfile.display_name)} está en nivel ${levelFromXP(otherProfile.xp)}. `:''}Hoy el universo tiene algo corto para aprender, algo absurdo para destruir y algo tranquilo para cuando no quieras competir.</p>
      <div class="hero-buttons"><button class="btn-v3 primary" data-action="quick-play">▶ Tengo 5 minutos</button><button class="btn-v3 signal" data-action="send-signal">🔔 Invitar a ${esc(other==='kora'?'Kora':'Carlos')}</button></div>
      ${state.pendingSignal?`<div class="signal-banner"><span>✨</span><div><b>KORA SIGNAL recibido</b><small>${esc(state.pendingSignal.from_player)} quiere jugar contigo.</small></div><button data-action="duo-entry">Entrar</button></div>`:''}
    </div>
    <div class="planet-console">
      <div class="orbit-line o1"></div><div class="orbit-line o2"></div><div class="orbit-line o3"></div>
      <button class="planet-core" data-action="quick-play"><span class="planet-glow"></span><b>${p.level}</b><small>LEVEL</small></button>
      <button class="satellite s1" data-action="world" data-world="english">🇬🇧<span>English</span></button>
      <button class="satellite s2" data-action="world" data-world="arcade">🚀<span>Arcade</span></button>
      <button class="satellite s3" data-action="world" data-world="puzzles">🧩<span>Puzzles</span></button>
      <button class="satellite s4" data-action="world" data-world="chill">🌿<span>Chill</span></button>
    </div>
  </section>
  <section class="dashboard-strip">
    <div class="xp-card glass"><div class="xp-ring" style="--p:${p.pct}%"><span>${p.level}</span></div><div><small>TU PROGRESO</small><b>${state.profile.xp} XP</b><p>${p.next} XP para nivel ${p.level+1}</p></div></div>
    <button class="daily-card glass" data-action="english-lesson" data-lesson="${daily.id}"><span>${daily.icon}</span><div><small>DAILY ENGLISH · ${daily.level}</small><b>${daily.title}</b><p>4 min · +XP · ${daily.subtitle}</p></div><i>→</i></button>
    <button class="garden-card glass" data-action="garden"><span>🌷</span><div><small>THE GARDEN</small><b>Nivel ${state.duoStats.garden_level||1}</b><p>Tu zona sin prisa.</p></div><i>→</i></button>
  </section>`
}

function worldPreview(){
  return `<section class="section-block"><div class="section-title"><div><small>EXPLORE THE UNIVERSE</small><h2>¿Qué te apetece?</h2></div><button class="text-btn" data-action="profile">Ver mi progreso →</button></div>
  <div class="world-grid">
    ${worldCard('🚀','ARCADE','Caso cerrado. Literalmente.','Case Invaders, Memory, Chaos y clásicos.','arcade','#ff7fb0')}
    ${worldCard('🧩','PUZZLE LAB','Para cuando el cerebro pide otra cosa.','Sudoku, lógica y memoria.','puzzles','#56c8ff')}
    ${worldCard('🇬🇧','ENGLISH LAB','Aprende sin sentir que estás estudiando.','Ruta A1 → A2 → B1 y quest diario.','english','#7ce3a7')}
    ${worldCard('🤝','DUO REALM','Dos pantallas. Una dimensión.','Trivia, Same Brain, Sudoku Duo y boss.','duo','#8b7cff')}
    ${worldCard('🌿','CHILL ZONE','Nada que demostrar aquí.','Garden, respiración y pequeñas pausas.','chill','#ffd56a')}
  </div></section>`
}
function worldCard(icon,kicker,title,desc,world,color){return `<button class="world-card" style="--accent:${color}" data-action="${world==='duo'?'duo-entry':'world'}" ${world!=='duo'?`data-world="${world}"`:''}><span class="world-icon">${icon}</span><small>${kicker}</small><h3>${title}</h3><p>${desc}</p><i>EXPLORE ↗</i></button>`}

function podiumBlock(){
  const list=[...state.profiles]; if(!list.find(p=>p.player_key===state.profile.player_key))list.push(state.profile)
  list.sort((a,b)=>(b.xp||0)-(a.xp||0)); while(list.length<2){const k=list[0]?.player_key==='carlos'?'kora':'carlos';list.push(defaultProfile(k==='kora'?'Kora':'Carlos'))}
  return `<section class="section-block podium-section"><div class="section-title"><div><small>EXPERIENCE PODIUM</small><h2>La carrera más innecesariamente seria.</h2></div><span class="duo-level">DUO XP · ${state.duoStats.xp||0}</span></div>
    <div class="podium-wrap">
      ${list.slice(0,2).map((p,i)=>`<div class="podium-player rank-${i+1}"><div class="crown">${i===0?'👑':'✦'}</div><div class="pod-avatar">${esc(p.display_name.slice(0,1).toUpperCase())}</div><b>${esc(p.display_name)}</b><small>Lv. ${levelFromXP(p.xp||0)}</small><strong>${p.xp||0} XP</strong><div class="pod-base"><span>#${i+1}</span></div></div>`).join('')}
      <div class="podium-side glass"><small>DUO PROGRESS</small><b>Level ${levelFromXP(state.duoStats.xp||0)}</b><div class="bar"><i style="width:${xpProgress({xp:state.duoStats.xp||0}).pct}%"></i></div><p>Cuando juegan juntos, ambos ganan XP personal y el universo gana Duo XP.</p></div>
    </div>
  </section>`
}

function renderHome(){
  state.screen='home'; clearTimers(); app.innerHTML=shell(`${dashboardHero()}${worldPreview()}${podiumBlock()}`,{world:'home'})
}

function renderWorld(world){
  clearTimers(); state.screen=world
  const map={
    arcade:{eyebrow:'ARCADE DISTRICT',title:'Destruye el backlog.',sub:'Juegos rápidos, combos y una cantidad sospechosa de expedientes.',cards:[
      ['🚀','Case Invaders','Navecita + casos + láser. Era inevitable.','case-invaders','SOLO / DUO'],
      ['🧠','Memory Reactor','Encuentra pares y encadena combos.','memory','SOLO'],
      ['⚡','30 Second Chaos','Treinta segundos. Cero dignidad.','chaos','SOLO'],
      ['📁','Classic Case Arena','El minijuego original evolucionado.','classic-case','DUO'],
    ]},
    puzzles:{eyebrow:'PUZZLE LAB',title:'Silencio. El cerebro está jugando.',sub:'Puzzles relajantes para perder el tiempo con propósito.',cards:[
      ['🔢','Sudoku','Relax, Normal y Focus.','sudoku','SOLO'],
      ['🤝','Sudoku Duo','El mismo tablero, dos cursores, una solución.','duo-sudoku','DUO'],
      ['🧠','Memory Reactor','También cuenta como ejercicio mental.','memory','SOLO'],
    ]},
    english:{eyebrow:'ENGLISH LAB',title:'Small lessons. Real progress.',sub:'Fundamentos concretos, sesiones de 3–8 minutos y práctica diaria.',cards:[]},
    chill:{eyebrow:'CHILL ZONE',title:'Aquí no hay backlog.',sub:'Entra cuando no quieras competir con absolutamente nadie.',cards:[
      ['🌷','The Garden','Toca flores, lee algo tranquilo y sal cuando quieras.','garden','SOLO'],
      ['🌌','Star Drift','Una pausa visual de dos minutos.','star-drift','SOLO'],
      ['☕','Coffee Break','Preguntas suaves para desconectarte.','coffee','SOLO'],
    ]}
  }
  const cfg=map[world]
  if(world==='english') return renderEnglishHub()
  app.innerHTML=shell(`<section class="world-hero"><div><small>${cfg.eyebrow}</small><h1>${cfg.title}</h1><p>${cfg.sub}</p></div><div class="world-emblem">${world==='arcade'?'🚀':world==='puzzles'?'🧩':'🌿'}</div></section>
  <div class="activity-grid">${cfg.cards.map(([icon,title,desc,action,tag])=>`<button class="activity-card" data-action="${action}"><span>${icon}</span><i>${tag}</i><h3>${title}</h3><p>${desc}</p><b>OPEN →</b></button>`).join('')}</div>`,{world,back:{action:'home',label:'Command Center'}})
}

function renderEnglishHub(){
  state.screen='english'; clearTimers(); const daily=englishCurriculum[(new Date().getDate()-1)%englishCurriculum.length]
  const mastery=Math.min(100,Math.round((state.profile.english_xp||0)/8))
  app.innerHTML=shell(`<section class="english-hero"><div><small>ENGLISH LAB · DAILY PRACTICE</small><h1>Learn a little.<br><span>Keep it moving.</span></h1><p>Una ruta corta y concreta: fundamentos primero, conversación después. Los temas se mantienen estables; los ejercicios pueden crecer desde Supabase sin volver a desplegar la app.</p><div class="hero-buttons"><button class="btn-v3 english" data-action="english-lesson" data-lesson="${daily.id}">Start Daily Quest · ${daily.title}</button><button class="btn-v3 soft" data-action="notify-enable">🔔 Activar alertas</button></div></div>
  <div class="english-meter glass"><span>🇬🇧</span><b>${state.profile.english_xp||0} XP</b><small>ENGLISH XP</small><div class="bar"><i style="width:${mastery}%"></i></div><p>Racha general: 🔥 ${state.profile.streak||1} días</p></div></section>
  <section class="section-block"><div class="section-title"><div><small>LEARNING PATH</small><h2>A1 → A2 → B1</h2></div><span>Sesiones de 3–8 min</span></div><div class="lesson-grid">${englishCurriculum.map((l,i)=>`<button class="lesson-card" style="--lesson:${l.color}" data-action="english-lesson" data-lesson="${l.id}"><span>${l.icon}</span><div><small>${l.level} · UNIT ${String(i+1).padStart(2,'0')}</small><h3>${l.title}</h3><p>${l.subtitle}</p></div><i>→</i></button>`).join('')}</div></section>
  <section class="english-note glass"><div>💡</div><div><b>¿Qué significa “siempre actualizado” aquí?</b><p>El currículo esencial no cambia por moda. KORAVERSE puede leer nuevos ejercicios activos desde la tabla <code>koraverse_english_content</code> de Supabase, así puedes ampliar ejemplos y prácticas sin tocar el código.</p></div></section>`,{world:'english',back:{action:'home',label:'Command Center'}})
}

function englishExercisesFor(lessonId){
  const remote=state.contentFromDb.filter(x=>x.lesson_id===lessonId).map(x=>({lessonId:x.lesson_id,level:x.level,topic:x.topic,kind:x.kind,prompt:x.prompt,options:x.options,answer:x.answer,explanation:x.explanation}))
  const local=bundledEnglishExercises.filter(x=>x.lessonId===lessonId)
  return [...remote,...local].sort(()=>Math.random()-.5)
}

function startEnglishLesson(lessonId){
  const lesson=englishCurriculum.find(x=>x.id===lessonId)||englishCurriculum[0];let q=englishExercisesFor(lesson.id)
  if(!q.length) q=bundledEnglishExercises.sort(()=>Math.random()-.5).slice(0,5)
  state.english={lessonId:lesson.id,queue:q.slice(0,Math.min(6,q.length)),index:0,correct:0,answered:false,builder:[]};renderEnglishQuestion()
}

function renderEnglishQuestion(){
  state.screen='english-play'; const e=state.english,q=e.queue[e.index],lesson=englishCurriculum.find(x=>x.id===e.lessonId)||englishCurriculum[0]
  if(!q) return finishEnglish()
  const progress=((e.index)/e.queue.length)*100
  let interaction=''
  if(q.kind==='builder'){
    interaction=`<div class="builder-answer" id="builderAnswer">${e.builder.length?e.builder.map((t,i)=>`<button data-action="builder-remove" data-index="${i}">${esc(t)}</button>`).join(''):'<span>Toca las palabras en orden…</span>'}</div><div class="token-bank">${q.tokens.map((t,i)=>`<button data-action="builder-add" data-index="${i}" ${e.builder.includes(t)?'disabled':''}>${esc(t)}</button>`).join('')}</div><button class="btn-v3 english" data-action="english-check-builder">Check sentence</button>`
  }else{
    interaction=`<div class="english-options">${(q.options||[]).map((o,i)=>`<button data-action="english-answer" data-index="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join('')}</div>`
  }
  app.innerHTML=shell(`<section class="lesson-play"><div class="lesson-top"><button class="round-back" data-action="world" data-world="english">×</button><div class="lesson-progress"><i style="width:${progress}%"></i></div><span>${e.index+1}/${e.queue.length}</span></div>
  <div class="lesson-question glass-xl"><div class="lesson-badge">${lesson.icon} ${lesson.level} · ${esc(lesson.title)}</div><small>${q.kind==='translate'?'TRANSLATE':q.kind==='builder'?'BUILD THE SENTENCE':'CHOOSE THE BEST ANSWER'}</small><h2>${esc(q.prompt)}</h2>${interaction}<div id="englishFeedback"></div></div></section>`,{world:'english'})
}

async function answerEnglish(index){
  const e=state.english,q=e.queue[e.index];if(e.answered)return;e.answered=true
  let correct=false
  if(q.kind==='builder') correct=JSON.stringify(e.builder.map(x=>x.toLowerCase()))===JSON.stringify(q.answer.map(x=>x.toLowerCase()))
  else correct=Number(index)===Number(q.answer)
  if(correct){e.correct++;beep('good');confetti(16)}else beep('bad')
  document.querySelectorAll('.english-options button').forEach((b,i)=>{b.disabled=true;if(i===Number(q.answer))b.classList.add('correct');else if(i===Number(index))b.classList.add('wrong')})
  const fb=document.querySelector('#englishFeedback');if(fb)fb.innerHTML=`<div class="feedback ${correct?'good':'bad'}"><b>${correct?'Perfect ✨':'Almost.'}</b><p>${esc(q.explanation||'Revisa la estructura y vuelve a intentarlo en la próxima.')}</p><button class="btn-v3 ${correct?'english':'soft'}" data-action="english-next">Continue →</button></div>`
}
function addBuilderToken(index){const q=state.english.queue[state.english.index],t=q.tokens[index];if(!state.english.builder.includes(t)){state.english.builder.push(t);renderEnglishQuestion()}}
function removeBuilderToken(index){state.english.builder.splice(index,1);renderEnglishQuestion()}
async function nextEnglish(){state.english.index++;state.english.answered=false;state.english.builder=[];if(state.english.index>=state.english.queue.length)return finishEnglish();renderEnglishQuestion()}
async function finishEnglish(){
  const e=state.english;const xp=20+e.correct*12;await awardXP(xp,'english',`${e.correct}/${e.queue.length} English`)
  app.innerHTML=shell(`<section class="result-screen"><div class="result-orb english-r">🇬🇧</div><small>LESSON COMPLETE</small><h1>${e.correct}/${e.queue.length}</h1><p>Ganaste <b>${xp} XP</b>. Lo importante aquí no es hacerlo perfecto; es volver mañana.</p><div class="hero-buttons"><button class="btn-v3 english" data-action="world" data-world="english">English Lab</button><button class="btn-v3 soft" data-action="home">Command Center</button></div></section>`,{world:'english'})
}

// ---------- SOLO SUDOKU ----------
function startSudoku(){const puzzle=sudokuPuzzles[0];state.sudoku={puzzle,board:puzzle.puzzle.split('').map(Number),selected:null,mistakes:0};renderSudoku()}
function renderSudoku(){
  const s=state.sudoku,p=s.puzzle;state.screen='sudoku'
  const cells=s.board.map((n,i)=>{const fixed=p.puzzle[i]!=='0';const r=Math.floor(i/9),c=i%9;return `<button class="sudoku-cell ${fixed?'fixed':''} ${s.selected===i?'selected':''} ${(c===2||c===5)?'block-r':''} ${(r===2||r===5)?'block-b':''}" data-action="sudoku-cell" data-index="${i}">${n||''}</button>`}).join('')
  app.innerHTML=shell(`<section class="game-header"><div><small>PUZZLE LAB · ${p.difficulty.toUpperCase()}</small><h1>Sudoku</h1><p>Sin reloj. Sin presión. Solo una cuadrícula que eventualmente dejará de molestarte.</p></div><div class="game-stat"><small>MISTAKES</small><b>${s.mistakes}</b></div></section>
  <section class="sudoku-layout"><div class="sudoku-board">${cells}</div><div class="sudoku-tools glass"><small>NUMBER PAD</small><div class="num-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-action="sudoku-number" data-number="${n}">${n}</button>`).join('')}</div><button class="btn-v3 soft" data-action="sudoku-clear">Clear cell</button><button class="btn-v3 primary" data-action="sudoku-check">Check puzzle</button><div class="mini-note">Completarlo da 90 XP. Cada error solo resta elegancia, no puntos.</div></div></section>`,{world:'puzzles',back:{action:'world',world:'puzzles',label:'Puzzle Lab'}})
}
function sudokuSet(n){const s=state.sudoku;if(s.selected==null||s.puzzle.puzzle[s.selected]!=='0')return;s.board[s.selected]=n;renderSudoku()}
async function checkSudoku(){const s=state.sudoku,sol=s.puzzle.solution.split('').map(Number);const complete=s.board.every(Boolean),correct=s.board.every((n,i)=>n===sol[i]);if(correct){confetti(70);await awardXP(90,'puzzle','Sudoku complete');return renderPuzzleResult('🧠','Sudoku complete','El universo acepta oficialmente que hoy tu cerebro funcionó.')}s.mistakes++;toast(complete?'Hay números fuera de lugar.':'Todavía faltan casillas.','');renderSudoku()}
function renderPuzzleResult(icon,title,sub){app.innerHTML=shell(`<section class="result-screen"><div class="result-orb">${icon}</div><small>PUZZLE COMPLETE</small><h1>${title}</h1><p>${sub}</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="world" data-world="puzzles">Puzzle Lab</button><button class="btn-v3 soft" data-action="home">Command Center</button></div></section>`,{world:'puzzles'})}

// ---------- MEMORY ----------
function startMemory(){const icons=memoryIcons.slice(0,6),deck=[...icons,...icons].sort(()=>Math.random()-.5).map((icon,id)=>({id,icon,open:false,matched:false}));state.memory={deck,first:null,lock:false,moves:0,matches:0};renderMemory()}
function renderMemory(){state.screen='memory';const m=state.memory;app.innerHTML=shell(`<section class="game-header"><div><small>PUZZLE / ARCADE</small><h1>Memory Reactor</h1><p>Encuentra los pares. No hay explicación científica para por qué la vaca vale lo mismo que el cohete.</p></div><div class="game-stat"><small>MOVES</small><b>${m.moves}</b></div></section><div class="memory-grid">${m.deck.map((c,i)=>`<button class="memory-card ${c.open||c.matched?'open':''} ${c.matched?'matched':''}" data-action="memory-card" data-index="${i}"><span class="back">✦</span><span class="front">${c.icon}</span></button>`).join('')}</div>`,{world:'puzzles',back:{action:'world',world:'puzzles',label:'Puzzle Lab'}})}
function flipMemory(index){const m=state.memory;if(m.lock)return;const card=m.deck[index];if(card.open||card.matched)return;card.open=true;if(m.first==null){m.first=index;renderMemory();return}m.moves++;const a=m.deck[m.first];if(a.icon===card.icon){a.matched=card.matched=true;m.matches++;m.first=null;beep('good');renderMemory();if(m.matches===6)setTimer(async()=>{await awardXP(Math.max(35,90-m.moves*2),'puzzle','Memory Reactor');renderPuzzleResult('🧠','Memory cleared',`${m.moves} movimientos. Bastante digno.`)},400)}else{m.lock=true;renderMemory();setTimer(()=>{a.open=card.open=false;m.first=null;m.lock=false;renderMemory()},700)}}

// ---------- CHAOS ----------
function startChaos(){state.chaos={score:0,end:Date.now()+30000,active:true};renderChaos();setTimer(()=>finishChaos(),30000);spawnChaosTarget()}
function renderChaos(){const remain=Math.max(0,Math.ceil(((state.chaos?.end||Date.now())-Date.now())/1000));app.innerHTML=shell(`<section class="game-header"><div><small>ARCADE · 30 SECOND CHAOS</small><h1>Catch the urgent.</h1><p>Haz clic en cada “urgente” antes de que cambie de lugar. Sí, esto cuenta como terapia.</p></div><div class="game-stat"><small>SCORE</small><b id="chaosScore">${state.chaos.score}</b></div></section><div class="chaos-arena" id="chaosArena"><div class="chaos-time"><span id="chaosTime">${remain}</span>s</div></div>`,{world:'arcade',back:{action:'world',world:'arcade',label:'Arcade'}});const tick=setInterval(()=>{const el=document.querySelector('#chaosTime');if(!el){clearInterval(tick);return}el.textContent=Math.max(0,Math.ceil((state.chaos.end-Date.now())/1000))},250);state.timers.add(tick)}
function spawnChaosTarget(){if(!state.chaos?.active)return;const arena=document.querySelector('#chaosArena');if(!arena)return;arena.querySelector('.chaos-target')?.remove();const b=document.createElement('button');b.className='chaos-target';b.textContent=random(['URGENTE','¿STATUS?','PARA HOY','FAVOR VALIDAR','ASAP']);b.style.left=(5+Math.random()*78)+'%';b.style.top=(12+Math.random()*70)+'%';b.onclick=()=>{state.chaos.score++;document.querySelector('#chaosScore').textContent=state.chaos.score;beep('soft');spawnChaosTarget()};arena.appendChild(b);setTimer(()=>{if(b.isConnected)spawnChaosTarget()},1200)}
async function finishChaos(){if(!state.chaos?.active)return;state.chaos.active=false;const score=state.chaos.score;await awardXP(20+score*2,'arcade','30 Second Chaos');app.innerHTML=shell(`<section class="result-screen"><div class="result-orb danger-r">⚡</div><small>CHAOS SURVIVED</small><h1>${score}</h1><p>urgencias neutralizadas en 30 segundos.</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="chaos">Otra vez</button><button class="btn-v3 soft" data-action="world" data-world="arcade">Arcade</button></div></section>`,{world:'arcade'})}

// ---------- CASE INVADERS CANVAS ----------
function startInvaders({duo=false}={}){
  clearTimers();state.screen='invaders';state.invaders={duo,score:0,lives:3,end:Date.now()+45000,keys:{},shots:[],cases:[],lastSpawn:0,shipX:.5,active:true,shared:0};
  app.innerHTML=shell(`<section class="game-header compact"><div><small>ARCADE · ${duo?'DUO RAID':'SOLO'}</small><h1>Case Invaders</h1><p>← → para moverte · espacio/clic para disparar · destruye el backlog.</p></div><div class="hud-row"><div><small>DESTROYED</small><b id="invScore">0</b></div><div><small>LIVES</small><b id="invLives">♥♥♥</b></div><div><small>TIME</small><b id="invTime">45</b></div>${duo?'<div><small>DUO HITS</small><b id="sharedHits">0</b></div>':''}</div></section><div class="invader-wrap"><canvas id="invCanvas"></canvas><div class="canvas-tip">CLICK / TAP TO FIRE</div></div>`,{world:'arcade',back:{action:duo?'duo-hub':'world',world:duo?null:'arcade',label:duo?'Duo Realm':'Arcade'}})
  setupInvadersCanvas()
}
function setupInvadersCanvas(){
  const canvas=document.querySelector('#invCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');const resize=()=>{const r=canvas.getBoundingClientRect();canvas.width=Math.floor(r.width*devicePixelRatio);canvas.height=Math.floor(r.height*devicePixelRatio);ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)};resize();window.addEventListener('resize',resize,{once:true});
  const inv=state.invaders;const fire=()=>{if(!inv.active)return;inv.shots.push({x:inv.shipX*canvas.clientWidth,y:canvas.clientHeight-62});beep('soft')};
  canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect();inv.shipX=clamp((e.clientX-r.left)/r.width,.05,.95)};canvas.onpointerdown=fire
  window.onkeydown=e=>{inv.keys[e.key]=true;if(e.code==='Space'){e.preventDefault();fire()}};window.onkeyup=e=>inv.keys[e.key]=false
  function frame(t){if(!inv.active)return;if(inv.keys.ArrowLeft)inv.shipX=clamp(inv.shipX-.012,.05,.95);if(inv.keys.ArrowRight)inv.shipX=clamp(inv.shipX+.012,.05,.95);if(t-inv.lastSpawn>620){inv.lastSpawn=t;inv.cases.push({x:.08+Math.random()*.84,y:-35,s:28+Math.random()*20,v:.55+Math.random()*.65,label:random(['INC','REQ','URG','REV','MAIL'])})}
    const W=canvas.clientWidth,H=canvas.clientHeight;ctx.clearRect(0,0,W,H);drawSpace(ctx,W,H,t);inv.shots.forEach(s=>s.y-=8);inv.cases.forEach(c=>c.y+=c.v);
    inv.shots=inv.shots.filter(s=>s.y>-20);let destroyed=[];for(let ci=0;ci<inv.cases.length;ci++){const c=inv.cases[ci];const x=c.x*W;for(let si=0;si<inv.shots.length;si++){const s=inv.shots[si];if(Math.abs(s.x-x)<28&&Math.abs(s.y-c.y)<28){destroyed.push(ci);inv.shots.splice(si,1);inv.score++;if(inv.duo)sendRoom('arcade_hit',{id:crypto.randomUUID()});break}}}
    destroyed=[...new Set(destroyed)].sort((a,b)=>b-a);destroyed.forEach(i=>inv.cases.splice(i,1));
    inv.cases=inv.cases.filter(c=>{if(c.y>H-45){inv.lives--;return false}return true});
    drawShip(ctx,inv.shipX*W,H-42);inv.shots.forEach(s=>{ctx.fillStyle='#7ce3ff';ctx.fillRect(s.x-2,s.y-12,4,14)});inv.cases.forEach(c=>drawCase(ctx,c.x*W,c.y,c.label));
    document.querySelector('#invScore')&&(document.querySelector('#invScore').textContent=inv.score);document.querySelector('#invLives')&&(document.querySelector('#invLives').textContent='♥'.repeat(Math.max(0,inv.lives)));document.querySelector('#invTime')&&(document.querySelector('#invTime').textContent=Math.max(0,Math.ceil((inv.end-Date.now())/1000)));
    if(inv.lives<=0||Date.now()>=inv.end)return finishInvaders();state.raf=requestAnimationFrame(frame)}state.raf=requestAnimationFrame(frame)
}
function drawSpace(ctx,W,H,t){ctx.fillStyle='#080b18';ctx.fillRect(0,0,W,H);for(let i=0;i<50;i++){const x=(i*97)%W,y=(i*53+(t*.02*(i%3+1)))%H;ctx.globalAlpha=.25+(i%4)*.15;ctx.fillStyle='#fff';ctx.fillRect(x,y,1.5,1.5)}ctx.globalAlpha=1;const g=ctx.createRadialGradient(W*.5,H*.2,0,W*.5,H*.2,W*.6);g.addColorStop(0,'rgba(116,91,255,.14)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function drawShip(ctx,x,y){ctx.save();ctx.translate(x,y);ctx.shadowBlur=22;ctx.shadowColor='#56c8ff';ctx.fillStyle='#d9e8ff';ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(21,18);ctx.lineTo(0,10);ctx.lineTo(-21,18);ctx.closePath();ctx.fill();ctx.fillStyle='#8b7cff';ctx.fillRect(-5,5,10,20);ctx.restore()}
function drawCase(ctx,x,y,label){ctx.save();ctx.translate(x,y);ctx.shadowBlur=12;ctx.shadowColor='rgba(255,213,106,.3)';ctx.fillStyle='#ffd56a';ctx.beginPath();ctx.roundRect(-28,-19,56,38,7);ctx.fill();ctx.fillStyle='#9d7422';ctx.font='700 9px system-ui';ctx.textAlign='center';ctx.fillText(label,0,4);ctx.restore()}
async function finishInvaders(){const inv=state.invaders;if(!inv?.active)return;inv.active=false;if(state.raf)cancelAnimationFrame(state.raf);const xp=25+inv.score*3;await awardXP(xp,'arcade','Case Invaders',{duo:inv.duo});if(inv.duo)sendRoom('arcade_done',{score:inv.score});app.innerHTML=shell(`<section class="result-screen"><div class="result-orb danger-r">🚀</div><small>WAVE COMPLETE</small><h1>${inv.score}</h1><p>casos destruidos · +${xp} XP</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="case-invaders">Otra wave</button><button class="btn-v3 soft" data-action="${inv.duo?'duo-hub':'world'}" ${!inv.duo?'data-world="arcade"':''}>${inv.duo?'Duo Realm':'Arcade'}</button></div></section>`,{world:'arcade'})}

// ---------- CHILL ----------
function renderGarden(){state.screen='garden';clearTimers();const flowers=Array.from({length:34},(_,i)=>`<button class="flower-v3" style="--x:${3+Math.random()*94}%;--y:${3+Math.random()*40}%;--d:${Math.random()*2}s;--c:${random(['#ff8fb1','#ffe16f','#a886ff','#ffac78','#7fdca7','#6fc7ff'])}" data-action="garden-flower"></button>`).join('');app.innerHTML=shell(`<section class="garden-v3"><div class="garden-sky"><div class="sun-v3"></div><div class="cloud-v3 c1"></div><div class="cloud-v3 c2"></div></div><div class="garden-message glass"><small>THE GARDEN</small><h2>Por hoy, el caos puede esperar.</h2><p id="gardenQuote">${random(gardenQuotes)}</p></div>${flowers}<div class="garden-ground"></div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})}
function starDrift(){state.screen='star-drift';app.innerHTML=shell(`<section class="drift"><div class="drift-copy"><small>STAR DRIFT · 2 MIN PAUSE</small><h1>No tienes que ganar esto.</h1><p>Mueve el cursor. Respira. Recoge luz si quieres.</p></div><div class="drift-field" id="driftField"><div class="drift-star" id="driftStar">✦</div>${Array.from({length:24},()=>`<i style="left:${Math.random()*96}%;top:${Math.random()*94}%;animation-delay:${Math.random()*3}s"></i>`).join('')}</div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}});const f=document.querySelector('#driftField'),s=document.querySelector('#driftStar');f.onpointermove=e=>{const r=f.getBoundingClientRect();s.style.transform=`translate(${e.clientX-r.left-18}px,${e.clientY-r.top-18}px)`}}
function coffeeBreak(){const qs=['¿Qué fue lo menos terrible de hoy?','Si pudieras salir ahora mismo, ¿a dónde irías?','¿Qué canción describiría tu energía de este momento?','¿Qué pequeña cosa te gustaría que pasara antes de terminar el día?','¿Café, postre, libro o paseo?'];app.innerHTML=shell(`<section class="coffee-screen"><div class="coffee-cup">☕</div><small>COFFEE BREAK</small><h1>${random(qs)}</h1><p>No hay respuesta correcta. Ni siquiera tienes que responder.</p><button class="btn-v3 soft" data-action="coffee">Otra pregunta</button></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})}

// ---------- PROFILE / PODIUM ----------
function renderProfile(){state.screen='profile';const p=xpProgress(),earned=achievements.filter(a=>a.level?p.level>=a.level:(state.profile[a.category||'xp']||0)>=a.threshold);app.innerHTML=shell(`<section class="profile-hero"><div class="big-avatar">${esc(state.profile.display_name[0].toUpperCase())}</div><div><small>PLAYER PROFILE</small><h1>${esc(state.profile.display_name)}</h1><p>Level ${p.level} · ${state.profile.xp} XP · 🔥 ${state.profile.streak||1} day streak</p></div><div class="hero-buttons profile-actions"><button class="btn-v3 soft" data-action="notify-enable">🔔 Activar alertas</button><button class="btn-v3 soft" data-action="switch-profile">Cambiar jugador</button></div></section><section class="profile-grid"><div class="profile-panel glass"><small>PROGRESS TO LEVEL ${p.level+1}</small><div class="big-progress"><i style="width:${p.pct}%"></i></div><b>${state.profile.xp} XP</b><p>${p.next} XP restantes.</p></div><div class="profile-panel glass stats-list"><div><span>🇬🇧 English</span><b>${state.profile.english_xp||0}</b></div><div><span>🧩 Puzzles</span><b>${state.profile.puzzle_xp||0}</b></div><div><span>🚀 Arcade</span><b>${state.profile.arcade_xp||0}</b></div><div><span>🤝 Duo</span><b>${state.profile.duo_xp||0}</b></div></div></section><section class="section-block"><div class="section-title"><div><small>ACHIEVEMENTS</small><h2>${earned.length}/${achievements.length} unlocked</h2></div></div><div class="achievement-grid">${achievements.map(a=>{const ok=earned.some(e=>e.id===a.id);return `<div class="achievement ${ok?'unlocked':''}"><span>${a.icon}</span><div><b>${a.title}</b><p>${a.desc}</p></div><i>${ok?'✓':'🔒'}</i></div>`}).join('')}</div></section>${podiumBlock()}`,{world:'home',back:{action:'home',label:'Command Center'}})}

// ---------- KORA SIGNAL ----------
async function setupSignalChannel(){
  if(!supabase||!state.profile)return
  if(state.signalChannel) await supabase.removeChannel(state.signalChannel)
  state.signalChannel=supabase.channel('koraverse-signals-v3',{config:{broadcast:{self:false}}})
    .on('broadcast',{event:'signal'},({payload})=>{if(payload?.to===state.profile.player_key)receiveSignal(payload)})
    .subscribe()
}
async function sendSignal(){
  const to=otherDefault(),from=state.profile.player_key,msg=`${state.profile.display_name} quiere jugar contigo.`
  if(state.signalChannel) await state.signalChannel.send({type:'broadcast',event:'signal',payload:{from,to,message:msg,ts:Date.now()}})
  if(state.dbReady) supabase.from('koraverse_signals').insert({from_player:from,to_player:to,message:msg}).then(()=>{})
  // Push real si el backend opcional fue configurado. Si no, falla silenciosamente y Realtime sigue funcionando.
  fetch('/api/kora-signal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from_player:from,to_player:to,from_name:state.profile.display_name})}).catch(()=>{})
  toast('KORA SIGNAL enviado ✨','signal');beep('signal')
}
async function receiveSignal(payload){state.pendingSignal={from_player:payload.from,message:payload.message};beep('signal');toast(payload.message||'Tu cómplice quiere jugar.','signal');showBrowserNotification('KORA SIGNAL',payload.message||'Tu cómplice quiere jugar contigo.');if(state.screen==='home')renderHome()}
async function checkPendingSignals(){if(!state.dbReady||!state.profile)return;try{const {data}=await supabase.from('koraverse_signals').select('*').eq('to_player',state.profile.player_key).eq('seen',false).order('created_at',{ascending:false}).limit(1);if(data?.[0])state.pendingSignal=data[0]}catch{}}
async function enableNotifications(){
  if(!('Notification'in window))return toast('Este navegador no soporta notificaciones')
  const permission=await Notification.requestPermission()
  if(permission!=='granted')return toast('Permiso no concedido')
  try{
    const reg=await navigator.serviceWorker.ready
    if(VAPID_PUBLIC_KEY&&reg.pushManager){
      const existing=await reg.pushManager.getSubscription()
      const sub=existing||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)})
      await fetch('/api/push-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player_key:state.profile.player_key,subscription:sub.toJSON()})})
      toast('Alertas push activadas 🔔')
    }else toast('Alertas del navegador activadas 🔔')
  }catch{toast('Alertas activadas; push cerrado requiere configuración VAPID')}
}
function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function showBrowserNotification(title,body){if(Notification.permission!=='granted')return;try{const reg=await navigator.serviceWorker.ready;reg.active?.postMessage({type:'KORA_SIGNAL',title,body})}catch{try{new Notification(title,{body})}catch{}}}

// ---------- DUO REALTIME ----------
function roomPlayer(){return {player_key:state.profile.player_key,name:state.profile.display_name,device:deviceId,role:state.room.role}}
function roomPlayers(){const m=state.room.channel?.presenceState?.()||{};return Object.values(m).flat().map(x=>x)}
async function connectRoom(role,code){
  if(!supabase)return toast('Supabase no está configurado.')
  let cached=null;try{cached=role==='host'?JSON.parse(localStorage.getItem(`koraverse_v3_host_${code}`)||'null'):null}catch{}
  await leaveRoom(false,{keepHostCache:true});state.room.code=code;state.room.role=role;state.room.game=cached||freshDuoGame();localStorage.setItem(ROOM_KEY,JSON.stringify({code,role}))
  history.replaceState({},'',`${location.pathname}?room=${code}`)
  const ch=supabase.channel(`koraverse-room-v3-${code}`,{config:{presence:{key:`${state.profile.player_key}:${deviceId}`},broadcast:{self:true}}});state.room.channel=ch
  ch.on('presence',{event:'sync'},()=>{state.room.players=roomPlayers();if(state.screen.startsWith('duo'))renderDuoScreen()})
    .on('broadcast',{event:'state'},({payload})=>{if(state.room.role!=='host'){state.room.game=payload.game;renderDuoScreen()}})
    .on('broadcast',{event:'need_state'},()=>{if(state.room.role==='host')broadcastGame()})
    .on('broadcast',{event:'action'},({payload})=>onRoomAction(payload))
    .on('broadcast',{event:'trivia_answer'},({payload})=>onTriviaAnswer(payload))
    .on('broadcast',{event:'brain_answer'},({payload})=>onBrainAnswer(payload))
    .on('broadcast',{event:'mission_validate'},({payload})=>onMissionValidate(payload))
    .on('broadcast',{event:'sudoku_cell'},({payload})=>onDuoSudokuCell(payload))
    .on('broadcast',{event:'case_hit'},({payload})=>onDuoCaseHit(payload))
    .on('broadcast',{event:'boss_hit'},({payload})=>onDuoBossHit(payload))
    .on('broadcast',{event:'arcade_hit'},()=>{if(state.invaders?.duo){state.invaders.shared++;const el=document.querySelector('#sharedHits');if(el)el.textContent=state.invaders.shared}})
    .on('broadcast',{event:'xp_award'},({payload})=>onXpAward(payload))
  await new Promise(resolve=>ch.subscribe(async status=>{if(status==='SUBSCRIBED'){state.room.connected=true;await ch.track(roomPlayer());resolve()}}))
  state.screen='duo-lobby';if(role==='guest')sendRoom('need_state',{});renderDuoScreen()
}
async function leaveRoom(render=true,{keepHostCache=false}={}){const oldCode=state.room.code,oldRole=state.room.role;if(state.room.channel&&supabase)await supabase.removeChannel(state.room.channel);state.room={code:null,role:null,channel:null,players:[],connected:false,game:freshDuoGame()};localStorage.removeItem(ROOM_KEY);if(!keepHostCache&&oldCode&&oldRole==='host')localStorage.removeItem(`koraverse_v3_host_${oldCode}`);history.replaceState({},'',location.pathname);if(render)renderHome()}
async function sendRoom(event,payload){if(state.room.channel)await state.room.channel.send({type:'broadcast',event,payload:{...payload,player_key:state.profile.player_key,name:state.profile.display_name,ts:Date.now()}})}
async function grantDuoPlayerXP(players,amount,source){if(state.room.role!=='host')return;for(const target of players)await sendRoom('xp_award',{target,amount,source});await awardDuoXP(Math.max(5,Math.round(amount*.7)))}
async function onXpAward(p){if(!p||p.target!==state.profile.player_key)return;await awardXP(Number(p.amount||0),'duo',p.source||'Duo Realm',{silent:false})}
async function broadcastGame(){state.room.game.updatedAt=Date.now();if(state.room.role==='host'&&state.room.code)localStorage.setItem(`koraverse_v3_host_${state.room.code}`,JSON.stringify(state.room.game));await state.room.channel?.send({type:'broadcast',event:'state',payload:{game:state.room.game}});renderDuoScreen()}
async function requestDuoAction(action,data={}){if(state.room.role==='host')return applyDuoAction(action,data);sendRoom('action',{action,data})}
function onRoomAction(p){if(state.room.role==='host'&&p?.action)applyDuoAction(p.action,p.data||{})}
function activeDuoPlayers(){return [...new Set(state.room.players.map(p=>p.player_key))].slice(0,2)}

async function openDuoEntry(){
  const pre=new URLSearchParams(location.search).get('room')?.toUpperCase()||''
  app.innerHTML=shell(`<section class="duo-entry"><div class="duo-entry-copy"><small>DUO REALM</small><h1>Two screens.<br>Same dimension.</h1><p>Crea una sala privada o entra con el código que te enviaron.</p></div><div class="duo-entry-panels"><div class="room-create glass"><span>✨</span><h3>Create universe</h3><p>Genera un código nuevo y compártelo.</p><button class="btn-v3 primary" data-action="create-room">Crear partida</button></div><div class="room-create glass"><span>🔗</span><h3>Join universe</h3><p>Entra a una sala existente.</p><input id="joinCode" class="input-v3 code" maxlength="6" value="${esc(pre)}" placeholder="ABC123"><button class="btn-v3 soft" data-action="join-room">Entrar</button></div></div></section>`,{world:'duo',back:{action:'home',label:'Command Center'}})
}
function renderDuoScreen(){
  const g=state.room.game;state.screen=`duo-${g.screen}`
  if(g.screen==='lobby')return renderDuoLobby();if(g.screen==='hub')return renderDuoHub();if(g.mode==='trivia')return renderDuoTrivia();if(g.mode==='brain')return renderDuoBrain();if(g.mode==='mission')return renderDuoMission();if(g.mode==='sudoku')return renderDuoSudoku();if(g.mode==='cases')return renderDuoCases();if(g.mode==='garden')return renderDuoGarden();renderDuoHub()
}
function renderDuoLobby(){const players=state.room.players;const unique=[];players.forEach(p=>{if(!unique.find(x=>x.player_key===p.player_key))unique.push(p)});const ready=unique.length>=2;const invite=`${location.origin}${location.pathname}?room=${state.room.code}`;app.innerHTML=shell(`<section class="duo-lobby"><div class="lobby-code"><small>PRIVATE ROOM</small><h1>${state.room.code}</h1><p>Comparte el enlace. No hace falta estar en la misma red.</p><div class="copy-link"><code>${esc(invite)}</code><button data-action="copy-room">Copy</button></div></div><div class="player-dock">${unique.map((p,i)=>`<div class="duo-player ${i===0?'p1':'p2'}"><span>${esc(p.name[0].toUpperCase())}</span><b>${esc(p.name)}</b><small>${p.role==='host'?'HOST':'PLAYER 2'}</small><i></i></div>`).join('')}${!ready?`<div class="duo-player empty"><span>?</span><b>Waiting...</b><small>PLAYER 2</small></div>`:''}</div><div class="lobby-status ${ready?'ready':''}"><i></i>${ready?'KORAVERSE LINK ESTABLISHED':'Waiting for accomplice...'}</div>${state.room.role==='host'?`<button class="btn-v3 primary big-btn ${ready?'':'disabled'}" data-action="duo-start">${ready?'ENTER DUO UNIVERSE':'WAITING...'}</button>`:`<div class="wait-copy">El anfitrión abrirá el universo cuando ambos estén conectados.</div>`}</section>`,{world:'duo',back:{action:'leave-room',label:'Salir'}})}
function renderDuoHub(){app.innerHTML=shell(`<section class="duo-hub-hero"><div><small>DUO REALM · ${state.room.code}</small><h1>Connected.</h1><p>Elijan algo. Cualquiera puede tocar una actividad; el host mantiene el estado sincronizado.</p></div><button class="btn-v3 signal" data-action="new-duo-room">↻ Nueva partida</button></section><div class="activity-grid duo-grid"><button class="activity-card" data-action="duo-game" data-game="trivia"><span>🎬</span><i>DUO</i><h3>Trivia Realm</h3><p>Respuestas ocultas hasta que ambos eligen.</p><b>PLAY →</b></button><button class="activity-card" data-action="duo-game" data-game="brain"><span>🧠</span><i>DUO</i><h3>Same Brain</h3><p>¿Piensan igual o fue pura propaganda?</p><b>PLAY →</b></button><button class="activity-card" data-action="duo-game" data-game="mission"><span>🕵️</span><i>OFFICE</i><h3>Mission Control</h3><p>Uno hace el reto; el otro valida.</p><b>PLAY →</b></button><button class="activity-card" data-action="duo-game" data-game="sudoku"><span>🔢</span><i>CO-OP</i><h3>Sudoku Duo</h3><p>Un tablero compartido. Dos cerebros.</p><b>PLAY →</b></button><button class="activity-card" data-action="duo-game" data-game="cases"><span>📁</span><i>CLASSIC+</i><h3>Case Arena</h3><p>20 casos y luego llega el Lic. Urgentísimo.</p><b>PLAY →</b></button><button class="activity-card" data-action="duo-invaders"><span>🚀</span><i>DUO RAID</i><h3>Case Invaders</h3><p>Cada uno pilota su nave. Los impactos se suman.</p><b>PLAY →</b></button><button class="activity-card" data-action="duo-game" data-game="garden"><span>🌷</span><i>REWARD</i><h3>The Garden</h3><p>${state.room.game.gardenUnlocked?'Desbloqueado.':'Derroten al boss para desbloquearlo.'}</p><b>OPEN →</b></button></div>`,{world:'duo',back:{action:'leave-room',label:'Salir de sala'}})}

function applyDuoAction(action,data){const g=state.room.game;const players=activeDuoPlayers();if(action==='start'){g.screen='hub';g.mode=null}else if(action==='hub'){g.screen='hub';g.mode=null}else if(action==='trivia'){const cat=data.cat||random(Object.keys(triviaBank)),q=random(triviaBank[cat]);g.screen='game';g.mode='trivia';g.round++;g.trivia={cat,q};g.answers={};g.result=null}else if(action==='brain'){g.screen='game';g.mode='brain';g.round++;g.brain=random(sameBrain);g.brainAnswers={};g.brainResult=null}else if(action==='mission'){g.screen='game';g.mode='mission';g.round++;const assignee=random(players),validator=players.find(x=>x!==assignee)||assignee;g.mission={text:random(missions),assignee,validator,status:'pending'}}else if(action==='sudoku'){const p=sudokuPuzzles[0];g.screen='game';g.mode='sudoku';g.round++;g.sudokuId=p.id;g.sudokuBoard=p.puzzle.split('').map(Number);g.sudokuFixed=p.puzzle.split('').map(x=>x!=='0');g.sudokuStatus=null}else if(action==='cases'){g.screen='game';g.mode='cases';g.round++;g.casePhase='cases';g.caseCount=0;g.bossHP=100}else if(action==='garden'){if(!g.gardenUnlocked)return toast('The Garden sigue dormido.');g.screen='game';g.mode='garden'}broadcastGame()}

function renderDuoTrivia(){const g=state.room.game,q=g.trivia.q;const mine=g.answers[state.profile.player_key];const result=g.result;app.innerHTML=shell(`<section class="duo-game-head"><button data-action="duo-hub">← Duo Realm</button><span>${g.trivia.cat.toUpperCase()} · ROUND ${g.round}</span><span>${Object.keys(g.answers).length}/2 LOCKED</span></section><div class="duo-question glass-xl"><small>TRIVIA REALM</small><h1>${esc(q.q)}</h1><div class="trivia-options">${q.a.map((a,i)=>`<button data-action="duo-trivia-answer" data-index="${i}" class="${mine===i?'locked':''} ${result&&q.c===i?'correct':''}"><span>${String.fromCharCode(65+i)}</span>${esc(a)}</button>`).join('')}</div>${mine!=null&&!result?'<div class="answer-lock">🔒 Answer locked. Waiting for the other dimension...</div>':''}${result?`<div class="duo-result"><b>${result.both?'DUO PERFECT ✨':'REVEAL'}</b><p>${result.text}</p><button class="btn-v3 primary" data-action="duo-game" data-game="trivia">Next round</button></div>`:''}</div>`,{world:'duo'})}
async function onTriviaAnswer(p){if(state.room.role!=='host'||state.room.game.mode!=='trivia'||p.round!==state.room.game.round)return;const g=state.room.game;if(g.answers[p.player_key]!=null)return;g.answers[p.player_key]=p.index;const players=activeDuoPlayers();if(players.length>=2&&players.every(k=>g.answers[k]!=null)){const c=g.trivia.q.c;const correct=players.filter(k=>g.answers[k]===c);g.result={both:correct.length===2,text:players.map(k=>`${k}: ${g.answers[k]===c?'correcta ✅':'incorrecta'}`).join(' · ')};grantDuoPlayerXP(correct,20,'Trivia Duo');if(correct.length===2)awardDuoXP(12)}broadcastGame()}

function renderDuoBrain(){const g=state.room.game,mine=g.brainAnswers[state.profile.player_key],result=g.brainResult;app.innerHTML=shell(`<section class="duo-game-head"><button data-action="duo-hub">← Duo Realm</button><span>SAME BRAIN · ROUND ${g.round}</span><span>${Object.keys(g.brainAnswers).length}/2 LOCKED</span></section><div class="duo-question glass-xl"><small>SYNC MODE EVOLVED</small><h1>${esc(g.brain.q)}</h1><div class="brain-options">${g.brain.o.map((o,i)=>`<button data-action="duo-brain-answer" data-index="${i}" class="${mine===i?'locked':''}">${esc(o)}</button>`).join('')}</div>${mine!=null&&!result?'<div class="answer-lock">🧠 Elección bloqueada. No hagas trampa.</div>':''}${result?`<div class="same-reveal ${result.same?'same':''}"><span>${result.same?'✨':'↯'}</span><b>${result.same?'SAME BRAIN':'DISTINTAS DIMENSIONES'}</b><p>${result.text}</p><button class="btn-v3 primary" data-action="duo-game" data-game="brain">Otra</button></div>`:''}</div>`,{world:'duo'})}
async function onBrainAnswer(p){if(state.room.role!=='host'||state.room.game.mode!=='brain'||p.round!==state.room.game.round)return;const g=state.room.game;if(g.brainAnswers[p.player_key]!=null)return;g.brainAnswers[p.player_key]=p.index;const ps=activeDuoPlayers();if(ps.length>=2&&ps.every(k=>g.brainAnswers[k]!=null)){const same=g.brainAnswers[ps[0]]===g.brainAnswers[ps[1]];g.brainResult={same,text:ps.map(k=>`${k}: ${g.brain.o[g.brainAnswers[k]]}`).join(' · ')};if(same)grantDuoPlayerXP(ps,15,'Same Brain')}broadcastGame()}

function renderDuoMission(){const m=state.room.game.mission,me=state.profile.player_key,assigned=me===m.assignee,validator=me===m.validator;app.innerHTML=shell(`<section class="mission-screen"><div class="mission-icon">🕵️</div><small>MISSION CONTROL · ROUND ${state.room.game.round}</small><h1>${assigned?'Your mission.':validator?'You are the validator.':'Mission in progress.'}</h1><div class="mission-card glass-xl"><p>${esc(m.text)}</p><div class="mission-roles"><span>ASSIGNEE <b>${esc(m.assignee)}</b></span><span>VALIDATOR <b>${esc(m.validator)}</b></span></div>${validator&&m.status==='pending'?`<div class="hero-buttons"><button class="btn-v3 english" data-action="mission-validate" data-ok="true">✓ Validar</button><button class="btn-v3 soft" data-action="mission-validate" data-ok="false">Todavía no</button></div>`:`<div class="answer-lock">${m.status==='pending'?'Esperando validación…':m.status==='approved'?'✅ Mission validated':'↻ Aún no validada'}</div>`}${m.status==='approved'?'<button class="btn-v3 primary" data-action="duo-hub">Back to Duo Realm</button>':''}</div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}
async function onMissionValidate(p){if(state.room.role!=='host'||state.room.game.mode!=='mission')return;const m=state.room.game.mission;if(p.player_key!==m.validator)return;m.status=p.ok?'approved':'pending';if(p.ok){grantDuoPlayerXP([m.assignee,m.validator],15,'Mission Control')}broadcastGame()}

function renderDuoSudoku(){const g=state.room.game,p=sudokuPuzzles.find(x=>x.id===g.sudokuId)||sudokuPuzzles[0];const cells=g.sudokuBoard.map((n,i)=>{const fixed=g.sudokuFixed[i],r=Math.floor(i/9),c=i%9;return `<button class="sudoku-cell ${fixed?'fixed':''} ${(c===2||c===5)?'block-r':''} ${(r===2||r===5)?'block-b':''}" data-action="duo-sudoku-cell" data-index="${i}">${n||''}</button>`}).join('');app.innerHTML=shell(`<section class="game-header"><div><small>DUO PUZZLE</small><h1>Sudoku Duo</h1><p>Selecciona una casilla y pulsa un número. Los cambios viajan a la otra pantalla.</p></div><div class="game-stat"><small>STATUS</small><b>${g.sudokuStatus||'SYNC'}</b></div></section><section class="sudoku-layout"><div class="sudoku-board" id="duoSudoku">${cells}</div><div class="sudoku-tools glass"><small>NUMBER PAD</small><div class="num-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-action="duo-sudoku-number" data-number="${n}">${n}</button>`).join('')}</div><button class="btn-v3 soft" data-action="duo-sudoku-number" data-number="0">Clear</button><button class="btn-v3 primary" data-action="duo-sudoku-check">Check together</button></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}
let duoSelectedCell=null
function onDuoSudokuCell(p){if(state.room.role!=='host'||state.room.game.mode!=='sudoku')return;const i=p.index;if(state.room.game.sudokuFixed[i])return;state.room.game.sudokuBoard[i]=p.value;broadcastGame()}
function checkDuoSudoku(){if(state.room.role!=='host')return sendRoom('action',{action:'sudoku-check',data:{}});const g=state.room.game,p=sudokuPuzzles.find(x=>x.id===g.sudokuId);const ok=g.sudokuBoard.join('')===p.solution;if(ok){g.sudokuStatus='COMPLETE ✨';g.gardenUnlocked=true;grantDuoPlayerXP(activeDuoPlayers(),60,'Sudoku Duo');confetti(60)}else g.sudokuStatus='KEEP GOING';broadcastGame()}

function renderDuoCases(){const g=state.room.game;if(g.casePhase==='boss')return renderDuoBoss();app.innerHTML=shell(`<section class="game-header"><div><small>CLASSIC CASE ARENA</small><h1>Clear the backlog.</h1><p>Ambos pueden eliminar casos. Al llegar a 20 aparece el jefe.</p></div><div class="game-stat"><small>CASES</small><b id="duoCaseCount">${g.caseCount}/20</b></div></section><div class="case-arena-v3" id="caseArena"></div>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}});spawnDuoCases()}
function spawnDuoCases(){const arena=document.querySelector('#caseArena');if(!arena||state.room.game.casePhase!=='cases')return;for(let i=0;i<8;i++){const b=document.createElement('button');b.className='floating-case';b.textContent=random(['INC-204','REQ-118','URG-313','REV-009','FAVOR VALIDAR']);b.style.left=(4+Math.random()*80)+'%';b.style.top=(5+Math.random()*78)+'%';b.onclick=()=>{b.remove();sendRoom('case_hit',{round:state.room.game.round,id:crypto.randomUUID()});setTimer(()=>{if(document.querySelector('#caseArena'))spawnOneCase()},250)};arena.appendChild(b)}}
function spawnOneCase(){const a=document.querySelector('#caseArena');if(!a)return;const b=document.createElement('button');b.className='floating-case';b.textContent=random(['INC-204','REQ-118','URG-313','REV-009']);b.style.left=(4+Math.random()*80)+'%';b.style.top=(5+Math.random()*78)+'%';b.onclick=()=>{b.remove();sendRoom('case_hit',{round:state.room.game.round,id:crypto.randomUUID()});setTimer(spawnOneCase,200)};a.appendChild(b)}
function onDuoCaseHit(p){if(state.room.role!=='host'||state.room.game.mode!=='cases'||state.room.game.casePhase!=='cases'||p.round!==state.room.game.round)return;state.room.game.caseCount++;if(state.room.game.caseCount>=20){state.room.game.casePhase='boss';state.room.game.bossHP=100}broadcastGame()}
function renderDuoBoss(){const g=state.room.game;app.innerHTML=shell(`<section class="boss-v3"><div class="boss-header"><small>BOSS FINAL</small><h1>Lic. Urgentísimo</h1><p>Devuélvanle todos sus “favor validar”.</p></div><button class="boss-body" data-action="boss-hit"><span class="boss-eye e1"></span><span class="boss-eye e2"></span><span class="boss-mouth"></span><i>CLICK TO ATTACK</i></button><div class="boss-hp"><span><b>HP</b>${g.bossHP}/100</span><div><i style="width:${g.bossHP}%"></i></div></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}
function onDuoBossHit(p){if(state.room.role!=='host'||state.room.game.mode!=='cases'||state.room.game.casePhase!=='boss')return;state.room.game.bossHP=Math.max(0,state.room.game.bossHP-5);if(state.room.game.bossHP===0){state.room.game.gardenUnlocked=true;state.room.game.mode='garden';grantDuoPlayerXP(activeDuoPlayers(),70,'Lic. Urgentísimo');confetti(80)}broadcastGame()}
function renderDuoGarden(){const g=state.room.game;if(!g.gardenUnlocked)return renderDuoHub();app.innerHTML=shell(`<section class="garden-v3 duo-garden"><div class="garden-sky"><div class="sun-v3"></div><div class="cloud-v3 c1"></div><div class="cloud-v3 c2"></div></div><div class="garden-message glass"><small>DUO REWARD</small><h2>KORAVERSE restored.</h2><p>${random(gardenQuotes)}</p></div>${Array.from({length:38},()=>`<button class="flower-v3" style="--x:${3+Math.random()*94}%;--y:${3+Math.random()*40}%;--d:${Math.random()*2}s;--c:${random(['#ff8fb1','#ffe16f','#a886ff','#ffac78','#7fdca7','#6fc7ff'])}" data-action="garden-flower"></button>`).join('')}<div class="garden-ground"></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}

// ---------- EVENT DELEGATION ----------
app.addEventListener('click',async e=>{
  const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action
  if(a==='choose-profile')return chooseProfile(el.dataset.name)
  if(a==='custom-profile'){const n=document.querySelector('#customName')?.value.trim();if(n)return chooseProfile(n)}
  if(a==='home')return renderHome()
  if(a==='world')return renderWorld(el.dataset.world)
  if(a==='profile')return renderProfile()
  if(a==='switch-profile'){localStorage.removeItem(PROFILE_KEY);state.profile=null;return renderGate()}
  if(a==='sound'){state.sound=!state.sound;localStorage.setItem(SOUND_KEY,state.sound?'on':'off');toast(state.sound?'Sonido activado':'Sonido desactivado');return state.screen==='home'?renderHome():null}
  if(a==='kora-tip')return toast(random(['Moo. El backlog no se destruye solo.','English Quest disponible. No te hagas.','Si no quieres competir, The Garden no hace preguntas.','KORAVERSE recomienda una pausa de 5 minutos.']))
  if(a==='quick-play'){const actions=['case-invaders','memory','chaos','sudoku'];return app.querySelector(`[data-action="${random(actions)}"]`)?.click()||startInvaders()}
  if(a==='send-signal')return sendSignal()
  if(a==='notify-enable')return enableNotifications()
  if(a==='english-lesson')return startEnglishLesson(el.dataset.lesson)
  if(a==='english-answer')return answerEnglish(Number(el.dataset.index))
  if(a==='english-check-builder')return answerEnglish(null)
  if(a==='english-next')return nextEnglish()
  if(a==='builder-add')return addBuilderToken(Number(el.dataset.index))
  if(a==='builder-remove')return removeBuilderToken(Number(el.dataset.index))
  if(a==='sudoku')return startSudoku()
  if(a==='sudoku-cell'){state.sudoku.selected=Number(el.dataset.index);return renderSudoku()}
  if(a==='sudoku-number')return sudokuSet(Number(el.dataset.number))
  if(a==='sudoku-clear')return sudokuSet(0)
  if(a==='sudoku-check')return checkSudoku()
  if(a==='memory')return startMemory()
  if(a==='memory-card')return flipMemory(Number(el.dataset.index))
  if(a==='chaos')return startChaos()
  if(a==='case-invaders')return startInvaders()
  if(a==='garden')return renderGarden()
  if(a==='garden-flower'){const q=document.querySelector('#gardenQuote');if(q)q.textContent=random(gardenQuotes);beep('soft');return}
  if(a==='star-drift')return starDrift()
  if(a==='coffee')return coffeeBreak()
  if(a==='classic-case'||a==='duo-sudoku')return openDuoEntry()
  if(a==='duo-entry')return state.room.connected?renderDuoHub():openDuoEntry()
  if(a==='create-room')return connectRoom('host',randomCode())
  if(a==='join-room'){const code=(document.querySelector('#joinCode')?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(code.length!==6)return toast('Introduce un código de 6 caracteres');return connectRoom('guest',code)}
  if(a==='copy-room'){await navigator.clipboard.writeText(`${location.origin}${location.pathname}?room=${state.room.code}`);return toast('Enlace copiado')}
  if(a==='leave-room')return leaveRoom()
  if(a==='duo-start')return requestDuoAction('start')
  if(a==='duo-hub')return requestDuoAction('hub')
  if(a==='new-duo-room'){if(state.room.role!=='host')return toast('Solo el host puede crear una nueva sala.');const old=state.room.code,code=randomCode();await sendRoom('action',{action:'new_room',data:{code}});if(old)localStorage.removeItem(`koraverse_v3_host_${old}`);return connectRoom('host',code)}
  if(a==='duo-game')return requestDuoAction(el.dataset.game)
  if(a==='duo-trivia-answer')return sendRoom('trivia_answer',{round:state.room.game.round,index:Number(el.dataset.index)})
  if(a==='duo-brain-answer')return sendRoom('brain_answer',{round:state.room.game.round,index:Number(el.dataset.index)})
  if(a==='mission-validate')return sendRoom('mission_validate',{ok:el.dataset.ok==='true'})
  if(a==='duo-sudoku-cell'){duoSelectedCell=Number(el.dataset.index);document.querySelectorAll('.sudoku-cell').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');return}
  if(a==='duo-sudoku-number'){if(duoSelectedCell==null)return toast('Selecciona una casilla');return sendRoom('sudoku_cell',{index:duoSelectedCell,value:Number(el.dataset.number)})}
  if(a==='duo-sudoku-check')return checkDuoSudoku()
  if(a==='boss-hit'){beep('soft');return sendRoom('boss_hit',{round:state.room.game.round})}
  if(a==='duo-invaders')return startInvaders({duo:true})
})

// handle special host actions not covered above
const _onRoomAction=onRoomAction
onRoomAction=function(p){
  if(p?.action==='new_room'&&state.room.role==='guest'&&p.data?.code){return connectRoom('guest',p.data.code)}
  if(p?.action==='sudoku-check'&&state.room.role==='host'){return checkDuoSudoku()}
  return _onRoomAction(p)
}

init()
