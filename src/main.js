import { createClient } from '@supabase/supabase-js'
import './style.css'
import { bank, missions, matchQs, quotes } from './data.js'

const app = document.querySelector('#app')
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('TU-PROYECTO'))
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null

const CATS = ['got', 'marvel', 'series', 'movies']
const SESSION_KEY = 'koraverse_session_v2'
const PLAYER_KEY = 'koraverse_player_id_v2'

const rt = {
  playerId: localStorage.getItem(PLAYER_KEY) || crypto.randomUUID(),
  name: localStorage.getItem('koraverse_player_name') || 'Carlos',
  role: null,
  roomCode: null,
  channel: null,
  connected: false,
  players: [],
  game: freshGame(),
  localAnswer: null,
  pendingTrivia: {},
  pendingMatch: {},
  seenEvents: new Set(),
  caseTimer: null,
  attackTimer: null,
  currentScreen: 'home',
  joinPrefill: new URLSearchParams(location.search).get('room')?.toUpperCase() || '',
}
localStorage.setItem(PLAYER_KEY, rt.playerId)

function freshGame() {
  return {
    version: 2,
    screen: 'lobby',
    mode: null,
    scores: {},
    streak: 0,
    triviaCount: 0,
    casesTotal: 0,
    currentCat: 'got',
    roundId: 0,
    questionIndex: null,
    matchIndex: null,
    roundStatus: null,
    lastResult: null,
    mission: null,
    casePhase: null,
    caseCount: 0,
    bossHP: 100,
    gardenUnlocked: false,
    updatedAt: Date.now(),
  }
}

function catName(c) {
  return { got: 'Game of Thrones', marvel: 'Marvel / Avengers', series: 'Series famosas', movies: 'Cine' }[c]
}
function sumScores() { return Object.values(rt.game.scores || {}).reduce((a, b) => a + Number(b || 0), 0) }
function meScore() { return Number(rt.game.scores?.[rt.playerId] || 0) }
function otherPlayer() { return rt.players.find(p => p.player_id !== rt.playerId) }
function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])) }
function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
function eventId() { return `${rt.playerId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}` }

function baseShell(content) {
  const partner = otherPlayer()
  const roomPill = rt.roomCode ? `<div class="pill roomMini">Sala <code>${rt.roomCode}</code></div>` : ''
  const partnerPill = rt.roomCode
    ? `<div class="pill"><span class="dot" style="background:${partner ? 'var(--green)' : 'var(--gold)'}"></span>${partner ? escapeHtml(partner.name) + ' conectado/a' : 'Esperando cómplice'}</div>`
    : ''
  return `
    <div class="bg"></div><div class="noise"></div><div class="toast" id="toast">Listo</div>
    <div class="cow-mascot" id="cowMascot" data-action="cow"><div class="cow-tip" id="cowTip">Moo. Dos personas, una sola dimensión.</div><div class="cow-face">🐮</div></div>
    <div class="app">
      <header class="topbar">
        <div class="brand"><span class="mark"></span>KORAVERSE <span class="roleTag">DUO REALTIME</span></div>
        <div class="userline">
          ${rt.roomCode ? `<div class="pill">⭐ ${sumScores()} pts · tú ${meScore()}</div>` : ''}
          ${roomPill}${partnerPill}
        </div>
      </header>
      ${content}
    </div>`
}

function renderHome() {
  clearLoops()
  rt.currentScreen = 'home'
  const setup = !configured ? `
    <div class="notice" style="margin-top:18px">
      <b>Falta configurar Supabase.</b> Copia <code>.env.example</code> a <code>.env.local</code> y coloca VITE_SUPABASE_URL y VITE_SUPABASE_KEY. La guía README.md explica el despliegue en Vercel.
    </div>` : ''
  app.innerHTML = baseShell(`
    <section class="page active" id="home">
      <div class="hero">
        <div>
          <div class="eyebrow">trivias · misiones · tiempo real · modo cómplice</div>
          <h1>Dos pantallas. Un mismo KORAVERSE.</h1>
          <p>Crea una sala privada, comparte el enlace y jueguen desde dos computadoras o móviles. Las respuestas se bloquean, se revelan juntas y los puntos se sincronizan en tiempo real.</p>
          <div class="row" style="margin-bottom:12px">
            <input class="input" id="playerName" value="${escapeHtml(rt.name)}" placeholder="Tu nombre" maxlength="24">
          </div>
          <div class="roomGrid">
            <div class="roomCard">
              <h3>✨ Crear sala</h3><p>Tú serás el anfitrión y recibirás un código para compartir.</p>
              <button class="btn primary ${!configured?'disabled':''}" data-action="create-room">Crear partida</button>
            </div>
            <div class="roomCard">
              <h3>🔗 Unirme</h3><p>Introduce el código que te enviaron.</p>
              <div class="row"><input class="input" id="roomCodeInput" value="${escapeHtml(rt.joinPrefill)}" placeholder="ABC123" maxlength="6" style="text-transform:uppercase;min-width:150px"><button class="btn soft ${!configured?'disabled':''}" data-action="join-room">Entrar</button></div>
            </div>
          </div>
          ${setup}
        </div>
        <div class="orbit"><div class="ring r2"></div><div class="ring r1"></div><div class="core"></div><div class="chip c1">🐉 Game of Thrones</div><div class="chip c2">🦸 Marvel / Avengers</div><div class="chip c3">📺 Series famosas</div><div class="chip c4">🎬 Cine</div></div>
      </div>
    </section>`)
}

