import { createClient } from '@supabase/supabase-js'
import { Chess } from './chess-engine.js'
import './style.css'
import {
  triviaBank, sameBrain, missions, gardenQuotes, englishCurriculum,
  bundledEnglishExercises, sudokuPuzzles, memoryIcons, achievements,
  avatarCatalog, coffeeActions, quietLibrary
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
const LANG_KEY = 'koraverse_v41_lang'
const THEME_KEY = 'koraverse_v41_theme'
const CHAT_CLEAR_PREFIX = 'koraverse_v41_chat_clear_'
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
  lang: localStorage.getItem(LANG_KEY) || 'es',
  theme: localStorage.getItem(THEME_KEY) || 'nebula',
  pendingSignal: null,
  social: { channel:null, presence:{}, messages:[], open:false, loaded:false, unread:0, typing:null },
  activity: [],
  sketch: { color:'#f7f8fb', size:5, eraser:false },
  chess: { guide:null, selected:null, hints:[], lessonStep:0 },
  discreet: false,
  soloTrivia: { category:null, queue:[], index:0, score:0, streak:0, answered:false, selected:null },
  mood: null,
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
    gardenUnlocked: false,
    chessFen: null, chessHistory: [], chessStatus: null, chessWhite: null, chessBlack: null, chessLastMove: null,
    updatedAt: Date.now(),
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


const UI = {
  es:{
    arcade:'Arcade', puzzles:'Puzzle Lab', trivia:'Trivia', english:'English Lab', duo:'Duo Realm', chill:'Chill',
    messages:'Mensajes', profile:'Perfil', welcome:'Bienvenido de nuevo', five:'Tengo 5 minutos', invite:'Invitar', chat:'Chat', avatars:'Avatar Studio',
    command:'CENTRO DE MANDO', explore:'EXPLORA EL UNIVERSO', appetite:'¿Qué te apetece?', progress:'Ver mi progreso →',
    choose:'¿Quién está entrando?', enter:'Entrar', other:'Otro nombre', spanish:'Español', englishLang:'English',
    online:'En línea', offline:'Desconectado', clearChat:'Limpiar chat', sketch:'Dibujar', typing:'está escribiendo…',
    theme:'Tema del perfil', discreet:'Modo discreto', level:'Nivel', streak:'días de racha', current:'actual', collection:'COLECCIÓN'
  },
  en:{
    arcade:'Arcade', puzzles:'Puzzle Lab', trivia:'Trivia', english:'English Lab', duo:'Duo Realm', chill:'Chill',
    messages:'Messages', profile:'Profile', welcome:'Welcome back', five:'I have 5 minutes', invite:'Invite', chat:'Chat', avatars:'Avatar Studio',
    command:'COMMAND CENTER', explore:'EXPLORE THE UNIVERSE', appetite:'What are you in the mood for?', progress:'View my progress →',
    choose:'Who is entering?', enter:'Enter', other:'Other name', spanish:'Español', englishLang:'English',
    online:'Online', offline:'Offline', clearChat:'Clear chat', sketch:'Draw', typing:'is typing…',
    theme:'Profile theme', discreet:'Discreet mode', level:'Level', streak:'day streak', current:'current', collection:'COLLECTION'
  }
}
const tr = key => UI[state.lang]?.[key] || UI.es[key] || key
const THEME_IDS=['nebula','midnight','aurora','rose','garden','retro','writers','coffee']
function applyTheme(){
  const id=state.profile?.theme_id || state.theme || 'nebula'
  document.documentElement.dataset.theme=id
  document.documentElement.lang=state.lang
  state.theme=id
}
function chatLimpiarCutoff(){return Number(localStorage.getItem(CHAT_CLEAR_PREFIX+(state.profile?.player_key||'anon'))||0)}
function rerenderPrimary(){applyTheme(); if(!state.profile)return renderGate(); if(state.screen==='profile')return renderProfile(); if(state.screen==='avatars')return renderAvatarStudio(); return renderHome()}

const avatarById = id => avatarCatalog.find(a=>a.id===id) || avatarCatalog[0]
function avatarVisual(id, size='md'){
  const a=avatarById(id)
  return `<span class="avatar-visual ${size}" style="--avatar-accent:${a.accent}"><img src="${a.image||''}" alt="${esc(a.name)}" loading="lazy"><span class="avatar-fallback">${a.icon}</span><span class="avatar-badge">${a.badge}</span></span>`
}
function socialPresenceList(){return Object.values(state.social.presence||{}).flat()}
function partnerPresence(){const key=otherDefault();return socialPresenceList().find(x=>x.player_key===key)}
function partnerIsOnline(){return Boolean(partnerPresence())}
function partnerLabel(){const key=otherDefault();return state.profiles.find(p=>p.player_key===key)?.display_name || (key==='kora'?'Kora':'Carlos')}
function formatClock(v){try{return new Date(v).toLocaleTimeString(state.lang==='es'?'es-DO':'en-US',{hour:'2-digit',minute:'2-digit'})}catch{return ''}}

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

function starsMarkup(){return `<div class="space-bg"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="aurora a1"></div><div class="aurora a2"></div><div class="grain"></div>`}
function gateGalaxyMarkup(){
  return `${starsMarkup()}<div class="gate-nebula"></div><div class="galaxy-war">
    <span class="spacecraft ship-a"><i></i></span><span class="spacecraft ship-b"><i></i></span><span class="laser laser-a"></span><span class="laser laser-b"></span>
    <span class="alien-cow cow-a"><img src="/avatars/cow-galaxy.svg" alt=""></span><span class="alien-cow cow-b"><img src="/avatars/cow-classic.svg" alt=""></span><span class="alien-cow cow-c"><img src="/avatars/cow-coffee.svg" alt=""></span>
  </div>`
}

function xpProgress(profile=state.profile){
  const level=levelFromXP(profile?.xp||0); const start=levelFloor(level), end=levelCeil(level); const pct=clamp(((profile?.xp||0)-start)/(end-start)*100,0,100)
  return {level,start,end,pct,next:end-(profile?.xp||0)}
}

function profileMini(){
  if(!state.profile) return ''
  const p=xpProgress();
  return `<button class="profile-mini" data-action="profile">
    ${avatarVisual(state.profile.avatar_id,'xs')}
    <span><b>${esc(state.profile.display_name)}</b><small>Lv. ${p.level} · ${state.profile.xp||0} XP</small></span>
  </button>`
}

function renderChatMessages(){
  const me=state.profile?.player_key
  const cutoff=chatLimpiarCutoff()
  const list=(state.social.messages||[]).filter(m=>new Date(m.created_at||0).getTime()>cutoff).slice(-80)
  if(!list.length) return `<div class="chat-empty"><span>✦</span><b>${state.lang==='es'?'Dimensión tranquila.':'Silencio dimension.'}</b><p>${state.lang==='es'?'Escribe algo, manda una señal o crea un dibujo.':'Write something, send a signal or make a drawing.'}</p></div>`
  return list.map(m=>{
    const mine=m.from_player===me
    const special=m.kind&&m.kind!=='text'
    const sketch=m.kind==='sketch'&&(m.metadata?.url||m.metadata?.data_url)
    return `<div class="chat-message ${mine?'mine':'theirs'} ${special?'special':''}">
      <div class="chat-bubble">${special&&m.kind!=='sketch'?`<small>${m.kind==='coffee_invite'?'COFFEE SIGNAL':'KORA SIGNAL'}</small>`:''}
      ${sketch?`<div class="chat-sketch"><img src="${esc(sketch)}" alt="Dibujo compartido"><span>🎨 ${esc(m.body||'Mira lo que dibujé')}</span></div>`:`<p>${esc(m.body)}</p>`}<time>${formatClock(m.created_at||Date.now())}</time></div>
    </div>`
  }).join('')
}
function socialDockMarkup(){
  if(!state.profile)return ''
  const pp=partnerPresence(), online=Boolean(pp), label=partnerLabel(), av=state.profiles.find(p=>p.player_key===otherDefault())?.avatar_id||pp?.avatar_id||'cow-classic'
  return `<button class="social-fab ${online?'online':''}" data-action="chat-toggle" title="${tr('messages')}">
    <span>💬</span>${state.social.unread?`<i>${Math.min(9,state.social.unread)}</i>`:''}
  </button>
  <aside id="socialPanel" class="social-panel ${state.social.open?'open':''}">
    <div class="social-head">
      <div class="social-person">${avatarVisual(av,'sm')}<div><b>${esc(label)}</b><small id="socialPresenceText"><i class="presence-dot ${online?'on':''}"></i>${online?`${tr('online')}${pp?.screen?` · ${esc(pp.screen)}`:''}`:tr('offline')}</small></div></div>
      <div class="chat-head-actions"><button data-action="sketch-pad" title="${tr('sketch')}">🎨</button><button data-action="chat-clear" title="${tr('clearChat')}">🧹</button><button data-action="chat-toggle">×</button></div>
    </div>
    <div class="social-quick">
      <button data-action="send-signal">✨ ¿Jugamos?</button>
      <button data-action="coffee-invite" data-coffee="coffee">☕ Café</button>
      <button data-action="quick-chat" data-message="¿Ajedrez? ♟️">♟️ Ajedrez</button>
      <button data-action="quick-chat" data-message="¿Sudoku? 🧩">🧩 Sudoku</button>
    </div>
    <div class="social-messages" id="socialMessages">${renderChatMessages()}</div>
    <div id="typingLine" class="typing-line ${state.social.typing?'show':''}">${state.social.typing?`${esc(label)} ${tr('typing')}`:''}</div>
    <div class="chat-compose"><button class="sketch-mini" data-action="sketch-pad">✎</button><input id="chatInput" maxlength="240" placeholder="${state.lang==='es'?'Escribe un mensaje…':'Write a message…'}"><button data-action="chat-send">↑</button></div>
  </aside>`
}
function refreshSocialDock(){
  const panel=document.querySelector('#socialPanel'), pp=partnerPresence(), label=partnerLabel()
  const presence=document.querySelector('#socialPresenceText')
  if(presence) presence.innerHTML=`<i class="presence-dot ${pp?'on':''}"></i>${pp?`${tr('online')}${pp.screen?` · ${esc(pp.screen)}`:''}`:tr('offline')}`
  const msgs=document.querySelector('#socialMessages'); if(msgs){msgs.innerHTML=renderChatMessages();msgs.scrollTop=msgs.scrollHeight}
  const fab=document.querySelector('.social-fab');if(fab){fab.classList.toggle('online',Boolean(pp));const old=fab.querySelector('i');if(old)old.remove();if(state.social.unread){const i=document.createElement('i');i.textContent=Math.min(9,state.social.unread);fab.appendChild(i)}}
  const typing=document.querySelector('#typingLine');if(typing){typing.classList.toggle('show',Boolean(state.social.typing));typing.textContent=state.social.typing?`${partnerLabel()} ${tr('typing')}`:''}
}
function updatePresence(screen=state.screen){
  if(!state.social.channel||!state.profile)return
  state.social.channel.track({player_key:state.profile.player_key,name:state.profile.display_name,avatar_id:state.profile.avatar_id||'cow-classic',screen,at:Date.now()}).catch(()=>{})
}
async function loadChatMessages(){
  if(state.social.loaded||!state.profile)return
  state.social.loaded=true
  if(!state.dbReady)return
  try{
    const {data}=await supabase.from('koraverse_messages').select('*').order('created_at',{ascending:false}).limit(100)
    const me=state.profile.player_key, other=otherDefault()
    const cutoff=chatLimpiarCutoff();state.social.messages=(data||[]).filter(m=>((m.from_player===me&&m.to_player===other)||(m.from_player===other&&m.to_player===me))&&new Date(m.created_at||0).getTime()>cutoff).reverse()
  }catch{}
}
function receiveChatMessage(msg){
  if(!msg||!state.profile)return
  const me=state.profile.player_key, other=otherDefault()
  if(!((msg.from_player===me&&msg.to_player===other)||(msg.from_player===other&&msg.to_player===me)))return
  if(msg.id&&state.social.messages.some(x=>x.id===msg.id))return
  state.social.messages.push(msg)
  if(msg.from_player!==me&&!state.social.open){state.social.unread++;toast(msg.kind==='coffee_invite'?msg.body:`${partnerLabel()}: ${msg.body}`,'signal');beep('signal')}
  refreshSocialDock()
}
async function setupSocialLayer(){
  if(!supabase||!state.profile)return
  if(state.social.channel)await supabase.removeChannel(state.social.channel)
  state.social.loaded=false
  const ch=supabase.channel('koraverse-social-v4',{config:{presence:{key:`${state.profile.player_key}:${deviceId}`},broadcast:{self:false}}})
  state.social.channel=ch
  ch.on('presence',{event:'sync'},()=>{state.social.presence=ch.presenceState()||{};refreshSocialDock()})
    .on('broadcast',{event:'chat_message'},({payload})=>receiveChatMessage(payload))
    .on('broadcast',{event:'typing'},({payload})=>{if(payload?.from!==state.profile.player_key){state.social.typing=payload?.active?payload.from:null;refreshSocialDock();if(payload?.active)setTimer(()=>{state.social.typing=null;refreshSocialDock()},1800)}})
  await new Promise(resolve=>ch.subscribe(async status=>{if(status==='SUBSCRIBED'){await updatePresence(state.screen);resolve()}}))
  await loadChatMessages();refreshSocialDock()
}
async function sendChatMessage(body,kind='text',metadata={}){
  body=String(body||'').trim();if(!body||!state.profile)return
  const row={from_player:state.profile.player_key,to_player:otherDefault(),body,kind,metadata,created_at:new Date().toISOString()}
  let saved=row
  if(state.dbReady){try{const {data}=await supabase.from('koraverse_messages').insert(row).select().single();if(data)saved=data}catch{}}
  receiveChatMessage(saved)
  await state.social.channel?.send({type:'broadcast',event:'chat_message',payload:saved})
}
async function toggleChat(){
  await loadChatMessages();state.social.open=!state.social.open;if(state.social.open)state.social.unread=0
  const p=document.querySelector('#socialPanel');if(p)p.classList.toggle('open',state.social.open)
  refreshSocialDock();if(state.social.open)setTimer(()=>document.querySelector('#chatInput')?.focus(),120)
}

async function sendTyping(active=true){
  if(!state.social.channel||!state.profile)return
  await state.social.channel.send({type:'broadcast',event:'typing',payload:{from:state.profile.player_key,active,ts:Date.now()}}).catch(()=>{})
}
function clearChatForMe(){
  if(!confirm(state.lang==='es'?'¿Limpiar el chat de esta pantalla? Los mensajes no se borrarán para la otra persona.':'Clear this chat view? Messages will not be deleted for the other person.'))return
  localStorage.setItem(CHAT_CLEAR_PREFIX+state.profile.player_key,String(Date.now()));state.social.messages=[];state.social.unread=0;refreshSocialDock();toast(state.lang==='es'?'Chat limpio para ti.':'Chat cleared for you.')
}

function shell(content,{world='home',back=null}={}){
  const connected=state.room.connected && state.room.code
  updatePresence(world);applyTheme()
  return `${starsMarkup()}<div id="toast" class="toast"></div>
  <div class="app-shell world-${world}">
    <header class="topbar-v3">
      <button class="brand-v3" data-action="home"><span class="brand-orb"></span><span>KORAVERSE<small>PREMIUM SOCIAL</small></span></button>
      <nav class="topnav">
        <button data-action="world" data-world="arcade">${tr('arcade')}</button>
        <button data-action="world" data-world="puzzles">${tr('puzzles')}</button>
        <button data-action="world" data-world="trivia">${tr('trivia')}</button>
        <button data-action="world" data-world="english">${tr('english')}</button>
        <button data-action="duo-entry">${tr('duo')}</button>
        <button data-action="world" data-world="chill">${tr('chill')}</button>
      </nav>
      <div class="top-actions">
        ${connected?`<span class="live-pill"><i></i>${state.room.code}</span>`:''}
        <span class="presence-pill ${partnerIsOnline()?'on':''}"><i></i>${esc(partnerLabel())}</span>
        <button class="lang-toggle" data-action="language" title="Idioma / Language">${state.lang==='es'?'ES':'EN'}</button>
        <button class="icon-btn chat-top" data-action="chat-toggle" title="${tr('messages')}">💬${state.social.unread?`<b>${Math.min(9,state.social.unread)}</b>`:''}</button>
        <button class="icon-btn" data-action="sound" title="Sonido">${state.sound?'🔊':'🔇'}</button>
        ${profileMini()}
      </div>
    </header>
    <main class="main-wrap">
      ${back?`<button class="back-v3" data-action="${back.action}" ${back.world?`data-world="${back.world}"`:''}>← ${back.label}</button>`:''}
      ${content}
    </main>
    ${socialDockMarkup()}
    <button class="kora-orb" data-action="kora-tip"><span>🐮</span><i></i></button>
  </div>`
}

async function init(){
  applyTheme()
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})
  const saved=localStorage.getItem(PROFILE_KEY)
  if(saved){ try{ state.profile=JSON.parse(saved) }catch{} }
  if(state.profile){
    await hydrateProfile(); await setupSignalChannel(); await setupSocialLayer(); await checkPendingSignals();
    const queryRoom=new URLSearchParams(location.search).get('room')?.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
    let savedRoom=null;try{savedRoom=JSON.parse(localStorage.getItem(ROOM_KEY)||'null')}catch{}
    if(queryRoom?.length===6){
      const role=savedRoom?.code===queryRoom?savedRoom.role:'guest'
      return connectRoom(role||'guest',queryRoom)
    }
    renderHome()
  } else {await loadGateProfiles();renderGate()}
}

