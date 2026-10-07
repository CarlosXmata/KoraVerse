import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
test('Service Worker never displays private payload text or navigates to an external URL',async()=>{
 const listeners={},shown=[],opened=[]
 const context=vm.createContext({self:{addEventListener:(name,fn)=>listeners[name]=fn,registration:{showNotification:async(title,options)=>shown.push({title,...options})},clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)}}})
 vm.runInContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),context)
 let pending;const event={data:{json:()=>({title:'Private title',body:'Private diary text',url:'https://external.test',kind:'coffee_invite'})},waitUntil:value=>pending=value}
 listeners.push(event);await pending;assert.equal(shown[0].title,'KORA-Señal');assert.equal(shown[0].body.includes('Private'),false);assert.equal(shown[0].data.url,'/')
 listeners.notificationclick({notification:{close(){},data:{url:'https://external.test'}},waitUntil:value=>pending=value});await pending;assert.deepEqual(opened,['/'])
})