function renderLobby() {
  clearLoops()
  rt.currentScreen = 'lobby'
  const invite = `${location.origin}${location.pathname}?room=${rt.roomCode}`
  const rows = rt.players.length ? rt.players.map(p => `
    <div class="playerRow"><div class="meta"><span class="avatar">${escapeHtml((p.name||'?').slice(0,1).toUpperCase())}</span><div><b>${escapeHtml(p.name)}</b><small style="display:block;color:var(--muted);margin-top:2px">${p.role === 'host' ? 'Anfitrión' : 'Cómplice'}</small></div></div><span class="statusDot"></span></div>`).join('') : `<div class="waitPanel">Conectando con la dimensión...</div>`
  const ready = rt.players.length >= 2
  app.innerHTML = baseShell(`
    <section class="page active">
      <button class="back" data-action="leave-room">← salir de la sala</button>
      <div class="sectionHead"><div class="eyebrow">sala multijugador</div><h2>KORAVERSE Link</h2><p>Comparte el código o el enlace. La partida comienza cuando ambos estén conectados.</p></div>
      <div class="lobbyGrid">
        <div class="roomCard">
          <span class="label">Código de sala</span><div class="roomCode">${rt.roomCode}</div>
          <div class="copyBox"><code>${escapeHtml(invite)}</code><button class="btn soft" data-action="copy-invite">Copiar</button></div>
          <div style="margin-top:14px" class="connectionBadge ${ready?'':'waiting'}"><span class="statusDot"></span>${ready?'2 jugadores conectados':'Esperando al segundo jugador'}</div>
        </div>
        <div class="roomCard"><span class="label">Participantes</span><div class="playerList">${rows}</div>
          ${rt.role === 'host'
            ? `<button style="margin-top:16px;width:100%" class="btn primary ${ready?'':'disabled'}" data-action="start-game">${ready?'Entrar al KORAVERSE':'Esperando cómplice...'}</button><div class="hostHint">El anfitrión controla el estado maestro; ambos pueden elegir juegos una vez dentro.</div>`
            : `<div class="waitPanel">${ready?'Conexión establecida. Esperando que el anfitrión abra el universo.':'Esperando al anfitrión...'}</div>`}
        </div>
      </div>
    </section>`)
}

function renderHub() {
  clearLoops()
  rt.currentScreen = 'hub'
  app.innerHTML = baseShell(`
    <section class="page active">
      <div class="sectionHead"><div class="eyebrow">elige una zona del KORAVERSE</div><h2>Trivia Realm</h2><p>Ambos responden desde su propia pantalla. Las elecciones permanecen ocultas hasta que los dos hayan contestado.</p></div>
      <div class="stats">
        <div class="stat"><small>Puntos del dúo</small><b>${sumScores()}</b></div>
        <div class="stat"><small>Racha perfecta</small><b>${rt.game.streak}</b></div>
        <div class="stat"><small>Trivias</small><b>${rt.game.triviaCount}</b></div>
        <div class="stat"><small>Casos eliminados</small><b>${rt.game.casesTotal}</b></div>
      </div>
      <div class="duoScores">${rt.players.slice(0,2).map(p=>`<div class="duoScore"><small>${escapeHtml(p.name)}</small><b>${rt.game.scores?.[p.player_id]||0} pts</b></div>`).join('')}</div>
      <div class="categoryGrid" style="margin-top:16px">
        ${category('🐉','Game of Thrones','Casas, personajes, lugares y momentos memorables.','got','#9c76ff','favorita')}
        ${category('🦸','Marvel / Avengers','Vengadores, villanos, artefactos y MCU.','marvel','#ff6f78','universo')}
        ${category('📺','Series famosas','Breaking Bad, Friends, Stranger Things, The Office y más.','series','#57d0ff','mix')}
        ${category('🎬','Películas','Clásicos, sagas, directores y cultura pop.','movies','#ffd56a','cine')}
        <button class="category" style="--glow:#72e4a5" data-action="mission"><span class="tag">oficina</span><div class="icon">🕵️</div><span class="zone-note">Office Missions</span><h3>Mission Control</h3><p>Uno recibe el reto; el otro lo valida desde su pantalla.</p></button>
        <button class="category" style="--glow:#ff9dc7" data-action="match"><span class="tag">duo</span><div class="icon">🤝</div><span class="zone-note">Duo Mode</span><h3>Sync Mode</h3><p>Ambos eligen en secreto y el sistema revela si coincidieron.</p></button>
        <button class="category" style="--glow:#f0ad5b" data-action="cases"><span class="tag">co-op</span><div class="icon">📁</div><span class="zone-note">Battle Zone</span><h3>Case Arena</h3><p>Ambas pantallas eliminan expedientes y comparten el HP del boss.</p></button>
        <button class="category" style="--glow:#8be2a5" data-action="garden"><span class="tag">${rt.game.gardenUnlocked?'abierto':'bloqueado'}</span><div class="icon">🌷</div><span class="zone-note">Reward Zone</span><h3>The Garden</h3><p>${rt.game.gardenUnlocked?'La recompensa del dúo está disponible.':'Derroten al boss final para hacerlo florecer.'}</p></button>
      </div>
    </section>`)
}