async function loadGateProfiles(){
  if(!supabase)return
  try{const {data}=await supabase.from('koraverse_profiles').select('*').order('xp',{ascending:false});if(data)state.profiles=data}catch{}
}

async function detectDb(){
  if(!supabase) return false
  try{ const {error}=await supabase.from('koraverse_profiles').select('player_key').limit(1); state.dbReady=!error; return !error }catch{return false}
}

function defaultProfile(name){
  return {player_key:profileKey(name),display_name:name,xp:0,english_xp:0,puzzle_xp:0,arcade_xp:0,trivia_xp:0,duo_xp:0,streak:0,last_active:null,avatar_id:'cow-classic',theme_id:'nebula',language:'es',status_message:null,last_seen:null}
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
      const {data:activity}=await supabase.from('koraverse_activity').select('*').eq('player_key',key).order('created_at',{ascending:false}).limit(12);state.activity=activity||[]
      state.lang=state.profile.language||state.lang;state.theme=state.profile.theme_id||state.theme;localStorage.setItem(LANG_KEY,state.lang);localStorage.setItem(THEME_KEY,state.theme);applyTheme()
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
  state.profile.last_seen=new Date().toISOString()
  localStorage.setItem(PROFILE_KEY,JSON.stringify(state.profile));localStorage.setItem(`koraverse_profile_${state.profile.player_key}`,JSON.stringify(state.profile))
  if(state.dbReady){ try{await supabase.from('koraverse_profiles').upsert({...state.profile,updated_at:new Date().toISOString()})}catch{} }
  if(refresh){ const idx=state.profiles.findIndex(p=>p.player_key===state.profile.player_key);if(idx>=0)state.profiles[idx]={...state.profile};else state.profiles.push({...state.profile}) }
}

async function awardXP(amount,category='general',source='activity',{duo=false,silent=false}={}){
  if(!state.profile||amount<=0)return
  const oldLevel=levelFromXP(state.profile.xp||0)
  state.profile.xp=(state.profile.xp||0)+amount
  const field={english:'english_xp',puzzle:'puzzle_xp',arcade:'arcade_xp',trivia:'trivia_xp',duo:'duo_xp'}[category]
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
  state.screen='gate'; clearTimers();applyTheme()
  const kora=state.profiles.find(p=>p.player_key==='kora')||defaultProfile('Kora'), carlos=state.profiles.find(p=>p.player_key==='carlos')||defaultProfile('Carlos')
  app.innerHTML=`${gateGalaxyMarkup()}<div class="gate-wrap cinematic-gate">
    <div class="gate-language"><button data-action="language">${state.lang==='es'?'ES · Español':'EN · English'}</button></div>
    <div class="gate-card glass-xl">
      <div class="gate-brand"><span class="brand-orb huge"></span><div><small>${state.lang==='es'?'BIENVENIDO A':'WELCOME TO'}</small><h1>KORAVERSE</h1><p>${state.lang==='es'?'Un universo privado para jugar, aprender, crear y desaparecer cinco minutos.':'A private universe to play, learn, create and disappear for five minutes.'}</p></div></div>
      <div class="gate-question">${tr('choose')}</div>
      <div class="profile-choices premium-identities">
        <button class="identity-card kora" data-action="choose-profile" data-name="Kora">${avatarVisual(kora.avatar_id||'cow-classic','gate')}<div><b>Kora</b><small>${tr('level')} ${levelFromXP(kora.xp||0)} · ${kora.xp||0} XP</small></div></button>
        <button class="identity-card carlos" data-action="choose-profile" data-name="Carlos">${avatarVisual(carlos.avatar_id||'screen-office','gate')}<div><b>Carlos</b><small>${tr('level')} ${levelFromXP(carlos.xp||0)} · ${carlos.xp||0} XP</small></div></button>
      </div>
      <div class="or-line"><span>o</span></div>
      <div class="custom-profile"><input id="customName" class="input-v3" placeholder="${tr('other')}"><button class="btn-v3 soft" data-action="custom-profile">${tr('enter')}</button></div>
      <small class="privacy-note">${state.lang==='es'?'Tu progreso se sincroniza con el KORAVERSE.':'Your progress syncs with KORAVERSE.'}</small>
    </div>
    <div class="gate-caption">🐮 ${state.lang==='es'?'Advertencia: se han detectado vacas alienígenas en el sector.':'Warning: alien cows detected in this sector.'}</div>
  </div>`
}

async function chooseProfile(name){
  state.profile=defaultProfile(name); localStorage.setItem(PROFILE_KEY,JSON.stringify(state.profile)); await hydrateProfile(); await setupSignalChannel(); await setupSocialLayer(); await checkPendingSignals();
  const room=new URLSearchParams(location.search).get('room')?.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
  if(room?.length===6)return connectRoom('guest',room)
  renderHome()
}

