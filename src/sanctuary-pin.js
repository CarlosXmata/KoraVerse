import {escapeHTML as esc} from './sky-utils.js'
export const validFourDigitPin=pin=>typeof pin==='string'&&/^\d{4}$/.test(pin)
export function mountPinKeypad(container,{message='',submit,close}={}){
 let pin='',busy=false
 container.innerHTML=`<div class="sanctuary-door ${message?'pin-error':''}"><button class="sanctuary-close" aria-label="Cerrar">×</button><span class="sanctuary-glyph">✦</span><h1>Introduce la llave</h1><div class="pin-dots" role="status" aria-label="0 de 4 dígitos"><span>○</span><span>○</span><span>○</span><span>○</span></div><div class="pin-keypad">${['1','2','3','4','5','6','7','8','9','back','0','enter'].map(key=>`<button type="button" data-pin-key="${key}" aria-label="${key==='back'?'Borrar un dígito':key==='enter'?'Abrir':key}">${key==='back'?'←':key==='enter'?'✓':key}</button>`).join('')}</div><p class="pin-access-note" role="status">${esc(message)}</p></div>`
 const dots=container.querySelector('.pin-dots'),note=container.querySelector('.pin-access-note')
 function render(){dots.innerHTML=Array.from({length:4},(_,i)=>`<span>${i<pin.length?'●':'○'}</span>`).join('');dots.setAttribute('aria-label',`${pin.length} de 4 dígitos`);container.querySelectorAll('[data-pin-key]').forEach(b=>b.disabled=busy)}
 async function send(){if(busy||!validFourDigitPin(pin))return;busy=true;render();const value=pin;pin='';try{await submit(value)}catch(error){busy=false;render();note.textContent=error?.status===429?'Espera unos minutos antes de volver.':error?.status===409?'Esta puerta todavía se está preparando.':'Esta llave no abre este cielo.';container.querySelector('.sanctuary-door').classList.add('pin-error');container.querySelector('[data-pin-key="1"]').focus()}}
 function input(key){if(busy)return;if(key==='back')pin=pin.slice(0,-1);else if(key==='enter')return send();else if(/^\d$/.test(key)&&pin.length<4)pin+=key;render();if(pin.length===4)send()}
 container.querySelector('.sanctuary-close').onclick=close
 container.querySelectorAll('[data-pin-key]').forEach(b=>b.onclick=()=>input(b.dataset.pinKey))
 container.onkeydown=e=>{if(/^\d$/.test(e.key)){e.preventDefault();input(e.key)}else if(e.key==='Backspace'){e.preventDefault();input('back')}else if(e.key==='Escape'){e.preventDefault();close()}}
 container.querySelector('[data-pin-key="1"]').focus()
 return {clear:()=>{pin='';render()},input}
}