function category(icon,title,desc,cat,glow,tag) {
  return `<button class="category" style="--glow:${glow}" data-action="trivia" data-cat="${cat}"><span class="tag">${tag}</span><div class="icon">${icon}</div><span class="zone-note">Trivia Realm</span><h3>${title}</h3><p>${desc}</p></button>`
}

function renderPlay() {
  rt.currentScreen = 'play'
  const content = rt.game.mode === 'trivia' ? triviaCard()
    : rt.game.mode === 'match' ? matchCard()
    : rt.game.mode === 'mission' ? missionCard()
    : rt.game.mode === 'cases' ? casesCard()
    : `<div class="center"><div><div class="big">Esperando estado de juego...</div></div></div>`
  app.innerHTML = baseShell(`
    <section class="page active"><button class="back" data-action="hub">← menú principal</button>
      <div class="layout"><aside class="side"><div class="eyebrow" style="margin:6px 0 12px">atajos</div><div class="menu">
        <button class="menuBtn" data-action="trivia" data-cat="got"><span class="ico">🐉</span><span><b>Game of Thrones</b><small>Trivia Realm</small></span></button>
        <button class="menuBtn" data-action="trivia" data-cat="marvel"><span class="ico">🦸</span><span><b>Marvel</b><small>Trivia Realm</small></span></button>
        <button class="menuBtn" data-action="trivia" data-cat="series"><span class="ico">📺</span><span><b>Series</b><small>Trivia Realm</small></span></button>
        <button class="menuBtn" data-action="trivia" data-cat="movies"><span class="ico">🎬</span><span><b>Cine</b><small>Trivia Realm</small></span></button>
        <button class="menuBtn" data-action="mission"><span class="ico">🕵️</span><span><b>Misión</b><small>Mission Control</small></span></button>
        <button class="menuBtn" data-action="match"><span class="ico">🤝</span><span><b>Sync Mode</b><small>Duo Mode</small></span></button>
        <button class="menuBtn" data-action="cases"><span class="ico">📁</span><span><b>Case Arena</b><small>Co-op</small></span></button>
      </div></aside><main class="stage stagePulse" id="stage">${content}</main></div>
    </section>`)
  if (rt.game.mode === 'cases') startCaseOrBossLoops()
}

function triviaCard() {
  const q = bank[rt.game.currentCat]?.[rt.game.questionIndex]
  if (!q) return '<div class="center"><div class="big">Pregunta no disponible.</div></div>'
  const result = rt.game.roundStatus === 'result' ? rt.game.lastResult : null
  const mine = result?.answers?.[rt.playerId] ?? (rt.localAnswer?.roundId === rt.game.roundId ? rt.localAnswer.index : null)
  const locked = rt.localAnswer?.roundId === rt.game.roundId || Boolean(result)
  const buttons = q.a.map((x,i) => {
    let cls = 'answer'
    if (locked) cls += ' locked'
    if (mine === i) cls += ' mine'
    if (result && i === result.correctIndex) cls += ' correct'
    if (result && mine === i && i !== result.correctIndex) cls += ' wrong'
    return `<button class="${cls}" data-action="answer-trivia" data-index="${i}">${String.fromCharCode(65+i)}. ${escapeHtml(x)}</button>`
  }).join('')
  let footer = `<div class="waitPanel">Elige una respuesta. No verás la elección de tu cómplice hasta que ambos hayan contestado.</div>`
  if (locked && !result) footer = `<div class="waitPanel"><b>✅ Respuesta bloqueada.</b><br>Esperando la respuesta de ${escapeHtml(otherPlayer()?.name || 'tu cómplice')}...</div>`
  if (result) {
    const rows = rt.players.slice(0,2).map(p => {
      const idx = result.answers?.[p.player_id]
      const ok = idx === result.correctIndex
      return `<div class="scoreBox"><b>${escapeHtml(p.name)}</b>${idx == null ? 'Sin respuesta' : `${String.fromCharCode(65+idx)}. ${escapeHtml(q.a[idx])} ${ok?'✅':'❌'}`}</div>`
    }).join('')
    footer = `<div class="scoreBoard">${rows}</div><div class="resultBanner">${result.bothCorrect?'✨ DUO PERFECT · bonus de sincronía':'Ronda revelada'}</div><div class="row" style="margin-top:14px"><button class="btn primary" data-action="next-trivia">Otra de ${catName(rt.game.currentCat)}</button><button class="btn soft" data-action="random-trivia">Aleatoria</button></div>`
  }
  return `<div class="card"><div class="row" style="justify-content:space-between;align-items:center"><span class="label">${catName(rt.game.currentCat)}</span><span class="streak">🔥 racha ${rt.game.streak}</span></div><h3>${escapeHtml(q.q)}</h3><p>Ronda ${rt.game.roundId}. Ambos responden de forma independiente.</p><div class="answers">${buttons}</div><div id="roundFooter">${footer}</div></div>`
}

