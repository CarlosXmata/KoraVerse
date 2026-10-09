// Isolated visual fixture: no server access, saved visits, EXP or Sanctuary session.
import './style.css'
import './v5.css'
import './living-sky.css'
import './color-rest.css'
import {Sanctuary} from './sanctuary.js'
import {ColorRest} from './color-rest.js'
const profiles=['carlos','kora'].map(player_key=>({player_key,forced_gray:false}));let player='carlos'
const client=new ColorRest({player:()=>player,qa:()=>false,apply:gray=>document.documentElement.dataset.colorGray=String(gray),request:async(_,options)=>{const {player,action}=JSON.parse(options.body),profile=profiles.find(p=>p.player_key===player);if(action==='color-awake')profile.forced_gray=false;return {ok:true,json:async()=>({color:{gray:profile.forced_gray}})}}})
const app=document.querySelector('#app')
app.className='sanctuary-overlay'
app.style.position='static'
app.style.minHeight='100vh'
function render(){app.innerHTML=`<main style="max-width:760px;margin:auto;padding:24px"><p>Muestra local · no modifica tu universo</p><h1>Un lugar entre mundos</h1><img src="/avatars/cow-galaxy.svg" alt="Vaquita en el cielo" style="width:140px"><p>Órbita actual: ${player==='carlos'?'Carlos':'Kora'}</p><div class="color-preview-controls"><button class="btn" id="switch">Cambiar perfil</button><button class="btn" id="return">Volver a entrar</button><button class="btn" id="xp">Ganar EXP (muestra)</button></div><div style="margin-top:24px;background:var(--panel);padding:20px;border:1px solid var(--line);border-radius:24px">${Sanctuary.prototype.colorMarkup.call({colors:profiles})}</div></main>`;app.querySelectorAll('[data-color-player]').forEach(button=>button.onclick=async()=>{profiles.find(p=>p.player_key===button.dataset.colorPlayer).forced_gray=button.dataset.colorEnabled==='true';await client.sync();render()});app.querySelector('#switch').onclick=async()=>{client.clear();player=player==='carlos'?'kora':'carlos';await client.sync();render()};app.querySelector('#return').onclick=()=>client.sync();app.querySelector('#xp').onclick=async()=>{await client.sync(true);render()}}
render()
