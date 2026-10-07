export function bindSecretDoor(button,{allowed=()=>true,onOpen,onHolding=()=>{},duration=4000,schedule=setTimeout,cancel=clearTimeout}={}){
 if(!button||button.dataset.bound)return
 button.dataset.bound='true';let timer=null
 const stop=()=>{if(timer!==null)cancel(timer);timer=null;onHolding(false)}
 const start=e=>{if(!allowed()||(e.type==='keydown'&&![' ','Enter'].includes(e.key))||e.repeat)return;e.preventDefault();stop();onHolding(true);timer=schedule(()=>{timer=null;onHolding(false);onOpen()},duration)}
 button.addEventListener('pointerdown',start);button.addEventListener('keydown',start)
 for(const name of ['pointerup','pointercancel','pointerleave','keyup','blur'])button.addEventListener(name,stop)
 return stop
}