function matchCard() {
  const m = matchQs[rt.game.matchIndex]
  if (!m) return '<div class="center"><div class="big">Pregunta de sincronía no disponible.</div></div>'
  const result = rt.game.roundStatus === 'result' ? rt.game.lastResult : null
  const mine = result?.answers?.[rt.playerId] ?? (rt.localAnswer?.roundId === rt.game.roundId ? rt.localAnswer.index : null)
  const locked = rt.localAnswer?.roundId === rt.game.roundId || Boolean(result)
  const buttons = m.o.map((x,i)=>`<button class="answer ${locked?'locked':''} ${mine===i?'mine':''}" data-action="answer-match" data-index="${i}">${escapeHtml(x)}</button>`).join('')
  let footer = locked && !result ? `<div class="waitPanel">✅ Elección bloqueada. Esperando a ${escapeHtml(otherPlayer()?.name || 'tu cómplice')}...</div>` : `<div class="waitPanel">Elijan sin decirse nada. El resultado aparece cuando ambos terminen.</div>`
  if (result) {
    const rows = rt.players.slice(0,2).map(p=>`<div class="scoreBox"><b>${escapeHtml(p.name)}</b>${escapeHtml(m.o[result.answers?.[p.player_id]] ?? 'Sin respuesta')}</div>`).join('')
    footer = `<div class="scoreBoard">${rows}</div><div class="resultBanner">${result.same?'✨ COINCIDENCIA DESBLOQUEADA · +10 cada uno':'👀 Hoy pensaron distinto'}</div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" data-action="next-match">Otra</button></div>`
  }
  return `<div class="card"><span class="label">duelo de coincidencia</span><h3>${escapeHtml(m.q)}</h3><p>Respuesta privada hasta que los dos hayan elegido.</p><div class="answers">${buttons}</div>${footer}</div>`
}

function missionCard() {
  const m = rt.game.mission
  if (!m) return '<div class="center"><div class="big">Generando misión...</div></div>'
  const assignee = rt.players.find(p=>p.player_id===m.assigneeId)
  const validator = rt.players.find(p=>p.player_id===m.validatorId)
  let controls = ''
  if (m.status === 'pending') {
    if (rt.playerId === m.validatorId) controls = `<div class="row"><button class="btn primary" data-action="validate-mission" data-approved="true">VALIDAR ${m.code}</button><button class="btn soft" data-action="validate-mission" data-approved="false">Aún no</button></div>`
    else controls = `<div class="waitPanel">Cuando termines, avisa a <b>${escapeHtml(validator?.name || 'tu cómplice')}</b>. La validación aparecerá directamente en su pantalla.</div>`
  } else if (m.status === 'approved') controls = `<div class="resultBanner">✅ Misión validada por ${escapeHtml(validator?.name || 'tu cómplice')} · +15 / +5 pts</div><div class="row" style="margin-top:14px"><button class="btn primary" data-action="mission">Otra misión</button></div>`
  else controls = `<div class="notice">⏳ El validador indicó que aún no está lista.</div><div class="row" style="margin-top:14px"><button class="btn primary" data-action="mission">Nueva misión</button></div>`
  return `<div class="card"><span class="label">misión de oficina · asignada a ${escapeHtml(assignee?.name || 'jugador')}</span><h3>Reto discreto</h3><p>${escapeHtml(m.text)}</p><div class="validation"><strong>Código ${m.code}</strong><p>${escapeHtml(validator?.name || 'El cómplice')} es quien puede validar esta misión.</p>${controls}</div></div>`
}

function casesCard() {
  if (rt.game.casePhase === 'boss') {
    return `<div><div class="sectionHead" style="margin-bottom:12px"><div class="eyebrow">boss final · co-op</div><h2 style="font-size:34px;margin:6px 0">Lic. Urgentísimo</h2><p>Los clics de ambos reducen la misma barra de vida.</p></div><div class="bossArena" id="bossArena"><div><div class="boss" id="boss" data-action="hit-boss"><div class="mouth"></div></div><div class="bossName">LIC. URGENTÍSIMO</div><div class="hp"><i id="hp" style="width:${rt.game.bossHP}%"></i></div><div id="hpText" style="font-size:11px;color:#aab0c1;margin-top:8px;text-align:center">HP ${rt.game.bossHP}/100 · ambos pueden atacar</div></div></div></div>`
  }
  return `<div><div class="sectionHead" style="margin-bottom:12px"><div class="eyebrow">minijuego cooperativo</div><h2 style="font-size:34px;margin:6px 0">Case Arena</h2><p>Los expedientes aparecen de forma independiente en ambas pantallas, pero todos cuentan para una sola meta.</p></div><div class="caseArena" id="arena"></div><div class="hud"><span>Eliminados por el dúo: <b id="caseScore">${rt.game.caseCount}</b>/12</span><span>Total histórico: <b id="caseTotal">${rt.game.casesTotal}</b></span></div></div>`
}

function renderGarden() {
  clearLoops()
  rt.currentScreen = 'garden'
  const unlocked = rt.game.gardenUnlocked
  app.innerHTML = baseShell(`<section class="page active"><button class="back" data-action="hub">← volver</button><div class="garden" id="garden"><div class="sun"></div><div class="cloud cl1"></div><div class="cloud cl2"></div><div class="quote"><h3 id="gardenTitle">${unlocked?'KORAVERSE restaurado.':'The Garden está dormido.'}</h3><p id="gardenQuote">${unlocked?'Por hoy, el caos perdió. Toca una flor y reclama tu recompensa.':'Derroten juntos al Lic. Urgentísimo para hacerlo florecer.'}</p></div></div></section>`)
  if (unlocked) buildFlowers()
}