function dashboardHero(){
  const p=xpProgress(); const other=otherDefault(); const otherProfile=state.profiles.find(x=>x.player_key===other)
  const daily=englishCurriculum[(new Date().getDate()-1)%englishCurriculum.length]
  const av=avatarById(state.profile.avatar_id)
  const online=partnerIsOnline()
  return `<section class="command-hero premium-home">
    <div class="hero-copy">
      <div class="eyebrow-v3"><i class="online-dot"></i> ${tr('command')} · ${new Date().toLocaleDateString(state.lang==='es'?'es-DO':'en-US',{weekday:'long',day:'numeric',month:'long'})}</div>
      <h1>${tr('welcome')},<br><span>${esc(state.profile.display_name)}.</span></h1>
      <p>${online?`${esc(partnerLabel())} está <b>${tr('online').toLowerCase()}</b> ahora mismo. `:otherProfile?`${esc(otherProfile.display_name)} está en nivel ${levelFromXP(otherProfile.xp)}. `:''}Elige una dimensión, entra cinco minutos o simplemente quédate flotando aquí.</p>
      <div class="hero-buttons"><button class="btn-v3 primary" data-action="quick-play">▶ ${tr('five')}</button><button class="btn-v3 signal" data-action="send-signal">🔔 ${tr('invite')} a ${esc(partnerLabel())}</button><button class="btn-v3 soft" data-action="chat-toggle">💬 ${tr('chat')}</button><button class="btn-v3 soft" data-action="avatar-studio">✨ ${tr('avatars')}</button></div>
      ${state.pendingSignal?`<div class="signal-banner"><span>✨</span><div><b>KORA SIGNAL recibido</b><small>${esc(state.pendingSignal.from_player)} quiere jugar contigo.</small></div><button data-action="duo-entry">Entrar</button></div>`:''}
    </div>
    <div class="planet-console premium-console">
      <div class="orbit-line o1"></div><div class="orbit-line o2"></div><div class="orbit-line o3"></div>
      <button class="planet-core morph-core" data-action="avatar-studio" aria-label="Perfil y avatar">
        <span class="planet-glow"></span>
        <span class="core-face level-face"><b>${p.level}</b><small>${tr('level').toUpperCase()}</small></span>
        <span class="core-face avatar-face">${avatarVisual(av.id,'xl')}<small>${esc(av.name)}</small></span>
        <span class="core-face status-face"><i class="status-orb ${online?'on':''}"></i><b>${online?(state.lang==='es'?'ENLACE DÚO':'DUO LINK'):(state.lang==='es'?'MODO SOLO':'SOLO MODE')}</b><small>${online?`${esc(partnerLabel())} ${tr('online').toUpperCase()}`:`${state.profile.xp} XP`}</small></span>
        <span class="core-face xp-face"><b>${state.profile.xp}</b><small>XP TOTAL</small></span>
        <span class="core-face streak-face"><b>🔥 ${state.profile.streak||1}</b><small>${tr('streak').toUpperCase()}</small></span>
      </button>
      <button class="satellite s1" data-action="world" data-world="english">🇬🇧<span>English</span></button>
      <button class="satellite s2" data-action="world" data-world="arcade">🚀<span>Arcade</span></button>
      <button class="satellite s3" data-action="world" data-world="puzzles">🧩<span>Puzzles</span></button>
      <button class="satellite s4" data-action="world" data-world="chill">🌿<span>Chill</span></button>
      <button class="satellite s5" data-action="world" data-world="trivia">🎬<span>Trivia</span></button>
    </div>
  </section>
  <section class="dashboard-strip">
    <div class="xp-card glass"><div class="xp-ring" style="--p:${p.pct}%"><span>${p.level}</span></div><div><small>TU PROGRESO</small><b>${state.profile.xp} XP</b><p>${p.next} XP para nivel ${p.level+1}</p></div></div>
    <button class="daily-card glass" data-action="english-lesson" data-lesson="${daily.id}"><span>${daily.icon}</span><div><small>DAILY ENGLISH · ${daily.level}</small><b>${daily.title}</b><p>4 min · +XP · ${daily.subtitle}</p></div><i>→</i></button>
    <button class="garden-card glass" data-action="coffee"><span>☕</span><div><small>COFFEE SIGNAL</small><b>${online?`${esc(partnerLabel())} está online`:'Mini break?'}</b><p>Invita a café, paseo o simplemente a hablar.</p></div><i>→</i></button>
  </section>`
}

function worldPreview(){
  return `<section class="section-block"><div class="section-title"><div><small>${tr('explore')}</small><h2>${tr('appetite')}</h2></div><button class="text-btn" data-action="profile">${tr('progress')}</button></div>
  <div class="world-grid premium-world-grid">
    ${worldCard('🚀','ARCADE','Caso cerrado. Literalmente.','Case Invaders, Memory, Caos y clásicos.','arcade','#ff7fb0')}
    ${worldCard('🧩','LABORATORIO DE PUZZLES','Para cuando el cerebro pide otra cosa.','Sudoku, lógica y memoria.','puzzles','#56c8ff')}
    ${worldCard('🎬','TRIVIA UNIVERSE','Solo o en dúo.','Game of Thrones, Marvel, series, cine y Mix.','trivia','#ffd56a')}
    ${worldCard('🇬🇧','ENGLISH LAB','Aprende sin sentir que estás estudiando.','Ruta A1 → A2 → B1 y quest diario.','english','#7ce3a7')}
    ${worldCard('🤝','DUO REALM','Dos pantallas. Una dimensión.','Trivia, Same Brain, Sudoku Duo y boss.','duo','#8b7cff')}
    ${worldCard('🌿','ZONA CHILL','Nada que demostrar aquí.','Garden, café, lluvia, lectura y pausas.','chill','#9ee7c1')}
  </div></section>`
}
function worldCard(icon,kicker,title,desc,world,color){return `<button class="world-card" style="--accent:${color}" data-action="${world==='duo'?'duo-entry':'world'}" ${world!=='duo'?`data-world="${world}"`:''}><span class="world-icon">${icon}</span><small>${kicker}</small><h3>${title}</h3><p>${desc}</p><i>${state.lang==='es'?'EXPLORAR':'EXPLORE'} ↗</i></button>`}

function podiumBlock(){
  const list=[...state.profiles]; if(!list.find(p=>p.player_key===state.profile.player_key))list.push(state.profile)
  list.sort((a,b)=>(b.xp||0)-(a.xp||0)); while(list.length<2){const k=list[0]?.player_key==='carlos'?'kora':'carlos';list.push(defaultProfile(k==='kora'?'Kora':'Carlos'))}
  return `<section class="section-block podium-section"><div class="section-title"><div><small>PODIO DE EXPERIENCIA</small><h2>La carrera más innecesariamente seria.</h2></div><span class="duo-level">DUO XP · ${state.duoStats.xp||0}</span></div>
    <div class="podium-wrap">
      ${list.slice(0,2).map((p,i)=>`<div class="podium-player rank-${i+1}"><div class="crown">${i===0?'👑':'✦'}</div><div class="pod-avatar premium-pod">${avatarVisual(p.avatar_id,'lg')}</div><b>${esc(p.display_name)}</b><small>Lv. ${levelFromXP(p.xp||0)}</small><strong>${p.xp||0} XP</strong><div class="pod-base"><span>#${i+1}</span></div></div>`).join('')}
      <div class="podium-side glass"><small>PROGRESO DUO</small><b>Level ${levelFromXP(state.duoStats.xp||0)}</b><div class="bar"><i style="width:${xpProgress({xp:state.duoStats.xp||0}).pct}%"></i></div><p>Cuando juegan juntos, ambos ganan XP personal y el universo gana Duo XP.</p></div>
    </div>
  </section>`
}

function renderHome(){
  state.screen='home'; clearTimers(); app.innerHTML=shell(`${dashboardHero()}${worldPreview()}${podiumBlock()}`,{world:'home'})
}

function renderWorld(world){
  clearTimers(); state.screen=world
  if(world==='trivia') return renderTriviaHub()
  const map={
    arcade:{eyebrow:'DISTRITO ARCADE',title:'Destruye el backlog.',sub:'Juegos rápidos, combos y una cantidad sospechosa de expedientes.',cards:[
      ['🚀','Case Invaders','Navecita + casos + láser. Era inevitable.','case-invaders','SOLO / DUO'],
      ['🧠','Memory Reactor','Encuentra pares y encadena combos.','memory','SOLO'],
      ['⚡',state.lang==='es'?'Caos de 30 segundos':'30 Second Chaos','Treinta segundos. Cero dignidad.','chaos','SOLO'],
      ['📁','Classic Case Arena','El minijuego original evolucionado.','classic-case','DUO'],
    ]},
    puzzles:{eyebrow:'LABORATORIO DE PUZZLES',title:'Silencio. El cerebro está jugando.',sub:'Puzzles relajantes para perder el tiempo con propósito.',cards:[
      ['🔢','Sudoku','Relax, Normal y Focus.','sudoku','SOLO'],
      ['🤝','Sudoku Duo','El mismo tablero, dos cursores, una solución.','duo-sudoku','DUO'],
      ['♟️','Chess Duo Lab','Ajedrez para dos con modo Guíame para aprender.','chess-duo','DUO'],
      ['🧠','Memory Reactor','También cuenta como ejercicio mental.','memory','SOLO'],
    ]},
    english:{eyebrow:'ENGLISH LAB',title:'Lecciones pequeñas. Progreso real.',sub:'Fundamentos concretos, sesiones de 3–8 minutos y práctica diaria.',cards:[]},
    chill:{eyebrow:'ZONA CHILL',title:'Aquí no hay backlog.',sub:'Una zona para estar, no necesariamente para ganar.',cards:[
      ['🌷','The Garden','Toca flores, lee algo tranquilo y sal cuando quieras.','garden','SOLO'],
      ['🌌','Star Drift','Una pausa visual de dos minutos.','star-drift','SOLO'],
      ['☕','Coffee Break','Invita a café, paseo, postre o conversación.','coffee','SOCIAL'],
      ['🎨','Sketch Pad','Dibuja algo y envíalo al chat con un clic.','sketch-pad','SOCIAL'],
      ['🌧️','Rain Room','Lluvia digital, cero objetivos.','rain-room','RELAX'],
      ['🪐','Órbita de ánimo','Elige cómo se siente el día y cambia la atmósfera.','mood-orbit','RELAX'],
      ['📖','Silencio Library','Una frase, silencio y un rincón sin puntuación.','quiet-library','RELAX'],
    ]}
  }
  const cfg=map[world]
  if(world==='english') return renderEnglishHub()
  app.innerHTML=shell(`<section class="world-hero"><div><small>${cfg.eyebrow}</small><h1>${cfg.title}</h1><p>${cfg.sub}</p></div><div class="world-emblem">${world==='arcade'?'🚀':world==='puzzles'?'🧩':'🌿'}</div></section>
  <div class="activity-grid">${cfg.cards.map(([icon,title,desc,action,tag])=>`<button class="activity-card" data-action="${action}"><span>${icon}</span><i>${tag}</i><h3>${title}</h3><p>${desc}</p><b>OPEN →</b></button>`).join('')}</div>`,{world,back:{action:'home',label:'Command Center'}})
}

function renderTriviaHub(){
  state.screen='trivia';clearTimers()
  const cats=[
    ['got','🐉','Game of Thrones','Casas, lugares, personajes y momentos memorables.'],
    ['marvel','🦸','Marvel / Avengers','Héroes, villanos, artefactos y MCU.'],
    ['series','📺','Series famosas','Breaking Bad, Friends, Stranger Things, The Office y más.'],
    ['movies','🎬','Películas','Cine, clásicos, sagas y cultura pop.'],
    ['mix','🎲','Mix Universe','Todo mezclado. El caos correcto.'],
  ]
  app.innerHTML=shell(`<section class="world-hero trivia-hero"><div><small>TRIVIA UNIVERSE · SOLO + DUO</small><h1>Preguntas,<br>pero con estilo.</h1><p>Juega solo para ganar XP personal o entra a Duo Realm para bloquear las respuestas hasta que ambos elijan.</p></div><div class="trivia-xp-card glass"><span>🎬</span><b>${state.profile.trivia_xp||0} XP</b><small>XP DE TRIVIA</small><button class="btn-v3 signal" data-action="duo-entry">Trivia Duo →</button></div></section>
  <div class="trivia-category-grid">${cats.map(([id,icon,title,desc])=>`<button class="trivia-category" data-action="solo-trivia-start" data-cat="${id}"><span>${icon}</span><small>10 PREGUNTAS</small><h3>${title}</h3><p>${desc}</p><i>JUGAR SOLO →</i></button>`).join('')}</div>`,{world:'trivia',back:{action:'home',label:'Command Center'}})
}
function startSoloTrivia(cat='mix'){
  const all=cat==='mix'?Object.values(triviaBank).flat():triviaBank[cat]
  const queue=[...all].sort(()=>Math.random()-.5).slice(0,Math.min(10,all.length))
  state.soloTrivia={category:cat,queue,index:0,score:0,streak:0,answered:false,selected:null};renderSoloTrivia()
}
function renderSoloTrivia(){
  const t=state.soloTrivia,q=t.queue[t.index];if(!q)return finishSoloTrivia()
  state.screen='trivia-play';const label={got:'GAME OF THRONES',marvel:'MARVEL',series:'SERIES',movies:'CINE',mix:'MIX UNIVERSE'}[t.category]||'TRIVIA'
  app.innerHTML=shell(`<section class="duo-game-head"><button data-action="world" data-world="trivia">← Trivia Universe</button><span>${label} · ${t.index+1}/${t.queue.length}</span><span>🔥 ${t.streak}</span></section><div class="duo-question glass-xl solo-trivia-card"><small>TRIVIA SOLO</small><h1>${esc(q.q)}</h1><div class="trivia-options">${q.a.map((a,i)=>`<button data-action="solo-trivia-answer" data-index="${i}" class="${t.answered&&q.c===i?'correct':''} ${t.answered&&t.selected===i&&i!==q.c?'wrong':''}"><span>${String.fromCharCode(65+i)}</span>${esc(a)}</button>`).join('')}</div>${t.answered?`<div class="duo-result"><b>${t.selected===q.c?'CORRECT ✨':'REVELACIÓN'}</b><p>${t.selected===q.c?`Racha ${t.streak}. +8 XP`:`Respuesta correcta: ${esc(q.a[q.c])}`}</p><button class="btn-v3 primary" data-action="solo-trivia-next">${t.index===t.queue.length-1?'Ver resultado':'Siguiente →'}</button></div>`:''}</div>`,{world:'trivia'})
}
async function answerSoloTrivia(index){
  const t=state.soloTrivia;if(t.answered)return;const q=t.queue[t.index];t.answered=true;t.selected=index
  if(index===q.c){t.score++;t.streak++;await awardXP(8,'trivia','Trivia Solo')}else t.streak=0
  beep(index===q.c?'good':'bad');renderSoloTrivia()
}
function nextSoloTrivia(){const t=state.soloTrivia;t.index++;t.answered=false;t.selected=null;if(t.index>=t.queue.length)return finishSoloTrivia();renderSoloTrivia()}
async function finishSoloTrivia(){
  const t=state.soloTrivia,bonus=t.score>=8?20:t.score>=5?10:5;await awardXP(bonus,'trivia','Trivia Finish',{silent:true});if(t.score>=8)confetti(55)
  app.innerHTML=shell(`<section class="result-screen"><div class="result-orb">🎬</div><small>TRIVIA COMPLETE</small><h1>${t.score}/${t.queue.length}</h1><p>${t.score>=8?'El universo sospecha que estabas estudiando.':t.score>=5?'Bastante digno.':'Se acepta revancha inmediatamente.'} · +${bonus} bonus XP</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="solo-trivia-start" data-cat="${t.category}">Otra ronda</button><button class="btn-v3 soft" data-action="world" data-world="trivia">Trivia Universe</button></div></section>`,{world:'trivia'})
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
    interaction=`<div class="builder-answer" id="builderAnswer">${e.builder.length?e.builder.map((t,i)=>`<button data-action="builder-remove" data-index="${i}">${esc(t)}</button>`).join(''):'<span>Toca las palabras en orden…</span>'}</div><div class="token-bank">${q.tokens.map((t,i)=>`<button data-action="builder-add" data-index="${i}" ${e.builder.includes(t)?'disabled':''}>${esc(t)}</button>`).join('')}</div><button class="btn-v3 english" data-action="english-check-builder">${state.lang==='es'?'Comprobar frase':'Check sentence'}</button>`
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
  const fb=document.querySelector('#englishFeedback');if(fb)fb.innerHTML=`<div class="feedback ${correct?'good':'bad'}"><b>${correct?(state.lang==='es'?'Perfecto ✨':'Perfect ✨'):(state.lang==='es'?'Casi.':'Almost.')}</b><p>${esc(q.explanation||'Revisa la estructura y vuelve a intentarlo en la próxima.')}</p><button class="btn-v3 ${correct?'english':'soft'}" data-action="english-next">${state.lang==='es'?'Continuar':'Continue'} →</button></div>`
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
  app.innerHTML=shell(`<section class="game-header"><div><small>LABORATORIO DE PUZZLES · ${p.difficulty.toUpperCase()}</small><h1>Sudoku</h1><p>Sin reloj. Sin presión. Solo una cuadrícula que eventualmente dejará de molestarte.</p></div><div class="game-stat"><small>MISTAKES</small><b>${s.mistakes}</b></div></section>
  <section class="sudoku-layout"><div class="sudoku-board">${cells}</div><div class="sudoku-tools glass"><small>TECLADO NUMÉRICO</small><div class="num-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-action="sudoku-number" data-number="${n}">${n}</button>`).join('')}</div><button class="btn-v3 soft" data-action="sudoku-clear">${state.lang==='es'?'Limpiar casilla':'Clear cell'}</button><button class="btn-v3 primary" data-action="sudoku-check">${state.lang==='es'?'Comprobar sudoku':'Check puzzle'}</button><div class="mini-note">Completarlo da 90 XP. Cada error solo resta elegancia, no puntos.</div></div></section>`,{world:'puzzles',back:{action:'world',world:'puzzles',label:'Puzzle Lab'}})
}
function sudokuSet(n){const s=state.sudoku;if(s.selected==null||s.puzzle.puzzle[s.selected]!=='0')return;s.board[s.selected]=n;renderSudoku()}
async function checkSudoku(){const s=state.sudoku,sol=s.puzzle.solution.split('').map(Number);const complete=s.board.every(Boolean),correct=s.board.every((n,i)=>n===sol[i]);if(correct){confetti(70);await awardXP(90,'puzzle','Sudoku complete');return renderPuzzleResult('🧠','Sudoku complete','El universo acepta oficialmente que hoy tu cerebro funcionó.')}s.mistakes++;toast(complete?'Hay números fuera de lugar.':'Todavía faltan casillas.','');renderSudoku()}
function renderPuzzleResult(icon,title,sub){app.innerHTML=shell(`<section class="result-screen"><div class="result-orb">${icon}</div><small>PUZZLE COMPLETE</small><h1>${title}</h1><p>${sub}</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="world" data-world="puzzles">Puzzle Lab</button><button class="btn-v3 soft" data-action="home">Command Center</button></div></section>`,{world:'puzzles'})}

