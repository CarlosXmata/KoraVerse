import {escapeHTML as esc} from './sky-utils.js'
export const SIGNAL_SOUND_KEY='koraverse_signals_sound'
export const GAMES={chess:{es:'Ajedrez',en:'Chess',icon:'♟'},sudoku:{es:'Sudoku',en:'Sudoku',icon:'▦'},trivia:{es:'Trivia',en:'Trivia',icon:'✦'},brain:{es:'Same Brain',en:'Same Brain',icon:'◎'}}
export function roomCode(value){return /^[A-Z0-9]{6}$/.test(String(value||'').toUpperCase())?String(value).toUpperCase():null}
export function roomLink(code,game,base='/'){const valid=roomCode(code);if(!valid)return null;return `${base}?room=${valid}${GAMES[game]?'&game='+game:''}`}
export function parseDuoLink(search){const p=new URLSearchParams(search);return {code:roomCode(p.get('room')),game:GAMES[p.get('game')]?p.get('game'):null,signals:p.get('signals')==='1'}}
export function shouldSound({from,me,duplicate=false,qa=false,sound=true,notificationSound=true,discreet=false,quiet=false}={}){return Boolean(from&&from!==me&&!duplicate&&!qa&&sound&&notificationSound&&!discreet&&!quiet)}
export function notificationData(msg={}){const invite=msg.kind==='game_invite',code=roomCode(msg.metadata?.room_code),game=msg.metadata?.game;return {kind:msg.kind||'text',title:invite?'KORA-Señal':'Una nueva señal en tu órbita',body:invite?'Te invitaron a compartir una órbita.':'Hay algo esperándote en KORAVERSE.',room_code:code,game:GAMES[game]?game:null,tag:'signal-'+(msg.client_id||msg.id||'legacy')}}
export function resonanceText(kind,lang='es'){const en=lang==='en';return kind==='photo'?(en?'An image crossed your orbit.':'Una imagen cruzó tu órbita.'):kind==='game_invite'?(en?'A KORA-Signal arrived.':'Una KORA-Señal llegó.'):(en?'A Cow-Signal arrived.':'Una Vaca-Señal llegó.')}
export class TypingPulse{
 constructor(send,{now=()=>Date.now(),schedule=setTimeout,cancel=clearTimeout,interval=900,timeout=1800}={}){Object.assign(this,{send,now,schedule,cancel,interval,timeout});this.last=-Infinity;this.active=false;this.timer=null}
 input(){const now=this.now();if(!this.active||now-this.last>=this.interval){this.send(true);this.last=now;this.active=true}this.cancel(this.timer);this.timer=this.schedule(()=>this.stop(),this.timeout)}
 stop(){this.cancel(this.timer);this.timer=null;if(this.active)this.send(false);this.active=false;this.last=-Infinity}
}
export function typingMarkup(name,avatar,lang='es'){return `<span class="typing-avatar">${avatar}</span><span>${esc(name)} ${lang==='en'?'is typing':'está escribiendo'}<i class="typing-dots" aria-hidden="true"><b></b><b></b><b></b></i></span>`}
export const MEDIA_BUCKET='koraverse-chat-media'
export function validMediaPath(path){return /^(carlos|kora)\/\d{4}\/(0[1-9]|1[0-2])\/[a-f0-9-]{36}(?:-thumb)?\.(webp|jpg)$/.test(path||'')}
export function photoMetadata({path,thumbnail_path,width,height,mime,original_name}){if(!validMediaPath(path)||!validMediaPath(thumbnail_path)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>2000||height>2000||!['image/webp','image/jpeg'].includes(mime))throw Error('Invalid photo metadata');return {bucket:MEDIA_BUCKET,path,thumbnail_path,width,height,mime,original_name:String(original_name||'photo').slice(0,120)}}
export function triviaRank(score,lang='es'){return score>=18?(lang==='en'?'Living Archive':'Archivo Viviente'):score>=15?(lang==='en'?'Orbit Master':'Maestro de la órbita'):score>=11?(lang==='en'?'Good eye':'Buen ojo'):(lang==='en'?'We need another season.':'Necesitamos otra temporada.')}