function renderFromGame() {
  if (!rt.roomCode) return renderHome()
  if (rt.game.screen === 'lobby') return renderLobby()
  if (rt.game.screen === 'hub') return renderHub()
  if (rt.game.screen === 'garden') return renderGarden()
  return renderPlay()
}

async function connectRoom(role, code, name, {resume=false}={}) {
  if (!configured) return toast('Configura Supabase primero')
  if (rt.channel) await supabase.removeChannel(rt.channel)
  clearLoops()
  rt.role = role
  rt.roomCode = code.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)
  rt.name = name.trim().slice(0,24) || (role === 'host' ? 'Carlos' : 'Cómplice')
  rt.connected = false
  rt.players = []
  localStorage.setItem('koraverse_player_name', rt.name)
  localStorage.setItem(SESSION_KEY, JSON.stringify({roomCode:rt.roomCode, role:rt.role, name:rt.name, playerId:rt.playerId}))
  history.replaceState({}, '', `${location.pathname}?room=${rt.roomCode}`)
  if (role === 'host') {
    rt.game = resume ? restoreHostState() : freshGame()
    rt.game.screen = rt.game.screen || 'lobby'
  } else {
    rt.game = freshGame()
  }
  renderLobby()
  const topic = `koraverse:${rt.roomCode}`
  rt.channel = supabase.channel(topic, {
    config: {
      broadcast: { self: true, ack: true },
      presence: { key: rt.playerId },
      private: false,
    }
  })
  attachChannelHandlers(rt.channel)
  rt.channel.subscribe(async status => {
    if (status === 'SUBSCRIBED') {
      rt.connected = true
      await rt.channel.track({ player_id: rt.playerId, name: rt.name, role: rt.role, online_at: new Date().toISOString() })
      if (rt.role === 'guest') setTimeout(() => send('request_state', { requesterId: rt.playerId }), 250)
      if (rt.role === 'host') setTimeout(() => broadcastState(), 350)
    }
    if (['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)) {
      rt.connected = false
      toast('Conexión Realtime interrumpida')
    }
  })
}

function attachChannelHandlers(ch) {
  ch.on('presence', {event:'sync'}, syncPresence)
  ch.on('presence', {event:'join'}, syncPresence)
  ch.on('presence', {event:'leave'}, syncPresence)
  ch.on('broadcast', {event:'request_state'}, ({payload}) => { if (rt.role === 'host') broadcastState(payload?.requesterId) })
  ch.on('broadcast', {event:'state_snapshot'}, ({payload}) => receiveState(payload))
  ch.on('broadcast', {event:'host_action'}, ({payload}) => { if (rt.role === 'host') handleHostAction(payload) })
  ch.on('broadcast', {event:'trivia_answer'}, ({payload}) => onTriviaAnswer(payload))
  ch.on('broadcast', {event:'match_answer'}, ({payload}) => onMatchAnswer(payload))
  ch.on('broadcast', {event:'mission_validate'}, ({payload}) => onMissionValidation(payload))
  ch.on('broadcast', {event:'case_hit'}, ({payload}) => onCaseHit(payload))
  ch.on('broadcast', {event:'case_count'}, ({payload}) => onCaseCount(payload))
  ch.on('broadcast', {event:'boss_hit'}, ({payload}) => onBossHit(payload))
  ch.on('broadcast', {event:'boss_hp'}, ({payload}) => onBossHP(payload))
}

function syncPresence() {
  if (!rt.channel) return
  const state = rt.channel.presenceState()
  const flat = Object.values(state).flat().filter(Boolean)
  const unique = new Map()
  for (const p of flat) if (p.player_id) unique.set(p.player_id, p)
  rt.players = [...unique.values()].sort((a,b) => (a.role==='host'?-1:1) - (b.role==='host'?-1:1))
  if (rt.role === 'host') {
    for (const p of rt.players.slice(0,2)) if (rt.game.scores[p.player_id] == null) rt.game.scores[p.player_id] = 0
    persistHostState()
  }
  renderFromGame()
  if (rt.role === 'host' && rt.connected) setTimeout(() => broadcastState(), 100)
}

function send(event, payload={}) {
  if (!rt.channel) return Promise.resolve()
  return rt.channel.send({ type:'broadcast', event, payload })
}
function broadcastState(target=null) {
  if (rt.role !== 'host') return
  rt.game.updatedAt = Date.now()
  persistHostState()
  send('state_snapshot', { game: rt.game, target })
}
function receiveState(payload) {
  if (!payload?.game) return
  if (payload.target && payload.target !== rt.playerId) return
  const previousRound = rt.game.roundId
  rt.game = payload.game
  if (previousRound !== rt.game.roundId) rt.localAnswer = null
  renderFromGame()
}
function persistHostState() {
  if (rt.role === 'host' && rt.roomCode) localStorage.setItem(`koraverse_host_${rt.roomCode}`, JSON.stringify(rt.game))
}
function restoreHostState() {
  try { return JSON.parse(localStorage.getItem(`koraverse_host_${rt.roomCode}`)) || freshGame() } catch { return freshGame() }
}
function commitGame() {
  rt.game.updatedAt = Date.now()
  persistHostState()
  renderFromGame()
  broadcastState()
}
function hostAction(action, data={}) {
  const payload = { action, data, requesterId: rt.playerId, requesterName: rt.name, id:eventId() }
  if (rt.role === 'host') handleHostAction(payload)
  else send('host_action', payload)
}
function activePlayers() { return rt.players.slice(0,2).map(p=>p.player_id) }