// ---------- MEMORY ----------
function startMemory(){const icons=memoryIcons.slice(0,6),deck=[...icons,...icons].sort(()=>Math.random()-.5).map((icon,id)=>({id,icon,open:false,matched:false}));state.memory={deck,first:null,lock:false,moves:0,matches:0};renderMemory()}
function renderMemory(){state.screen='memory';const m=state.memory;app.innerHTML=shell(`<section class="game-header"><div><small>PUZZLE / ARCADE</small><h1>Memory Reactor</h1><p>Encuentra los pares. No hay explicación científica para por qué la vaca vale lo mismo que el cohete.</p></div><div class="game-stat"><small>MOVES</small><b>${m.moves}</b></div></section><div class="memory-grid">${m.deck.map((c,i)=>`<button class="memory-card ${c.open||c.matched?'open':''} ${c.matched?'matched':''}" data-action="memory-card" data-index="${i}"><span class="back">✦</span><span class="front">${c.icon}</span></button>`).join('')}</div>`,{world:'puzzles',back:{action:'world',world:'puzzles',label:'Puzzle Lab'}})}
function flipMemory(index){const m=state.memory;if(m.lock)return;const card=m.deck[index];if(card.open||card.matched)return;card.open=true;if(m.first==null){m.first=index;renderMemory();return}m.moves++;const a=m.deck[m.first];if(a.icon===card.icon){a.matched=card.matched=true;m.matches++;m.first=null;beep('good');renderMemory();if(m.matches===6)setTimer(async()=>{await awardXP(Math.max(35,90-m.moves*2),'puzzle','Memory Reactor');renderPuzzleResult('🧠','Memory cleared',`${m.moves} movimientos. Bastante digno.`)},400)}else{m.lock=true;renderMemory();setTimer(()=>{a.open=card.open=false;m.first=null;m.lock=false;renderMemory()},700)}}

// ---------- CHAOS ----------
function startCaos(){state.chaos={score:0,end:Date.now()+30000,active:true};renderCaos();setTimer(()=>finishCaos(),30000);spawnCaosTarget()}
function renderCaos(){const remain=Math.max(0,Math.ceil(((state.chaos?.end||Date.now())-Date.now())/1000));app.innerHTML=shell(`<section class="game-header"><div><small>ARCADE · ${state.lang==='es'?'CAOS DE 30 SEGUNDOS':'30 SECOND CHAOS'}</small><h1>${state.lang==='es'?'Atrapa lo urgente.':'Catch the urgent.'}</h1><p>Haz clic en cada “urgente” antes de que cambie de lugar. Sí, esto cuenta como terapia.</p></div><div class="game-stat"><small>${state.lang==='es'?'PUNTOS':'SCORE'}</small><b id="chaosScore">${state.chaos.score}</b></div></section><div class="chaos-arena" id="chaosArena"><div class="chaos-time"><span id="chaosTime">${remain}</span>s</div></div>`,{world:'arcade',back:{action:'world',world:'arcade',label:'Arcade'}});const tick=setInterval(()=>{const el=document.querySelector('#chaosTime');if(!el){clearInterval(tick);return}el.textContent=Math.max(0,Math.ceil((state.chaos.end-Date.now())/1000))},250);state.timers.add(tick)}
function spawnCaosTarget(){if(!state.chaos?.active)return;const arena=document.querySelector('#chaosArena');if(!arena)return;arena.querySelector('.chaos-target')?.remove();const b=document.createElement('button');b.className='chaos-target';b.textContent=random(['URGENTE','¿ESTADO?','PARA HOY','FAVOR VALIDAR','ASAP']);b.style.left=(5+Math.random()*78)+'%';b.style.top=(12+Math.random()*70)+'%';b.onclick=()=>{state.chaos.score++;document.querySelector('#chaosScore').textContent=state.chaos.score;beep('soft');spawnCaosTarget()};arena.appendChild(b);setTimer(()=>{if(b.isConnected)spawnCaosTarget()},1200)}
async function finishCaos(){if(!state.chaos?.active)return;state.chaos.active=false;const score=state.chaos.score;await awardXP(20+score*2,'arcade',state.lang==='es'?'Caos de 30 segundos':'30 Second Chaos');app.innerHTML=shell(`<section class="result-screen"><div class="result-orb danger-r">⚡</div><small>${state.lang==='es'?'CAOS SUPERADO':'CHAOS SURVIVED'}</small><h1>${score}</h1><p>urgencias neutralizadas en 30 segundos.</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="chaos">Otra vez</button><button class="btn-v3 soft" data-action="world" data-world="arcade">Arcade</button></div></section>`,{world:'arcade'})}

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
async function finishInvaders(){const inv=state.invaders;if(!inv?.active)return;inv.active=false;if(state.raf)cancelAnimationFrame(state.raf);const xp=25+inv.score*3;await awardXP(xp,'arcade','Case Invaders',{duo:inv.duo});if(inv.duo)sendRoom('arcade_done',{score:inv.score});app.innerHTML=shell(`<section class="result-screen"><div class="result-orb danger-r">🚀</div><small>OLEADA COMPLETA</small><h1>${inv.score}</h1><p>casos destruidos · +${xp} XP</p><div class="hero-buttons"><button class="btn-v3 primary" data-action="case-invaders">Otra wave</button><button class="btn-v3 soft" data-action="${inv.duo?'duo-hub':'world'}" ${!inv.duo?'data-world="arcade"':''}>${inv.duo?'Duo Realm':'Arcade'}</button></div></section>`,{world:'arcade'})}

