import test from 'node:test'
import assert from 'node:assert/strict'
import {ALIGNMENT_STORY,KORA_BIRTH_YEAR,STORY_DATES,storyScenes,PROPHECY_SCENE} from '../src/alignment-story-data.js'
import {StoryClock,storyTimeline,mountAlignmentStory} from '../src/alignment-story.js'
import {COSMIC_YEARBOOK,atlasSearch,specialDates} from '../src/cosmic-yearbook.js'
import {archiveMarkup} from '../src/atlas-archive.js'

test('the Carlos narrative has eleven bilingual chapters and lasts between two and four minutes',()=>{
 const scenes=storyScenes(),beats=storyTimeline(scenes)
 assert.equal(scenes.length,11);assert.equal(new Set(scenes.map(s=>s.id)).size,11)
 assert.ok(beats.at(-1).end>=120000&&beats.at(-1).end<=240000)
 for(const s of scenes){assert.equal(s.duration,s.pages.reduce((n,p)=>n+p.duration,0));for(const p of s.pages)for(const lang of ['es','en']){assert.ok(p.lines[lang].length>=1&&p.lines[lang].length<=4);assert.ok(p.lines[lang].every(l=>l.trim()))}}
 assert.match(ALIGNMENT_STORY.perspective.es,/Carlos/)
})
test('birth year is unknown unless explicitly supplied; previews never mutate the narrative',()=>{
 assert.equal(KORA_BIRTH_YEAR,null)
 const original=JSON.stringify(ALIGNMENT_STORY),unknown=storyScenes().find(s=>s.id==='new-light'),known=storyScenes({birthYear:2002}).find(s=>s.id==='new-light')
 assert.equal(unknown.metadata.birthYearUnknown,true);assert.match(unknown.pages[0].lines.es.join(' '),/después del año 2001/)
 assert.match(known.pages[0].lines.es[0],/2002/);assert.equal(known.metadata.birthYearConfirmed,true)
 assert.throws(()=>storyScenes({birthYear:1999}));assert.throws(()=>storyScenes({birthYear:'2002'}));assert.throws(()=>storyScenes({birthYear:3000}))
 assert.equal(JSON.stringify(ALIGNMENT_STORY),original)
 assert.doesNotMatch(unknown.pages.flatMap(p=>p.lines.es).join(' '),/edad|cumplió \d+|\d+ años/)
})
test('arrival is exact, recognition approximate, and configured corrections reach both labels and prose',()=>{
 assert.equal(STORY_DATES.arrival,'2025-10-03');assert.equal(STORY_DATES.encounter,'2025-10-12')
 const scenes=storyScenes();assert.equal(scenes.find(s=>s.id==='recognition').approximate,true);assert.equal(scenes.find(s=>s.id==='arrival').approximate,false)
 const dates={...STORY_DATES,arrival:'2025-10-04',encounter:'2025-10-13',encounterApproximate:false},corrected=storyScenes({dates})
 assert.equal(corrected.find(s=>s.id==='arrival').date,dates.arrival);assert.match(corrected.find(s=>s.id==='arrival').pages[0].lines.es[0],/4 de octubre/)
 assert.equal(corrected.find(s=>s.id==='recognition').approximate,false);assert.match(corrected.find(s=>s.id==='recognition').pages[0].lines.es[1],/13 de octubre/)
 assert.equal(specialDates(dates)[dates.encounter].approximate,false)
 const november=storyScenes({dates:{...dates,encounter:'2025-11-13'}}).find(s=>s.id==='recognition');assert.match(november.pages[0].lines.es[0],/noviembre/);assert.match(november.pages[3].lines.es[0],/noviembre de 2025/)
})
test('the clock supports pause, hidden tabs, chapter skips, jumps, end and restart',()=>{
 const clock=new StoryClock(storyTimeline(storyScenes()))
 clock.tick(0);clock.tick(50);assert.equal(clock.elapsed,50)
 clock.paused=true;clock.tick(100);assert.equal(clock.elapsed,50)
 clock.paused=false;clock.tick(150,true);assert.equal(clock.elapsed,50)
 clock.jump('arrival');assert.equal(clock.current().scene.id,'arrival');clock.next();assert.equal(clock.current().scene.id,'between-days')
 clock.jump('closing');clock.next();assert.equal(clock.current(),null)
 clock.restart();assert.equal(clock.elapsed,0);assert.equal(clock.paused,false);assert.equal(clock.current().scene.id,'before-name')
})
test('the mythical archive covers every year from 2000 to 2027, with bilingual fiction',()=>{
 assert.deepEqual(Object.keys(COSMIC_YEARBOOK).map(Number),Array.from({length:28},(_,i)=>2000+i))
 for(const entry of Object.values(COSMIC_YEARBOOK)){assert.equal(entry.type,'myth');assert.equal(entry.fiction,true);assert.equal(entry.icon,'✧');for(const lang of ['es','en']){assert.ok(entry.title[lang]);assert.ok(entry.story[lang])}}
 assert.equal(COSMIC_YEARBOOK[2027].title.es,'La Constelación del Sí');assert.equal(PROPHECY_SCENE.metadata.unconfirmed,true);assert.equal(PROPHECY_SCENE.metadata.fiction,true)
})
const stars=[{id:'a',star_name:'Un recuerdo',event_date:'2026-10-08'},{id:'b',star_name:'Aurelia',event_date:'2026-10-10'}]
test('a silent date still shows its year myth; exact and cumulative memories stay independent',()=>{
 const before=JSON.stringify(stars),silent=atlasSearch(stars,'2026-10-09'),cumulative=atlasSearch(stars,'2026-10-09',{timeTravel:true})
 assert.equal(silent.real.length,0);assert.equal(silent.myth.year,2026);assert.equal(silent.special,null)
 assert.equal(cumulative.real.length,1);assert.equal(cumulative.exact.length,0)
 assert.equal(atlasSearch(stars,'2026-10-10').real.length,2-1)
 assert.equal(atlasSearch(stars,'',{year:2027}).myth.year,2027)
 assert.equal(atlasSearch(stars,'2026-02-30').valid,false);assert.equal(atlasSearch(stars,'1999-05-10').myth,null)
 assert.equal(JSON.stringify(stars),before)
})
test('special coordinates are literary content rather than fabricated real memories',()=>{
 for(const date of ['2025-10-03','2025-10-12','2026-10-10']){const r=atlasSearch([],date);assert.equal(r.real.length,0);assert.equal(r.exact.length,0);assert.equal(r.special.fiction,true)}
 assert.equal(atlasSearch([],'2025-10-12').special.approximate,true)
})
test('Atlas presents real memories first, escapes content and labels the prophecy unconfirmed',()=>{
 const html=archiveMarkup({...atlasSearch(stars,'2026-10-10'),date:'2026-10-10'})
 assert.ok(html.indexOf('RECUERDOS REALES')<html.indexOf('ARCHIVO MÍTICO'))
 assert.match(html,/No son registros astronómicos ni hechos biográficos confirmados/)
 const prophecy=archiveMarkup(atlasSearch([],'',{year:2027}));assert.match(prophecy,/profecía no confirmada/);assert.match(prophecy,/data-story-scene="prophecy"/)
 const escaped=archiveMarkup(atlasSearch([{id:'<x>',star_name:'<script>',event_date:'2026-10-10'}],'2026-10-10'));assert.doesNotMatch(escaped,/<script>/);assert.match(escaped,/&lt;script&gt;/)
})
test('reduced motion keeps the whole story, freezes on pause and restores focus and the page on exit',()=>{
 const keys=['document','window','requestAnimationFrame','cancelAnimationFrame','devicePixelRatio','innerWidth','innerHeight'],saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]))
 let callback,removed=0,focused=0,exited=0,cameraWrites=0
 const app={inert:false},nodes=new Map(),node=key=>{if(!nodes.has(key))nodes.set(key,{style:{},focus(){},hidden:key==='.story-ending',getContext:()=>null});return nodes.get(key)}
 const el={dataset:{},style:{setProperty(){cameraWrites++}},setAttribute(){},focus(){},remove(){removed++},addEventListener(){},removeEventListener(){},querySelector:node}
 try{
  globalThis.document={body:{style:{overflow:'auto'}},activeElement:{focus(){focused++}},querySelector:()=>app,createElement:()=>el,hidden:false}
  globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.requestAnimationFrame=fn=>{callback=fn;return 1};globalThis.cancelAnimationFrame=()=>{}
  globalThis.innerWidth=360;globalThis.innerHeight=800;globalThis.devicePixelRatio=1
  const film=mountAlignmentStory({container:{append(){}},reduced:true,onExit:()=>exited++})
  assert.equal(app.inert,true);assert.equal(document.body.style.overflow,'hidden');callback(0);callback(50)
  node('.story-pause').onclick();callback(100);assert.equal(film.clock.elapsed,50)
  node('.story-next').onclick();callback(150);assert.equal(film.clock.current().scene.id,'new-light');assert.equal(film.clock.paused,true)
  node('.story-restart').onclick();assert.equal(film.clock.elapsed,0);assert.equal(film.clock.paused,false)
  for(let t=200;t<230000;t+=50)callback(t)
  assert.equal(node('.story-ending').hidden,false);assert.equal(cameraWrites,0);assert.equal(film.clock.total,229000)
  node('.story-restart').onclick();node('select').value='closing';node('select').onchange();callback(230100);node('.story-next').onclick();callback(230150);assert.equal(node('.story-ending').hidden,false)
  film.close();film.close();assert.equal(removed,1);assert.equal(exited,1);assert.equal(focused,1);assert.equal(app.inert,false);assert.equal(document.body.style.overflow,'auto')
 }finally{for(const [k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v}}
})