function handleHostAction(msg) {
  if (!msg?.action || rt.seenEvents.has(msg.id)) return
  rt.seenEvents.add(msg.id)
  const ids = activePlayers()
  ids.forEach(id => { if (rt.game.scores[id] == null) rt.game.scores[id] = 0 })
  switch (msg.action) {
    case 'start_game':
      if (ids.length < 2) return toast('Falta el segundo jugador')
      rt.game.screen='hub'; rt.game.mode=null; commitGame(); break
    case 'hub': rt.game.screen='hub'; rt.game.mode=null; commitGame(); break
    case 'trivia': startTrivia(msg.data.cat || 'got'); break
    case 'random_trivia': startTrivia(CATS[Math.floor(Math.random()*CATS.length)]); break
    case 'match': startMatch(); break
    case 'mission': startMission(msg.requesterId); break
    case 'cases': startCases(); break
    case 'garden': rt.game.screen='garden'; rt.game.mode='garden'; commitGame(); break
  }
}

function startTrivia(cat) {
  rt.game.screen='play'; rt.game.mode='trivia'; rt.game.currentCat=cat; rt.game.roundId++
  rt.game.questionIndex=Math.floor(Math.random()*bank[cat].length); rt.game.roundStatus='answering'; rt.game.lastResult=null
  rt.pendingTrivia[rt.game.roundId]={}
  rt.localAnswer=null
  commitGame()
}
function startMatch() {
  rt.game.screen='play'; rt.game.mode='match'; rt.game.roundId++; rt.game.matchIndex=Math.floor(Math.random()*matchQs.length)
  rt.game.roundStatus='answering'; rt.game.lastResult=null; rt.pendingMatch[rt.game.roundId]={}; rt.localAnswer=null; commitGame()
}
function startMission(requesterId) {
  const ids=activePlayers(); if(ids.length<2) return
  const validatorId=ids.find(id=>id!==requesterId) || ids[1]
  const assigneeId=requesterId || ids[0]
  const assignee=rt.players.find(p=>p.player_id===assigneeId)
  const validator=rt.players.find(p=>p.player_id===validatorId)
  const raw=missions[Math.floor(Math.random()*missions.length)]
  const txt=raw.replaceAll('{p}', validator?.name || 'tu cómplice')
  rt.game.screen='play';rt.game.mode='mission';rt.game.roundId++;rt.game.mission={text:txt,code:Math.random().toString(36).slice(2,6).toUpperCase(),assigneeId,validatorId,status:'pending',assigneeName:assignee?.name,validatorName:validator?.name};commitGame()
}
function startCases() {
  rt.game.screen='play';rt.game.mode='cases';rt.game.roundId++;rt.game.casePhase='cases';rt.game.caseCount=0;rt.game.bossHP=100;commitGame()
}

function answerTrivia(index) {
  if (rt.game.roundStatus !== 'answering' || rt.localAnswer?.roundId === rt.game.roundId) return
  rt.localAnswer={roundId:rt.game.roundId,index}; renderPlay()
  send('trivia_answer',{roundId:rt.game.roundId,playerId:rt.playerId,name:rt.name,index,id:eventId()})
}
function onTriviaAnswer(p) {
  if (!p || p.roundId !== rt.game.roundId || rt.game.mode!=='trivia' || rt.game.roundStatus!=='answering') return
  if (p.playerId===rt.playerId && !rt.localAnswer) {rt.localAnswer={roundId:p.roundId,index:p.index}; renderPlay()}
  if (rt.role!=='host') return
  rt.pendingTrivia[p.roundId] ||= {}
  rt.pendingTrivia[p.roundId][p.playerId]=p.index
  const ids=activePlayers(); if(ids.length<2 || !ids.every(id=>rt.pendingTrivia[p.roundId][id] != null)) return
  const q=bank[rt.game.currentCat][rt.game.questionIndex]
  const answers={...rt.pendingTrivia[p.roundId]}
  const bothCorrect=ids.every(id=>answers[id]===q.c)
  ids.forEach(id=>{if(answers[id]===q.c) rt.game.scores[id]=(rt.game.scores[id]||0)+20})
  if(bothCorrect){ids.forEach(id=>rt.game.scores[id]+=15);rt.game.streak++}else rt.game.streak=0
  rt.game.triviaCount++; rt.game.roundStatus='result'; rt.game.lastResult={answers,correctIndex:q.c,bothCorrect}; commitGame(); if(bothCorrect) confetti()
}
function answerMatch(index) {
  if (rt.game.roundStatus !== 'answering' || rt.localAnswer?.roundId === rt.game.roundId) return
  rt.localAnswer={roundId:rt.game.roundId,index};renderPlay();send('match_answer',{roundId:rt.game.roundId,playerId:rt.playerId,index,id:eventId()})
}
function onMatchAnswer(p) {
  if(!p||p.roundId!==rt.game.roundId||rt.game.mode!=='match'||rt.game.roundStatus!=='answering') return
  if(p.playerId===rt.playerId&&!rt.localAnswer){rt.localAnswer={roundId:p.roundId,index:p.index};renderPlay()}
  if(rt.role!=='host') return
  rt.pendingMatch[p.roundId] ||= {};rt.pendingMatch[p.roundId][p.playerId]=p.index
  const ids=activePlayers();if(ids.length<2||!ids.every(id=>rt.pendingMatch[p.roundId][id]!=null)) return
  const answers={...rt.pendingMatch[p.roundId]};const same=answers[ids[0]]===answers[ids[1]]
  if(same) ids.forEach(id=>rt.game.scores[id]=(rt.game.scores[id]||0)+10)
  rt.game.roundStatus='result';rt.game.lastResult={answers,same};commitGame();if(same)confetti()
}
function validateMission(approved) { send('mission_validate',{roundId:rt.game.roundId,playerId:rt.playerId,approved,id:eventId()}) }
function onMissionValidation(p) {
  if(rt.role!=='host'||!p||rt.game.mode!=='mission'||p.roundId!==rt.game.roundId||p.playerId!==rt.game.mission?.validatorId||rt.game.mission.status!=='pending') return
  rt.game.mission.status=p.approved?'approved':'rejected'
  if(p.approved){rt.game.scores[rt.game.mission.assigneeId]=(rt.game.scores[rt.game.mission.assigneeId]||0)+15;rt.game.scores[rt.game.mission.validatorId]=(rt.game.scores[rt.game.mission.validatorId]||0)+5}
  commitGame();if(p.approved)confetti()
}