// ---------- CHILL ----------
function renderGarden(){state.screen='garden';clearTimers();const flowers=Array.from({length:34},(_,i)=>`<button class="flower-v3" style="--x:${3+Math.random()*94}%;--y:${3+Math.random()*40}%;--d:${Math.random()*2}s;--c:${random(['#ff8fb1','#ffe16f','#a886ff','#ffac78','#7fdca7','#6fc7ff'])}" data-action="garden-flower"></button>`).join('');app.innerHTML=shell(`<section class="garden-v3"><div class="garden-sky"><div class="sun-v3"></div><div class="cloud-v3 c1"></div><div class="cloud-v3 c2"></div></div><div class="garden-message glass"><small>THE GARDEN</small><h2>Por hoy, el caos puede esperar.</h2><p id="gardenQuote">${random(gardenQuotes)}</p></div>${flowers}<div class="garden-ground"></div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})}
function starDrift(){state.screen='star-drift';app.innerHTML=shell(`<section class="drift"><div class="drift-copy"><small>STAR DRIFT · PAUSA DE 2 MIN</small><h1>Aquí no tienes que ganar nada.</h1><p>Mueve el cursor. Respira. Recoge luz si quieres.</p></div><div class="drift-field" id="driftField"><div class="drift-star" id="driftStar">✦</div>${Array.from({length:24},()=>`<i style="left:${Math.random()*96}%;top:${Math.random()*94}%;animation-delay:${Math.random()*3}s"></i>`).join('')}</div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}});const f=document.querySelector('#driftField'),s=document.querySelector('#driftStar');f.onpointermove=e=>{const r=f.getBoundingClientRect();s.style.transform=`translate(${e.clientX-r.left-18}px,${e.clientY-r.top-18}px)`}}
function coffeeBreak(){
  state.screen='coffee'
  const qs=['¿Qué fue lo menos terrible de hoy?','Si pudieras salir ahora mismo, ¿a dónde irías?','¿Qué canción describiría tu energía de este momento?','¿Qué pequeña cosa te gustaría que pasara antes de terminar el día?','¿Café, postre, libro o paseo?']
  app.innerHTML=shell(`<section class="coffee-premium"><div class="coffee-main"><div class="coffee-cup">☕</div><small>COFFEE BREAK · SOCIAL CHILL</small><h1>${random(qs)}</h1><p>No hay respuesta correcta. Pero sí puedes convertir la pausa digital en una invitación real.</p><div class="coffee-actions">${coffeeActions.map(a=>`<button data-action="coffee-invite" data-coffee="${a.id}"><span>${a.icon}</span><b>${a.label}</b><small>${partnerIsOnline()?'Enviar ahora':'Quedará en el chat'}</small></button>`).join('')}</div><button class="btn-v3 soft" data-action="coffee">Otra pregunta</button></div><aside class="coffee-status glass"><small>DUO ESTADO</small>${avatarVisual(state.profiles.find(p=>p.player_key===otherDefault())?.avatar_id||'cow-classic','lg')}<b>${esc(partnerLabel())}</b><p><i class="presence-dot ${partnerIsOnline()?'on':''}"></i>${partnerIsOnline()?'Online en KORAVERSE':'Offline · verá tu invitación al entrar'}</p><button class="btn-v3 soft" data-action="chat-toggle">Abrir chat</button></aside></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})
}
async function sendCoffeeInvite(id){const item=coffeeActions.find(x=>x.id===id)||coffeeActions[0];await sendChatMessage(item.message,'coffee_invite',{action:id});toast(`${item.icon} Invitación enviada`,'signal');beep('signal');fetch('/api/kora-signal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from_player:state.profile.player_key,to_player:otherDefault(),from_name:state.profile.display_name,message:item.message,kind:'coffee'})}).catch(()=>{})}
function rainRoom(){state.screen='rain-room';app.innerHTML=shell(`<section class="rain-room"><div class="rain-window">${Array.from({length:70},(_,i)=>`<i style="--x:${Math.random()*100}%;--d:${Math.random()*2.4}s;--s:${.7+Math.random()*1.4}"></i>`).join('')}<div class="rain-copy glass"><small>SALA DE LLUVIA</small><h1>Nada que resolver.</h1><p>Quédate aquí un minuto. La lluvia no necesita seguimiento.</p><button class="btn-v3 soft" data-action="coffee-invite" data-coffee="five">Invitar a mini break</button></div></div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})}
function moodOrbit(){state.screen='mood';const moods=[['calm','🌿','Tranquilo'],['tired','🌙','Cansado'],['chaos','⚡','Caos'],['happy','✨','Bien'],['quiet','☁️','Silencio']];app.innerHTML=shell(`<section class="mood-room"><small>MOOD ORBIT</small><h1>¿Qué energía tiene el día?</h1><p>Esto no puntúa. Solo cambia un poco el universo.</p><div class="mood-grid">${moods.map(([id,ic,label])=>`<button class="${state.mood===id?'active':''}" data-action="mood-select" data-mood="${id}"><span>${ic}</span><b>${label}</b></button>`).join('')}</div><div class="mood-planet mood-${state.mood||'calm'}"></div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})}
function selectMood(m){state.mood=m;beep('soft');moodOrbit()}
function quietLibraryRoom(){state.screen='library';app.innerHTML=shell(`<section class="quiet-library"><div class="library-card glass-xl"><span>📖</span><small>BIBLIOTECA TRANQUILA</small><h1>${esc(random(quietLibrary))}</h1><p>Una página imaginaria. Cero notificaciones durante exactamente el tiempo que tú decidas.</p><div class="hero-buttons"><button class="btn-v3 soft" data-action="quiet-library">Otra página</button><button class="btn-v3 signal" data-action="quick-chat" data-message="Te encontré una frase bonita en Silencio Library 📖">Compartir en chat</button></div></div></section>`,{world:'chill',back:{action:'world',world:'chill',label:'Chill Zone'}})}


// ---------- PROFILE / AVATARS / PODIUM ----------
function renderProfile(){
  state.screen='profile';const p=xpProgress(),earned=achievements.filter(a=>a.level?p.level>=a.level:(state.profile[a.category||'xp']||0)>=a.threshold),av=avatarById(state.profile.avatar_id)
  const themes=[['nebula','🌌','Nebula'],['midnight','🌙','Midnight'],['aurora','🌈','Aurora'],['rose','🌸','Rose Dust'],['garden','🌿','Garden Glow'],['retro','🕹️','Retro Arcade'],['writers','📚','Writers’ Room'],['coffee','☕','Coffee Night']]
  const recent=state.activity.length?state.activity.slice(0,6).map(a=>`<li><span>${a.category==='english'?'🇬🇧':a.category==='arcade'?'🚀':a.category==='puzzle'?'🧩':a.category==='trivia'?'🎬':'✨'}</span><div><b>${esc(a.source)}</b><small>+${a.xp} XP · ${formatClock(a.created_at)}</small></div></li>`).join(''):`<li><span>✨</span><div><b>${state.lang==='es'?'Tu historia empieza aquí.':'Your story starts here.'}</b><small>KORAVERSE 4.1</small></div></li>`
  app.innerHTML=shell(`<section class="profile-universe">
    <div class="profile-stage"><div class="profile-stage-stars"></div>${avatarVisual(av.id,'full')}<div class="profile-avatar-copy"><small>${state.lang==='es'?'AVATAR ACTUAL':'CURRENT AVATAR'}</small><b>${esc(av.name)}</b></div></div>
    <div class="profile-overview"><small>${state.lang==='es'?'UNIVERSO DEL JUGADOR':'PLAYER UNIVERSE'}</small><h1>${esc(state.profile.display_name)}</h1><p>${tr('level')} ${p.level} · ${state.profile.xp} XP · 🔥 ${state.profile.streak||1} ${tr('streak')}</p>
      <div class="profile-metrics"><div><span>${p.level}</span><small>${tr('level')}</small></div><div><span>${state.profile.xp}</span><small>XP</small></div><div><span>${state.profile.streak||1}</span><small>RACHA</small></div><div><span>${earned.length}</span><small>LOGROS</small></div></div>
      <div class="hero-buttons profile-actions"><button class="btn-v3 primary" data-action="avatar-studio">✨ ${tr('avatars')}</button><button class="btn-v3 signal" data-action="sketch-pad">🎨 Sketch Pad</button><button class="btn-v3 soft" data-action="notify-enable">🔔 Alertas</button><button class="btn-v3 soft" data-action="switch-profile">Cambiar jugador</button></div>
    </div>
  </section>
  <section class="profile-grid premium-profile-grid"><div class="profile-panel glass"><small>PROGRESO AL NIVEL ${p.level+1}</small><div class="big-progress"><i style="width:${p.pct}%"></i></div><b>${state.profile.xp} XP</b><p>${p.next} XP restantes.</p></div><div class="profile-panel glass stats-list"><div><span>🇬🇧 English</span><b>${state.profile.english_xp||0}</b></div><div><span>🎬 Trivia</span><b>${state.profile.trivia_xp||0}</b></div><div><span>🧩 Puzzles</span><b>${state.profile.puzzle_xp||0}</b></div><div><span>🚀 Arcade</span><b>${state.profile.arcade_xp||0}</b></div><div><span>🤝 Duo</span><b>${state.profile.duo_xp||0}</b></div></div></section>
  <section class="section-block"><div class="section-title"><div><small>${tr('theme').toUpperCase()}</small><h2>${state.lang==='es'?'Haz que el universo se parezca a ti.':'Make the universe feel like you.'}</h2></div></div><div class="theme-grid">${themes.map(([id,ic,label])=>`<button class="theme-card theme-${id} ${state.theme===id?'active':''}" data-action="theme" data-theme="${id}"><span>${ic}</span><b>${label}</b><i>${state.theme===id?'✓':''}</i></button>`).join('')}</div></section>
  <section class="profile-life-grid"><div class="profile-feed glass"><small>${state.lang==='es'?'ÚLTIMAMENTE EN TU UNIVERSO':'RECENTLY IN YOUR UNIVERSE'}</small><ul>${recent}</ul></div><div class="profile-collection glass"><small>${state.lang==='es'?'COLECCIÓN':'COLLECTION'}</small>${avatarVisual(av.id,'lg')}<b>${esc(av.name)}</b><p>${esc(av.blurb)}</p><button class="btn-v3 soft" data-action="avatar-studio">Ver colección →</button></div></section>
  <section class="section-block"><div class="section-title"><div><small>LOGROS</small><h2>${earned.length}/${achievements.length} desbloqueados</h2></div></div><div class="achievement-grid">${achievements.map(a=>{const ok=earned.some(e=>e.id===a.id);return `<div class="achievement ${ok?'unlocked':''}"><span>${a.icon}</span><div><b>${a.title}</b><p>${a.desc}</p></div><i>${ok?'✓':'🔒'}</i></div>`}).join('')}</div></section>${podiumBlock()}`,{world:'home',back:{action:'home',label:'Command Center'}})
}

function renderAvatarStudio(){
  state.screen='avatars';const xp=state.profile.xp||0;const groups=[...new Set(avatarCatalog.map(a=>a.collection))]
  app.innerHTML=shell(`<section class="avatar-hero"><div><small>AVATAR STUDIO · COLECCIONA Y EXPRÉSATE</small><h1>Elige tu<br><span>dimensión.</span></h1><p>Vaquitas, animales, escritores y arquetipos originales. Los avatares ahora tienen cuerpo completo y algunos se desbloquean jugando.</p></div><div class="avatar-stage glass-xl">${avatarVisual(state.profile.avatar_id,'full')}<b>${esc(avatarById(state.profile.avatar_id).name)}</b><small>${xp} XP · ${tr('current')}</small></div></section>${groups.map(g=>`<section class="avatar-collection"><div class="section-title"><div><small>${tr('collection')}</small><h2>${esc(g)}</h2></div></div><div class="avatar-grid">${avatarCatalog.filter(a=>a.collection===g).map(a=>{const unlocked=xp>=a.unlock,selected=a.id===state.profile.avatar_id;return `<button class="avatar-card ${selected?'selected':''} ${unlocked?'':'locked'}" data-action="select-avatar" data-avatar="${a.id}">${avatarVisual(a.id,'lg')}<small>${a.unlock?`${a.unlock} XP`:'STARTER'}</small><h3>${esc(a.name)}</h3><p>${esc(a.blurb)}</p><i>${selected?'ACTUAL':unlocked?'ELEGIR →':'🔒 BLOQUEADO'}</i></button>`}).join('')}</div></section>`).join('')}`,{world:'home',back:{action:'profile',label:'Profile'}})
}
async function selectAvatar(id){const a=avatarById(id);if((state.profile.xp||0)<a.unlock)return toast(`Se desbloquea con ${a.unlock} XP`);state.profile.avatar_id=id;await persistProfile();updatePresence(state.screen);beep('good');toast(`${a.name} seleccionado ✨`,'xp');renderAvatarStudio()}

// ---------- SKETCH PAD ----------
function renderSketchPad(){
  state.screen='sketch';app.innerHTML=shell(`<section class="sketch-page"><div class="sketch-copy"><small>SKETCH PAD · SOCIAL</small><h1>${state.lang==='es'?'Dibuja algo. Lo serio puede esperar.':'Draw something. Serious things can wait.'}</h1><p>${state.lang==='es'?'Haz un garabato, una vaca espacial o cualquier cosa y envíala directamente al chat.':'Make a doodle and send it straight to chat.'}</p></div><div class="sketch-workspace glass-xl"><div class="sketch-toolbar"><label>Color <input id="sketchColor" type="color" value="${state.sketch.color}"></label><label>Grosor <input id="sketchSize" type="range" min="2" max="24" value="${state.sketch.size}"></label><button data-action="sketch-eraser">🧽 Borrador</button><button data-action="sketch-clear">🗑 Limpiar</button></div><div class="canvas-wrap"><canvas id="sketchCanvas" width="1000" height="650"></canvas></div><div class="sketch-actions"><button class="btn-v3 soft" data-action="sketch-save">Guardar PNG</button><button class="btn-v3 primary" data-action="sketch-send">💬 Mira lo que dibujé</button></div></div></section>`,{world:'chill',back:{action:'home',label:'Command Center'}});setTimer(initSketchCanvas,30)
}
function initSketchCanvas(){
  const c=document.querySelector('#sketchCanvas');if(!c)return;const ctx=c.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';let down=false,last=null
  const pos=e=>{const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}
  c.onpointerdown=e=>{down=true;last=pos(e);c.setPointerCapture?.(e.pointerId)}
  c.onpointermove=e=>{if(!down)return;const q=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(q.x,q.y);ctx.lineWidth=state.sketch.size;ctx.strokeStyle=state.sketch.eraser?'#0b0f1a':state.sketch.color;ctx.stroke();last=q}
  c.onpointerup=c.onpointercancel=()=>{down=false;last=null}
  document.querySelector('#sketchColor')?.addEventListener('input',e=>{state.sketch.color=e.target.value;state.sketch.eraser=false})
  document.querySelector('#sketchSize')?.addEventListener('input',e=>state.sketch.size=Number(e.target.value))
}
function clearSketch(){const c=document.querySelector('#sketchCanvas');c?.getContext('2d').clearRect(0,0,c.width,c.height)}
function saveSketch(){const c=document.querySelector('#sketchCanvas');if(!c)return;const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=`koraverse-dibujo-${Date.now()}.png`;a.click()}
async function sendSketch(){
  const c=document.querySelector('#sketchCanvas');if(!c)return;const blob=await new Promise(r=>c.toBlob(r,'image/webp',.82));let url=''
  if(state.dbReady&&blob){try{const path=`${state.profile.player_key}/${Date.now()}-${crypto.randomUUID()}.webp`;const {error}=await supabase.storage.from('koraverse-sketches').upload(path,blob,{contentType:'image/webp',upsert:false});if(!error)url=supabase.storage.from('koraverse-sketches').getPublicUrl(path).data.publicUrl}catch{}}
  const data_url=url?'':c.toDataURL('image/webp',.65)
  await sendChatMessage(state.lang==='es'?'Mira lo que dibujé 🎨':'Look what I drew 🎨','sketch',{url,data_url});await awardXP(8,'general','Sketch Pad',{silent:true});toast(state.lang==='es'?'Dibujo enviado al chat 🎨':'Drawing sent 🎨','signal');renderHome()
}

// ---------- KORA SIGNAL ----------
async function setupSignalChannel(){
  if(!supabase||!state.profile)return
  if(state.signalChannel) await supabase.removeChannel(state.signalChannel)
  state.signalChannel=supabase.channel('koraverse-signals-v4',{config:{broadcast:{self:false}}})
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
function roomPlayer(){return {player_key:state.profile.player_key,name:state.profile.display_name,avatar_id:state.profile.avatar_id||'cow-classic',device:deviceId,role:state.room.role}}
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
    .on('broadcast',{event:'chess_move'},({payload})=>onChessMove(payload))
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
  app.innerHTML=shell(`<section class="duo-entry"><div class="duo-entry-copy"><small>DUO REALM</small><h1>Dos pantallas.<br>Una misma dimensión.</h1><p>Crea una sala privada o entra con el código que te enviaron.</p></div><div class="duo-entry-panels"><div class="room-create glass"><span>✨</span><h3>Crear universo</h3><p>Genera un código nuevo y compártelo.</p><button class="btn-v3 primary" data-action="create-room">Crear partida</button></div><div class="room-create glass"><span>🔗</span><h3>Unirse al universo</h3><p>Entra a una sala existente.</p><input id="joinCode" class="input-v3 code" maxlength="6" value="${esc(pre)}" placeholder="ABC123"><button class="btn-v3 soft" data-action="join-room">Entrar</button></div></div></section>`,{world:'duo',back:{action:'home',label:'Command Center'}})
}
function renderDuoScreen(){
  const g=state.room.game;state.screen=`duo-${g.screen}`
  if(g.screen==='lobby')return renderDuoLobby();if(g.screen==='hub')return renderDuoHub();if(g.mode==='trivia')return renderDuoTrivia();if(g.mode==='brain')return renderDuoBrain();if(g.mode==='mission')return renderDuoMission();if(g.mode==='sudoku')return renderDuoSudoku();if(g.mode==='chess')return renderChessDuo();if(g.mode==='cases')return renderDuoCases();if(g.mode==='garden')return renderDuoGarden();renderDuoHub()
}
function renderDuoLobby(){const players=state.room.players;const unique=[];players.forEach(p=>{if(!unique.find(x=>x.player_key===p.player_key))unique.push(p)});const ready=unique.length>=2;const invite=`${location.origin}${location.pathname}?room=${state.room.code}`;app.innerHTML=shell(`<section class="duo-lobby"><div class="lobby-code"><small>SALA PRIVADA</small><h1>${state.room.code}</h1><p>Comparte el enlace. No hace falta estar en la misma red.</p><div class="copy-link"><code>${esc(invite)}</code><button data-action="copy-room">Copiar</button></div></div><div class="player-dock">${unique.map((p,i)=>`<div class="duo-player ${i===0?'p1':'p2'}"><span class="duo-avatar-wrap">${avatarVisual(p.avatar_id||'cow-classic','md')}</span><b>${esc(p.name)}</b><small>${p.role==='host'?'HOST':'JUGADOR 2'}</small><i></i></div>`).join('')}${!ready?`<div class="duo-player empty"><span>?</span><b>Esperando...</b><small>JUGADOR 2</small></div>`:''}</div><div class="lobby-status ${ready?'ready':''}"><i></i>${ready?'ENLACE KORAVERSE ESTABLECIDO':'Esperando al cómplice...'}</div>${state.room.role==='host'?`<button class="btn-v3 primary big-btn ${ready?'':'disabled'}" data-action="duo-start">${ready?'ENTRAR AL DUO UNIVERSE':'ESPERANDO...'}</button>`:`<div class="wait-copy">El anfitrión abrirá el universo cuando ambos estén conectados.</div>`}</section>`,{world:'duo',back:{action:'leave-room',label:'Salir'}})}
function renderDuoHub(){app.innerHTML=shell(`<section class="duo-hub-hero"><div><small>DUO REALM · ${state.room.code}</small><h1>Conectados.</h1><p>Dos pantallas, un mismo universo. Elijan una actividad y el estado se mantendrá sincronizado.</p></div><button class="btn-v3 signal" data-action="new-duo-room">↻ Nueva partida</button></section><div class="activity-grid duo-grid"><button class="activity-card chess-feature" data-action="duo-game" data-game="chess"><span>♟️</span><i>NUEVO · APRENDE</i><h3>Chess Duo Lab</h3><p>Ajedrez real con modo <b>Guíame</b>, movimientos legales y explicaciones para principiantes.</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-game" data-game="trivia"><span>🎬</span><i>DUO</i><h3>Trivia Realm</h3><p>Respuestas ocultas hasta que ambos eligen.</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-game" data-game="brain"><span>🧠</span><i>DUO</i><h3>Same Brain</h3><p>¿Piensan igual o fue pura propaganda?</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-game" data-game="mission"><span>🕵️</span><i>OFFICE</i><h3>Mission Control</h3><p>Uno hace el reto; el otro valida.</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-game" data-game="sudoku"><span>🔢</span><i>CO-OP</i><h3>Sudoku Duo</h3><p>Un tablero compartido. Dos cerebros.</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-game" data-game="cases"><span>📁</span><i>CLASSIC+</i><h3>Case Arena</h3><p>20 casos y luego llega el Lic. Urgentísimo.</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-invaders"><span>🚀</span><i>DUO RAID</i><h3>Case Invaders</h3><p>Cada uno pilota su nave. Los impactos se suman.</p><b>JUGAR →</b></button><button class="activity-card" data-action="duo-game" data-game="garden"><span>🌷</span><i>RECOMPENSA</i><h3>The Garden</h3><p>${state.room.game.gardenUnlocked?'Desbloqueado.':'Derroten al boss para desbloquearlo.'}</p><b>ABRIR →</b></button></div>`,{world:'duo',back:{action:'leave-room',label:'Salir de sala'}})}


function applyDuoAction(action,data){
  const g=state.room.game;const players=activeDuoPlayers()
  if(action==='start'){g.screen='hub';g.mode=null}
  else if(action==='hub'){g.screen='hub';g.mode=null}
  else if(action==='trivia'){const cat=data.cat||random(Object.keys(triviaBank)),q=random(triviaBank[cat]);g.screen='game';g.mode='trivia';g.round++;g.trivia={cat,q};g.answers={};g.result=null}
  else if(action==='brain'){g.screen='game';g.mode='brain';g.round++;g.brain=random(sameBrain);g.brainAnswers={};g.brainResult=null}
  else if(action==='mission'){g.screen='game';g.mode='mission';g.round++;const assignee=random(players),validator=players.find(x=>x!==assignee)||assignee;g.mission={text:random(missions),assignee,validator,status:'pending'}}
  else if(action==='sudoku'){const p=sudokuPuzzles[0];g.screen='game';g.mode='sudoku';g.round++;g.sudokuId=p.id;g.sudokuBoard=p.puzzle.split('').map(Number);g.sudokuFixed=p.puzzle.split('').map(x=>x!=='0');g.sudokuStatus=null}
  else if(action==='chess'){
    const game=new Chess();const host=state.room.players.find(p=>p.role==='host')?.player_key||players[0];const guest=players.find(x=>x!==host)||players[1]||host
    g.screen='game';g.mode='chess';g.round++;g.chessFen=game.fen();g.chessHistory=[];g.chessStatus='En juego';g.chessWhite=host;g.chessBlack=guest;g.chessLastMove=null;state.chess.selected=null;state.chess.hints=[]
  }
  else if(action==='cases'){g.screen='game';g.mode='cases';g.round++;g.casePhase='cases';g.caseCount=0;g.bossHP=100}
  else if(action==='garden'){if(!g.gardenUnlocked)return toast('The Garden sigue dormido.');g.screen='game';g.mode='garden'}
  broadcastGame()
}


const CHESS_PIECES={wp:'♙',wn:'♘',wb:'♗',wr:'♖',wq:'♕',wk:'♔',bp:'♟',bn:'♞',bb:'♝',br:'♜',bq:'♛',bk:'♚'}
const PIECE_ES={p:'Peón',n:'Caballo',b:'Alfil',r:'Torre',q:'Reina',k:'Rey'}
function chessColorFor(key){const g=state.room.game;return key===g.chessWhite?'w':key===g.chessBlack?'b':null}
function chessGuideOn(){if(state.chess.guide==null)state.chess.guide=state.profile.player_key==='kora';return state.chess.guide}
function chessMoveScore(m){const vals={p:1,n:3,b:3,r:5,q:9,k:0};let score=(m.captured?vals[m.captured]*10:0)+(m.san.includes('+')?6:0)+(m.san.includes('#')?100:0);if(['d4','d5','e4','e5'].includes(m.to))score+=4;if(m.flags?.includes('k')||m.flags?.includes('q'))score+=5;return score}
function chessAdvice(game){const moves=game.moves({verbose:true}).sort((a,b)=>chessMoveScore(b)-chessMoveScore(a)).slice(0,3);return moves.map(m=>`${m.san} · ${m.captured?'captura una pieza y gana material':m.san.includes('+')?'da jaque al rey':'mejora la posición o desarrolla una pieza'}`)}
function chessPieceHelp(piece){return {p:'El peón avanza una casilla y captura en diagonal. En su primera jugada puede avanzar dos.',n:'El caballo se mueve en forma de L y puede saltar sobre otras piezas.',b:'El alfil se mueve en diagonal tantas casillas como quiera.',r:'La torre se mueve en línea recta por filas y columnas.',q:'La reina combina los movimientos de torre y alfil.',k:'El rey mueve una casilla en cualquier dirección. Nunca puede quedar en jaque.'}[piece]||''}
function renderChessLearn(){
  state.screen='duo-chess-learn';const lessons=[['♙','Peón','Avanza hacia delante, captura en diagonal y al llegar al final puede promocionar.'],['♘','Caballo','Se mueve en L. Es la única pieza que puede saltar sobre otras.'],['♗','Alfil','Recorre diagonales y siempre permanece en casillas del mismo color.'],['♖','Torre','Se mueve horizontal o verticalmente.'],['♕','Reina','La pieza más poderosa: combina torre y alfil.'],['♔','Rey','Debe permanecer a salvo. Jaque mate termina la partida.']]
  app.innerHTML=shell(`<section class="chess-learn"><small>CHESS DUO LAB · APRENDE</small><h1>Ajedrez sin presión.</h1><p>Cinco minutos aquí bastan para entender el tablero antes de retar a tu cómplice.</p><div class="chess-lesson-grid">${lessons.map(([ic,n,d])=>`<article><span>${ic}</span><b>${n}</b><p>${d}</p></article>`).join('')}</div><div class="chess-principles glass"><b>3 ideas que valen oro</b><span>1. Controla el centro.</span><span>2. Saca caballos y alfiles temprano.</span><span>3. Protege tu rey; enrocar suele ayudar.</span></div><button class="btn-v3 primary" data-action="duo-game" data-game="chess">♟️ Practicar en partida</button></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})
}
function renderChessDuo(){
  const g=state.room.game;const game=new Chess(g.chessFen||undefined);const myColor=chessColorFor(state.profile.player_key)||'w';const guide=chessGuideOn();const selected=state.chess.selected;const legal=selected?game.moves({square:selected,verbose:true}):[];const legalTo=new Set(legal.map(m=>m.to));const rows=game.board();const coords=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)coords.push({r,c})
  if(myColor==='b')coords.reverse()
  const board=coords.map(({r,c})=>{const piece=rows[r][c],sq='abcdefgh'[c]+(8-r);const key=piece?piece.color+piece.type:'';const own=piece?.color===myColor;const last=g.chessLastMove&&(g.chessLastMove.from===sq||g.chessLastMove.to===sq);return `<button class="chess-square ${(r+c)%2?'dark':'light'} ${selected===sq?'selected':''} ${guide&&legalTo.has(sq)?'legal':''} ${last?'last':''}" data-action="chess-square" data-square="${sq}">${piece?`<span class="piece ${own?'mine':''}">${CHESS_PIECES[key]}</span>`:''}<i>${sq}</i></button>`}).join('')
  const turn=game.turn()==='w'?g.chessWhite:g.chessBlack;const isMyTurn=turn===state.profile.player_key;const selectedPiece=selected?game.get(selected):null;const suggestions=guide?chessAdvice(game):[]
  const status=g.chessStatus||(game.isCheck()?'Jaque':'En juego')
  app.innerHTML=shell(`<section class="chess-shell"><div class="chess-top"><div><small>CHESS DUO LAB · ${state.room.code}</small><h1>${status}</h1><p>${isMyTurn?'Tu turno.':'Turno de '+esc(turn||'oponente')+'.'} ${guide?'El modo Guíame está activo solo para ti.':''}</p></div><div class="chess-toggle"><button class="${guide?'active':''}" data-action="chess-guide">🧠 Guíame ${guide?'ON':'OFF'}</button><button data-action="chess-learn">📖 Aprende</button><button data-action="chess-hint">✨ Pista</button></div></div><div class="chess-layout"><div class="chess-board-wrap"><div class="chess-board">${board}</div><div class="chess-players"><span>♔ Blancas · <b>${esc(g.chessWhite||'—')}</b></span><span>♚ Negras · <b>${esc(g.chessBlack||'—')}</b></span></div></div><aside class="chess-coach glass"><small>${guide?'TU GUÍA':'PARTIDA'}</small>${selectedPiece&&guide?`<div class="coach-piece"><span>${CHESS_PIECES[myColor+selectedPiece.type]||''}</span><div><b>${PIECE_ES[selectedPiece.type]}</b><p>${chessPieceHelp(selectedPiece.type)}</p></div></div>`:''}<div class="coach-card"><b>${isMyTurn?'¿Qué mirar ahora?':'Mientras esperas'}</b><p>${guide?(isMyTurn?'Elige una pieza. Las casillas posibles se iluminarán. Tu rey nunca puede quedar expuesto.':'Observa qué amenaza la última jugada y piensa qué pieza quedó menos protegida.'):'Modo normal: sin ayudas estratégicas.'}</p></div>${guide?`<div class="coach-suggestions"><b>Movimientos candidatos</b>${suggestions.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}<div class="chess-history"><b>Últimos movimientos</b><p>${g.chessHistory?.slice(-8).join(' · ')||'La partida acaba de comenzar.'}</p></div></aside></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})
}
function clickChessSquare(square){
  const g=state.room.game,game=new Chess(g.chessFen||undefined),myColor=chessColorFor(state.profile.player_key),piece=game.get(square)
  if(game.turn()!==myColor)return toast('Todavía no es tu turno.')
  if(!state.chess.selected){if(!piece||piece.color!==myColor)return toast('Elige una de tus piezas.');state.chess.selected=square;return renderChessDuo()}
  if(piece&&piece.color===myColor){state.chess.selected=square;return renderChessDuo()}
  const from=state.chess.selected;state.chess.selected=null;sendRoom('chess_move',{round:g.round,from,to:square,promotion:'q'})
}
async function onChessMove(p){
  if(state.room.role!=='host'||state.room.game.mode!=='chess'||p.round!==state.room.game.round)return;const g=state.room.game,game=new Chess(g.chessFen||undefined),color=chessColorFor(p.player_key);if(game.turn()!==color)return
  try{const mv=game.move({from:p.from,to:p.to,promotion:p.promotion||'q'});if(!mv)return;g.chessFen=game.fen();g.chessHistory=game.history();g.chessLastMove={from:mv.from,to:mv.to};g.chessStatus=game.isCheckmate()?'Jaque mate':game.isDraw()?'Tablas':game.isCheck()?'Jaque':'En juego';if(game.isGameOver()){const players=activeDuoPlayers();if(game.isCheckmate())grantDuoPlayerXP([p.player_key],50,'Chess Duo');grantDuoPlayerXP(players.filter(x=>x!==p.player_key),20,'Chess Duo');awardDuoXP(20)}broadcastGame()}catch{}
}

