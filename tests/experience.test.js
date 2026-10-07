import test from 'node:test'
import assert from 'node:assert/strict'
import {mountAlignment,RoseGarden} from '../src/birthday-experience.js'
import {bindSecretDoor} from '../src/secret-door.js'
test('hidden door requires a four-second hold and cancels early release or disallowed players',()=>{
 const events={},button={dataset:{},addEventListener:(name,fn)=>events[name]=fn};let pending=null,opened=0,allowed=true
 bindSecretDoor(button,{allowed:()=>allowed,onOpen:()=>opened++,schedule:(fn,duration)=>{assert.equal(duration,4000);pending=fn;return 1},cancel:()=>{pending=null}})
 const input={type:'pointerdown',preventDefault(){}}
 events.pointerdown(input);events.pointerup();assert.equal(pending,null);assert.equal(opened,0)
 events.pointerdown(input);pending();assert.equal(opened,1);allowed=false;events.pointerdown(input);assert.equal(opened,1)
})
test('film pauses in hidden state, finishes once and reduced motion uses the short sequence',async()=>{
 const saved={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,matchMedia:globalThis.matchMedia}
 let callback,hidden=false,completed=0,removed=0
 const element={dataset:{},style:{setProperty(){}},setAttribute(){},focus(){},remove(){removed++},querySelector(){return {onclick:null}}}
 try{
  globalThis.document={hidden:false,createElement:()=>element};globalThis.matchMedia=()=>({matches:true});globalThis.requestAnimationFrame=fn=>{callback=fn;return 1};globalThis.cancelAnimationFrame=()=>{}
  mountAlignment({container:{appendChild(){}},reduced:true,paused:()=>hidden,onComplete:()=>completed++})
  callback(0);hidden=true;for(let t=80;t<=8000;t+=80)callback(t);assert.equal(completed,0);assert.equal(element.dataset.stage,'greeting')
  hidden=false;for(let t=8080;t<=10000&&completed===0;t+=80)callback(t);assert.equal(completed,1);assert.equal(removed,1);callback(11000);assert.equal(completed,1)
 }finally{for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
})
test('roses save each opening once, refuse false progress on failure, and preview never writes',async()=>{
 const saved={document:globalThis.document,matchMedia:globalThis.matchMedia};let calls=0
 const status={textContent:''},app={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>status}
 try{
  globalThis.document={querySelector:()=>({classList:{add(){}}})};globalThis.matchMedia=()=>({matches:true})
  const garden=new RoseGarden({app,shell:html=>html,onOpen:async()=>{calls++}});await garden.open(1);await garden.open(1);assert.equal(calls,1);assert.equal(garden.opened.size,1)
  garden.onOpen=async()=>{throw Error('offline')};await garden.open(2);assert.equal(garden.opened.has(2),false);assert.match(status.textContent,/guardar/)
  const preview=new RoseGarden({app,shell:html=>html,preview:true,onOpen:async()=>{calls++}});for(let i=1;i<=10;i++)await preview.open(i);assert.equal(preview.opened.size,10);assert.equal(calls,1)
 }finally{for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
})