function startCaseOrBossLoops() {
  clearLoops()
  if(rt.game.casePhase==='cases') {
    spawnCase(); rt.caseTimer=setInterval(()=>{ if(rt.game.mode==='cases'&&rt.game.casePhase==='cases') spawnCase() },700)
  } else if(rt.game.casePhase==='boss') {
    rt.attackTimer=setInterval(()=>spawnAttack(),500)
  }
}
function spawnCase() {
  const arena=document.getElementById('arena');if(!arena||rt.game.caseCount>=12)return
  const b=document.createElement('button');b.className='case';b.textContent=['INC-204','REQ-118','CAS-077','REV-009','URG-313'][Math.floor(Math.random()*5)]
  b.style.left=(4+Math.random()*80)+'%';b.style.top=(6+Math.random()*77)+'%';
  b.addEventListener('click',()=>{b.remove();send('case_hit',{roundId:rt.game.roundId,playerId:rt.playerId,id:eventId()})},{once:true});arena.appendChild(b);setTimeout(()=>b.remove(),2100)
}
function onCaseHit(p) {
  if(rt.role!=='host'||!p||rt.game.mode!=='cases'||rt.game.casePhase!=='cases'||p.roundId!==rt.game.roundId||rt.seenEvents.has(p.id)) return
  rt.seenEvents.add(p.id);rt.game.caseCount=Math.min(12,rt.game.caseCount+1);rt.game.casesTotal++
  persistHostState();send('case_count',{roundId:rt.game.roundId,count:rt.game.caseCount,total:rt.game.casesTotal})
  updateCaseHud(rt.game.caseCount,rt.game.casesTotal)
  if(rt.game.caseCount>=12){rt.game.casePhase='boss';rt.game.bossHP=100;setTimeout(()=>commitGame(),250)}
}
function onCaseCount(p) {
  if(!p||p.roundId!==rt.game.roundId||rt.game.mode!=='cases'||rt.game.casePhase!=='cases')return
  rt.game.caseCount=p.count;rt.game.casesTotal=p.total;updateCaseHud(p.count,p.total)
}
function updateCaseHud(count,total){const a=document.getElementById('caseScore'),b=document.getElementById('caseTotal');if(a)a.textContent=count;if(b)b.textContent=total}
function hitBoss(){if(rt.game.mode!=='cases'||rt.game.casePhase!=='boss')return;const b=document.getElementById('boss');b?.animate([{transform:'scale(1)'},{transform:'scale(.88) rotate(4deg)'},{transform:'scale(1)'}],{duration:170});send('boss_hit',{roundId:rt.game.roundId,playerId:rt.playerId,id:eventId()})}
function onBossHit(p){
  if(rt.role!=='host'||!p||rt.game.mode!=='cases'||rt.game.casePhase!=='boss'||p.roundId!==rt.game.roundId||rt.seenEvents.has(p.id))return
  rt.seenEvents.add(p.id);rt.game.bossHP=Math.max(0,rt.game.bossHP-8);persistHostState();send('boss_hp',{roundId:rt.game.roundId,hp:rt.game.bossHP});updateBossHud(rt.game.bossHP)
  if(rt.game.bossHP<=0){activePlayers().forEach(id=>rt.game.scores[id]=(rt.game.scores[id]||0)+50);rt.game.gardenUnlocked=true;rt.game.screen='garden';rt.game.mode='garden';setTimeout(()=>{commitGame();confetti()},500)}
}
function onBossHP(p){if(!p||p.roundId!==rt.game.roundId)return;rt.game.bossHP=p.hp;updateBossHud(p.hp)}
function updateBossHud(hp){const bar=document.getElementById('hp'),txt=document.getElementById('hpText');if(bar)bar.style.width=hp+'%';if(txt)txt.textContent=`HP ${hp}/100 · ambos pueden atacar`}
function spawnAttack(){const a=document.getElementById('bossArena');if(!a)return;const x=document.createElement('div');x.className='attack';x.textContent=['URGENTE','¿STATUS?','PARA HOY','FOLLOW-UP','FAVOR VALIDAR'][Math.floor(Math.random()*5)];x.style.left=(8+Math.random()*78)+'%';x.style.top='-8px';a.appendChild(x);setTimeout(()=>x.remove(),1500)}
function clearLoops(){if(rt.caseTimer){clearInterval(rt.caseTimer);rt.caseTimer=null}if(rt.attackTimer){clearInterval(rt.attackTimer);rt.attackTimer=null}}