function renderDuoTrivia(){const g=state.room.game,q=g.trivia.q;const mine=g.answers[state.profile.player_key];const result=g.result;app.innerHTML=shell(`<section class="duo-game-head"><button data-action="duo-hub">← Duo Realm</button><span>${g.trivia.cat.toUpperCase()} · RONDA ${g.round}</span><span>${Object.keys(g.answers).length}/2 BLOQUEADAS</span></section><div class="duo-question glass-xl"><small>TRIVIA REALM</small><h1>${esc(q.q)}</h1><div class="trivia-options">${q.a.map((a,i)=>`<button data-action="duo-trivia-answer" data-index="${i}" class="${mine===i?'locked':''} ${result&&q.c===i?'correct':''}"><span>${String.fromCharCode(65+i)}</span>${esc(a)}</button>`).join('')}</div>${mine!=null&&!result?'<div class="answer-lock">🔒 Respuesta bloqueada. Esperando la otra dimensión...</div>':''}${result?`<div class="duo-result"><b>${result.both?'DUO PERFECT ✨':'REVELACIÓN'}</b><p>${result.text}</p><button class="btn-v3 primary" data-action="duo-game" data-game="trivia">Siguiente ronda</button></div>`:''}</div>`,{world:'duo'})}
async function onTriviaAnswer(p){if(state.room.role!=='host'||state.room.game.mode!=='trivia'||p.round!==state.room.game.round)return;const g=state.room.game;if(g.answers[p.player_key]!=null)return;g.answers[p.player_key]=p.index;const players=activeDuoPlayers();if(players.length>=2&&players.every(k=>g.answers[k]!=null)){const c=g.trivia.q.c;const correct=players.filter(k=>g.answers[k]===c);g.result={both:correct.length===2,text:players.map(k=>`${k}: ${g.answers[k]===c?'correcta ✅':'incorrecta'}`).join(' · ')};grantDuoPlayerXP(correct,20,'Trivia Duo');if(correct.length===2)awardDuoXP(12)}broadcastGame()}