function buildFlowers(){const g=document.getElementById('garden');if(!g)return;const colors=['#ff8fb1','#ffe16f','#a886ff','#ffac78','#7fdca7','#6fc7ff'];for(let i=0;i<28;i++){const f=document.createElement('div');f.className='flower';f.style.left=(3+Math.random()*93)+'%';f.style.bottom=(36+Math.random()*76)+'px';f.style.background=colors[Math.floor(Math.random()*colors.length)];f.style.animationDelay=(Math.random()*.8)+'s';const s=document.createElement('span');s.className='stem';f.appendChild(s);f.addEventListener('click',()=>{document.getElementById('gardenQuote').textContent=quotes[Math.floor(Math.random()*quotes.length)];f.animate([{transform:'scale(1)'},{transform:'scale(1.45) rotate(8deg)'},{transform:'scale(1)'}],{duration:420})});g.appendChild(f)}}
function confetti(){const colors=['#8b7cff','#56c8ff','#ff7fb0','#ffd56a','#7ce3a7'];for(let i=0;i<36;i++){const d=document.createElement('div');d.className='confetti';d.style.left=(45+Math.random()*10)+'vw';d.style.top='15vh';d.style.background=colors[Math.floor(Math.random()*colors.length)];d.style.animationDelay=(Math.random()*.15)+'s';document.body.appendChild(d);setTimeout(()=>d.remove(),1400)}}
function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function cowMessage(){const m=document.getElementById('cowMascot'),t=document.getElementById('cowTip');if(!m||!t)return;const arr=['Moo. Ahora sí son dos pantallas de verdad.','Si aparece otro URGENTE, atáquenlo entre ambos.','KORAVERSE Link estable. Nada de registrar respuestas por Teams.','El Garden se gana en pareja.'];t.textContent=arr[Math.floor(Math.random()*arr.length)];m.classList.add('show-tip');setTimeout(()=>m.classList.remove('show-tip'),2600)}

async function leaveRoom(){clearLoops();if(rt.channel&&supabase)await supabase.removeChannel(rt.channel);rt.channel=null;rt.roomCode=null;rt.role=null;rt.players=[];rt.game=freshGame();localStorage.removeItem(SESSION_KEY);history.replaceState({},'',location.pathname);renderHome()}

app.addEventListener('click', async e => {
  const el=e.target.closest('[data-action]');if(!el)return
  const action=el.dataset.action
  if(action==='cow') return cowMessage()
  if(action==='create-room') {const name=document.getElementById('playerName')?.value||'Carlos';return connectRoom('host',randomCode(),name)}
  if(action==='join-room') {const name=document.getElementById('playerName')?.value||'Cómplice';const code=(document.getElementById('roomCodeInput')?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6)return toast('Introduce un código de 6 caracteres');return connectRoom('guest',code,name)}
  if(action==='leave-room') return leaveRoom()
  if(action==='copy-invite') {const link=`${location.origin}${location.pathname}?room=${rt.roomCode}`;await navigator.clipboard.writeText(link);return toast('Enlace copiado')}
  if(action==='start-game') return hostAction('start_game')
  if(action==='hub') return hostAction('hub')
  if(action==='trivia') return hostAction('trivia',{cat:el.dataset.cat})
  if(action==='next-trivia') return hostAction('trivia',{cat:rt.game.currentCat})
  if(action==='random-trivia') return hostAction('random_trivia')
  if(action==='answer-trivia') return answerTrivia(Number(el.dataset.index))
  if(action==='match'||action==='next-match') return hostAction('match')
  if(action==='answer-match') return answerMatch(Number(el.dataset.index))
  if(action==='mission') return hostAction('mission')
  if(action==='validate-mission') return validateMission(el.dataset.approved==='true')
  if(action==='cases') return hostAction('cases')
  if(action==='hit-boss') return hitBoss()
  if(action==='garden') return hostAction('garden')
})

async function boot(){
  const saved=localStorage.getItem(SESSION_KEY)
  if(configured && saved){
    try{
      const s=JSON.parse(saved)
      if(s.roomCode && s.role && s.playerId===rt.playerId && (!rt.joinPrefill || rt.joinPrefill===s.roomCode)){
        return connectRoom(s.role,s.roomCode,s.name,{resume:true})
      }
    }catch{}
  }
  renderHome()
}
boot()