function renderDuoBrain(){const g=state.room.game,mine=g.brainAnswers[state.profile.player_key],result=g.brainResult;app.innerHTML=shell(`<section class="duo-game-head"><button data-action="duo-hub">← Duo Realm</button><span>SAME BRAIN · RONDA ${g.round}</span><span>${Object.keys(g.brainAnswers).length}/2 BLOQUEADAS</span></section><div class="duo-question glass-xl"><small>SYNC MODE EVOLUCIONADO</small><h1>${esc(g.brain.q)}</h1><div class="brain-options">${g.brain.o.map((o,i)=>`<button data-action="duo-brain-answer" data-index="${i}" class="${mine===i?'locked':''}">${esc(o)}</button>`).join('')}</div>${mine!=null&&!result?'<div class="answer-lock">🧠 Elección bloqueada. No hagas trampa.</div>':''}${result?`<div class="same-reveal ${result.same?'same':''}"><span>${result.same?'✨':'↯'}</span><b>${result.same?'SAME BRAIN':'DISTINTAS DIMENSIONES'}</b><p>${result.text}</p><button class="btn-v3 primary" data-action="duo-game" data-game="brain">Otra</button></div>`:''}</div>`,{world:'duo'})}
async function onBrainAnswer(p){if(state.room.role!=='host'||state.room.game.mode!=='brain'||p.round!==state.room.game.round)return;const g=state.room.game;if(g.brainAnswers[p.player_key]!=null)return;g.brainAnswers[p.player_key]=p.index;const ps=activeDuoPlayers();if(ps.length>=2&&ps.every(k=>g.brainAnswers[k]!=null)){const same=g.brainAnswers[ps[0]]===g.brainAnswers[ps[1]];g.brainResult={same,text:ps.map(k=>`${k}: ${g.brain.o[g.brainAnswers[k]]}`).join(' · ')};if(same)grantDuoPlayerXP(ps,15,'Same Brain')}broadcastGame()}

function renderDuoMission(){const m=state.room.game.mission,me=state.profile.player_key,assigned=me===m.assignee,validator=me===m.validator;app.innerHTML=shell(`<section class="mission-screen"><div class="mission-icon">🕵️</div><small>MISSION CONTROL · RONDA ${state.room.game.round}</small><h1>${assigned?'Tu misión.':validator?'Tú validas.':'Misión en curso.'}</h1><div class="mission-card glass-xl"><p>${esc(m.text)}</p><div class="mission-roles"><span>RESPONSABLE <b>${esc(m.assignee)}</b></span><span>VALIDADOR <b>${esc(m.validator)}</b></span></div>${validator&&m.status==='pending'?`<div class="hero-buttons"><button class="btn-v3 english" data-action="mission-validate" data-ok="true">✓ Validar</button><button class="btn-v3 soft" data-action="mission-validate" data-ok="false">Todavía no</button></div>`:`<div class="answer-lock">${m.status==='pending'?'Esperando validación…':m.status==='approved'?'✅ Misión validada':'↻ Aún no validada'}</div>`}${m.status==='approved'?'<button class="btn-v3 primary" data-action="duo-hub">Volver a Duo Realm</button>':''}</div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}
async function onMissionValidate(p){if(state.room.role!=='host'||state.room.game.mode!=='mission')return;const m=state.room.game.mission;if(p.player_key!==m.validator)return;m.status=p.ok?'approved':'pending';if(p.ok){grantDuoPlayerXP([m.assignee,m.validator],15,'Mission Control')}broadcastGame()}

function renderDuoSudoku(){const g=state.room.game,p=sudokuPuzzles.find(x=>x.id===g.sudokuId)||sudokuPuzzles[0];const cells=g.sudokuBoard.map((n,i)=>{const fixed=g.sudokuFixed[i],r=Math.floor(i/9),c=i%9;return `<button class="sudoku-cell ${fixed?'fixed':''} ${(c===2||c===5)?'block-r':''} ${(r===2||r===5)?'block-b':''}" data-action="duo-sudoku-cell" data-index="${i}">${n||''}</button>`}).join('');app.innerHTML=shell(`<section class="game-header"><div><small>PUZZLE DUO</small><h1>Sudoku Duo</h1><p>Selecciona una casilla y pulsa un número. Los cambios viajan a la otra pantalla.</p></div><div class="game-stat"><small>ESTADO</small><b>${g.sudokuStatus||'SYNC'}</b></div></section><section class="sudoku-layout"><div class="sudoku-board" id="duoSudoku">${cells}</div><div class="sudoku-tools glass"><small>TECLADO NUMÉRICO</small><div class="num-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-action="duo-sudoku-number" data-number="${n}">${n}</button>`).join('')}</div><button class="btn-v3 soft" data-action="duo-sudoku-number" data-number="0">Limpiar</button><button class="btn-v3 primary" data-action="duo-sudoku-check">Revisar juntos</button></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}
let duoSelectedCell=null
function onDuoSudokuCell(p){if(state.room.role!=='host'||state.room.game.mode!=='sudoku')return;const i=p.index;if(state.room.game.sudokuFixed[i])return;state.room.game.sudokuBoard[i]=p.value;broadcastGame()}
function checkDuoSudoku(){if(state.room.role!=='host')return sendRoom('action',{action:'sudoku-check',data:{}});const g=state.room.game,p=sudokuPuzzles.find(x=>x.id===g.sudokuId);const ok=g.sudokuBoard.join('')===p.solution;if(ok){g.sudokuStatus='COMPLETE ✨';g.gardenUnlocked=true;grantDuoPlayerXP(activeDuoPlayers(),60,'Sudoku Duo');confetti(60)}else g.sudokuStatus='KEEP GOING';broadcastGame()}

function renderDuoCases(){const g=state.room.game;if(g.casePhase==='boss')return renderDuoBoss();app.innerHTML=shell(`<section class="game-header"><div><small>CLASSIC CASE ARENA</small><h1>Despejen el backlog.</h1><p>Ambos pueden eliminar casos. Al llegar a 20 aparece el jefe.</p></div><div class="game-stat"><small>CASOS</small><b id="duoCaseCount">${g.caseCount}/20</b></div></section><div class="case-arena-v3" id="caseArena"></div>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}});spawnDuoCases()}
function spawnDuoCases(){const arena=document.querySelector('#caseArena');if(!arena||state.room.game.casePhase!=='cases')return;for(let i=0;i<8;i++){const b=document.createElement('button');b.className='floating-case';b.textContent=random(['INC-204','REQ-118','URG-313','REV-009','FAVOR VALIDAR']);b.style.left=(4+Math.random()*80)+'%';b.style.top=(5+Math.random()*78)+'%';b.onclick=()=>{b.remove();sendRoom('case_hit',{round:state.room.game.round,id:crypto.randomUUID()});setTimer(()=>{if(document.querySelector('#caseArena'))spawnOneCase()},250)};arena.appendChild(b)}}
function spawnOneCase(){const a=document.querySelector('#caseArena');if(!a)return;const b=document.createElement('button');b.className='floating-case';b.textContent=random(['INC-204','REQ-118','URG-313','REV-009']);b.style.left=(4+Math.random()*80)+'%';b.style.top=(5+Math.random()*78)+'%';b.onclick=()=>{b.remove();sendRoom('case_hit',{round:state.room.game.round,id:crypto.randomUUID()});setTimer(spawnOneCase,200)};a.appendChild(b)}
function onDuoCaseHit(p){if(state.room.role!=='host'||state.room.game.mode!=='cases'||state.room.game.casePhase!=='cases'||p.round!==state.room.game.round)return;state.room.game.caseCount++;if(state.room.game.caseCount>=20){state.room.game.casePhase='boss';state.room.game.bossHP=100}broadcastGame()}
function renderDuoBoss(){const g=state.room.game;app.innerHTML=shell(`<section class="boss-v3"><div class="boss-header"><small>BOSS FINAL</small><h1>Lic. Urgentísimo</h1><p>Devuélvanle todos sus “favor validar”.</p></div><button class="boss-body" data-action="boss-hit"><span class="boss-eye e1"></span><span class="boss-eye e2"></span><span class="boss-mouth"></span><i>CLIC PARA ATACAR</i></button><div class="boss-hp"><span><b>HP</b>${g.bossHP}/100</span><div><i style="width:${g.bossHP}%"></i></div></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}
function onDuoBossHit(p){if(state.room.role!=='host'||state.room.game.mode!=='cases'||state.room.game.casePhase!=='boss')return;state.room.game.bossHP=Math.max(0,state.room.game.bossHP-5);if(state.room.game.bossHP===0){state.room.game.gardenUnlocked=true;state.room.game.mode='garden';grantDuoPlayerXP(activeDuoPlayers(),70,'Lic. Urgentísimo');confetti(80)}broadcastGame()}
function renderDuoGarden(){const g=state.room.game;if(!g.gardenUnlocked)return renderDuoHub();app.innerHTML=shell(`<section class="garden-v3 duo-garden"><div class="garden-sky"><div class="sun-v3"></div><div class="cloud-v3 c1"></div><div class="cloud-v3 c2"></div></div><div class="garden-message glass"><small>DUO REWARD</small><h2>KORAVERSE restaurado.</h2><p>${random(gardenQuotes)}</p></div>${Array.from({length:38},()=>`<button class="flower-v3" style="--x:${3+Math.random()*94}%;--y:${3+Math.random()*40}%;--d:${Math.random()*2}s;--c:${random(['#ff8fb1','#ffe16f','#a886ff','#ffac78','#7fdca7','#6fc7ff'])}" data-action="garden-flower"></button>`).join('')}<div class="garden-ground"></div></section>`,{world:'duo',back:{action:'duo-hub',label:'Duo Realm'}})}

// ---------- EVENT DELEGATION ----------
app.addEventListener('click',async e=>{
  const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action
  if(a==='choose-profile')return chooseProfile(el.dataset.name)
  if(a==='custom-profile'){const n=document.querySelector('#customName')?.value.trim();if(n)return chooseProfile(n)}
  if(a==='home')return renderHome()
  if(a==='world')return renderWorld(el.dataset.world)
  if(a==='profile')return renderProfile()
  if(a==='switch-profile'){if(state.social.channel&&supabase)supabase.removeChannel(state.social.channel);if(state.signalChannel&&supabase)supabase.removeChannel(state.signalChannel);localStorage.removeItem(PROFILE_KEY);state.profile=null;return renderGate()}
  if(a==='sound'){state.sound=!state.sound;localStorage.setItem(SOUND_KEY,state.sound?'on':'off');toast(state.sound?'Sonido activado':'Sonido desactivado');return state.screen==='home'?renderHome():null}
  if(a==='language'){state.lang=state.lang==='es'?'en':'es';localStorage.setItem(LANG_KEY,state.lang);if(state.profile){state.profile.language=state.lang;await persistProfile(false)}return rerenderPrimary()}
  if(a==='theme'){const id=el.dataset.theme;if(!THEME_IDS.includes(id))return;state.theme=id;localStorage.setItem(THEME_KEY,id);if(state.profile){state.profile.theme_id=id;await persistProfile(false)}applyTheme();return renderProfile()}
  if(a==='kora-tip')return toast(random(['Moo. El backlog no se destruye solo.','English Quest disponible. No te hagas.','Si no quieres competir, The Garden no hace preguntas.','KORAVERSE recomienda una pausa de 5 minutos.']))
  if(a==='quick-play'){const pick=random(['invaders','memory','chaos','sudoku','trivia']);if(pick==='memory')return startMemory();if(pick==='chaos')return startCaos();if(pick==='sudoku')return startSudoku();if(pick==='trivia')return startSoloTrivia('mix');return startInvaders()}
  if(a==='send-signal')return sendSignal()
  if(a==='chat-toggle')return toggleChat()
  if(a==='chat-send'){const input=document.querySelector('#chatInput');const v=input?.value||'';if(input)input.value='';sendTyping(false);return sendChatMessage(v)}
  if(a==='chat-clear')return clearChatForMe()
  if(a==='sketch-pad')return renderSketchPad()
  if(a==='sketch-clear')return clearSketch()
  if(a==='sketch-eraser'){state.sketch.eraser=!state.sketch.eraser;el.classList.toggle('active',state.sketch.eraser);return}
  if(a==='sketch-save')return saveSketch()
  if(a==='sketch-send')return sendSketch()
  if(a==='quick-chat')return sendChatMessage(el.dataset.message||'Hola ✨')
  if(a==='coffee-invite')return sendCoffeeInvite(el.dataset.coffee)
  if(a==='avatar-studio')return renderAvatarStudio()
  if(a==='select-avatar')return selectAvatar(el.dataset.avatar)
  if(a==='solo-trivia-start')return startSoloTrivia(el.dataset.cat||'mix')
  if(a==='solo-trivia-answer')return answerSoloTrivia(Number(el.dataset.index))
  if(a==='solo-trivia-next')return nextSoloTrivia()
  if(a==='rain-room')return rainRoom()
  if(a==='mood-orbit')return moodOrbit()
  if(a==='mood-select')return selectMood(el.dataset.mood)
  if(a==='quiet-library')return quietLibraryRoom()
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
  if(a==='chaos')return startCaos()
  if(a==='case-invaders')return startInvaders()
  if(a==='garden')return renderGarden()
  if(a==='garden-flower'){const q=document.querySelector('#gardenQuote');if(q)q.textContent=random(gardenQuotes);beep('soft');return}
  if(a==='star-drift')return starDrift()
  if(a==='coffee')return coffeeBreak()
  if(a==='classic-case'||a==='duo-sudoku'||a==='chess-duo')return openDuoEntry()
  if(a==='duo-entry')return state.room.connected?renderDuoHub():openDuoEntry()
  if(a==='create-room')return connectRoom('host',randomCode())
  if(a==='join-room'){const code=(document.querySelector('#joinCode')?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(code.length!==6)return toast('Introduce un código de 6 caracteres');return connectRoom('guest',code)}
  if(a==='copy-room'){await navigator.clipboard.writeText(`${location.origin}${location.pathname}?room=${state.room.code}`);return toast('Enlace copiado')}
  if(a==='leave-room')return leaveRoom()
  if(a==='duo-start')return requestDuoAction('start')
  if(a==='duo-hub')return requestDuoAction('hub')
  if(a==='new-duo-room'){if(state.room.role!=='host')return toast('Solo el host puede crear una nueva sala.');const old=state.room.code,code=randomCode();await sendRoom('action',{action:'new_room',data:{code}});if(old)localStorage.removeItem(`koraverse_v3_host_${old}`);return connectRoom('host',code)}
  if(a==='duo-game')return requestDuoAction(el.dataset.game)
  if(a==='chess-learn')return renderChessLearn()
  if(a==='chess-guide'){state.chess.guide=!chessGuideOn();state.chess.selected=null;return renderChessDuo()}
  if(a==='chess-hint'){state.chess.guide=true;state.chess.selected=null;toast('Pista activada: mira los candidatos del panel.');return renderChessDuo()}
  if(a==='chess-square')return clickChessSquare(el.dataset.square)
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

document.addEventListener('input',e=>{if(e.target?.id==='chatInput'){sendTyping(true)}})
function toggleDiscreet(){state.discreet=!state.discreet;let el=document.querySelector('#discreetOverlay');if(state.discreet){if(!el){el=document.createElement('div');el.id='discreetOverlay';el.className='discreet-overlay';document.body.appendChild(el)}el.innerHTML=`<div><span class="brand-orb"></span><small>KORAVERSE FOCUS</small><b>${new Date().toLocaleTimeString(state.lang==='es'?'es-DO':'en-US',{hour:'2-digit',minute:'2-digit'})}</b><p>${state.lang==='es'?'Sesión pausada. Ctrl + Espacio para volver.':'Session paused. Ctrl + Space to return.'}</p></div>`;el.classList.add('show')}else el?.classList.remove('show')}
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.code==='Space'){e.preventDefault();return toggleDiscreet()}if(e.key==='Enter'&&e.target?.id==='chatInput'){e.preventDefault();const v=e.target.value;e.target.value='';sendTyping(false);sendChatMessage(v)}})

init()
